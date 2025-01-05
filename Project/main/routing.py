# WS connection №3
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/chat/<str:room_name>/', consumers.ChatConsumer.as_asgi()) # маршрут, обрабатывающей WebSocket запросы
]