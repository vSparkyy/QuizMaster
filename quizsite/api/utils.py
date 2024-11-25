from django.utils.timezone import now
from .LLM import mark_answer
from .models import CompletedQuiz, CompletedQuizQuestion

grade_key = {
    "A+": 95,
    "A": 90,
    "B": 80,
    "C": 70,
    "D": 60,
    "E": 50,
    "F": 0
}

def save_completed_quiz(user, topic, questions, submitted_answers, difficulty):
    total_marks = sum(int(question['marks']) for question in questions)
    total_questions = len(questions)
    marks = 0

    quiz = CompletedQuiz.objects.create(
        user=user,
        topic=topic,
        number_of_questions=total_questions,
        difficulty=difficulty,
        grade=0,
        percentage=0,
        created_at=now()
    )

    for question in questions:
        _marks = 0
        question_text = question["question_text"]
        answer_key = question["answer_key"]
        submitted_answer = submitted_answers.get(str(question["id"]), "")

        if question["type"] == "multiple_choice":
            answer_key = answer_key.lower()
            submitted_answer = submitted_answer.lower()

            if submitted_answer == answer_key:
                _marks += int(question["marks"])

        elif question["type"] == "multiple_select":
            for answer in answer_key:
                if answer in submitted_answer:
                    _marks += 1

        else:
            _marks += mark_answer(submitted_answer, answer_key, question['marks'])

        is_correct = _marks == int(question["marks"])

        CompletedQuizQuestion.objects.create(
            quiz=quiz,
            question_text=question_text,
            answer_key=answer_key,
            submitted_answer=submitted_answer,
            marks=_marks,
            total_marks=int(question["marks"]),
            is_correct=is_correct
        )

        marks += _marks

    percentage = round((marks / total_marks) * 100, 2)
    for grade, min_percentage in grade_key.items():
        if percentage >= min_percentage:
            quiz.grade = grade
            break
    quiz.percentage = percentage
    quiz.save()

    return quiz