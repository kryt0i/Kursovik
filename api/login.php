<?php
// Файл: api/login.php
require_once '../vendor/autoload.php';
require_once 'db.php';
use Firebase\JWT\JWT;

$data = json_decode(file_get_contents("php://input"));

if (empty($data->username) || empty($data->password)) {
    http_response_code(400);
    echo json_encode(['message' => 'Имя пользователя и пароль обязательны.'], JSON_UNESCAPED_UNICODE);
    exit();
}

$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$data->username]);
$user = $stmt->fetch();

if ($user && password_verify($data->password, $user['password'])) {
    $secret_key = "your_super_secret_key_12345";
    $issuedat_claim = time();
    $expire_claim = $issuedat_claim + 3600;
    $token_payload = [
        "iss" => "http://site", "aud" => "http://site", "iat" => $issuedat_claim, "exp" => $expire_claim,
        "data" => ["id" => $user['id'], "username" => $user['username'], "role" => $user['role']]
    ];
    $jwt = JWT::encode($token_payload, $secret_key, 'HS256');
    http_response_code(200);
    echo json_encode([
        "token" => $jwt,
        "user" => ["id" => $user['id'], "username" => $user['username'], "role" => $user['role']]
    ], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(401);
    echo json_encode(['message' => 'Неверное имя пользователя или пароль.'], JSON_UNESCAPED_UNICODE);
}
?>