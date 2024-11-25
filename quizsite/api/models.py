from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.auth import get_user_model
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class AccountManager(BaseUserManager):
    def create_user(self, first_name, last_name, date_of_birth, year_group, password=None):
        if not first_name or not last_name or not date_of_birth:
            raise ValueError("Users must have a first name, last name, and date of birth")

        username = self.generate_username(first_name, last_name, date_of_birth)

        user = self.model(
            username=username,
            first_name=first_name,
            last_name=last_name,
            date_of_birth=date_of_birth,
            year_group=year_group,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def generate_username(self, first_name, last_name, date_of_birth):
        username_base = (
            first_name[:3].capitalize() +
            last_name[:3].upper() +
            date_of_birth.strftime("%m%d")
        )

        similar_usernames = Account.objects.filter(username__startswith=username_base)
        if similar_usernames.exists():
            count = similar_usernames.count()
            username = f"{username_base}_{count + 1}"
        else:
            username = username_base

        return username

    def create_superuser(self, first_name, last_name, date_of_birth, year_group, password=None):
        user = self.create_user(first_name, last_name, date_of_birth, year_group, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class Account(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    date_of_birth = models.DateField()
    year_group = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(13)])
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = AccountManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'date_of_birth', 'year_group']

    def __str__(self):
        return self.username

user = get_user_model()

class CompletedQuiz(models.Model):
    user = models.ForeignKey(user, on_delete=models.CASCADE, related_name="completed_quizzes")
    topic = models.CharField(max_length=50)
    number_of_questions = models.PositiveIntegerField()
    difficulty = models.CharField(max_length=20, null=True, blank=True)
    grade = models.CharField(max_length=2)
    percentage = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quiz: {self.topic} by {self.user.username} on {self.created_at}. Difficulty: {self.difficulty}"

class CompletedQuizQuestion(models.Model):
    quiz = models.ForeignKey(CompletedQuiz, on_delete=models.CASCADE, related_name="questions")
    question_text = models.TextField()
    answer_key = models.TextField()
    submitted_answer = models.TextField()
    marks = models.PositiveIntegerField()
    total_marks = models.PositiveIntegerField()
    is_correct = models.BooleanField()

    def __str__(self):
        return f"Question: {self.question_text[:50]}... (Correct: {self.is_correct})"
