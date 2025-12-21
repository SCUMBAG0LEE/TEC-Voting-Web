<?php
session_start();
if($_SESSION['adminLogin']!=1)
{
    header("location:index.php");
    exit();
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if($id > 0) {
    require_once '../includes/db_config.php';
    
    // Get photo path to delete file
    $photo_query = "SELECT photo FROM candidates WHERE id = ?";
    $stmt = mysqli_prepare($con, $photo_query);
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $candidate = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);
    
    // Delete from database
    $query = "DELETE FROM candidates WHERE id = ?";
    $stmt2 = mysqli_prepare($con, $query);
    mysqli_stmt_bind_param($stmt2, "i", $id);
    $data = mysqli_stmt_execute($stmt2);
    mysqli_stmt_close($stmt2);

    if($data)
    {
        // Delete photo file if exists
        if($candidate && !empty($candidate['photo']) && file_exists($candidate['photo'])) {
            unlink($candidate['photo']);
        }
        echo "<script>
                alert('Candidate deleted!')
                location.href='candidates.php'
             </script>";
    }
    else
    {
        echo "<script>
                alert('Error deleting candidate!')
                history.back()
             </script>";
    }
}
else
{
    header("location:candidates.php");
    exit();
}
?>