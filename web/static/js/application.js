// === application.js — только для главной страницы (/)
const API_URL = '/api';

let currentUser = null;
let items = [];
let history = [];

// Функция для получения cookie
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// === ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log('application.js: DOM загружен');

    // Проверяем cookie token
    const token = getCookie('token');
    if (!token) {
        console.log('Нет токена в cookie → редирект');
        window.location.href = '/login';
        return;
    }

    // Декодируем токен чтобы получить информацию о пользователе
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Проверяем срок действия токена
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.log('Токен истёк → редирект');
            document.cookie = 'token=; Max-Age=0; path=/;'; // Удаляем истёкший токен
            window.location.href = '/login';
            return;
        }

        currentUser = {
            username: payload.username,
            role: payload.role
        };
        console.log('currentUser из токена:', currentUser);
    } catch (e) {
        console.error('Ошибка декодирования токена', e);
        window.location.href = '/login';
        return;
    }

    // Всё ок — показываем UI
    showApp();
    setupEventListeners();
    switchTab('items'); // сразу грузим товары
});

// === UI ===
function showApp() {
    const appSection = document.getElementById('appSection');
    if (appSection) {
        appSection.classList.remove('hidden');
    }

    const userEl = document.getElementById('currentUser');
    if (userEl) {
        userEl.textContent = currentUser.username;
    }

    const roleEl = document.getElementById('currentRole');
    if (roleEl) {
        roleEl.textContent = getRoleText(currentUser.role);
        roleEl.className = `role-badge role-${currentUser.role}`;
    }

    updateUIPermissions();
}

function updateUIPermissions() {
    const canCreate = ['admin', 'manager'].includes(currentUser.role);
    const btn = document.getElementById('addItemBtn');
    if (btn) {
        btn.style.display = canCreate ? 'block' : 'none';
    }
}

// === Табы ===
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === tabName + 'Tab');
    });

    if (tabName === 'items') loadItems();
    if (tabName === 'history') loadHistory();
}

// === Слушатели ===
function setupEventListeners() {
    addListener('logoutBtn', 'click', handleLogout);
    addListener('addItemBtn', 'click', openAddItemModal);
    addListener('itemForm', 'submit', handleItemSubmit);
    addListener('searchItems', 'input', filterItems);
    addListener('applyFiltersBtn', 'click', loadHistory);
    addListener('resetFiltersBtn', 'click', resetFilters);

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
}

function addListener(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

// === Выход ===
async function handleLogout() {
    try {
        await fetch('/logout', { credentials: 'include' });
    } catch (e) {
        // ignore
    }
    window.location.href = '/login';
}

// === Товары ===
async function loadItems() {
    try {
        const res = await fetch(`${API_URL}/items`, {
            credentials: 'include'
        });

        if (res.status === 401 || res.status === 403) {
            window.location.href = '/login';
            return;
        }

        const data = await res.json();
        if (data.success) {
            items = data.data || [];
            renderItems();
        } else {
            showAlert('itemAlert', data.error || 'Ошибка', 'error');
        }
    } catch (err) {
        console.error(err);
        showAlert('itemAlert', 'Нет связи с сервером', 'error');
    }
}

function renderItems() {
    const container = document.getElementById('itemsTable');
    if (!container) return;

    if (!items.length) {
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
                <td>${item.name}</td>
                <td>${item.description || '-'}</td>
                <td>${item.quantity}</td>
                <td>${item.price.toFixed(2)} ₽</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="viewItemHistory(${item.id})">История</button>
                        ${canUpdate ? `<button class="btn btn-primary btn-sm" onclick="editItem(${item.id})">Редактировать</button>` : ''}
                        ${canDelete ? `<button class="btn btn-danger btn-sm" onclick="deleteItem(${item.id})">Удалить</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function filterItems() {
    const searchInput = document.getElementById('searchItems');
    if (!searchInput) return;

    const term = searchInput.value.toLowerCase();
    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(term) ||
        (i.description && i.description.toLowerCase().includes(term))
    );

    const temp = items;
    items = filtered;
    renderItems();
    items = temp;
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

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showAlert('itemAlert', id ? 'Товар обновлен' : 'Товар добавлен', 'success');
            closeItemModal();
            loadItems();
        } else {
            alert(result.error);
        }
    } catch (error) {
        alert('Ошибка сохранения товара');
    }
}

async function deleteItem(id) {
    if (!confirm('Удалить товар?')) return;

    try {
        const response = await fetch(`${API_URL}/items/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('itemAlert', 'Товар удален', 'success');
            loadItems();
        } else {
            showAlert('itemAlert', data.error, 'error');
        }
    } catch (error) {
        showAlert('itemAlert', 'Ошибка удаления товара', 'error');
    }
}

function closeItemModal() {
    document.getElementById('itemModal').classList.remove('active');
}

// === История ===
async function loadHistory() {
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
        const response = await fetch(`${API_URL}/history?${params}`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            history = data.data || [];
            renderHistory();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Ошибка загрузки истории');
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
                    <div><strong>Пользователь:</strong> ${h.username}</div>
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
                    <li>Название: ${h.new_data.name}</li>
                    <li>Количество: ${h.new_data.quantity}</li>
                    <li>Цена: ${h.new_data.price} ₽</li>
                </ul>
            </div>
        `;
    } else if (h.action === 'UPDATE' && h.old_data && h.new_data) {
        html += '<div style="margin-top: 10px;"><strong>Изменения:</strong><ul style="margin: 5px 0; padding-left: 20px;">';

        if (h.old_data.name !== h.new_data.name) {
            html += `<li>Название: <s>${h.old_data.name}</s> → ${h.new_data.name}</li>`;
        }
        if (h.old_data.description !== h.new_data.description) {
            html += `<li>Описание: <s>${h.old_data.description || '-'}</s> → ${h.new_data.description || '-'}</li>`;
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
                <strong>Удален товар:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Название: ${h.old_data.name}</li>
                    <li>Количество: ${h.old_data.quantity}</li>
                    <li>Цена: ${h.old_data.price} ₽</li>
                </ul>
            </div>
        `;
    }

    return html;
}

async function viewItemHistory(itemId) {
    try {
        const response = await fetch(`${API_URL}/history/items/${itemId}`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            const itemHistory = data.data || [];
            renderItemHistory(itemHistory);
            document.getElementById('historyModal').classList.add('active');
        } else {
            alert(data.error);
        }
    } catch (error) {
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
                    <div><strong>Пользователь:</strong> ${h.username}</div>
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
    const filterAction = document.getElementById('filterAction');
    const filterUsername = document.getElementById('filterUsername');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');

    if (filterAction) filterAction.value = '';
    if (filterUsername) filterUsername.value = '';
    if (filterDateFrom) filterDateFrom.value = '';
    if (filterDateTo) filterDateTo.value = '';

    loadHistory();
}

// === Утилиты ===
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