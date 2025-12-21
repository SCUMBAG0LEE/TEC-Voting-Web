<?php
/**
 * Shared header for admin pages
 * Usage: include '../includes/admin_header.php'; (set $page_title before including)
 */
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
error_reporting(0);

// Check admin authentication
if ($_SESSION['adminLogin'] != 1) {
    header("location:index.php");
    exit();
}

require_once __DIR__ . '/db_config.php';
require_once __DIR__ . '/all-select-data.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title . ' - ' : ''; ?>TEC Online Voting</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/all.min.css">
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
    <?php if (isset($extra_css)) echo $extra_css; ?>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="menu-bar" id="show" onclick="showMenu()">&#9776;</span>
            <span class="menu-bar" id="hide" onclick="hideMenu()">&#9776;</span>
            <span class="logo"><a href="admin-panel.php" style="all: unset; cursor: pointer">TEC Online Voting</a></span>
            <span class="profile" onclick="showProfile()">
                <img src="../res/user3.jpg" alt="">
                <label><?php echo htmlspecialchars($_SESSION['name']); ?></label>
            </span>
        </div>
        <?php include __DIR__ . '/menu.php'; ?>
        <div id="profile-panel">
            <i class="fa-solid fa-circle-xmark" onclick="hidePanel()"></i>
            <div class="dp"><img src="../res/user3.jpg" alt=""></div>
            <div class="info">
                <h2><?php echo htmlspecialchars($_SESSION['name']); ?></h2>
                <h5>Admin</h5>
            </div>
            <div class="link">
                <a href="../includes/admin-logout.php" class="del">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
                </a>
            </div>
        </div>
        <div id="main">
