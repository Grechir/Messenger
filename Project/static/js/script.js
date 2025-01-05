// работа с чатом
const chatBox = document.querySelector('.chatBox');
const chatInput = document.querySelector('.chatInput');
const sendButton = document.querySelector('.sendButton');

// Получение и отображение пользователей и чатов
const userList = document.querySelector('.userList');
const chatList = document.querySelector('.chatList');
const csrftoken = getCookie('csrftoken'); // токен пользователя

let chatSocket = null;
let currentChatId = null;
let currentUserId = null;

//////////////////////////////////////////////// открытие соединения с чатом /////////////
function openChat(chatId, chatName, chatDescription) {
    // 1) если уже открыто соединение, то закрываем его
    if (chatSocket) {
        chatSocket.close(); // Закрываем старое соединение
    }

    // 2) устанавливаем id чата, обновляем заголовок чата и его описание
    currentChatId = chatId;
    document.getElementById('chat-name').textContent = chatName;
    document.getElementById('chat-description').textContent = chatDescription;

    // 3) открываем новое соединение
    chatSocket = new WebSocket(
        'ws://' + '127.0.0.1:8000' + '/ws/chat/' + chatId + '/' // WebSocket URL
    )

    // 3.1) при открытии соединения
    chatSocket.onopen = function () {
        console.log(`Connected to ${chatName}`);
    };

    // 4) при получении сообщения
    chatSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        chatBox.innerHTML += `<div>${data.username}: ${data.message}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    // 5) при закрытии соединения
    chatSocket.onclose = function () {
        console.log(`Disconnected from ${chatName}`);
    };
}

///////////////////////////////////////////////// Отправка сообщения ///////////
async function sendMessageToDB(message, chatId, userId) {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/messages/create_message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                content: message,
                chat: chatId,
                sender: userId
            }),
        });
        if (!response.ok) {
            console.error('Ошибка при создании сообщения:', await response.text());
        } else {
            console.log('Сообщение успешно создано в базе данных!')
        }
    } catch (error) {
        console.error('Ошибка соединения:', error);
    }
}

function sendMessageToWS(socket, message, userId) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            message: message,
            user: userId
        }));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const chatNameInput = document.getElementById('chat-name');

    if (!usernameInput || !chatNameInput) {
        console.error("Элементы с ID 'username' или 'chat-name' не найдены.");
    }
});
// отправка сообщения при нажатии на кнопку
sendButton.addEventListener('click', (event) => {
    event.preventDefault();

    const message = chatInput.value;
    const chatId = currentChatId
    const userId = currentUserId
    console.log("Сообщение:", message, " id чата:", chatId, " id пользователя:", userId);

    if (!message || !chatId || !userId) {
        sendMessageToDB(message, chatId, userId);
        sendMessageToWS(chatSocket, message, userId);

        chatBox.scrollTop = chatBox.scrollHeight; // прокручиваем чат вниз
        chatInput.value = ''; // очищаем поле ввода
    }
});

// отправка сообщения при нажатии на Enter
chatInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendButton.click();
    }
});

////////////////////////////////////// загрузка и отображение ПОЛЬЗОВАТЕЛЕЙ И ЧАТОВ /////////////
async function fetchData() {
    try {
        // запрос текущего пользователя через API ////////////////////////
        const currentUserResponse = await fetch ('http://127.0.0.1:8000/api/users/current_user/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('token')}`,
            },
        });

        if (currentUserResponse.ok) {
            const userData = await currentUserResponse.json();
            currentUserId = userData.id; // сохраняем id текущего пользователя
        } else {
            if (currentUserResponse.status === 403) {
                console.error('Ошибка: Необходимо авторизоваться для доступа.');
            }
            console.log('Ошибка получения текущего пользователя')
        }

        // запрос пользователей через API ////////////////////////
        const userResponse = await fetch('http://127.0.0.1:8000/api/users/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrftoken,
            },
            credentials: 'same-origin', // Чтобы передавать куки
        });

        // преобразуем в JSON
        const users = await userResponse.json(); // перевод в JSON

        // отображение пользователей
        renderUsers(users);

        // запрос чатов через API ////////////////////////
        const chatsResponse = await fetch ('http://127.0.0.1:8000/api/chats/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrftoken,
            },
            credentials: 'same-origin', // Чтобы передавать куки
        }); // это в Project.urls.py

        // преобразуем в JSON
        const chats = await chatsResponse.json();

        // отображение чатов
        renderChats(chats);


    } catch (error) {
        console.error('Ошибка загрузки данных', error);
    }
}

// отображение пользователей
function renderUsers(users) {
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = `${user.username}`;
        li.addEventListener('click', () => {
            // открываем личный чат с пользователем
            openChat(user.id, li.textContent);
        });
        userList.appendChild(li); // создаем элемент списка li внутри списка ul
    });
}

// отображение чатов
function renderChats(chats) {
    chatList.innerHTML = '';
    chats.forEach(chat => {
        const li = document.createElement('li');
        li.textContent = chat.name;
        li.setAttribute('data-chat-id', chat.id);  // сразу устанавливаем атрибут с id чата
        li.addEventListener('click', () => {
            // открываем чат
            openChat(chat.id, chat.name);
        });
        chatList.appendChild(li); // создаем элемент списка li внутри списка ul
    })
}
// отображение текущего пользователя, чатов и всех пользователей
if (localStorage.getItem('token')) {
    document.addEventListener('DOMContentLoaded', fetchData); // если токен есть, то как загрузится DOM активируем
} else {
    document.addEventListener('tokenAvailable', fetchData); // если токена нет, ждем событие его появления
}
// (замечание) Если пользователей и чатов будет много, то сайт ляжет отдохнуть. Но сейчас речь идет не об оптимизации.
// P.S. А когда о ней идет речь? XD

////////////////////////// автоматическая передача csrf токена для поддержания сессий ////////
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
