// === app.js — только для главной страницы (/)

const API_URL = '/api';

let token = localStorage.getItem('token');
let currentUser = null;
let items = [];
let history = [];

// === ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log('app.js: DOM загружен');

    // 1. Проверяем токен
    if (!token) {
        console.log('Нет токена → редирект');
        redirectToLogin();
        return;
    }

    // 2. Пытаемся восстановить currentUser из localStorage
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        try {
            currentUser = JSON.parse(stored);
            console.log('currentUser из localStorage:', currentUser);
        } catch (e) {
            console.error('Ошибка парсинга currentUser', e);
        }
    }

    // 3. Если нет — получаем через /api/me
    if (!currentUser) {
        console.log('Запрос к /api/me...');
        try {
            const res = await fetch(`${API_URL}/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            });

            if (!res.ok) {
                console.log('401/403 → редирект');
                redirectToLogin();
                return;
            }

            const data = await res.json();
            if (data.success && data.data) {
                currentUser = data.data;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                console.log('currentUser получен:', currentUser);
            } else {
                redirectToLogin();
                return;
            }
        } catch (err) {
            console.error('Ошибка /api/me', err);
            redirectToLogin();
            return;
        }
    }

    // 4. Всё ок — показываем UI
    showApp();
    setupEventListeners();
    switchTab('items'); // сразу грузим товары
});

// === UI ===
function showApp() {
    document.getElementById('appSection').classList.remove('hidden');
    document.getElementById('currentUser').textContent = currentUser.username;
    const roleEl = document.getElementById('currentRole');
    roleEl.textContent = getRoleText(currentUser.role);
    roleEl.className = `role-badge role-${currentUser.role}`;
    updateUIPermissions();
}

function updateUIPermissions() {
    const canCreate = ['admin', 'manager'].includes(currentUser.role);
    const btn = document.getElementById('addItemBtn');
    if (btn) btn.style.display = canCreate ? 'block' : 'none';
}

// === Табы ===
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabName + 'Tab'));

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
    try { await fetch('/logout', { credentials: 'include' }); } catch { }
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
}

function redirectToLogin() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
}

// === Товары ===
async function loadItems() {
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/items`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });

        if (res.status === 401) {
            redirectToLogin();
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
        container.innerHTML = `<div class="empty-state"><h3>Нет товаров</h3><p>Добавьте первый товар</p></div>`;
        return;
    }

    const canUpdate = ['admin', 'manager'].includes(currentUser.role);
    const canDelete = currentUser.role === 'admin';

    let html = `<table><thead><tr>
        <th>ID</th><th>Название</th><th>Описание</th><th>Кол-во</th><th>Цена</th><th>Действия</th>
    </tr></thead><tbody>`;

    items.forEach(item => {
        html += `<tr>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.description || '-'}</td>
            <td>${item.quantity}</td>
            <td>${item.price.toFixed(2)} ₽</td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewItemHistory(${item.id})">История</button>
                    ${canUpdate ? `<button onclick="editItem(${item.id})">Редактировать</button>` : ''}
                    ${canDelete ? `<button onclick="deleteItem(${item.id})">Удалить</button>` : ''}
                </div>
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// === Остальные функции (filterItems, модалки, история и т.д.) — оставь как есть ===
// (всё, что ниже — копируй из твоего app.js, но без login/register)

function filterItems() {
    const term = document.getElementById('searchItems')?.value.toLowerCase() || '';
    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(term) ||
        (i.description && i.description.toLowerCase().includes(term))
    );
    const temp = items;
    items = filtered;
    renderItems();
    items = temp;
}

// ... (вставь сюда openAddItemModal, editItem, handleItemSubmit, deleteItem, loadHistory и т.д.)