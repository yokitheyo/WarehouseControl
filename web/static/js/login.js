// login.js — минимальная логика для login.html
const API_URL = '/api';

function addListenerIfExists(selectorOrElem, event, handler) {
    const el = typeof selectorOrElem === 'string' ? document.getElementById(selectorOrElem) : selectorOrElem;
    if (el) el.addEventListener(event, handler);
}

addListenerIfExists('loginForm', 'submit', handleLogin);

// показываем уведомление (создаёт контейнер, если его нет)
function showAlert(elementId, message, type) {
    let alertDiv = document.getElementById(elementId);
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = elementId;
        document.body.prepend(alertDiv);
    }
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    setTimeout(() => { alertDiv.style.display = 'none'; }, 5000);
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('handleLogin called');

    const usernameEl = document.getElementById('loginUsername');
    const passwordEl = document.getElementById('loginPassword');
    const username = usernameEl ? usernameEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';

    if (!username || !password) {
        showAlert('loginAlert', 'Введите имя пользователя и пароль', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // критично для получения Set-Cookie
            body: JSON.stringify({ username, password })
        });

        // Попытка прочитать JSON (если сервер возвращает json)
        let data = {};
        try { data = await response.json(); } catch (_) { /* ignore */ }

        console.log('login response', response.status, data);

        if (response.ok) {
            // редирект на защищённую страницу
            window.location.href = '/';
        } else {
            showAlert('loginAlert', data.error || data.message || 'Ошибка авторизации', 'error');
        }
    } catch (err) {
        console.error('login error', err);
        showAlert('loginAlert', 'Ошибка подключения к серверу', 'error');
    }
}
