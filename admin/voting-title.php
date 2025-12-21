<?php
session_start();
if($_SESSION['adminLogin']!=1)
{
    header("location:index.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voting Title - TEC Online Voting</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/all.min.css">
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
</head>
<body>
   <div class="container">
        <form action="" method="POST" enctype="multipart/form-data">
            <div class="heading"><h1><a href="admin-panel.php" style="all: unset; cursor: pointer">TEC Online Voting</a></h1></div>
            <div class="form">
                <h4>Election Title</h4>
                <label class="label">Title:</label>
                <input type="text" name="title" class="input" placeholder="Enter voting title" required>

                <button class="button" name="set">Set Title</button>
                <div class="link1"><a href="admin-panel.php"><i class="fa-solid fa-arrow-left"></i> Back to Dashboard</a></div>
            </div>
        </form>
   </div>
</body>
</html>

<?php

    if(isset($_POST['set']))
    {
        require_once '../includes/db_config.php';
        $title = trim($_POST['title']);

        $query = "UPDATE voting SET voting_title = ?";
        $stmt = mysqli_prepare($con, $query);
        mysqli_stmt_bind_param($stmt, "s", $title);
        $data = mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);

        if($data)
        {
            echo "<script> alert('Title set Successfully!') </script>";
        }
        else
        {
            echo "<script> alert('Error updating title!') </script>";
        }
    }

?>
