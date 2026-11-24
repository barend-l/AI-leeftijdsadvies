<?php
// Slaat de teksten uit het dashboard op in de map 'inhoud'.
// Alleen de bekende tekstbestanden mogen worden overschreven; van elke versie blijft een kopie bewaard.
declare(strict_types=1);

const STANDAARD_WACHTWOORD = 'entree';
const MAX_BYTES = 1500000;
const MAX_KOPIEEN = 40;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function klaar(int $status, array $antwoord): void
{
    http_response_code($status);
    echo json_encode($antwoord, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    klaar(405, ['ok' => false, 'fout' => 'Alleen POST is toegestaan.']);
}

$instellingen = require __DIR__ . '/instellingen.php';
$wachtwoord = (string) ($instellingen['wachtwoord'] ?? '');
$invoer = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($invoer)) {
    klaar(400, ['ok' => false, 'fout' => 'Ongeldig verzoek.']);
}

if ($wachtwoord === '' || !hash_equals($wachtwoord, (string) ($invoer['wachtwoord'] ?? ''))) {
    sleep(1); // remt het raden van wachtwoorden af
    klaar(401, ['ok' => false, 'fout' => 'Het wachtwoord klopt niet.']);
}

$map = dirname(__DIR__) . '/inhoud';
$actie = (string) ($invoer['actie'] ?? '');

if ($actie === 'inloggen') {
    klaar(200, [
        'ok' => true,
        'standaard' => $wachtwoord === STANDAARD_WACHTWOORD,
        'schrijfbaar' => is_dir($map) && is_writable($map),
    ]);
}

if ($actie !== 'opslaan') {
    klaar(400, ['ok' => false, 'fout' => 'Onbekende actie.']);
}

$bestand = (string) ($invoer['bestand'] ?? '');
$inhoud = $invoer['inhoud'] ?? null;
if (!preg_match('/^(algemeen|\d{1,2}-\d{1,2}-jaar)\.md$/', $bestand)) {
    klaar(400, ['ok' => false, 'fout' => 'Dit bestand mag niet worden aangepast.']);
}
if (!is_string($inhoud) || $inhoud === '' || strlen($inhoud) > MAX_BYTES || !mb_check_encoding($inhoud, 'UTF-8')) {
    klaar(400, ['ok' => false, 'fout' => 'De tekst is leeg, te groot of geen geldige tekst.']);
}

$doel = $map . '/' . $bestand;
if (!is_file($doel)) {
    klaar(404, ['ok' => false, 'fout' => 'Het bestand bestaat niet.']);
}
if (!is_writable($doel) || !is_writable($map)) {
    klaar(500, ['ok' => false, 'fout' => "De map 'inhoud' is niet schrijfbaar. Vraag je beheerder om schrijfrechten."]);
}

// Kopie van de vorige versie bewaren
$kopieen = __DIR__ . '/kopieen';
if (is_dir($kopieen) || @mkdir($kopieen, 0755)) {
    @copy($doel, $kopieen . '/' . date('Ymd-His') . '-' . $bestand);
    $oud = glob($kopieen . '/*.md') ?: [];
    sort($oud);
    foreach (array_slice($oud, 0, max(0, count($oud) - MAX_KOPIEEN)) as $weg) {
        @unlink($weg);
    }
}

$tijdelijk = $doel . '.tmp';
if (file_put_contents($tijdelijk, $inhoud, LOCK_EX) === false || !rename($tijdelijk, $doel)) {
    @unlink($tijdelijk);
    klaar(500, ['ok' => false, 'fout' => 'Opslaan is mislukt.']);
}

klaar(200, ['ok' => true]);
