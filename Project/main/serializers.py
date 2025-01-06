from .models import Chat, Message
from django.contrib.auth.models import User

from rest_framework import serializers

class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = ('id', 'name', 'description', 'participants')


class MessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='sender.username', read_only=True)
    class Meta:
        model = Message
        fields = ('id', 'chat', 'content', 'timestamp', 'sender', 'username')

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')