<?php
/**
 * Shared header for voter-facing pages
 * Usage: include 'includes/header.php'; (set $page_title before including)
 */
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
error_reporting(0);
require_once __DIR__ . '/db_config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title . ' - ' : ''; ?>TEC Online Voting</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/all.min.css">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <?php if (isset($extra_css)) echo $extra_css; ?>
</head>
<body>
