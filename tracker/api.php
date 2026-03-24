<?php
/**
 * TraVis API — Backend PHP file-based
 * Da posizionare nella stessa cartella di index.html
 * Richiede: data/ e export/ scrivibili da PHP
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$DATA_DIR = __DIR__ . '/data';
$EXPORT_DIR = __DIR__ . '/export';
$CSV_FILE = __DIR__ . '/aziende.csv';

// Crea cartelle se non esistono
if (!is_dir($DATA_DIR)) mkdir($DATA_DIR, 0755, true);
if (!is_dir($EXPORT_DIR)) mkdir($EXPORT_DIR, 0755, true);

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {

    // ── Carica anagrafica ──
    case 'get_aziende':
        $aziende = loadCSV($CSV_FILE);
        $custom = loadJSON("$DATA_DIR/aziende_custom.json");
        
        // Merge custom data
        $deleted = $custom['deleted'] ?? [];
        $overrides = $custom['overrides'] ?? [];
        $added = $custom['added'] ?? [];
        
        $result = [];
        foreach ($aziende as $a) {
            if (in_array($a['id'], $deleted)) continue;
            if (isset($overrides[$a['id']])) {
                $a = array_merge($a, $overrides[$a['id']]);
            }
            $result[] = $a;
        }
        foreach ($added as $a) {
            if (!in_array($a['id'], $deleted)) {
                $result[] = $a;
            }
        }
        
        echo json_encode(['ok' => true, 'aziende' => $result], JSON_UNESCAPED_UNICODE);
        break;

    // ── Salva visita ──
    case 'save_visita':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['azienda_id'])) {
            echo json_encode(['ok' => false, 'error' => 'Dati mancanti']);
            break;
        }
        
        $date = $input['data'] ?? date('Y-m-d');
        $file = "$DATA_DIR/visite_$date.json";
        $visite = loadJSON($file) ?: [];
        
        // Se edit, sostituisci
        if (!empty($input['id'])) {
            $found = false;
            foreach ($visite as &$v) {
                if ($v['id'] === $input['id']) {
                    $v = $input;
                    $found = true;
                    break;
                }
            }
            if (!$found) $visite[] = $input;
        } else {
            $input['id'] = 'v_' . time() . '_' . bin2hex(random_bytes(3));
            $visite[] = $input;
        }
        
        saveJSON($file, $visite);
        
        // Auto-export
        autoExport($input, $DATA_DIR, $EXPORT_DIR);
        
        echo json_encode(['ok' => true, 'visita' => $input], JSON_UNESCAPED_UNICODE);
        break;

    // ── Carica visite ──
    case 'get_visite':
        $allVisite = [];
        $files = glob("$DATA_DIR/visite_*.json");
        foreach ($files as $f) {
            $data = loadJSON($f);
            if (is_array($data)) $allVisite = array_merge($allVisite, $data);
        }
        echo json_encode(['ok' => true, 'visite' => $allVisite], JSON_UNESCAPED_UNICODE);
        break;

    // ── Elimina visita ──
    case 'delete_visita':
        $input = json_decode(file_get_contents('php://input'), true);
        $visitId = $input['id'] ?? '';
        if (!$visitId) { echo json_encode(['ok' => false]); break; }
        
        $files = glob("$DATA_DIR/visite_*.json");
        foreach ($files as $f) {
            $data = loadJSON($f);
            $filtered = array_values(array_filter($data, fn($v) => $v['id'] !== $visitId));
            if (count($filtered) !== count($data)) {
                saveJSON($f, $filtered);
                break;
            }
        }
        echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
        break;

    // ── Salva modifica azienda ──
    case 'save_company':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? '';
        if (!$id) { echo json_encode(['ok' => false]); break; }
        
        $custom = loadJSON("$DATA_DIR/aziende_custom.json") ?: ['deleted'=>[], 'overrides'=>[], 'added'=>[]];
        $custom['overrides'][$id] = $input;
        saveJSON("$DATA_DIR/aziende_custom.json", $custom);
        
        echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
        break;

    // ── Aggiungi azienda ──
    case 'add_company':
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['nome'])) {
            echo json_encode(['ok' => false, 'error' => 'Nome mancante']);
            break;
        }
        
        $input['id'] = 'c_' . time() . '_' . bin2hex(random_bytes(3));
        $custom = loadJSON("$DATA_DIR/aziende_custom.json") ?: ['deleted'=>[], 'overrides'=>[], 'added'=>[]];
        $custom['added'][] = $input;
        saveJSON("$DATA_DIR/aziende_custom.json", $custom);
        
        echo json_encode(['ok' => true, 'azienda' => $input], JSON_UNESCAPED_UNICODE);
        break;

    // ── Elimina azienda ──
    case 'delete_company':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? '';
        if (!$id) { echo json_encode(['ok' => false]); break; }
        
        $custom = loadJSON("$DATA_DIR/aziende_custom.json") ?: ['deleted'=>[], 'overrides'=>[], 'added'=>[]];
        $custom['deleted'][] = $id;
        saveJSON("$DATA_DIR/aziende_custom.json", $custom);
        
        echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
        break;

    // ── Export CSV ──
    case 'export':
        $allVisite = [];
        $files = glob("$DATA_DIR/visite_*.json");
        foreach ($files as $f) {
            $data = loadJSON($f);
            if (is_array($data)) $allVisite = array_merge($allVisite, $data);
        }
        
        $aziende = loadCSV($CSV_FILE);
        $aziMap = [];
        foreach ($aziende as $a) $aziMap[$a['id']] = $a;
        
        $agente = $_GET['agente'] ?? 'agente';
        $filename = 'visite_' . date('Y-m-d') . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $agente) . '.csv';
        
        $csv = "Azienda,Città,Categoria,Data,Ora,Rating,Preventivo,Contatto,Note,Agente,Tel Agente\n";
        foreach ($allVisite as $v) {
            $a = $aziMap[$v['azienda_id']] ?? [];
            $row = [
                $a['nome'] ?? '', $a['citta'] ?? '', $a['categoria'] ?? '',
                $v['data'] ?? '', $v['ora'] ?? '', $v['rating'] ?? '',
                ($v['preventivo'] ?? false) ? 'Sì' : 'No',
                $v['contatto'] ?? '', $v['note'] ?? '',
                $v['agente'] ?? '', $v['agente_tel'] ?? ''
            ];
            $csv .= implode(',', array_map(fn($val) => '"' . str_replace('"', '""', $val) . '"', $row)) . "\n";
        }
        
        file_put_contents("$EXPORT_DIR/$filename", "\xEF\xBB\xBF" . $csv);
        
        header('Content-Type: text/csv; charset=utf-8');
        header("Content-Disposition: attachment; filename=\"$filename\"");
        echo "\xEF\xBB\xBF" . $csv;
        break;

    default:
        echo json_encode(['ok' => false, 'error' => 'Azione sconosciuta', 'actions' => [
            'get_aziende', 'get_visite', 'save_visita', 'delete_visita',
            'save_company', 'add_company', 'delete_company', 'export'
        ]]);
}

// ═══════════════════════════════════════
// FUNZIONI HELPER
// ═══════════════════════════════════════

function loadCSV($file) {
    if (!file_exists($file)) return [];
    $handle = fopen($file, 'r');
    if (!$handle) return [];
    
    // BOM
    $bom = fread($handle, 3);
    if ($bom !== "\xEF\xBB\xBF") rewind($handle);
    
    // Detect separator
    $firstLine = fgets($handle);
    rewind($handle);
    if ($bom === "\xEF\xBB\xBF") fread($handle, 3);
    
    $sep = (substr_count($firstLine, ';') > substr_count($firstLine, ',')) ? ';' : ',';
    
    $headers = fgetcsv($handle, 0, $sep);
    if (!$headers) return [];
    
    // Normalize headers
    $headerMap = [];
    foreach ($headers as $i => $h) {
        $h = strtolower(trim(preg_replace('/^\x{FEFF}/u', '', $h)));
        if (str_contains($h, 'nome') || str_contains($h, 'azienda')) $headerMap['nome'] = $i;
        elseif (str_contains($h, 'citt')) $headerMap['citta'] = $i;
        elseif (str_contains($h, 'indirizzo') || str_contains($h, 'via')) $headerMap['indirizzo'] = $i;
        elseif (str_contains($h, 'email') || str_contains($h, 'mail')) $headerMap['email'] = $i;
        elseif (str_contains($h, 'telefono') || str_contains($h, 'tel')) $headerMap['telefono'] = $i;
        elseif (str_contains($h, 'campo') || str_contains($h, 'lavoro')) $headerMap['campo'] = $i;
        elseif (str_contains($h, 'categoria') || str_contains($h, 'cat')) $headerMap['categoria'] = $i;
        elseif (str_contains($h, 'sito') || str_contains($h, 'web') || str_contains($h, 'url')) $headerMap['sito'] = $i;
    }
    
    $result = [];
    while (($row = fgetcsv($handle, 0, $sep)) !== false) {
        $nome = trim($row[$headerMap['nome'] ?? 0] ?? '');
        if (!$nome) continue;
        
        $result[] = [
            'id' => substr(md5($nome), 0, 8),
            'nome' => $nome,
            'citta' => trim($row[$headerMap['citta'] ?? -1] ?? ''),
            'indirizzo' => trim($row[$headerMap['indirizzo'] ?? -1] ?? ''),
            'email' => trim($row[$headerMap['email'] ?? -1] ?? ''),
            'telefono' => trim($row[$headerMap['telefono'] ?? -1] ?? ''),
            'campo' => trim($row[$headerMap['campo'] ?? -1] ?? ''),
            'categoria' => trim($row[$headerMap['categoria'] ?? -1] ?? ''),
            'sito' => trim($row[$headerMap['sito'] ?? -1] ?? ''),
        ];
    }
    
    fclose($handle);
    return $result;
}

function loadJSON($file) {
    if (!file_exists($file)) return null;
    $data = json_decode(file_get_contents($file), true);
    return $data;
}

function saveJSON($file, $data) {
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

function autoExport($visita, $dataDir, $exportDir) {
    // Genera export automatico dopo ogni salvataggio
    $date = $visita['data'] ?? date('Y-m-d');
    $agente = preg_replace('/[^a-zA-Z0-9]/', '', $visita['agente'] ?? 'agente');
    $file = "$dataDir/visite_$date.json";
    $visite = loadJSON($file) ?: [];
    
    $csv = "Azienda_ID,Data,Ora,Rating,Preventivo,Contatto,Note,Agente\n";
    foreach ($visite as $v) {
        $row = [$v['azienda_id']??'', $v['data']??'', $v['ora']??'', $v['rating']??'',
                ($v['preventivo']??false)?'Sì':'No', $v['contatto']??'', $v['note']??'', $v['agente']??''];
        $csv .= implode(',', array_map(fn($val) => '"'.str_replace('"','""',$val).'"', $row)) . "\n";
    }
    
    file_put_contents("$exportDir/visite_{$date}_{$agente}.csv", "\xEF\xBB\xBF" . $csv);
}
