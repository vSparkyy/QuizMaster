from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import CompletedQuiz, CompletedQuizQuestion
from django.utils.timezone import now
from datetime import date
from rest_framework_simplejwt.tokens import RefreshToken
import json

User = get_user_model()

class SubmitQuizViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            first_name="Test",
            last_name="User",
            date_of_birth=date(2000, 1, 1),
            year_group=12,
            password="testpassword"
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client = Client()
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {self.access_token}"

        self.questions_data = [
            {
                "id": 1,
                "question_text": "What is 2 + 2?",
                "difficulty": "easy",
                "question_type": "multiple_choice",
                "options": ["2", "3", "4", "5"],
                "answer_key": "4",
                "marks": "1",
                "topic": "Maths"
            },
            {
                "id": 2,
                "question_text": "Which of these are programming languages?",
                "difficulty": "medium",
                "question_type": "multi_select",
                "options": ["Python", "HTML", "JavaScript", "CSS"],
                "answer_key": ["Python", "JavaScript"],
                "marks": "2",
                "topic": "Computer Science"
            },
            {
                "id": 3,
                "question_text": "Multiples of 3",
                "difficulty": "easy",
                "question_type": "multiple_select",
                "options": ["2", "3", "4", "6"],
                "answer_key": ["3", "6"],
                "marks": "2",
                "topic": "Maths"
            }
        ]
        with open(settings.BASE_DIR / 'test_questions.json', 'w') as file:
            json.dump(self.questions_data, file)

    def tearDown(self):
        import os
        os.remove(settings.BASE_DIR / 'test_questions.json')

    def test_submit_quiz_with_marks(self):
        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.access_token}"}
        data = {
            "topic": "Maths",
            "difficulty": "easy",
            "submitted_answers": {
                "1": "4"
            }
        }
        with self.settings(BASE_DIR=settings.BASE_DIR):
            response = self.client.post(
                "/api/submit-quiz/", data, content_type="application/json", **headers
            )
        self.assertEqual(response.status_code, 201)
        quiz = CompletedQuiz.objects.get(id=response.json()["quiz_id"])
        self.assertEqual(quiz.topic, "Maths")
        self.assertEqual(quiz.difficulty, "easy")
        self.assertEqual(quiz.percentage, 100.0)
        self.assertEqual(quiz.grade, "A+")
        question = quiz.questions.first()
        self.assertEqual(question.marks, 1)
        self.assertEqual(question.total_marks, 1)

    def test_submit_quiz_partial_marks(self):
        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.access_token}"}
        data = {
            "topic": "Maths",
            "difficulty": "easy",
            "submitted_answers": {
                "1": "3"
            }
        }
        with self.settings(BASE_DIR=settings.BASE_DIR):
            response = self.client.post(
                "/api/submit-quiz/", data, content_type="application/json", **headers
            )
        self.assertEqual(response.status_code, 201)
        quiz = CompletedQuiz.objects.get(id=response.json()["quiz_id"])
        self.assertEqual(quiz.percentage, 0.0)
        self.assertEqual(quiz.difficulty, "easy")
        self.assertEqual(quiz.grade, "F")
        question = quiz.questions.first()
        self.assertEqual(question.marks, 0)
        self.assertEqual(question.total_marks, 1)

    def test_submit_long_answer_question(self):
        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.access_token}"}
        self.questions_data.append({
            "id": 4,
            "question_text": "Explain the concept of gravity.",
            "difficulty": "hard",
            "question_type": "long_answer",
            "options": [],
            "answer_key": "Gravity is a force that attracts two bodies towards each other.",
            "marks": 5,
            "topic": "Physics"
        })
        with open(settings.BASE_DIR / 'test_questions.json', 'w') as file:
            json.dump(self.questions_data, file)
        data = {
            "topic": "Physics",
            "difficulty": "hard",
            "submitted_answers": {
                "4": "Gravity is a force that pulls objects towards the Earth."
            }
        }
        with self.settings(BASE_DIR=settings.BASE_DIR):
            response = self.client.post(
                "/api/submit-quiz/", data, content_type="application/json", **headers
            )
        self.assertEqual(response.status_code, 201)
        quiz = CompletedQuiz.objects.get(id=response.json()["quiz_id"])
        self.assertEqual(quiz.topic, "Physics")
        self.assertEqual(quiz.difficulty, "hard")
        self.assertEqual(quiz.number_of_questions, 1)
        question = quiz.questions.first()
        self.assertEqual(question.question_text, "Explain the concept of gravity.")
        self.assertEqual(question.total_marks, 5)
        self.assertGreaterEqual(question.marks, 3)
        self.assertLessEqual(question.marks, 5)
        self.assertTrue(question.marks > 0)

    def test_submit_quiz_multiple_questions(self):
        headers = {"HTTP_AUTHORIZATION": f"Bearer {self.access_token}"}
        data = {
            "topic": "Maths",
            "submitted_answers": {
                "1": "4",
                "3": "3,6"
            }
        }
        with self.settings(BASE_DIR=settings.BASE_DIR):
            response = self.client.post(
                "/api/submit-quiz/", data, content_type="application/json", **headers
            )
        self.assertEqual(response.status_code, 201)
        quiz = CompletedQuiz.objects.get(id=response.json()["quiz_id"])
        self.assertEqual(quiz.percentage, 100.0)
        self.assertEqual(quiz.grade, "A+")
        questions = quiz.questions.all()
        self.assertEqual(questions[0].marks, 1)
        self.assertEqual(questions[1].marks, 2)

class CompletedQuizViewTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            first_name="Test",
            last_name="User",
            date_of_birth=date(2000, 1, 1),
            year_group=12,
            password="testpassword"
        )
        self.client = Client()
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {self.access_token}"
        self.quiz = CompletedQuiz.objects.create(
            user=self.user,
            topic="Maths",
            number_of_questions=2,
            grade="B",
            percentage=75.0,
            created_at=now()
        )
        CompletedQuizQuestion.objects.create(
            quiz=self.quiz,
            question_text="What is 2 + 2?",
            answer_key="4",
            submitted_answer="4",
            marks=1,
            total_marks=1,
            is_correct=True
        )
        CompletedQuizQuestion.objects.create(
            quiz=self.quiz,
            question_text="What is 3 + 3?",
            answer_key="6",
            submitted_answer="5",
            marks=0,
            total_marks=1,
            is_correct=False
        )

    def test_get_user_completed_quizzes_with_marks(self):
        response = self.client.get("/api/completed-quizzes/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        quiz = data[0]
        self.assertEqual(quiz["topic"], "Maths")
        self.assertEqual(quiz["number_of_questions"], 2)
        self.assertEqual(quiz["grade"], "B")
        self.assertEqual(quiz["percentage"], 75.0)
        questions = quiz["questions"]
        self.assertEqual(len(questions), 2)
        self.assertEqual(questions[0]["marks"], 1)
        self.assertEqual(questions[0]["total_marks"], 1)
        self.assertEqual(questions[1]["marks"], 0)
        self.assertEqual(questions[1]["total_marks"], 1)
        self.assertEqual(questions[1]["is_correct"], False)
