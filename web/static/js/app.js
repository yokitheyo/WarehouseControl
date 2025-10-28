// API Base URL
const API_URL = '/api';

// State
let token = localStorage.getItem('token');
let currentUser = null;
let items = [];
let history = [];

// Init
// document.addEventListener('DOMContentLoaded', () => {
//     if (token) {
//         showApp();
//         loadItems();
//     } else {
//         showLogin();
//     }

//     setupEventListeners();
// });

function addListenerIfExists(selectorOrElem, event, handler) {
    const el = typeof selectorOrElem === 'string' ? document.getElementById(selectorOrElem) : selectorOrElem;
    if (el) el.addEventListener(event, handler);
}

// Event Listeners
// function setupEventListeners() {
//     // Login
//     document.getElementById('loginForm').addEventListener('submit', handleLogin);
//     document.getElementById('logoutBtn').addEventListener('click', handleLogout);

//     // Tabs
//     document.querySelectorAll('.tab').forEach(tab => {
//         tab.addEventListener('click', () => switchTab(tab.dataset.tab));
//     });

//     // Items
//     document.getElementById('addItemBtn').addEventListener('click', openAddItemModal);
//     document.getElementById('itemForm').addEventListener('submit', handleItemSubmit);
//     document.getElementById('searchItems').addEventListener('input', filterItems);

//     // History filters
//     document.getElementById('applyFiltersBtn').addEventListener('click', loadHistory);
//     document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
// }

function setupEventListeners() {
    // Login
    addListenerIfExists('loginForm', 'submit', handleLogin);
    addListenerIfExists('logoutBtn', 'click', handleLogout);

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Items
    addListenerIfExists('addItemBtn', 'click', openAddItemModal);
    addListenerIfExists('itemForm', 'submit', handleItemSubmit);
    addListenerIfExists('searchItems', 'input', filterItems);

    // History filters
    addListenerIfExists('applyFiltersBtn', 'click', loadHistory);
    addListenerIfExists('resetFiltersBtn', 'click', resetFilters);
}


// Auth
async function handleLogin(e) {
    e.preventDefault();
    console.log('handleLogin called');

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showAlert('loginAlert', 'Введите имя пользователя и пароль', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // важно, чтобы cookie установился
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Авторизация успешна — редиректим на главную страницу
            window.location.href = '/';
        } else {
            showAlert('loginAlert', data.error || 'Ошибка авторизации', 'error');
        }
    } catch (error) {
        showAlert('loginAlert', 'Ошибка подключения к серверу', 'error');
    }
}


async function handleLogout() {
    try {
        await fetch('/logout', { method: 'GET', credentials: 'include' });
    } catch (e) {
        // ignore
    }
    // очищаем состояние фронта
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// UI Navigation
function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
}

function showApp() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');

    // Update user info
    document.getElementById('currentUser').textContent = currentUser.username;
    const roleElement = document.getElementById('currentRole');
    roleElement.textContent = getRoleText(currentUser.role);
    roleElement.className = `role-badge role-${currentUser.role}`;

    // Show/hide buttons based on role
    updateUIPermissions();
}

function updateUIPermissions() {
    const canCreate = currentUser.role === 'admin' || currentUser.role === 'manager';
    const addBtn = document.getElementById('addItemBtn');

    if (canCreate) {
        addBtn.style.display = 'block';
    } else {
        addBtn.style.display = 'none';
    }
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Load data for tab
    if (tabName === 'items') {
        loadItems();
    } else if (tabName === 'history') {
        loadHistory();
    }
}

// Items
async function loadItems() {
    try {
        const response = await fetch(`${API_URL}/items`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
        });

        const data = await response.json();

        if (data.success) {
            items = data.data || [];
            renderItems();
        } else {
            showAlert('itemAlert', data.error, 'error');
        }
    } catch (error) {
        showAlert('itemAlert', 'Ошибка загрузки товаров', 'error');
    }
}

function renderItems() {
    const container = document.getElementById('itemsTable');

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

    const canUpdate = currentUser.role === 'admin' || currentUser.role === 'manager';
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
    const searchTerm = document.getElementById('searchItems').value.toLowerCase();
    const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
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
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
            headers: { 'Authorization': `Bearer ${token}` },
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

// History
async function loadHistory() {
    const filters = {
        action: document.getElementById('filterAction').value,
        username: document.getElementById('filterUsername').value,
        date_from: document.getElementById('filterDateFrom').value,
        date_to: document.getElementById('filterDateTo').value
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
            headers: { 'Authorization': `Bearer ${token}` },
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
            headers: { 'Authorization': `Bearer ${token}` },
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
    document.getElementById('filterAction').value = '';
    document.getElementById('filterUsername').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    loadHistory();
}

// Utility functions
function showAlert(elementId, message, type) {
    const alertDiv = document.getElementById(elementId);
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


// document.getElementById('registerForm').addEventListener('submit', handleRegister);
addListenerIfExists('registerForm', 'submit', handleRegister);


// Реализуем функцию регистрации
async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;

    if (!username || !password || !role) {
        showAlert('registerAlert', 'Заполните все поля', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role }),
            credentials: 'include'

        });

        const data = await response.json();

        if (response.ok && data.success) {
            showAlert('registerAlert', 'Пользователь успешно зарегистрирован!', 'success');
            // Можно сразу переключить на форму логина:
            document.getElementById('registerForm').reset();
            document.getElementById('loginSection').classList.remove('hidden');
            document.getElementById('registerSection').classList.add('hidden');
        } else {
            showAlert('registerAlert', data.error || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        showAlert('registerAlert', 'Ошибка подключения к серверу', 'error');
    }
}