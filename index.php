<?php
declare(strict_types=1);
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>James Beckwith</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&display=swap">
<link rel="stylesheet" href="css/desktop.css">
</head>
<body>

<?php require __DIR__ . '/includes/icons.svg.php'; ?>

<div class="hero">
  <?php require __DIR__ . '/includes/menubar.php'; ?>

  <main class="desktop" id="desktop">
    <?php require __DIR__ . '/includes/desktop-icons.php'; ?>
    <?php require __DIR__ . '/includes/wordmark.php'; ?>
  </main>
</div>

<?php require __DIR__ . '/includes/below.php'; ?>
<?php require __DIR__ . '/includes/windows.php'; ?>

<script src="js/desktop.js" defer></script>
</body>
</html>
