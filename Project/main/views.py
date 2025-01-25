from six import print_

from .models import Chat, Message
from .serializers import ChatSerializer, MessageSerializer, UserSerializer

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework import viewsets, status

from django.contrib.auth.models import User
from django.urls import reverse



class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    def list(self, request, *args, **kwargs):
        chat_id = request.query_params.get('chat_id')
        if chat_id:
            messages = self.queryset.filter(chat_id=chat_id).order_by('-timestamp')
            serializer = self.get_serializer(messages, many=True)
            return Response(serializer.data)
        raise ValidationError({"error": "Параметр 'chat_id' обязателен для получения сообщений."})

    @action(detail=False, methods=['post'])
    def create_message(self, request):
        data = request.data                                     # создаем дату из запроса
        serializer = self.get_serializer(data=data)             # проверяем данные на валидность сериализатором
        if serializer.is_valid():                               # если валидны:
            serializer.save()    # message                      # 1) сохраняем сообщение
            return Response(serializer.data, status=201)        # 2) статус 200 OK
        return Response(serializer.errors, status=400)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['get', 'put'], url_path='current_user')
    def current_user(self, request):
        user = request.user  # Получаем текущего пользователя

        if request.method == 'GET':
            # Сериализуем данные пользователя
            serializer = self.get_serializer(user)
            data = serializer.data

            # Формируем URL профиля
            profile_url = request.build_absolute_uri(
                reverse('profile', kwargs={'user_id': user.id})
            )
            data['profile_url'] = profile_url
            return Response(data)

        elif request.method == 'PUT':
            print('Отправленная дата:', request.data)
            # Обновляем данные пользователя
            serializer = self.get_serializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)