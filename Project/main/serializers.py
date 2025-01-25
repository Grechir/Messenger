from .models import Chat, Message, Profile
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


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('avatar', 'birth_date', 'bio')


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source='profile.avatar')
    birth_date = serializers.DateField(source='profile.birth_date')
    bio = serializers.CharField(source='profile.bio')

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'birth_date', 'bio')

    def update(self, instance, validated_data):
        # отделяем данные профиля от validated_data, чтобы работать с ними по отдельности для удобства
        print('Полученная дата:', validated_data)
        profile_data = validated_data.pop('profile', None)
        print("Validated data (user):", validated_data)
        print("Validated data (profile):", profile_data)

        # обновляем данные пользователя модели User (validated_data)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # обновляем данные профиля модели Profile (profile_data)
        if profile_data:
            profile_instance = instance.profile # работаем с инстансом модели Profile, переданным с OneToOneField
            for attr, value in profile_data.items():
                print(f"Updating profile {attr}: {value}")
                setattr(profile_instance, attr, value)
            profile_instance.save()

        return instance

