<?php
require_once 'db.php';
require_once 'auth.php';
check_admin_auth();
$id = $_GET['id'] ?? 0;
$stmt = $pdo->prepare("DELETE FROM requests WHERE id = ?");
$stmt->execute([$id]);
echo json_encode(['message' => 'Заявка удалена.']);
?>