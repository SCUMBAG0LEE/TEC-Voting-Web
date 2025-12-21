<?php
/**
 * Add Voter Handler
 * TEC Voting System - Admin Panel
 */
session_start();
if ($_SESSION['adminLogin'] != 1) {
    header("location:index.php");
    exit();
}

require_once '../includes/db_config.php';

$nim = $_POST['nim'] ?? '';

if (!empty($nim)) {
    // Validate NIM format
    if (!preg_match('/^[0-9]{9}$/', $nim)) {
        $_SESSION['message'] = "Error: NIM must be exactly 9 digits";
        $_SESSION['msg_type'] = "error";
    } else {
        // Check if NIM already exists using prepared statement
        $check_query = "SELECT * FROM voters WHERE nim = ?";
        $stmt = mysqli_prepare($con, $check_query);
        mysqli_stmt_bind_param($stmt, "s", $nim);
        mysqli_stmt_execute($stmt);
        $check_result = mysqli_stmt_get_result($stmt);
        
        if (mysqli_num_rows($check_result) > 0) {
            $_SESSION['message'] = "Error: NIM $nim already registered";
            $_SESSION['msg_type'] = "error";
        } else {
            // Insert new voter using prepared statement
            $insert_query = "INSERT INTO voters (nim, vote) VALUES (?, 0)";
            $stmt2 = mysqli_prepare($con, $insert_query);
            mysqli_stmt_bind_param($stmt2, "s", $nim);
            if (mysqli_stmt_execute($stmt2)) {
                $_SESSION['message'] = "Voter $nim added successfully";
                $_SESSION['msg_type'] = "success";
            } else {
                $_SESSION['message'] = "Error adding voter";
                $_SESSION['msg_type'] = "error";
            }
            mysqli_stmt_close($stmt2);
        }
        mysqli_stmt_close($stmt);
    }
}

header("location:voters.php");
exit();
?>
