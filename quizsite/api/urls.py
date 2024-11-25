from django.urls import path, include
from . import views
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView

urlpatterns = [
    path('register/', views.RegisterUserView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='get_token'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('auth/', include('rest_framework.urls')),
    path('questions/', views.QuestionListView.as_view(), name='questions'),
    path('completed-quizzes/', views.UserCompletedQuizzesView.as_view(), name='user_completed_quizzes'),
    path('submit-quiz/', views.SubmitQuizView.as_view(), name='submit_quiz'),
]