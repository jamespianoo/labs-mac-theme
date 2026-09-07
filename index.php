<?php
declare(strict_types=1);
?><!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="dark light">
<title>James Beckwith</title>
<link rel="icon" href="img/icons/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="img/icons/favicon-16.png" type="image/png" sizes="16x16">
<link rel="icon" href="img/icons/jb.webp" type="image/webp" sizes="any">
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Pixelify+Sans:wght@400;500;600&display=swap">
<link rel="stylesheet" href="css/desktop.css">
</head>
<body class="booting">

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

<script src="js/desktop.js" defer></script>
<script src="js/audio-theme.js" defer></script>
<script src="js/windows.js" defer></script>
<script src="js/icons.js" defer></script>
<script src="js/menus.js" defer></script>
</body>
</html>
