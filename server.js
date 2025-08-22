const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'quickfix',
  port: 3306
};

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Заполните все поля' });
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    const user = rows[0];
    if (password !== user.password) return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    res.json({ user: { id: user.id, username: user.username, role: user.role } });
    await connection.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Заполните все поля' });
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length > 0) return res.status(400).json({ message: 'Пользователь уже существует' });
    await connection.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, 'user']);
    res.json({ message: 'Регистрация успешна' });
    await connection.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/api/requests', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM requests');
    res.json(rows);
    await connection.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/requests', async (req, res) => {
  const { equipment, issue, user_id } = req.body;
  if (!equipment || !issue || !user_id) return res.status(400).json({ message: 'Заполните все поля' });
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('INSERT INTO requests (equipment, issue, status, date, user_id) VALUES (?, ?, ?, ?, ?)', 
      [equipment, issue, 'В ожидании', new Date().toISOString().split('T')[0], user_id]);
    res.json({ message: 'Заявка добавлена' });
    await connection.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('DELETE FROM requests WHERE id = ?', [id]);
    res.json({ message: 'Заявка удалена' });
    await connection.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.listen(3000, () => console.log('Сервер запущен на http://localhost:3000'));