<?php
declare(strict_types=1);

// Determine base URL path for assets and routing
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
$baseHref = ($scriptDir === '' || $scriptDir === '.') ? '/' : $scriptDir . '/';

// Determine initial slug from query param or REQUEST_URI
$initialSlug = '';
if (!empty($_GET['folder'])) {
    $initialSlug = strtolower(trim((string) $_GET['folder']));
} elseif (!empty($_GET['p'])) {
    $initialSlug = strtolower(trim((string) $_GET['p']));
} else {
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '';
    if ($scriptDir !== '' && str_starts_with($uriPath, $scriptDir)) {
        $uriPath = substr($uriPath, strlen($scriptDir));
    }
    $slug = trim($uriPath, '/');
    if ($slug !== '' && !str_contains($slug, '/')) {
        $initialSlug = strtolower($slug);
    }
}
$initialSlug = preg_replace('/[^a-z0-9_-]/', '', $initialSlug);

$folderTitles = [
    'music' => 'Music',
    'football' => 'Football',
    'labs' => 'Labs',
    'maps' => 'Maps',
    'videos' => 'Videos',
    'piano' => 'Piano Repair',
    'piano-repair' => 'Piano Repair',
    'stream' => 'Streaming',
    'streaming' => 'Streaming',
    'about' => 'about-me.pdf',
    'contact' => 'contact.me',
    'trash' => 'Trash',
];
$pageTitle = isset($folderTitles[$initialSlug]) ? 'James Beckwith | ' . $folderTitles[$initialSlug] : 'James Beckwith';
?><!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<base href="<?= htmlspecialchars($baseHref, ENT_QUOTES, 'UTF-8') ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
<link rel="icon" href="img/icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="img/icons/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="img/icons/favicon-16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="img/icons/apple-touch-icon.png">
<script>
/* Appearance: 'auto' (default) follows daylight where the visitor is,
   'light' and 'dark' are fixed. Runs before first paint so there is no flash. */
(function () {
  var KEY = 'jb-appearance';

  /* Local sunrise and sunset in clock hours, estimated from the date and the
     device's time zone alone: no location permission needed. Longitude comes
     from the standard UTC offset; latitude is a mid-latitude guess, flipped
     for southern-hemisphere zones. */
  function sunTimes(now) {
    var y = now.getFullYear();
    var jan = new Date(y, 0, 1).getTimezoneOffset();
    var jul = new Date(y, 6, 1).getTimezoneOffset();
    var dst = (Math.max(jan, jul) - now.getTimezoneOffset()) / 60;
    var zone = '';
    try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var south = jan < jul ||
      /^(Australia|Antarctica|Pacific\/(Auckland|Chatham|Fiji)|America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|Punta_Arenas)|Africa\/(Johannesburg|Maputo|Windhoek|Gaborone|Maseru|Mbabane)|Indian\/(Mauritius|Reunion))/.test(zone);
    var lat = (south ? -48 : 48) * Math.PI / 180;
    var day = Math.floor((now - new Date(y, 0, 0)) / 864e5);
    var decl = 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + day) / 365);
    var b = 2 * Math.PI * (day - 81) / 364;
    var eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    var noon = 12 + dst - eot / 60;
    var cosH = (Math.sin(-0.833 * Math.PI / 180) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
    var half = Math.acos(Math.max(-1, Math.min(1, cosH))) * 12 / Math.PI;
    return { rise: noon - half, set: noon + half };
  }

  function mode() {
    try {
      var m = localStorage.getItem(KEY);
      return m === 'light' || m === 'dark' ? m : 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function resolve(m, now) {
    if (m === 'light' || m === 'dark') return m;
    now = now || new Date();
    var sun = sunTimes(now);
    var h = now.getHours() + now.getMinutes() / 60;
    return h >= sun.rise && h < sun.set ? 'light' : 'dark';
  }

  window.JBAppearance = { KEY: KEY, mode: mode, resolve: resolve, sunTimes: sunTimes };
  document.documentElement.setAttribute('data-theme', resolve(mode()));
})();
</script>
<link rel="stylesheet" href="css/desktop.css">
</head>
<body class="booting" data-initial-slug="<?= htmlspecialchars($initialSlug, ENT_QUOTES, 'UTF-8') ?>" data-base-href="<?= htmlspecialchars($baseHref, ENT_QUOTES, 'UTF-8') ?>">

<div class="hero">
  <?php require __DIR__ . '/includes/desktop-map.php'; ?>
  <?php require __DIR__ . '/includes/menubar.php'; ?>

  <main class="desktop" id="desktop">
    <?php require __DIR__ . '/includes/stickies.php'; ?>
    <?php require __DIR__ . '/includes/desktop-icons.php'; ?>
    <?php require __DIR__ . '/includes/wordmark.php'; ?>
  </main>
  <div class="boot-veil" aria-hidden="true"></div>
</div>

<?php require __DIR__ . '/includes/windows.php'; ?>
<?php require __DIR__ . '/includes/context-menu.php'; ?>
<?php require __DIR__ . '/includes/alert-dialog.php'; ?>

<script id="jb-taxonomy" type="application/json">
<?= file_get_contents(__DIR__ . '/data/taxonomy.json') ?>
</script>

<script src="js/desktop.js" defer></script>
<script src="js/audio-theme.js" defer></script>
<script src="js/windows.js" defer></script>
<script src="js/icons.js" defer></script>
<script src="js/menus.js" defer></script>
<script src="js/pixel-glyphs.js" defer></script>
<script src="js/pixel-effects.js" defer></script>
<script src="js/pixel-music.js" defer></script>
<script src="js/pixel-field.js" defer></script>
</body>
</html>
