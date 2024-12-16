import json
import random
import os
from rest_framework import generics, views, response, status
from .models import Account, CompletedQuiz
from .serializers import AccountSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.http import JsonResponse
from django.db.models import Avg
from rest_framework import status
from rest_framework.response import Response
from .utils import save_completed_quiz
from datetime import datetime
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CompletedQuizQuestion

class UserSearchView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        query = request.GET.get('query', '')
        users = Account.objects.filter(username__icontains=query)[:10]
        data = [{'username': u.username, 'first_name': u.first_name, 'last_name': u.last_name} for u in users]
        return Response(data)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            user = Account.objects.get(username=request.data.get("username"))
            response.data["user"] = {
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
            }
        return response

class GenerateUsernameView(views.APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        first_name = request.query_params.get("first_name", "")
        last_name = request.query_params.get("last_name", "")
        date_of_birth = request.query_params.get("date_of_birth", "")

        if not first_name or not last_name or not date_of_birth:
            return Response(
                {"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            dob = datetime.strptime(date_of_birth, "%Y-%m-%d")
            username_base = (
                first_name[:3].capitalize()
                + last_name[:3].upper()
                + dob.strftime("%m%d")
            )

            similar_usernames = Account.objects.filter(
                username__startswith=username_base
            )
            if similar_usernames.exists():
                count = similar_usernames.count()
                generated_username = f"{username_base}_{count + 1}"
            else:
                generated_username = username_base

            return Response({"username": generated_username}, status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST
            )


class QuestionListView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        with open(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "questions.json"),
            "r",
        ) as f:
            questions = json.load(f)

        topic = request.GET.get("topic")
        difficulty = request.GET.get("difficulty")

        if not topic or not difficulty:
            return JsonResponse(
                {"error": "Both topic and difficulty are required."}, status=400
            )

        filtered_questions = [
            q
            for q in questions
            if q["topic"] == topic and q["difficulty"] == difficulty
        ]

        difficulty_count_map = {"easy": 3, "medium": 4, "hard": 6}
        num_questions = difficulty_count_map.get(difficulty, 0)

        selected_questions = random.sample(
            filtered_questions, min(len(filtered_questions), num_questions)
        )

        return JsonResponse(selected_questions, safe=False)


class UserCompletedQuizzesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        quizzes = (
            CompletedQuiz.objects.filter(user=user)
            .prefetch_related("questions")
            .order_by("-created_at")
        )

        quiz_data = []
        for quiz in quizzes:
            quiz_data.append(
                {
                    "topic": quiz.topic,
                    "number_of_questions": quiz.number_of_questions,
                    "grade": quiz.grade,
                    "percentage": quiz.percentage,
                    "difficulty": quiz.difficulty,
                    "created_at": quiz.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "questions": [
                        {
                            "question_text": q.question_text,
                            "correct_answer": q.answer_key,
                            "submitted_answer": q.submitted_answer,
                            "is_correct": q.is_correct,
                            "marks": q.marks,
                            "total_marks": q.total_marks,
                        }
                        for q in quiz.questions.all()
                    ],
                }
            )

        return response.Response(quiz_data)


class SubmitQuizView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        topic = data.get("topic")
        difficulty = data.get("difficulty")
        submitted_answers = data.get("submitted_answers")

        if not topic or not submitted_answers:
            return Response(
                {"error": "Topic and submitted answers are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with open(
                os.path.join(
                    os.path.dirname(os.path.abspath(__file__)), "questions.json"
                ),
                "r",
            ) as file:
                all_questions = json.load(file)
        except FileNotFoundError:
            return Response(
                {"error": "Questions file not found."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        questions = [q for q in all_questions if str(q["id"]) in submitted_answers.keys()]

        if not questions:
            return Response(
                {"error": "No questions found for the specified topic."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        completed_quiz = save_completed_quiz(
            user, topic, questions, submitted_answers, difficulty
        )

        quiz_questions = CompletedQuizQuestion.objects.filter(quiz=completed_quiz)

        submitted_questions = [
            {
                "question_text": question.question_text,
                "submitted_answer": question.submitted_answer,
                "correct_answer": question.answer_key,
                "is_correct": question.is_correct,
                "marks": question.marks,
                "total_marks": question.total_marks,
            }
            for question in quiz_questions
        ]

        return Response(
            {
                "message": "Quiz submitted successfully.",
                "quiz_id": completed_quiz.id,
                "grade": completed_quiz.grade,
                "percentage": completed_quiz.percentage,
                "submitted_questions": submitted_questions,
                "created_at": completed_quiz.created_at,
            },
            status=status.HTTP_201_CREATED,
        )



class UserQuizzesReportView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        username = request.data.get("username")
        if not username:
            return Response(
                {"error": "Username is required in the payload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = Account.objects.get(username__iexact=username)
        except Account.DoesNotExist:
            return Response(
                {"error": f"User '{username}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        quizzes = CompletedQuiz.objects.filter(user=user).order_by("-created_at")
        data = [
            {
                "topic": quiz.topic,
                "number_of_questions": quiz.number_of_questions,
                "difficulty": quiz.difficulty,
                "grade": quiz.grade,
                "percentage": quiz.percentage,
                "created_at": quiz.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for quiz in quizzes
        ]

        return Response({"user": user.username, "quizzes": data})


class TopicDifficultyReportView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        topic = request.data.get("topic")
        difficulty = request.data.get("difficulty")

        if not topic or not difficulty:
            return Response(
                {"error": "Both topic and difficulty are required."}, status=400
            )

        quizzes = CompletedQuiz.objects.filter(topic=topic, difficulty=difficulty)

        if not quizzes.exists():
            return Response(
                {"error": "No quizzes found for the selected filters."}, status=404
            )

        avg_score = round(quizzes.aggregate(Avg("percentage"))["percentage__avg"])
        highest_quiz = quizzes.order_by("-percentage").first()
        highest_score = highest_quiz.percentage
        top_user = highest_quiz.user

        data = {
            "topic": topic,
            "difficulty": difficulty,
            "average_score": avg_score,
            "highest_score": highest_score,
            "top_user": {
                "username": top_user.username,
                "first_name": top_user.first_name,
                "last_name": top_user.last_name,
            },
        }

        return Response(data)


class RegisterUserView(generics.CreateAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [AllowAny]
