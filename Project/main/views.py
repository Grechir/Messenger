from .models import Chat, Message
from .serializers import ChatSerializer, MessageSerializer, UserSerializer

from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.decorators import action
from rest_framework import status
from rest_framework.response import Response
from rest_framework import viewsets

from django.contrib.auth.models import User, Permission



class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    @action(detail=False, methods=['post'])
    def create_message(self, request):
        data = request.data                                     # создаем дату из запроса
        serializer = self.get_serializer(data=data)             # проверяем данные на валидность сериализатором
        if serializer.is_valid():                               # если валидны:
            serializer.save()    # message                      # 1) сохраняем сообщение
            return Response(serializer.data, status=201)        # 2) статус 200 OK
        return Response(serializer.errors, status=400)


class UserViewSet(ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['get'], url_path='current_user')
    def current_user(self, request):
        # if request.user.is_authenticated:

        user = request.user  # получаем пользователя
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email
        })
        # else:
        #     return Response({'detail': 'Необходимо авторизоваться'}, status=status.HTTP_403_FORBIDDEN)
