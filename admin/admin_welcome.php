<?php

    error_reporting(0);
    session_start();
    $_SESSION['error']="";

    require_once "../includes/db_config.php";

    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    if(!empty($email) && !empty($password)) {
        $query = "SELECT * FROM admin WHERE email = ?";
        $stmt = mysqli_prepare($con, $query);
        mysqli_stmt_bind_param($stmt, "s", $email);
        mysqli_stmt_execute($stmt);
        $data = mysqli_stmt_get_result($stmt);
        $result = mysqli_fetch_assoc($data);
        mysqli_stmt_close($stmt);

        if($result && $password === $result['password']) {
            $_SESSION['email'] = $result['email'];
            $_SESSION['name'] = $result['name'];
            $_SESSION['adminLogin'] = 1;
            header("location:admin-panel.php");
            exit();
        } else {
            $_SESSION['error'] = "Invalid email or password!";
            header("location:index.php");
            exit();
        }
    } else {
        $_SESSION['error'] = "Please enter email and password!";
        header("location:index.php");
        exit();
    }

?>