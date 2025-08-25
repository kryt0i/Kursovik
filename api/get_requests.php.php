<?php
require_once 'db.php';
require_once 'auth.php';

$token = check_auth();
$user_id = $token->data->id;
$user_role = $token->data->role;

// Базовый SQL-запрос
$sql = "SELECT 
            r.id, r.equipment, r.problem_description, r.status, r.created_at, r.completed_at, r.user_id,
            creator.username as creator_username, 
            assignee.username as assignee_username
        FROM requests r
        JOIN users creator ON r.user_id = creator.id
        LEFT JOIN users assignee ON r.assignee_id = assignee.id";

$params = [];
$conditions = [];

// Главное условие: если роль 'user', показываем только его заявки
if ($user_role === 'user') {
    $conditions[] = "r.user_id = ?";
    $params[] = $user_id;
}

if (count($conditions) > 0) {
    $sql .= " WHERE " . implode(' AND ', $conditions);
}

$sql .= " ORDER BY r.created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode($stmt->fetchAll());
?>