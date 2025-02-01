// работа с чатом
const chatBox = document.querySelector('.chatBox');
const chatInput = document.querySelector('.chatInput');
const roomNameInput = document.querySelector('.roomName');
const roomDescriptionInput = document.querySelector('.roomDescription');
const sendButton = document.querySelector('.sendButton');
const createChatBtn = document.querySelector('.CreateChatBtn');
const editChatButton = document.querySelector('.editChatButton');
const deleteChatButton = document.querySelector('.deleteChatButton');
const closeModalButton = document.querySelector('.closeModalButton');
const saveModalButton = document.querySelector('.saveModalButton');
const addParticipantButton = document.querySelector('.addParticipantButton');

// Получение и отображение пользователей и чатов
const userList = document.querySelector('.userList');
const chatList = document.querySelector('.chatList');
const messageList = document.querySelector('.messageList');
const availableUsersList = document.querySelector('.availableUsersList');
const csrftoken = getCookie('csrftoken'); // токен пользователя

let allUsers = null;
let chatSocket = null;
let currentChatId = null;
let currentUserId = null;
let currentUsername = null;
let currentUserAvatar = null;

//////////////////////////////////////////////// открытие соединения с чатом /////////////
function openChat(chatId, chatName, chatDescription=null) {
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
        messageList.innerHTML = '';
        loadMessages(chatId);
    };

    // 4) при получении сообщения
    chatSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        const messageLi = document.createElement('li');
        messageLi.textContent = `${data.username}: ${data.message}`;
        messageList.prepend(messageLi);
        messageList.scrollTop = chatBox.scrollHeight;
    };

    // 5) при закрытии соединения
    chatSocket.onclose = function () {
        console.log(`Disconnected from ${chatName}`);
    };
}

//////////////////////////////////////////////////Открытие соединения с ЛС ////////////////
async function openPrivateChat(userId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/chats/get_or_create_private_chat/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({user_id: userId}),
        });

        if (response.ok) {
            const chat = await response.json()
            console.log("Чат найден или создан:", chat);
            openChat(chat.id, chat.name);
        } else {
            console.log('Чат не найден')
        }

    } catch (error) {
        console.log('Ошибка открытия чата с пользователем', error);
    }
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

function sendMessageToWS(socket, message, userId, username) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            message: message,
            user: userId,
            username: username
        }));
    } else {
        console.error("WebSocket не открыт или не готов к отправке.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const chatNameInput = document.getElementById('chat-name');

    if (!usernameInput || !chatNameInput) {
        console.error("Элементы с ID 'username' или 'chat-name' не найдены.");
    }
});

// отправка сообщения
async function sendMessage() {

    const message = chatInput.value;
    const chatId = currentChatId
    const userId = currentUserId
    const username = currentUsername
    console.log(
        `Сообщение: ${message},
        id чата: ${chatId},
        id пользователя: ${userId},
        Имя пользователя: ${username},`
    );

    if (message && chatId && userId) {
        sendMessageToDB(message, chatId, userId);
        sendMessageToWS(chatSocket, message, userId, username);

        chatInput.value = ''; // очищаем поле ввода

    } else {
        console.log('Не удалось отправить сообщение. Проверьте данные: ', { message, chatId, userId })
    }
}

// отправка сообщения
sendButton.addEventListener('click', (event) => {
    event.preventDefault();
    sendMessage();  // вызываем функцию отправки сообщения
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

            const profileLink = document.getElementById('profile-link');
            profileLink.href = userData.profile_url

            currentUserId = userData.id; // сохраняем id текущего пользователя
            currentUsername = userData.username  // сохраняем username текущего пользователя
            currentUserAvatar = userData.avatar // сохраняем аватарку текущего пользователя

            document.getElementById('user-name').textContent = `${userData.username}`
            if (currentUserAvatar) {
                document.getElementById('user-avatar').src = currentUserAvatar
            } else {
                console.log('не удалось найти аватар в базе данных')
                document.getElementById('user-avatar').src = 'media/avatar/default.jpg'
            }

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
        });

        // преобразуем в JSON и отображаем пользователей
        if (userResponse.ok) {
            const users = await userResponse.json(); // перевод в JSON
            allUsers = users;
            renderUsers(users);
        } else {
            console.error('Ошибка получения пользователей!')
        }

        // запрос чатов текущего пользователя через API ////////////////////////
        const chatsResponse = await fetch ('http://127.0.0.1:8000/api/chats/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrftoken,
            },
        });

        // преобразуем в JSON и отображаем чаты
        if (chatsResponse.ok) {
            const chats = await chatsResponse.json();
            const userChats = chats.filter(chat => chat.participants.includes(currentUserId));
            renderChats(userChats);
        } else {
            console.error('Ошибка получения чатов!')
        }

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
            openPrivateChat(user.id);
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
            openChat(chat.id, chat.name, chat.description);
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

