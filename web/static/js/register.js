// register.js — логика для register.html
const API_URL = '/api';

function addListenerIfExists(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

addListenerIfExists('registerForm', 'submit', handleRegister);

function showAlert(elementId, message, type) {
    let alertDiv = document.getElementById(elementId);
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = elementId;
        const form = document.getElementById('registerForm');
        if (form) {
            form.parentNode.insertBefore(alertDiv, form);
        } else {
            document.body.prepend(alertDiv);
        }
    }
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    setTimeout(() => { alertDiv.style.display = 'none'; }, 5000);
}

async function handleRegister(e) {
    e.preventDefault();
    console.log('handleRegister called');

    const usernameEl = document.getElementById('registerUsername');
    const passwordEl = document.getElementById('registerPassword');
    const passwordConfirmEl = document.getElementById('registerPasswordConfirm');
    const roleEl = document.getElementById('registerRole');

    const username = usernameEl ? usernameEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const passwordConfirm = passwordConfirmEl ? passwordConfirmEl.value : '';
    const role = roleEl ? roleEl.value : '';

    // Валидация
    if (!username || !password || !role) {
        showAlert('registerAlert', 'Заполните все поля', 'error');
        return;
    }

    if (username.length < 3) {
        showAlert('registerAlert', 'Имя пользователя должно содержать минимум 3 символа', 'error');
        return;
    }

    if (password.length < 6) {
        showAlert('registerAlert', 'Пароль должен содержать минимум 6 символов', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showAlert('registerAlert', 'Пароли не совпадают', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password, role })
        });

        let data = {};
        try { data = await response.json(); } catch (_) { /* ignore */ }

        console.log('register response', response.status, data);

        if (response.ok && data.success) {
            showAlert('registerAlert', 'Регистрация успешна! Перенаправление на страницу входа...', 'success');

            // Через 2 секунды переходим на страницу входа
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showAlert('registerAlert', data.error || data.message || 'Ошибка регистрации', 'error');
        }
    } catch (err) {
        console.error('register error', err);
        showAlert('registerAlert', 'Ошибка подключения к серверу', 'error');
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const btn = input.parentElement.querySelector('.password-toggle-btn');
    if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.textContent = '🙈';
    } else {
        input.type = 'password';
        if (btn) btn.textContent = '👁️';
    }
}