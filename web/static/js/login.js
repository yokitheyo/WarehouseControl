// login.js
(function () {
    'use strict';

    const API_URL = '/api';

    // Инициализация при загрузке DOM
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        console.log('[LOGIN] Инициализация');

        // Если уже авторизован - редирект на главную
        if (isAuthenticated()) {
            console.log('[LOGIN] Пользователь авторизован, редирект на /');
            redirectToHome();
            return;
        }

        // Подключаем обработчик формы
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', handleLogin);
        }

        console.log('[LOGIN] Готов к работе');
    }

    function isAuthenticated() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;

        // Проверяем срок действия токена
        try {
            const payload = parseJWT(token);
            if (!payload || !payload.exp) return false;

            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                console.log('[LOGIN] Токен истёк');
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                return false;
            }

            return true;
        } catch (e) {
            console.error('[LOGIN] Ошибка проверки токена:', e);
            return false;
        }
    }

    function parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('[LOGIN] Ошибка парсинга JWT:', e);
            return null;
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        console.log('[LOGIN] Отправка формы');

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            showAlert('Введите имя пользователя и пароль', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('[LOGIN] Ответ сервера:', response.status, data);

            if (response.ok && data.success) {
                // Сохраняем токен и данные пользователя
                localStorage.setItem('authToken', data.data.token);
                localStorage.setItem('authUser', JSON.stringify({
                    username: data.data.username,
                    role: data.data.role
                }));

                console.log('[LOGIN] Авторизация успешна, токен сохранён');
                showAlert('Вход выполнен! Перенаправление...', 'success');

                // Редирект через 500ms
                setTimeout(() => {
                    redirectToHome();
                }, 500);
            } else {
                showAlert(data.error || 'Неверное имя пользователя или пароль', 'error');
            }
        } catch (error) {
            console.error('[LOGIN] Ошибка:', error);
            showAlert('Ошибка подключения к серверу', 'error');
        }
    }

    function showAlert(message, type) {
        let alert = document.getElementById('loginAlert');
        if (!alert) {
            alert = document.createElement('div');
            alert.id = 'loginAlert';
            const form = document.getElementById('loginForm');
            if (form && form.parentNode) {
                form.parentNode.insertBefore(alert, form);
            }
        }

        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.display = 'block';

        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }

    function redirectToHome() {
        window.location.replace('/');
    }

    // Глобальная функция для переключения видимости пароля
    window.togglePassword = function (inputId) {
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
    };

})();