////////////////////////////////////// загрузка и отображение сообщений чата /////////////////
async function loadMessages(chatId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/messages/?chat_id=${chatId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('token')}`,
            },
        });
        if (!response.ok) {
            console.error('Ошибка при загрузке сообщений:', await response.text());
            return;
        }
        const data = await response.json();
        renderMessages(data); // массив передаем в renderMessages

    } catch (error) {
        console.error('Ошибка при загрузке сообщений:', error);
    }
}

function renderMessages(messages) {
    messageList.innerHTML = '';
    messages.forEach(message => {
        const messageLi = document.createElement('li');
        messageLi.textContent = `${message.username}: ${message.content}`;
        messageList.appendChild(messageLi);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}


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

/////////////////////////////////////////////// создание чата //////////////////////////////////
async function createChat() {
    const roomName = roomNameInput.value.trim();  // Получаем название чата
    const roomDescription = roomDescriptionInput.value
    const participant = currentUserId
    if (!roomName) {
        alert('Введите название чата');
        return;
    }
    try {
        const response = await fetch('http://127.0.0.1:8000/api/chats/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                name: roomName,
                description: roomDescription,
                participants: [participant]
            }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Чат успешно создан:', data);
            addChatToChatList(data);        // Добавляем новый чат в список
            roomNameInput.value = '';           // Очищаем поле ввода
            roomDescriptionInput.value = '';
        } else {
            console.error('Ошибка при создании чата');
            alert('Не удалось создать чат');
        }
    } catch (error) {
        console.error('Ошибка соединения:', error);
        alert('Ошибка соединения');
    }
}

function addChatToChatList(chat) {
    const chatLi = document.createElement('li');
    chatLi.textContent = `${chat.name}`;
    chatList.appendChild(chatLi);
    chatBox.scrollTop = chatBox.scrollHeight;
    chatLi.setAttribute('data-chat-id', chat.id);  // сразу устанавливаем атрибут с id чата
    chatLi.addEventListener('click', () => {
        // открываем чат
        openChat(chat.id, chat.name, chat.description);
    });
}

createChatBtn.addEventListener('click', (event) => {
    event.preventDefault();
    createChat();
});

/////////////////////////////////// Редактирование и удаление чата //////////////////////

// РЕДАКТИРОВАНИЕ ЧАТА
// открытие окна редактирования
editChatButton.addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('editChatModal').style.display = 'block';

// Закрытие окна редактирования
    closeModalButton.addEventListener('click', () => {
        document.getElementById('editChatModal').style.display = 'none';
    });

// Сохранение изменений (отправка данных на сервер)
    saveModalButton.addEventListener('click', async () => {
        const name = document.getElementById('chatNameInput').value;
        const description = document.getElementById('chatDescriptionInput').value;

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/chats/${currentChatId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    name,
                    description,
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Обновляем интерфейс после успешного сохранения
                document.getElementById('chat-name').textContent = data.name;
                document.getElementById('chat-description').textContent = data.description;

                // Закрываем окно редактирования
                document.getElementById('editChatModal').style.display = 'none';

                alert('Чат успешно отредактирован!');
                window.location.reload();
            } else {
                alert('Ошибка редактирования чата.');
            }
        } catch (error) {
            console.error('Непредвиденная ошибка:', error);
        }
    });
});

// УДАЛЕНИЕ ЧАТА
deleteChatButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const confirmDelete = confirm(`Вы уверены, что хотите удалить этот чат?`);
    if (!confirmDelete) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/chats/${currentChatId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${localStorage.getItem('token')}`,
            }
        })

        if (response.ok) {
            alert('Чат успешно удален!');
            window.location.reload();
        } else {
            alert('Не удалось удалить чат');
        }

    } catch (error) {
        console.log('Ошибка удаления чата:', error);
    }
});

//////////////// добавление участников чата ///////////////////////////////////////
function addParticipant(chatId, userId) {
    fetch(`http://127.0.0.1:8000/api/chats/${chatId}/add_participant/`, {
        method: "PATCH",
        headers: {
            "Authorization": `Token ${localStorage.getItem('token')}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: userId })
    })
        .then(response => response.json())
        .then(data => {
            console.log("Участник добавлен:", data);
            document.querySelector(".availableUsersList").style.display = "none"; // Закрываем список
            alert('Добавлен новый участник!')
        })
        .catch(error => console.error("Ошибка:", error));
}

function loadAvailableUsers(chatId, chatParticipants) {
    const availableUsers = allUsers.filter(user => !chatParticipants.includes(user.id));

    availableUsersList.innerHTML = '';

    availableUsers.forEach(user => {
        const userItem = document.createElement('li');
        userItem.textContent = user.username;
        userItem.onclick = () => addParticipant(chatId, user.id);
        availableUsersList.appendChild(userItem);
    });

    availableUsersList.style.display = 'block';
}

addParticipantButton.addEventListener('click', (event) => {
    event.preventDefault();

    fetch(`http://127.0.0.1:8000/api/chats/${currentChatId}/`)
        .then(response => response.json())
        .then(chat => {
            const chatParticipants = chat.participants
            loadAvailableUsers(currentChatId, chatParticipants);
        })
        .catch(error => console.log('Ошибка при получении данных чата', error));
})

// Скрываем список, если кликнули за его пределами
document.addEventListener('click', (event) => {
    if (!availableUsersList.contains(event.target) && event.target.id !== "addParticipantButton") {
        availableUsersList.style.display = 'none';
    }
});
