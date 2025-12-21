<?php

    error_reporting(0);
    session_start();

    if($_SESSION['userLogin']!=1)
    {
        header("location:index.php");
        exit();
    }
    elseif($_SESSION['vote']==1)
    {
        header("location:voted.php");
        exit();
    }

    require_once 'includes/db_config.php';
    
    // Get selected candidate ID
    $candidate_id = isset($_POST['candidate']) ? (int)$_POST['candidate'] : 0;
    
    if($candidate_id > 0) {
        // Update candidate votes atomically
        $can_up_query = "UPDATE candidates SET votes = votes + 1 WHERE id = ?";
        $stmt = mysqli_prepare($con, $can_up_query);
        mysqli_stmt_bind_param($stmt, "i", $candidate_id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    }

    // Update voter's vote status using NIM
    $nim = $_SESSION['nim'];
    $voter_up_query = "UPDATE voters SET vote=1 WHERE nim = ?";
    $stmt2 = mysqli_prepare($con, $voter_up_query);
    mysqli_stmt_bind_param($stmt2, "s", $nim);
    $voter_up_data = mysqli_stmt_execute($stmt2);
    mysqli_stmt_close($stmt2);

    if($voter_up_data)
    {
        $_SESSION['vote'] = 1;
        header("location:voted.php");
        exit();
    }

?>