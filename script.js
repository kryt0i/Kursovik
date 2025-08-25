// Файл: script.js
// ВЕРСИЯ С ИСПРАВЛЕНИЕМ ОШИБКИ 400

document.addEventListener('DOMContentLoaded', () => {
    // --- Глобальные переменные и ссылки на DOM ---
    const API_BASE_URL = 'api/';
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const requestForm = document.getElementById('request-form');
    const requestsList = document.getElementById('requests-list');
    const adminPanel = document.getElementById('admin-panel');
    const usersList = document.getElementById('users-list');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    let searchDebounceTimer;

    // --- ОСНОВНЫЕ ФУНКЦИИ ---

    const apiRequest = async (endpoint, method = 'GET', body = null) => {
        let url = `${API_BASE_URL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const config = { method, headers };
        if (body) {
            config.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, config);
            const responseText = await response.text();
            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    errorData = { message: responseText || `Код ошибки: ${response.status}` };
                }
                alert(`Ошибка: ${errorData.message}`);
                return null;
            }
            return responseText ? JSON.parse(responseText) : true;
        } catch (error) {
            console.error('Сетевая ошибка или ошибка парсинга:', error);
            alert('Произошла сетевая ошибка. Проверьте консоль разработчика (F12) и убедитесь, что сервер запущен.');
            return null;
        }
    };

    const showAuth = () => { authContainer.classList.remove('hidden'); appContainer.classList.add('hidden'); };
    const showApp = async () => {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        const user = JSON.parse(localStorage.getItem('user'));
        userInfo.textContent = `Пользователь: ${user.username} (Роль: ${user.role})`;
        await loadRequests();
        if (user.role === 'admin') { adminPanel.classList.remove('hidden'); await loadUsers(); } else { adminPanel.classList.add('hidden'); }
    };

    const loadRequests = async () => {
        const status = statusFilter.value, search = searchInput.value;
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (search) params.append('search', search);

        const requests = await apiRequest(`get_requests.php?${params.toString()}`);
        requestsList.innerHTML = '';
        const currentUser = JSON.parse(localStorage.getItem('user'));

        if (requests && requests.length) {
            requests.forEach(req => {
                const card = document.createElement('div');
                card.className = 'request-card';
                const statusClass = req.status.replace(/\s+/g, '-').toLowerCase();
                card.classList.add(`status-${statusClass}`);

                const createdAt = new Date(req.created_at).toLocaleString('ru-RU');
                const completedAt = req.completed_at ? new Date(req.completed_at).toLocaleString('ru-RU') : '';

                card.innerHTML = `
                    <div class="card-actions-icons"></div>
                    <h4>${req.equipment} (от ${req.creator_username})</h4>
                    <p><strong>Проблема:</strong> ${req.problem_description}</p>
                    <p><strong>Статус:</strong> ${req.status}</p>
                    ${req.assignee_username ? `<p><strong>Исполнитель:</strong> ${req.assignee_username}</p>` : ''}
                    <p><small>Создано: ${createdAt}</small></p>
                    ${completedAt ? `<p><small>Выполнено: ${completedAt}</small></p>` : ''}
                    <div class="actions"></div>
                    <div class="comments-section">
                        <!-- ИЗМЕНЕНИЕ: ID теперь прямо на кнопке -->
                        <button class="toggle-comments-btn" data-request-id="${req.id}">Показать комментарии</button>
                        <div class="comments-container hidden"></div>
                    </div>`;

                const iconsContainer = card.querySelector('.card-actions-icons');
                if (currentUser.id == req.user_id && req.status === 'Новая') {
                    const editBtn = document.createElement('button');
                    editBtn.innerHTML = '✏️'; editBtn.className = 'icon-btn edit-request-btn'; editBtn.title = 'Редактировать заявку';
                    editBtn.onclick = () => editRequest(req.id, req.equipment, req.problem_description);
                    iconsContainer.appendChild(editBtn);
                }

                if (currentUser.role === 'admin') {
                    const actionsDiv = card.querySelector('.actions');
                    const statusSelect = document.createElement('select');
                    statusSelect.innerHTML = `<option value="Новая" ${req.status === 'Новая' ? 'selected' : ''}>Новая</option><option value="В работе" ${req.status === 'В работе' ? 'selected' : ''}>В работе</option><option value="Выполнена" ${req.status === 'Выполнена' ? 'selected' : ''}>Выполнена</option>`;
                    statusSelect.onchange = () => updateRequestStatus(req.id, statusSelect.value);
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Удалить';
                    deleteBtn.onclick = () => deleteRequest(req.id);
                    actionsDiv.append(statusSelect, deleteBtn);
                }
                requestsList.appendChild(card);
            });
        } else {
            requestsList.innerHTML = '<p>Заявок, соответствующих критериям, не найдено.</p>';
        }
    };

    const loadUsers = async () => { /* код без изменений */ };

    // --- ФУНКЦИИ-ОБРАБОТЧИКИ CRUD ---
    const updateRequestStatus = async (id, status) => { if (await apiRequest(`update_request.php?id=${id}`, 'PUT', { status })) await loadRequests(); };
    const deleteRequest = async (id) => { if (confirm('Вы уверены, что хотите удалить эту заявку?')) if (await apiRequest(`delete_request.php?id=${id}`, 'DELETE')) await loadRequests(); };
    const deleteUser = async (id) => { if (confirm('Вы уверены, что хотите удалить этого пользователя?')) if (await apiRequest(`delete_user.php?id=${id}`, 'DELETE')) { await loadUsers(); await loadRequests(); } };
    const editRequest = async (id, currentEquipment, currentProblem) => {
        const newEquipment = prompt('Введите новое название оборудования:', currentEquipment); if (newEquipment === null || newEquipment.trim() === '') return;
        const newProblem = prompt('Введите новое описание проблемы:', currentProblem); if (newProblem === null || newProblem.trim() === '') return;
        if (await apiRequest('edit_request.php', 'POST', { id, equipment: newEquipment, problem_description: newProblem })) { alert('Заявка успешно обновлена.'); await loadRequests(); }
    };

    // --- ФУНКЦИИ ДЛЯ КОММЕНТАРИЕВ ---
    const loadComments = async (requestId, container) => {
        const comments = await apiRequest(`get_comments.php?request_id=${requestId}`);
        if (comments === null) return; // Прерываем, если была ошибка
        container.innerHTML = '';
        if (comments.length > 0) {
            comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment';
                commentDiv.innerHTML = `<p>${comment.comment_text}</p><small><strong>${comment.username}</strong> - ${new Date(comment.created_at).toLocaleString('ru-RU')}</small>`;
                container.appendChild(commentDiv);
            });
        } else {
            container.innerHTML = '<p><small>Комментариев пока нет.</small></p>';
        }
        const addCommentForm = document.createElement('form');
        addCommentForm.className = 'add-comment-form';
        addCommentForm.innerHTML = `<input type="text" placeholder="Ваш комментарий..." required><button type="submit">Отправить</button>`;
        addCommentForm.onsubmit = async (e) => {
            e.preventDefault();
            const input = addCommentForm.querySelector('input');
            const commentText = input.value;
            if (commentText.trim() === '') return;
            if (await apiRequest('add_comment.php', 'POST', { request_id: requestId, comment_text: commentText })) {
                await loadComments(requestId, container);
            }
        };
        container.appendChild(addCommentForm);
    };

    // --- НАВЕШИВАНИЕ ОБРАБОТЧИКОВ СОБЫТИЙ ---
    showRegisterLink.addEventListener('click', e => { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); });
    showLoginLink.addEventListener('click', e => { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); });
    logoutBtn.addEventListener('click', () => { localStorage.removeItem('token'); localStorage.removeItem('user'); showAuth(); });
    loginForm.addEventListener('submit', async (e) => { e.preventDefault(); const data = await apiRequest('login.php', 'POST', { username: loginForm.querySelector('#login-username').value, password: loginForm.querySelector('#login-password').value }); if (data && data.token) { localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user)); loginForm.reset(); showApp(); } });
    registerForm.addEventListener('submit', async (e) => { e.preventDefault(); const password = registerForm.querySelector('#register-password').value; if (password.length < 6) { alert('Пароль должен содержать не менее 6 символов.'); return; } const username = registerForm.querySelector('#register-username').value; if (await apiRequest('register.php', 'POST', { username, password })) { alert('Регистрация прошла успешно!'); showLoginLink.click(); registerForm.reset(); } });
    requestForm.addEventListener('submit', async (e) => { e.preventDefault(); const equipment = requestForm.querySelector('#equipment').value; const problem = requestForm.querySelector('#problem-description').value; if (await apiRequest('create_request.php', 'POST', { equipment, problem_description: problem })) { requestForm.reset(); await loadRequests(); } });
    statusFilter.addEventListener('change', loadRequests);
    searchInput.addEventListener('input', () => { clearTimeout(searchDebounceTimer); searchDebounceTimer = setTimeout(() => { loadRequests(); }, 300); });
    requestsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('toggle-comments-btn')) {
            const button = e.target;
            const commentsContainer = button.nextElementSibling;
            // ИЗМЕНЕНИЕ: Берем ID прямо с кнопки
            const requestId = button.dataset.requestId; 
            const isHidden = commentsContainer.classList.toggle('hidden');
            button.textContent = isHidden ? 'Показать комментарии' : 'Скрыть комментарии';
            if (!isHidden) {
                await loadComments(requestId, commentsContainer);
            }
        }
    });

    // --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ---
    if (localStorage.getItem('token')) { showApp(); } else { showAuth(); }
});