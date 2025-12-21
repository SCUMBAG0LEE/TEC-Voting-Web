<?php
    session_start();
    error_reporting(0);
    $_SESSION["adminLogin"]=0;
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - TEC Online Voting</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/all.min.css">
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
    <style>
        .error { color: red; text-align: center; }
        .back-link { text-align: center; margin-top: 1rem; }
        .back-link a { color: #00a2ed; text-decoration: none; }
        .back-link a:hover { text-decoration: underline; }
    </style>
</head>
<body>
   <div class="container">
        <div class="heading"><h1><a href="../index.html" style="all: unset; cursor: pointer">TEC Online Voting</a></h1></div>
        <div class="form">
            <h4>Admin Login</h4>
            <form action="admin_welcome.php" method="POST">
                <label class="label">Email Address:</label>
                <input type="email" name="email" class="input" placeholder="Enter Email Address" required>

                <label class="label">Password:</label>
                <input type="password" name="password" class="input" placeholder="Enter Password" required>

                <button class="button" name="login">Login</button>
            </form>
            <p class="error"><?php echo $_SESSION['error']; ?></p>
            <div class="back-link"><a href="../index.html"><i class="fa-solid fa-arrow-left"></i> Back to Home</a></div>
        </div>
   </div>
</body>
</html>