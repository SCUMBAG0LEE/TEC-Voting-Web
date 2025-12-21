<?php
session_start();
error_reporting(0);
require_once 'includes/db_config.php';
include 'includes/check_voting_status.php';
$error = $_SESSION['error']; // Save error before destroying session
session_destroy();
$_SESSION['userLogin'] = 0;
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voter Login - TEC Online Voting</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/all.min.css">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <style>
        .back-link { text-align: center; margin-top: 1rem; }
        .back-link a { color: #00a2ed; text-decoration: none; }
        .back-link a:hover { text-decoration: underline; }
    </style>
</head>

<body>
    <div class="container">
        <div class="heading">
            <h1><a href="index.html" style="all: unset; cursor: pointer">TEC Online Voting</a></h1>
        </div>
        <div class="form">
            <h4>Voter Login</h4>
            <form action="voting-system.php" method="POST">
                <label class="label">NIM (Student ID):</label>
                <input type="text" name="nim" class="input" placeholder="Enter your 9-digit NIM" minlength="9" maxlength="9" pattern="[0-9]{9}" title="NIM must be exactly 9 digits" required>

                <button class="button" name="login">Login</button>
            </form>
            <p class="error"><?php echo $error; ?></p>
            <div class="back-link"><a href="index.html"><i class="fa-solid fa-arrow-left"></i> Back to Home</a></div>
        </div>
    </div>
</body>
</html>