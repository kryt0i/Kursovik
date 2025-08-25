```javascript
document.addEventListener('DOMContentLoaded', () => {
    // --- ОБЩАЯ ЛОГИКА ДЛЯ ВСЕХ СТРАНИЦ ---
    const API_URL = 'api/';
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const currentPage = window.location.pathname.split('/').pop();

    // --- ОБЩАЯ АУТЕНТИФИКАЦИЯ И НАВИГАЦИЯ ---

    // Если мы не на странице входа и токена нет - выкидываем на логин
    if (currentPage !== 'login.html' && !token) {
        window.location.href = 'login.html';
        return;
    }
    // Если мы на странице входа, но токен есть - перекидываем на заявки
    if (currentPage === 'login.html' && token) {
        window.location.href = 'requests.html';
        return;
    }
    // Если пользователь не админ, но лезет на админ-панель - выкидываем
    if (currentPage === 'admin.html' && user?.role !== 'admin') {
        window.location.href = 'requests.html';
        return;
    }

    // Универсальная функция для API запросов
    const apiRequest = async (endpoint, method = 'GET', body = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const config = { method, headers };
        if (body) {
            config.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            if (!response.ok) {
                // Если ошибка авторизации, разлогиниваем пользователя
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
                return null;
            }
            // 204 No Content - успешный ответ без тела
            return response.status !== 204 ? response.json() : true;
        } catch (error) {
            console.error('Сетевая ошибка:', error);
            return null;
        }
    };
    
    // --- ОБЩИЕ ЭЛЕМЕНТЫ ИНТЕРФЕЙСА (ШАПКА) ---
    const userInfoEl = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const mainNav = document.getElementById('main-nav');

    if (logoutBtn) {
        userInfoEl.textContent = `Пользователь: ${user.username}`;
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
        
        mainNav.innerHTML = `<a href="requests.html" class="${currentPage === 'requests.html' ? 'active' : ''}">Заявки</a>`;
        if (user.role === 'admin') {
            mainNav.innerHTML += `<a href="admin.html" class="${currentPage === 'admin.html' ? 'active' : ''}">Администрирование</a>`;
        }
    }

    // --- ЛОГИКА ДЛЯ КОНКРЕТНЫХ СТРАНИЦ ---

    // Логика для страницы login.html
    if (currentPage === 'login.html') {
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            const result = await apiRequest('login.php', 'POST', {
                username: e.target.elements['login-username'].value,
                password: e.target.elements['login-password'].value
            });
            if (result && result.token) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                window.location.href = 'requests.html';
            }
        });

        const registerForm = document.getElementById('register-form');
        registerForm.addEventListener('submit', async e => {
            e.preventDefault();
            const username = e.target.elements['register-username'].value;
            const password = e.target.elements['register-password'].value;
            if (password.length < 6) {
                alert('Пароль должен содержать не менее 6 символов.');
                return;
            }
            const result = await apiRequest('register.php', 'POST', { username, password });
            if (result) {
                e.target.reset();
                document.getElementById('show-login').click();
            }
        });

        document.getElementById('show-register').addEventListener('click', e => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });

        document.getElementById('show-login').addEventListener('click', e => {
            e.preventDefault();
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    // Логика для страницы requests.html
    if (currentPage === 'requests.html') {
        const requestForm = document.getElementById('request-form');
        const requestsList = document.getElementById('requests-list');

        const loadRequests = async () => {
            const requests = await apiRequest('get_requests.php');
            if (!requests) return;

            requestsList.innerHTML = '';
            if (requests.length > 0) {
                requests.forEach(req => {
                    const card = document.createElement('div');
                    card.className = 'request-card';
                    card.innerHTML = `
                        <h4>Заявка #${req.id}</h4>
                        <p><strong>Оборудование:</strong> ${req.equipment}</p>
                        <p><strong>Описание проблемы:</strong> ${req.problem_description}</p>
                        <p><strong>Статус:</strong> ${req.status}</p>
                        <p><strong>Создано:</strong> ${new Date(req.created_at).toLocaleString('ru-RU')}</p>
                        ${req.completed_at ? `<p><strong>Завершено:</strong> ${new Date(req.completed_at).toLocaleString('ru-RU')}</p>` : ''}
                        <p><strong>Создатель:</strong> ${req.creator_username}</p>
                        ${req.assignee_username ? `<p><strong>Исполнитель:</strong> ${req.assignee_username}</p>` : ''}
                        <div class="actions"></div>
                    `;
                    const actionsDiv = card.querySelector('.actions');
                    if (user.role === 'admin') {
                        const statusSelect = document.createElement('select');
                        ['Новая', 'В работе', 'Выполнена'].forEach(status => {
                            const option = document.createElement('option');
                            option.value = status;
                            option.textContent = status;
                            option.selected = req.status === status;
                            statusSelect.appendChild(option);
                        });
                        statusSelect.onchange = async () => {
                            if (await apiRequest(`update_request.php?id=${req.id}`, 'PUT', { status: statusSelect.value })) {
                                loadRequests();
                            }
                        };
                        actionsDiv.appendChild(statusSelect);

                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Удалить';
                        deleteBtn.className = 'delete-btn';
                        deleteBtn.onclick = async () => {
                            if (confirm(`Удалить заявку #${req.id}?`)) {
                                if (await apiRequest(`delete_request.php?id=${req.id}`, 'DELETE')) {
                                    loadRequests();
                                }
                            }
                        };
                        actionsDiv.appendChild(deleteBtn);
                    } else if (req.user_id == user.id && req.status === 'Новая') {
                        const supplementBtn = document.createElement('button');
                        supplementBtn.textContent = 'Дополнить заявку';
                        supplementBtn.style.marginLeft = '10px';
                        supplementBtn.onclick = async () => {
                            const addition = prompt('Введите дополнение к описанию проблемы:');
                            if (addition && addition.trim() !== '') {
                                const newDescription = `${req.problem_description}\n\nДОПОЛНЕНО (${new Date().toLocaleString('ru-RU')}):\n${addition}`;
                                if (await apiRequest(`update_request.php?id=${req.id}`, 'PUT', { problem_description: newDescription })) {
                                    loadRequests();
                                }
                            }
                        };
                        actionsDiv.appendChild(supplementBtn);
                    }
                    requestsList.appendChild(card);
                });
            } else {
                requestsList.innerHTML = '<p>У вас пока нет заявок.</p>';
            }
        };

        requestForm.addEventListener('submit', async e => {
            e.preventDefault();
            const result = await apiRequest('create_request.php', 'POST', { 
                equipment: e.target.elements.equipment.value, 
                email: e.target.elements.email.value, // Добавляем email
                problem_description: e.target.elements['problem-description'].value 
            });
            if (result) {
                e.target.reset();
                await loadRequests();
            }
        });

        loadRequests();
    }

    // Логика для страницы admin.html
    if (currentPage === 'admin.html') {
        const usersList = document.getElementById('users-list');
        const loadUsers = async () => {
            const users = await apiRequest('get_users.php');
            if (!users) return;

            usersList.innerHTML = '';
            if (users) {
                users.forEach(u => {
                    const card = document.createElement('div');
                    card.className = 'user-card';
                    card.innerHTML = `<p><strong>ID:</strong> ${u.id}, <strong>Имя:</strong> ${u.username}, <strong>Роль:</strong> ${u.role}</p>`;
                    if (u.role !== 'admin') {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Удалить';
                        deleteBtn.className = 'delete-btn';
                        deleteBtn.onclick = async () => {
                            if (confirm(`Удалить пользователя ${u.username}?`)) {
                                if (await apiRequest(`delete_user.php?id=${u.id}`, 'DELETE')) {
                                    loadUsers();
                                }
                            }
                        };
                        card.appendChild(deleteBtn);
                    }
                    usersList.appendChild(card);
                });
            }
        };
        loadUsers();
    }
});
```