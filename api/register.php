<?php
// Файл: api/register.php
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));

if (empty($data->username) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Имя пользователя и пароль обязательны.'], JSON_UNESCAPED_UNICODE);
    exit();
}

if (strlen($data->password) < 6) {
    http_response_code(400);
    echo json_encode(['message' => 'Пароль должен содержать не менее 6 символов.'], JSON_UNESCAPED_UNICODE);
    exit();
}

$username = $data->username;
$password_hash = password_hash($data->password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    $stmt->execute([$username, $password_hash]);
    http_response_code(201);
    echo json_encode(['message' => 'Пользователь успешно зарегистрирован.'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    if ($e->errorInfo[1] == 1062) {
         echo json_encode(['message' => 'Пользователь с таким именем уже существует.'], JSON_UNESCAPED_UNICODE);
    } else {
         echo json_encode(['message' => 'Ошибка сервера при регистрации.'], JSON_UNESCAPED_UNICODE);
    }
}
?>