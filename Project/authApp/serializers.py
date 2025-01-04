from django.contrib.auth.models import User
from django.core.serializers import serialize

from rest_framework import serializers
from rest_framework.authtoken.models import Token

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    # создаем метод save, в котором:
    def save(self, **kwargs):

        user = User.objects.create_user(                        # создаем нового пользователя, в котором присваиваем
            username = self.validated_data['username'],         # полям username, email, password -  соответствующие
            email = self.validated_data['email'],               # провалидированные значения, которые передает юзер
            password = self.validated_data['password'],
        )

        Token.objects.create(user=user) # присваиваем пользователю токен

        return user


