from django.urls import path
from django.views.generic import TemplateView
from .views import UserViewSet

urlpatterns = [
    path('profile/<int:user_id>/', TemplateView.as_view(template_name='profile.html'), name='profile'),
    path('', TemplateView.as_view(template_name='index.html'), name='index'),
    path('api/users/current_user/', UserViewSet.as_view({'put': 'update'}), name='update_current_user'),
]