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
    <title>Add Candidate - TEC Online Voting</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/all.min.css">
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
</head>
<body>
   <div class="container">
        <form action="" method="POST" enctype="multipart/form-data">
            <div class="heading"><h1><a href="admin-panel.php" style="all: unset; cursor: pointer">TEC Online Voting</a></h1></div>
            <div class="form">
                <h4>Add New Candidate</h4>
                
                <label class="label">Candidate Name:</label>
                <input type="text" name="cname" class="input" placeholder="Enter Candidate Name" required>

                <label class="label">NIM (Student ID):</label>
                <input type="text" name="cnim" class="input" placeholder="Enter 9-digit NIM" minlength="9" maxlength="9" pattern="[0-9]{9}" title="NIM must be exactly 9 digits" required>

                <label class="label">Major / Faculty:</label>
                <input type="text" name="cmajor" class="input" placeholder="Enter Major or Faculty" required>

                <label class="label">Batch (Year):</label>
                <input type="number" name="cbatch" class="input" placeholder="Enter Batch Year (e.g. 2022)" min="2000" max="2099" required>

                <label class="label">Candidate Photo:</label>
                <input type="file" accept="image/*" name="cphoto" class="input" required>

                <button class="button" name="register">Register Candidate</button>
                <div class="link1"><a href="candidates.php"><i class="fa-solid fa-arrow-left"></i> Back to Candidates</a></div>
            </div>
        </form>
   </div>
</body>
</html>

<?php

    if(isset($_POST['register']))
    {
        require_once '../includes/db_config.php';
        $cname = trim($_POST['cname']);
        $cnim = trim($_POST['cnim']);
        $cmajor = trim($_POST['cmajor']);
        $cbatch = trim($_POST['cbatch']);
        
        // Validate NIM format
        if (!preg_match('/^[0-9]{9}$/', $cnim)) {
            echo "<script>alert('NIM must be exactly 9 digits!')</script>";
        } else {
            // Handle file upload
            $filename = $_FILES["cphoto"]["name"];
            $tempname = $_FILES["cphoto"]["tmp_name"];
            $folder = "candidate_photos/" . $cnim . "_" . basename($filename);
            
            // Create folder if it doesn't exist
            if (!file_exists("candidate_photos")) {
                mkdir("candidate_photos", 0777, true);
            }
            
            move_uploaded_file($tempname, $folder);

            $query = "INSERT INTO candidates (name, nim, major, batch, photo) VALUES (?, ?, ?, ?, ?)";
            $stmt = mysqli_prepare($con, $query);
            mysqli_stmt_bind_param($stmt, "sssss", $cname, $cnim, $cmajor, $cbatch, $folder);
            $data = mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);

            if($data)
            {
                echo "<script>
                        alert('Candidate Registered successfully')
                        location.href='candidates.php'
                    </script>";
            }
            else
            {
                echo "<script> alert('Error: NIM may already exist!') </script>";
            }
        }
    }

?>