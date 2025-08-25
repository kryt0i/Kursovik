```php
<?php
// Файл: api/create_request.php
require_once 'db.php';
require_once 'auth.php';
require_once '../vendor/autoload.php';

use Mailgun\Mailgun;

$token = check_auth();
$user_id = $token->data->id;

$data = json_decode(file_get_contents("php://input"));
$equipment = $data->equipment ?? '';
$problem_description = $data->problem_description ?? '';
$email = $data->email ?? '';

if (empty($equipment) || empty($problem_description) || empty($email)) {
    http_response_code(400);
    echo json_encode(['message' => 'Все поля, включая email, должны быть заполнены.'], JSON_UNESCAPED_UNICODE);
    exit();
}

// Проверка валидности email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['message' => 'Некорректный email.'], JSON_UNESCAPED_UNICODE);
    exit();
}

// Сохранение заявки в базе данных
$stmt = $pdo->prepare("INSERT INTO requests (user_id, equipment, problem_description, email) VALUES (?, ?, ?, ?)");
$stmt->execute([$user_id, $equipment, $problem_description, $email]);

$request_id = $pdo->lastInsertId();

// Настройка Mailgun
$mailgun_domain = "your-mailgun-domain"; // Замените на ваш домен из Mailgun (например, sandboxXXX.mailgun.org)
$mailgun_api_key = "your-mailgun-api-key"; // Замените на ваш API-ключ из Mailgun
$mg = Mailgun::create($mailgun_api_key);

// 1. Отправка письма пользователю
try {
    $mg->messages()->send($mailgun_domain, [
        'from'    => 'no-reply@your-mailgun-domain', // Укажите ваш отправитель
        'to'      => $email,
        'subject' => 'Ваша заявка принята',
        'html'    => "
            <h2>Заявка #{$request_id} принята</h2>
            <p>Уважаемый пользователь,</p>
            <p>Ваша заявка на оборудование <strong>{$equipment}</strong> успешно принята.</p>
            <p><strong>Описание проблемы:</strong> {$problem_description}</p>
            <p>Мы свяжемся с вами в ближайшее время.</p>
            <p>С уважением,<br>Система учета заявок</p>
        "
    ]);
} catch (Exception $e) {
    // Логируем ошибку, но не прерываем выполнение
    error_log("Ошибка отправки письма пользователю: " . $e->getMessage());
}

// 2. Отправка письма администратору
try {
    $mg->messages()->send($mailgun_domain, [
        'from'    => 'no-reply@your-mailgun-domain', // Укажите ваш отправитель
        'to'      => 'aegorov1357@gmail.com',
        'subject' => 'Новая заявка создана',
        'html'    => "
            <h2>Новая заявка #{$request_id}</h2>
            <p>Создана новая заявка от пользователя ID: {$user_id}.</p>
            <p><strong>Оборудование:</strong> {$equipment}</p>
            <p><strong>Описание проблемы:</strong> {$problem_description}</p>
            <p><strong>Email пользователя:</strong> {$email}</p>
            <p>Пожалуйста, проверьте заявку в системе.</p>
        "
    ]);
} catch (Exception $e) {
    // Логируем ошибку, но не прерываем выполнение
    error_log("Ошибка отправки письма администратору: " . $e->getMessage());
}

http_response_code(201);
echo json_encode(['message' => 'Заявка создана'], JSON_UNESCAPED_UNICODE);
?>
```