// application.js
(function () {
    'use strict';

    const API_URL = '/api';
    let currentUser = null;
    let items = [];
    let history = [];

    // === ИНИЦИАЛИЗАЦИЯ ===
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        console.log('[APP] Инициализация');

        // Проверяем авторизацию
        if (!checkAuth()) {
            console.log('[APP] Не авторизован, редирект на /login');
            window.location.replace('/login');
            return;
        }

        console.log('[APP] Пользователь авторизован:', currentUser);

        // Показываем интерфейс
        showApp();

        // Подключаем обработчики
        setupEventListeners();

        // Загружаем товары
        switchTab('items');
    }

    function checkAuth() {
        const token = localStorage.getItem('authToken');
        const userJson = localStorage.getItem('authUser');

        if (!token || !userJson) {
            return false;
        }

        try {
            const payload = parseJWT(token);
            if (!payload || !payload.exp) {
                clearAuth();
                return false;
            }

            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
                console.log('[APP] Токен истёк');
                clearAuth();
                return false;
            }

            currentUser = JSON.parse(userJson);
            return true;
        } catch (e) {
            console.error('[APP] Ошибка проверки авторизации:', e);
            clearAuth();
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

    function clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        currentUser = null;
    }

    function showApp() {
        const appSection = document.getElementById('appSection');
        if (appSection) {
            appSection.classList.remove('hidden');
        }

        const userEl = document.getElementById('currentUser');
        if (userEl && currentUser) {
            userEl.textContent = currentUser.username;
        }

        const roleEl = document.getElementById('currentRole');
        if (roleEl && currentUser) {
            roleEl.textContent = getRoleText(currentUser.role);
            roleEl.className = `role-badge role-${currentUser.role}`;
        }

        updateUIPermissions();
    }

    function updateUIPermissions() {
        if (!currentUser) return;

        const canCreate = ['admin', 'manager'].includes(currentUser.role);
        const addBtn = document.getElementById('addItemBtn');
        if (addBtn) {
            addBtn.style.display = canCreate ? 'inline-block' : 'none';
        }
    }

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===
    function setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', openAddItemModal);
        }

        const itemForm = document.getElementById('itemForm');
        if (itemForm) {
            itemForm.addEventListener('submit', handleItemSubmit);
        }

        const searchItems = document.getElementById('searchItems');
        if (searchItems) {
            searchItems.addEventListener('input', filterItems);
        }

        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', loadHistory);
        }

        const resetFiltersBtn = document.getElementById('resetFiltersBtn');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', resetFilters);
        }

        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });
    }

    function handleLogout() {
        console.log('[APP] Выход из системы');
        clearAuth();
        window.location.replace('/login');
    }

    // === ТАБЫ ===
    function switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });

        if (tabName === 'items') {
            loadItems();
        } else if (tabName === 'history') {
            loadHistory();
        }
    }

    // === API ЗАПРОСЫ ===
    async function apiRequest(url, options = {}) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('[APP] Нет токена, редирект на /login');
            window.location.replace('/login');
            return null;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401 || response.status === 403) {
                console.log('[APP] Ошибка авторизации (401/403), редирект на /login');
                clearAuth();
                window.location.replace('/login');
                return null;
            }

            return response;
        } catch (error) {
            console.error('[APP] Ошибка запроса:', error);
            throw error;
        }
    }

    // === ТОВАРЫ ===
    async function loadItems() {
        console.log('[APP] Загрузка товаров');

        try {
            const response = await apiRequest(`${API_URL}/items`);
            if (!response) return;

            const data = await response.json();

            if (data.success) {
                items = data.data || [];
                console.log('[APP] Загружено товаров:', items.length);
                renderItems();
            } else {
                showAlert('itemAlert', data.error || 'Ошибка загрузки товаров', 'error');
            }
        } catch (error) {
            console.error('[APP] Ошибка загрузки товаров:', error);
            showAlert('itemAlert', 'Ошибка подключения к серверу', 'error');
        }
    }

    function renderItems() {
        const container = document.getElementById('itemsTable');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                    </svg>
                    <h3>Нет товаров</h3>
                    <p>Добавьте первый товар на склад</p>
                </div>
            `;
            return;
        }

        const canUpdate = ['admin', 'manager'].includes(currentUser.role);
        const canDelete = currentUser.role === 'admin';

        let html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Название</th>
                        <th>Описание</th>
                        <th>Количество</th>
                        <th>Цена</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
        `;

        items.forEach(item => {
            html += `
                <tr>
                    <td>${item.id}</td>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${escapeHtml(item.description || '-')}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price.toFixed(2)} ₽</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-sm" onclick="window.app.viewItemHistory(${item.id})">История</button>
                            ${canUpdate ? `<button class="btn btn-primary btn-sm" onclick="window.app.editItem(${item.id})">Редактировать</button>` : ''}
                            ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="window.app.deleteItem(${item.id})">Удалить</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    function filterItems() {
        const searchInput = document.getElementById('searchItems');
        if (!searchInput) return;

        const term = searchInput.value.toLowerCase();
        const container = document.getElementById('itemsTable');

        if (!term) {
            renderItems();
            return;
        }

        const filtered = items.filter(item =>
            item.name.toLowerCase().includes(term) ||
            (item.description && item.description.toLowerCase().includes(term))
        );

        // Временно заменяем items для рендеринга
        const originalItems = items;
        items = filtered;
        renderItems();
        items = originalItems;
    }

    function openAddItemModal() {
        document.getElementById('modalTitle').textContent = 'Добавить товар';
        document.getElementById('itemId').value = '';
        document.getElementById('itemForm').reset();
        document.getElementById('itemModal').classList.add('active');
    }

    function editItem(id) {
        const item = items.find(i => i.id === id);
        if (!item) return;

        document.getElementById('modalTitle').textContent = 'Редактировать товар';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('itemQuantity').value = item.quantity;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemModal').classList.add('active');
    }

    async function handleItemSubmit(e) {
        e.preventDefault();
        console.log('[APP] Сохранение товара');

        const id = document.getElementById('itemId').value;
        const data = {
            name: document.getElementById('itemName').value,
            description: document.getElementById('itemDescription').value,
            quantity: parseInt(document.getElementById('itemQuantity').value),
            price: parseFloat(document.getElementById('itemPrice').value)
        };

        try {
            const url = id ? `${API_URL}/items/${id}` : `${API_URL}/items`;
            const method = id ? 'PUT' : 'POST';

            const response = await apiRequest(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response) return;

            const result = await response.json();

            if (result.success) {
                showAlert('itemAlert', id ? 'Товар обновлён' : 'Товар добавлен', 'success');
                closeItemModal();
                loadItems();
            } else {
                showAlert('itemAlert', result.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('[APP] Ошибка сохранения товара:', error);
            showAlert('itemAlert', 'Ошибка сохранения товара', 'error');
        }
    }

    async function deleteItem(id) {
        if (!confirm('Удалить товар?')) return;

        console.log('[APP] Удаление товара', id);

        try {
            const response = await apiRequest(`${API_URL}/items/${id}`, {
                method: 'DELETE'
            });

            if (!response) return;

            const data = await response.json();

            if (data.success) {
                showAlert('itemAlert', 'Товар удалён', 'success');
                loadItems();
            } else {
                showAlert('itemAlert', data.error || 'Ошибка удаления', 'error');
            }
        } catch (error) {
            console.error('[APP] Ошибка удаления товара:', error);
            showAlert('itemAlert', 'Ошибка удаления товара', 'error');
        }
    }

    function closeItemModal() {
        document.getElementById('itemModal').classList.remove('active');
    }

    // === ИСТОРИЯ ===
    async function loadHistory() {
        console.log('[APP] Загрузка истории');

        const filters = {
            action: document.getElementById('filterAction')?.value || '',
            username: document.getElementById('filterUsername')?.value || '',
            date_from: document.getElementById('filterDateFrom')?.value || '',
            date_to: document.getElementById('filterDateTo')?.value || ''
        };

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                if (key === 'date_from' || key === 'date_to') {
                    params.append(key, new Date(value).toISOString());
                } else {
                    params.append(key, value);
                }
            }
        });

        try {
            const response = await apiRequest(`${API_URL}/history?${params}`);
            if (!response) return;

            const data = await response.json();

            if (data.success) {
                history = data.data || [];
                console.log('[APP] Загружено записей истории:', history.length);
                renderHistory();
            } else {
                showAlert('historyAlert', data.error || 'Ошибка загрузки истории', 'error');
            }
        } catch (error) {
            console.error('[APP] Ошибка загрузки истории:', error);
            showAlert('historyAlert', 'Ошибка загрузки истории', 'error');
        }
    }

    function renderHistory() {
        const container = document.getElementById('historyList');
        if (!container) return;

        if (history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                    <h3>История пуста</h3>
                    <p>Здесь будут отображаться все изменения товаров</p>
                </div>
            `;
            return;
        }

        let html = '';
        history.forEach(h => {
            const date = new Date(h.changed_at);
            const dateStr = date.toLocaleString('ru-RU');

            html += `
                <div class="history-item">
                    <div class="history-header">
                        <div>
                            <span class="history-action action-${h.action.toLowerCase()}">${getActionText(h.action)}</span>
                            <strong>Товар ID: ${h.item_id}</strong>
                        </div>
                        <div>
                            <small>${dateStr}</small>
                        </div>
                    </div>
                    <div class="history-changes">
                        <div><strong>Пользователь:</strong> ${escapeHtml(h.username)}</div>
                        ${renderChanges(h)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function renderChanges(h) {
        let html = '';

        if (h.action === 'INSERT' && h.new_data) {
            html += `
                <div style="margin-top: 10px;">
                    <strong>Создан товар:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Название: ${escapeHtml(h.new_data.name)}</li>
                        <li>Количество: ${h.new_data.quantity}</li>
                        <li>Цена: ${h.new_data.price} ₽</li>
                    </ul>
                </div>
            `;
        } else if (h.action === 'UPDATE' && h.old_data && h.new_data) {
            html += '<div style="margin-top: 10px;"><strong>Изменения:</strong><ul style="margin: 5px 0; padding-left: 20px;">';

            if (h.old_data.name !== h.new_data.name) {
                html += `<li>Название: <s>${escapeHtml(h.old_data.name)}</s> → ${escapeHtml(h.new_data.name)}</li>`;
            }
            if (h.old_data.description !== h.new_data.description) {
                html += `<li>Описание: <s>${escapeHtml(h.old_data.description || '-')}</s> → ${escapeHtml(h.new_data.description || '-')}</li>`;
            }
            if (h.old_data.quantity !== h.new_data.quantity) {
                html += `<li>Количество: <s>${h.old_data.quantity}</s> → ${h.new_data.quantity}</li>`;
            }
            if (h.old_data.price !== h.new_data.price) {
                html += `<li>Цена: <s>${h.old_data.price} ₽</s> → ${h.new_data.price} ₽</li>`;
            }

            html += '</ul></div>';
        } else if (h.action === 'DELETE' && h.old_data) {
            html += `
                <div style="margin-top: 10px;">
                    <strong>Удалён товар:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Название: ${escapeHtml(h.old_data.name)}</li>
                        <li>Количество: ${h.old_data.quantity}</li>
                        <li>Цена: ${h.old_data.price} ₽</li>
                    </ul>
                </div>
            `;
        }

        return html;
    }

    async function viewItemHistory(itemId) {
        console.log('[APP] Загрузка истории товара', itemId);

        try {
            const response = await apiRequest(`${API_URL}/history/items/${itemId}`);
            if (!response) return;

            const data = await response.json();

            if (data.success) {
                const itemHistory = data.data || [];
                renderItemHistory(itemHistory);
                document.getElementById('historyModal').classList.add('active');
            } else {
                alert(data.error || 'Ошибка загрузки истории товара');
            }
        } catch (error) {
            console.error('[APP] Ошибка загрузки истории товара:', error);
            alert('Ошибка загрузки истории товара');
        }
    }

    function renderItemHistory(itemHistory) {
        const container = document.getElementById('itemHistoryContent');
        if (!container) return;

        if (itemHistory.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6c757d;">История изменений отсутствует</p>';
            return;
        }

        let html = '';
        itemHistory.forEach(h => {
            const date = new Date(h.changed_at);
            const dateStr = date.toLocaleString('ru-RU');

            html += `
                <div class="history-item">
                    <div class="history-header">
                        <div>
                            <span class="history-action action-${h.action.toLowerCase()}">${getActionText(h.action)}</span>
                        </div>
                        <div>
                            <small>${dateStr}</small>
                        </div>
                    </div>
                    <div class="history-changes">
                        <div><strong>Пользователь:</strong> ${escapeHtml(h.username)}</div>
                        ${renderChanges(h)}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function closeHistoryModal() {
        document.getElementById('historyModal').classList.remove('active');
    }

    function resetFilters() {
        ['filterAction', 'filterUsername', 'filterDateFrom', 'filterDateTo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        loadHistory();
    }

    // === УТИЛИТЫ ===
    function showAlert(elementId, message, type) {
        const alertDiv = document.getElementById(elementId);
        if (!alertDiv) return;

        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';

        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 5000);
    }

    function getRoleText(role) {
        const roles = {
            'admin': 'Администратор',
            'manager': 'Менеджер',
            'viewer': 'Просмотр'
        };
        return roles[role] || role;
    }

    function getActionText(action) {
        const actions = {
            'INSERT': 'Создание',
            'UPDATE': 'Обновление',
            'DELETE': 'Удаление'
        };
        return actions[action] || action;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Экспортируем функции для onclick в HTML
    window.app = {
        editItem,
        deleteItem,
        viewItemHistory,
        closeItemModal,
        closeHistoryModal
    };

})();