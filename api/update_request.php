<?php
// Файл: api/update_request.php
require_once 'db.php';
require_once 'auth.php';

$token = check_auth();
$data = json_decode(file_get_contents("php://input"));
$request_id = $_GET['id'] ?? 0;

if (empty($request_id)) { http_response_code(400); exit('Request ID is required.'); }

$stmt_check = $pdo->prepare("SELECT user_id, status FROM requests WHERE id = ?");
$stmt_check->execute([$request_id]);
$request = $stmt_check->fetch();

if (!$request) { http_response_code(404); exit('Request not found.'); }

if ($token->data->role === 'admin' && isset($data->status)) {
    $status = $data->status;
    $sql = "UPDATE requests SET status = ?";
    $params = [$status];

    if ($status === 'В работе') { $sql .= ", assignee_id = ?"; $params[] = $token->data->id; }
    elseif ($status === 'Выполнена') { $sql .= ", completed_at = NOW()"; }
    
    $sql .= " WHERE id = ?";
    $params[] = $request_id;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode(['message' => 'Статус обновлен.'], JSON_UNESCAPED_UNICODE);
}
elseif ($request['user_id'] == $token->data->id && isset($data->problem_description)) {
    if ($request['status'] !== 'Новая') { http_response_code(403); exit('Нельзя дополнять заявку, которая уже в работе.'); }
    
    $new_description = $data->problem_description;
    $stmt = $pdo->prepare("UPDATE requests SET problem_description = ? WHERE id = ?");
    $stmt->execute([$new_description, $request_id]);
    echo json_encode(['message' => 'Заявка дополнена.'], JSON_UNESCAPED_UNICODE);
}
else {
    http_response_code(403);
    exit('Доступ запрещен.');
}
?>```
</details>

<details>
<summary><strong>5. Файл: `api/get_requests.php` (ОБНОВЛЕН)</strong></summary>

```php
<?php
// Файл: api/get_requests.php
require_once 'db.php';
require_once 'auth.php';

$token = check_auth();
$user_id = $token->data->id;
$user_role = $token->data->role;

$sql = "SELECT r.id, r.equipment, r.problem_description, r.status, r.created_at, r.completed_at, r.user_id, creator.username as creator_username, assignee.username as assignee_username FROM requests r JOIN users creator ON r.user_id = creator.id LEFT JOIN users assignee ON r.assignee_id = assignee.id";

$params = [];
$conditions = [];

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

echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
?>