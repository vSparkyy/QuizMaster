import json
import random
import os
from rest_framework import generics, views, response, status
from .models import Account, CompletedQuiz
from .serializers import AccountSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.http import JsonResponse
from django.db.models import Max, Avg
from rest_framework import status
from rest_framework.response import Response
from .utils import save_completed_quiz


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
                            "answer_key": q.answer_key,
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

        questions = [q for q in all_questions if q["topic"] == topic]

        if not questions:
            return Response(
                {"error": "No questions found for the specified topic."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        questions_data = [
            {
                "id": question["id"],
                "question_text": question["question_text"],
                "answer_key": question["answer_key"],
                "marks": question["marks"],
                "type": question["question_type"],
            }
            for question in questions
            if str(question["id"]) in submitted_answers
        ]

        if not questions_data:
            return Response(
                {"error": "No valid questions found for the provided answers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        completed_quiz = save_completed_quiz(
            user, topic, questions_data, submitted_answers, difficulty
        )

        return Response(
            {
                "message": "Quiz submitted successfully.",
                "quiz_id": completed_quiz.id,
                "grade": completed_quiz.grade,
                "percentage": completed_quiz.percentage,
                "created_at": completed_quiz.created_at,
            },
            status=status.HTTP_201_CREATED,
        )


class UserQuizzesReportView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, username):
        try:
            user = Account.objects.get(username=username)
        except Account.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

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

        return Response({"user": username, "quizzes": data})


class TopicDifficultyReportView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        topic = request.GET.get("topic")
        difficulty = request.GET.get("difficulty")

        if not topic or not difficulty:
            return Response(
                {"error": "Both topic and difficulty are required."}, status=400
            )

        quizzes = CompletedQuiz.objects.filter(topic=topic, difficulty=difficulty)

        if not quizzes.exists():
            return Response(
                {"error": "No quizzes found for the selected filters."}, status=404
            )

        avg_score = quizzes.aggregate(Avg("percentage"))["percentage__avg"]
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
