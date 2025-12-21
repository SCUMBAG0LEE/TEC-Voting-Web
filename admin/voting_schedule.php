<?php
session_start();
if($_SESSION['adminLogin']!=1) {
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
    <title>Voting Schedule - TEC Online Voting</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/all.min.css">
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
</head>
<body>
   <div class="container">
        <div class="heading"><h1><a href="admin-panel.php" style="all: unset; cursor: pointer">TEC Online Voting</a></h1></div>
        <div class="form">
            <h4>Voting Schedule</h4>
            <form action="" method="POST">
                <label class="label">Valid From:</label>
                <input type="datetime-local" name="start" class="input" required>

                <label class="label">Valid To:</label>
                <input type="datetime-local" name="end" class="input" required>
                <button class="button" name="set">Set Schedule</button>
            </form>
            <div class="link1"><a href="admin-panel.php"><i class="fa-solid fa-arrow-left"></i> Back to Dashboard</a></div>
        </div>
   </div>
</body>
</html>
<?php

    require_once '../includes/db_config.php';
    if(isset($_POST['set']))
    {
        $starting = $_POST['start'];
        $ending = $_POST['end'];
        
        // Validate dates
        if(strtotime($ending) <= strtotime($starting)) {
            echo "<script> alert('End date must be after start date!') </script>";
        } else {
            $query = "UPDATE voting SET vot_start_date = ?, vot_end_date = ?";
            $stmt = mysqli_prepare($con, $query);
            mysqli_stmt_bind_param($stmt, "ss", $starting, $ending);
            $data = mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);

            if(!$data)
            {
                echo "<script> alert('Something went wrong!') </script>";
            }
            else
            {
                echo "<script> alert('Schedule updated successfully!') </script>";
            }
        }
    }
?>