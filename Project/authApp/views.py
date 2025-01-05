from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from .serializers import UserSerializer


@api_view(['POST'])
def signup(request):  # принимаем запрос от пользователя
    serializer = UserSerializer(data=request.data)  # передаем в сериализатор данные из запроса пользователя
    if serializer.is_valid():
        user = serializer.save()  # Создаём пользователя и токен через сериализатор и сохраняем
        token = Token.objects.get(user=user)  # получаем токен пользователя, который создали в сериализаторе

        # Формируем ответ
        response_data = {
            'user': serializer.data,
            'token': token.key,
        }

        return Response(response_data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def login(request):

    data = request.data  # получаем данные из запроса пользователя
    user_identification = authenticate(username=data['username'], password=data['password'])
    # если пользователя нет, то возвращается объект None, в ином случае:
    if user_identification:
        # user = User.objects.get(username=data['username']) # достаем пользователя по информации из запроса
        serializer = UserSerializer(user_identification)  # сериализируем этого пользователя

        response_data = {
            'user': serializer.data,
        }

        token, created_token = Token.objects.get_or_create(user=user_identification)
        # так как каждый раз, когда пользователь выходит из системы, токен, что использовался для аутентификации
        # пропадает, мы создаем новый и присваиваем переменной created_token, в ином случае в token
        if token:
            response_data['token'] = token.key
        elif created_token:
            response_data['token'] = created_token.key

        return Response(response_data, status=status.HTTP_200_OK)

    return Response({"detail": "not found"}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout(request):

    request.user.auth_token.delete()

    return Response({"message": "logout was successful"})
