document.addEventListener('DOMContentLoaded', () => {
    const authBlock = document.getElementById('auth'); // контент с регистрацией
    const mainContent = document.getElementById('page-content'); // Основной контент страницы

    // Проверяем наличие токена при загрузке страницы
    const token = localStorage.getItem('token');
    if (token) {
        // Если токен есть, скрываем форму логина и показываем основной контент
        if (authBlock) authBlock.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('hidden');
        console.log('Пользователь авторизован, показываем основной контент.');
    } else {
        // Если токена нет, показываем форму логина и скрываем основной контент
        if (authBlock) authBlock.classList.remove('hidden');
        if (mainContent) mainContent.classList.add('hidden');
        console.log('Пользователь не авторизован, показываем форму логина.');
    }

    // Логика входа
    const loginButton = document.querySelector('.loginButton'); // Кнопка логина
    if (loginButton) {
        loginButton.addEventListener('click', (event) => {
            event.preventDefault(); // Предотвращаем стандартное поведение кнопки

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            fetch('http://127.0.0.1:8000/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Ошибка при авторизации');
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.token) {
                        // Сохраняем токен в localStorage
                        localStorage.setItem('token', data.token);

                        const event = new CustomEvent('tokenAvailable');
                        document.dispatchEvent(event);

                        alert('Вы успешно вошли в систему!');

                        // Скрываем форму логина
                        if (authBlock) authBlock.classList.add('hidden');

                        // Показываем основной контент
                        if (mainContent) mainContent.classList.remove('hidden');
                    } else {
                        alert('Токен авторизации не обнаружен. Попробуйте еще раз.');
                    }
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    alert('Неверные данные для входа. Попробуйте ещё раз.');
                });
        });
    }

    // Логика выхода
    const logoutButton = document.querySelector('.logoutButton'); // Кнопка выхода
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Удаляем токен из localStorage
            localStorage.removeItem('token');

            // Показываем форму логина
            if (authBlock) authBlock.classList.remove('hidden');

            // Скрываем основной контент
            if (mainContent) mainContent.classList.add('hidden');

            alert('Вы вышли из системы.');
        });
    }

    // Логика регистрации
    const signupBlock = document.getElementById('signup-form');
    const signupButton = document.querySelector('.signupButton');
    const signupSubmitButton = document.querySelector('.signupSubmitButton');
    if (signupButton) {
        signupButton.addEventListener('click', () => {
            signupBlock.classList.remove('hidden');
            signupButton.classList.add('hidden');
        });
    }

    if (signupSubmitButton) {
        signupSubmitButton.addEventListener('click', (event) => {
            event.preventDefault(); // Предотвращаем стандартное поведение кнопки

            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            if (!username || !email || !password) {
                alert('Пожалуйста, заполните все поля.');
            } else {
                fetch('http://127.0.0.1:8000/auth/signup/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        email: email,
                        password: password,
                    }),
                })
                .then(response => {
                    if(!response.ok) {
                        throw new Error('Ошибка регистрации');
                    }
                    return response.json();
                })
                .then(() => {
                    alert('Регистрация прошла успешно! Вы можете зайти в систему!');
                    signupBlock.classList.add('hidden');
                    signupButton.classList.remove('hidden');
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    alert('Произошла ошибка регистрации, попробуйте еще раз!')
                });
            }
        });
    }
});
