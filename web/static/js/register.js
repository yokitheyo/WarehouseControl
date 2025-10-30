// register.js
(function () {
    'use strict';

    const API_URL = '/api';

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        console.log('[REGISTER] Инициализация');

        // Если уже авторизован - редирект на главную
        if (isAuthenticated()) {
            console.log('[REGISTER] Пользователь авторизован, редирект на /');
            window.location.replace('/');
            return;
        }

        const form = document.getElementById('registerForm');
        if (form) {
            form.addEventListener('submit', handleRegister);
        }

        console.log('[REGISTER] Готов к работе');
    }

    function isAuthenticated() {
        const token = localStorage.getItem('authToken');
        if (!token) return false;

        try {
            const payload = parseJWT(token);
            if (!payload || !payload.exp) return false;

            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                return false;
            }

            return true;
        } catch (e) {
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
            return null;
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        console.log('[REGISTER] Отправка формы');

        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        const role = document.getElementById('registerRole').value;

        // Валидация
        if (!username || !password || !role) {
            showAlert('Заполните все поля', 'error');
            return;
        }

        if (username.length < 3) {
            showAlert('Имя пользователя должно содержать минимум 3 символа', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            showAlert('Пароли не совпадают', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });

            const data = await response.json();
            console.log('[REGISTER] Ответ сервера:', response.status, data);

            if (response.ok && data.success) {
                showAlert('Регистрация успешна! Перенаправление на страницу входа...', 'success');
                setTimeout(() => {
                    window.location.replace('/login');
                }, 2000);
            } else {
                showAlert(data.error || 'Ошибка регистрации', 'error');
            }
        } catch (error) {
            console.error('[REGISTER] Ошибка:', error);
            showAlert('Ошибка подключения к серверу', 'error');
        }
    }

    function showAlert(message, type) {
        let alert = document.getElementById('registerAlert');
        if (!alert) {
            alert = document.createElement('div');
            alert.id = 'registerAlert';
            const form = document.getElementById('registerForm');
            if (form && form.parentNode) {
                form.parentNode.insertBefore(alert, form);
            }
        }

        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.display = 'block';

        setTimeout(() => {
            alert.style.display = 'none';
        }, type === 'success' ? 3000 : 5000);
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