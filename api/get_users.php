<?php
// Файл: api/get_users.php
require_once 'db.php';
require_once 'auth.php'; // <--- И ЗДЕСЬ ТОЖЕ

check_admin_auth();

$stmt = $pdo->query("SELECT id, username, role FROM users");
$users = $stmt->fetchAll();

echo json_encode($users, JSON_UNESCAPED_UNICODE);
?>