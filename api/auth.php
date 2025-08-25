<?php
// Файл: api/auth.php
// ФИНАЛЬНАЯ ВЕРСИЯ 2.0

require_once '../vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// --- БЛОК ПОИСКА ТОКЕНА ---
function getBearerToken() {
    $authHeader = null;
    // Проверяем самый надежный источник, который мы подтвердили тестом
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } 
    // Запасной вариант для некоторых других конфигураций
    else if (function_exists('getallheaders')) {
        $requestHeaders = getallheaders();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $authHeader = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($authHeader)) {
        // Извлекаем токен из "Bearer ..."
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// --- БЛОК ПРОВЕРКИ ---
function check_auth() {
    $jwt = getBearerToken();

    if (!$jwt) {
        http_response_code(401);
        echo json_encode(['message' => 'Доступ запрещен: Токен не найден.'], JSON_UNESCAPED_UNICODE);
        exit();
    }

    try {
        $secret_key = "your_super_secret_key_12345";
        $token = JWT::decode($jwt, new Key($secret_key, 'HS256'));
        return $token;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['message' => 'Доступ запрещен: Неверный токен или истек срок действия.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

function check_admin_auth() {
    $token = check_auth();
    if ($token->data->role !== 'admin') {
        http_response_code(403);
        echo json_encode(['message' => 'Доступ запрещен: требуются права администратора.'], JSON_UNESCAPED_UNICODE);
        exit();
    }
    return $token;
}
?>