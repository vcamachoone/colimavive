<?php
/**
 * Colima Vivo 1.0 - Backend de Récords Globales (Global Leaderboard)
 * Compatible con cualquier plan de Hostinger (PHP 7.4 / 8.0 / 8.1 / 8.2 / 8.3)
 * Soporta SQLite automático (cero configuración) con fallback a JSON plano.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$dataDir = __DIR__ . '/../data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

// Configuración de almacenamiento
$dbFile = $dataDir . '/leaderboard.db';
$jsonFile = $dataDir . '/leaderboard.json';
$useSQLite = extension_loaded('pdo_sqlite');

/**
 * Obtener conexión PDO SQLite o inicializar base de datos
 */
function getDatabase(string $path): ?PDO {
    try {
        $pdo = new PDO('sqlite:' . $path, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 5
        ]);
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                score INTEGER NOT NULL,
                coins INTEGER NOT NULL DEFAULT 0,
                world INTEGER NOT NULL DEFAULT 0,
                sub INTEGER NOT NULL DEFAULT 0,
                is_rev INTEGER NOT NULL DEFAULT 0,
                ip_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
        ");
        return $pdo;
    } catch (Throwable $e) {
        return null;
    }
}

/**
 * Fallback a archivo JSON si SQLite no estuviera disponible
 */
function getJsonScores(string $path): array {
    if (!file_exists($path)) {
        return [];
    }
    $content = @file_get_contents($path);
    if (!$content) return [];
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function saveJsonScores(string $path, array $scores): bool {
    usort($scores, fn($a, $b) => ($b['score'] ?? 0) <=> ($a['score'] ?? 0));
    $top = array_slice($scores, 0, 100);
    return (bool)@file_put_contents($path, json_encode($top, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

$pdo = $useSQLite ? getDatabase($dbFile) : null;

// ==========================================================
// MÉTODO GET: Listar los mejores puntajes globales
// ==========================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $limit = isset($_GET['limit']) ? max(5, min(50, (int)$_GET['limit'])) : 20;

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                SELECT id, name, score, coins, world, sub, is_rev, created_at as date
                FROM scores
                ORDER BY score DESC, coins DESC, id ASC
                LIMIT :lim
            ");
            $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll();

            $results = [];
            $rank = 1;
            foreach ($rows as $r) {
                $results[] = [
                    'rank'       => $rank++,
                    'name'       => htmlspecialchars($r['name'], ENT_QUOTES, 'UTF-8'),
                    'score'      => (int)$r['score'],
                    'coins'      => (int)$r['coins'],
                    'world'      => (int)$r['world'],
                    'sub'        => (int)$r['sub'],
                    'is_rev'     => (bool)$r['is_rev'],
                    'date'       => substr((string)$r['date'], 0, 10)
                ];
            }

            echo json_encode([
                'success' => true,
                'driver'  => 'sqlite',
                'scores'  => $results
            ]);
            exit;
        } catch (Throwable $e) {
            // Continúa a fallback JSON
        }
    }

    // Fallback JSON
    $all = getJsonScores($jsonFile);
    $results = [];
    $rank = 1;
    foreach (array_slice($all, 0, $limit) as $r) {
        $results[] = [
            'rank'   => $rank++,
            'name'   => htmlspecialchars($r['name'] ?? 'Colimense', ENT_QUOTES, 'UTF-8'),
            'score'  => (int)($r['score'] ?? 0),
            'coins'  => (int)($r['coins'] ?? 0),
            'world'  => (int)($r['world'] ?? 0),
            'sub'    => (int)($r['sub'] ?? 0),
            'is_rev' => (bool)($r['is_rev'] ?? false),
            'date'   => substr((string)($r['date'] ?? date('Y-m-d')), 0, 10)
        ];
    }

    echo json_encode([
        'success' => true,
        'driver'  => 'json',
        'scores'  => $results
    ]);
    exit;
}

// ==========================================================
// MÉTODO POST: Registrar nuevo puntaje global
// ==========================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
        exit;
    }

    // Sanitización y validación estricta
    $rawName = trim((string)($payload['name'] ?? ''));
    // Limpiar caracteres extraños, permitir letras, números, espacios y guiones
    $name = preg_replace('/[^\p{L}\p{N}\s_\-]/u', '', $rawName);
    if (empty($name)) {
        $name = 'Jugador ' . rand(100, 999);
    }
    if (mb_strlen($name, 'UTF-8') > 14) {
        $name = mb_substr($name, 0, 14, 'UTF-8');
    }

    $score = max(0, min(9999999, (int)($payload['score'] ?? 0)));
    $coins = max(0, min(99999, (int)($payload['coins'] ?? 0)));
    $world = max(0, min(9, (int)($payload['world'] ?? 0)));
    $sub   = max(0, min(2, (int)($payload['sub'] ?? 0)));
    $isRev = !empty($payload['is_rev']) ? 1 : 0;

    $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $ipHash   = hash('sha256', $clientIp . date('Y-m-d') . 'colima_salt_2026');

    if ($pdo) {
        try {
            // Rate limit básico por IP (máximo 6 registros por minuto)
            $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM scores WHERE ip_hash = :hash AND created_at > datetime('now', '-1 minute')");
            $checkStmt->execute([':hash' => $ipHash]);
            if ((int)$checkStmt->fetchColumn() >= 6) {
                http_response_code(429);
                echo json_encode(['success' => false, 'error' => 'Por favor espera un momento antes de enviar otro puntaje.']);
                exit;
            }

            $stmt = $pdo->prepare("
                INSERT INTO scores (name, score, coins, world, sub, is_rev, ip_hash, created_at)
                VALUES (:name, :score, :coins, :world, :sub, :is_rev, :hash, datetime('now'))
            ");
            $stmt->execute([
                ':name'   => $name,
                ':score'  => $score,
                ':coins'  => $coins,
                ':world'  => $world,
                ':sub'    => $sub,
                ':is_rev' => $isRev,
                ':hash'   => $ipHash
            ]);

            // Calcular posición en el ranking
            $rankStmt = $pdo->prepare("SELECT COUNT(*) + 1 FROM scores WHERE score > :score");
            $rankStmt->execute([':score' => $score]);
            $rank = (int)$rankStmt->fetchColumn();

            echo json_encode([
                'success' => true,
                'rank'    => $rank,
                'message' => '¡Puntaje registrado exitosamente en el Top Global!'
            ]);
            exit;
        } catch (Throwable $e) {
            // Continúa a JSON
        }
    }

    // Guardado en fallback JSON
    $all = getJsonScores($jsonFile);
    $entry = [
        'name'   => $name,
        'score'  => $score,
        'coins'  => $coins,
        'world'  => $world,
        'sub'    => $sub,
        'is_rev' => (bool)$isRev,
        'date'   => date('Y-m-d H:i')
    ];
    $all[] = $entry;
    saveJsonScores($jsonFile, $all);

    // Calcular posición aproximada
    usort($all, fn($a, $b) => ($b['score'] ?? 0) <=> ($a['score'] ?? 0));
    $rank = 1;
    foreach ($all as $idx => $item) {
        if ($item['score'] === $score && $item['name'] === $name) {
            $rank = $idx + 1;
            break;
        }
    }

    echo json_encode([
        'success' => true,
        'rank'    => $rank,
        'message' => '¡Puntaje registrado exitosamente!'
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
