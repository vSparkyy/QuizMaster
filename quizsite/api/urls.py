from django.urls import path, include
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.RegisterUserView.as_view(), name='register'),
    path('token/', views.CustomTokenObtainPairView.as_view(), name='get_token'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('auth/', include('rest_framework.urls')),
    path('questions/', views.QuestionListView.as_view(), name='questions'),
    path('completed-quizzes/', views.UserCompletedQuizzesView.as_view(), name='user_completed_quizzes'),
    path('submit-quiz/', views.SubmitQuizView.as_view(), name='submit_quiz'),
    path('generate-username/', views.GenerateUsernameView.as_view(), name='generate-username'),
    path('topic-difficulty-report/', views.TopicDifficultyReportView.as_view(), name='topic_difficulty_report'),
    path('user-quizzes-report/', views.UserQuizzesReportView.as_view(), name='user_quizzes_report'),
    path('search/', views.UserSearchView.as_view(), name='user-search')
]