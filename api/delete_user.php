<?php
require_once 'db.php';
require_once 'auth.php';
$token = check_admin_auth();
$id = $_GET['id'] ?? 0;
if ($token->data->id == $id) {
    http_response_code(400);
    echo json_encode(['message' => 'Нельзя удалить свою учетную запись.']);
    exit();
}
$stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
$stmt->execute([$id]);
echo json_encode(['message' => 'Пользователь удален.']);
?>