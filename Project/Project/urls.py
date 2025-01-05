from django.contrib import admin
from django.urls import path, include
from main import views
from rest_framework.routers import DefaultRouter

from main.views import UserViewSet

router = DefaultRouter()
router.register(r'chats', views.ChatViewSet)
router.register(r'messages', views.MessageViewSet)
router.register(r'users', UserViewSet, basename='user')


urlpatterns = [
    path('admin/', admin.site.urls), # Страница админки
    path('api/', include(router.urls)), # API для сообщений и чатов
    path('auth/', include('authApp.urls')),
]
