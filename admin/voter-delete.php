<?php
session_start();
if($_SESSION['adminLogin']!=1)
{
    header("location:index.php");
    exit();
}

$nim = isset($_GET['nim']) ? $_GET['nim'] : '';

if(!empty($nim) && preg_match('/^[0-9]{9}$/', $nim)) {
    require_once '../includes/db_config.php';
    
    $query = "DELETE FROM voters WHERE nim = ?";
    $stmt = mysqli_prepare($con, $query);
    mysqli_stmt_bind_param($stmt, "s", $nim);
    $data = mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    if($data)
    {
        $_SESSION['message'] = "Voter $nim deleted successfully";
        $_SESSION['msg_type'] = "success";
    }
    else
    {
        $_SESSION['message'] = "Error deleting voter";
        $_SESSION['msg_type'] = "error";
    }
}
else
{
    $_SESSION['message'] = "Invalid NIM";
    $_SESSION['msg_type'] = "error";
}

header("location:voters.php");
exit();
?>
