document.addEventListener("DOMContentLoaded", async function() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/users/current_user/', {
            method: 'GET',
            headers: {
                'Authorization': `Token ${localStorage.getItem('token')}`,
        },
    });
    if (response.ok) {
        const data = await response.json();
        console.log('Сервер прислал:', data);
        document.getElementById('firstName').value = data.first_name || '';
        document.getElementById('lastName').value = data.last_name || '';
        document.getElementById('bio').value = data.bio || '';
        document.getElementById('birthDate').value = data.birth_date || '';
        document.getElementById('profile-avatar').src = data.avatar || '/media/avatar/default.jpg';
    } else {
        console.log('Ошибка загрузки данных профиля');
    }
    } catch (error) {
        console.log('Ошибка соединения', error);
    }
});

document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    const data = new FormData();
    data.append('first_name', document.getElementById('firstName').value);
    data.append('last_name', document.getElementById('lastName').value);
    data.append('bio', document.getElementById('bio').value);
    data.append('birth_date', document.getElementById('birthDate').value);
    data.append('avatar', document.getElementById('avatar').files[0])

    for (let [key, value] of data.entries()) {
        console.log(`${key}: ${value}`);
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/api/users/current_user/', {
            method: 'PUT',
            headers: {
                'Authorization': `Token ${localStorage.getItem('token')}`,
        },
            body: data,
    });
        if (response.ok) {
            alert('Профиль обновлен')
        } else {
            alert('Ошибка обновления профиля')
        }
    } catch (error) {
        console.log('Ошибка соединения:', error)
    }
});



