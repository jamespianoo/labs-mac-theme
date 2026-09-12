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
<meta name="color-scheme" content="dark light">
<title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
<link rel="icon" href="img/icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="img/icons/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="img/icons/favicon-16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="img/icons/apple-touch-icon.png">
<script>
(function () {
  try {
    var t = localStorage.getItem('jb-theme');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
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
</body>
</html>
