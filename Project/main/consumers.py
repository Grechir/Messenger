# WS connection №2
import json

from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    # при подключении
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name'] # идентификатор комнаты, извлекаемый из URL
        self.room_group_name = f'chat_{self.room_name}' # уникальное имя группы, связывающее всех клиентов в одной комнате
        await self.channel_layer.group_add(  # добавляем участника в группу:
            self.room_group_name,  # группа, в которую добавляем участника
            self.channel_name  # сам участник, которого добавляем (уникальный идентификатор текущего клиента)
        )
        await self.accept()  # подтверждается соединение клиента

    # при получении сообщения сервером от клиента
    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data) # получаем данные в формате json и преобразуем в словарь (python объект)
        message = data['message'] # извлекаем сообщение по ключу message

        await self.channel_layer.group_send( # Передаем сообщение (не отправляем) в очередь для отправки всем участникам группы
            self.room_group_name, # первый аргумент - название группы, куда отправляем сообщение
            {                               # второй аргумент - словарь, который содержит:
                'type': 'chat_message',     # 1) Тип обработчика (который и отправит сообщение)
                'message': message,         # 2) Само сообщение
            }
        )

    # обработчик отправки сообщения всем участникам группы (извлекает сообщение из события event и отправляет)
    async def chat_message(self, event):
        message = event['message']  # event - словарь, переданный в group_send
        await self.send(text_data=json.dumps({  # self.send отвечает за передачу сообщения от сервера в браузер
            'message': message,
        }))

    # отключение пользователя от websocket соединения
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name, # группа, из которой отключаем участника
            self.channel_name  # сам участник, которого отключаем (уникальный идентификатор текущего клиента)
        )

