<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

function respond(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$dbPath = getenv('SQLITE_PATH') ?: __DIR__ . '/data/calendario.sqlite';
$dbDirectory = dirname($dbPath);

try {
    if (!is_dir($dbDirectory) && !mkdir($dbDirectory, 0775, true) && !is_dir($dbDirectory)) {
        throw new RuntimeException('Não foi possível criar a pasta do banco de dados.');
    }

    $pdo = new PDO('sqlite:' . $dbPath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec('PRAGMA busy_timeout = 5000');
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS marcacoes (
            data_dia TEXT PRIMARY KEY NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('orange', 'red', 'green')),
            atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )"
    );
} catch (Throwable $e) {
    error_log('SQLite initialization error: ' . $e->getMessage());
    respond(['success' => false, 'error' => 'Não foi possível abrir o banco SQLite. Verifique a configuração do armazenamento persistente.'], 500);
}

$action = $_GET['action'] ?? '';

if ($action === 'list') {
    $month = $_GET['month'] ?? '';
    if (!is_string($month) || !preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
        respond(['success' => false, 'error' => 'Mês inválido.'], 400);
    }

    $stmt = $pdo->prepare(
        "SELECT data_dia, status FROM marcacoes
         WHERE data_dia >= :start AND data_dia < :next_month"
    );
    $start = $month . '-01';
    $nextMonth = (new DateTimeImmutable($start))->modify('+1 month')->format('Y-m-d');
    $stmt->execute(['start' => $start, 'next_month' => $nextMonth]);
    $statuses = [];
    foreach ($stmt->fetchAll() as $row) {
        $statuses[$row['data_dia']] = $row['status'];
    }
    respond(['success' => true, 'statuses' => $statuses]);
}

if ($action === 'save') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(['success' => false, 'error' => 'Método não permitido.'], 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) respond(['success' => false, 'error' => 'Dados inválidos.'], 400);

    $date = $input['date'] ?? '';
    $status = $input['status'] ?? '';
    if (!is_string($date) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ||
        !checkdate((int)substr($date, 5, 2), (int)substr($date, 8, 2), (int)substr($date, 0, 4))) {
        respond(['success' => false, 'error' => 'Data inválida.'], 400);
    }
    if (!is_string($status) || !in_array($status, ['empty', 'orange', 'red', 'green'], true)) {
        respond(['success' => false, 'error' => 'Status inválido.'], 400);
    }

    if ($status === 'empty') {
        $stmt = $pdo->prepare('DELETE FROM marcacoes WHERE data_dia = :date');
        $stmt->execute(['date' => $date]);
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO marcacoes (data_dia, status, atualizado_em)
             VALUES (:date, :status, CURRENT_TIMESTAMP)
             ON CONFLICT(data_dia) DO UPDATE SET
               status = excluded.status,
               atualizado_em = CURRENT_TIMESTAMP'
        );
        $stmt->execute(['date' => $date, 'status' => $status]);
    }
    respond(['success' => true]);
}

respond(['success' => false, 'error' => 'Ação não encontrada.'], 404);
