<?php
session_start();
if($_SESSION['adminLogin']!=1)
{
    header("location:index.php");
    exit();
}
require_once '../includes/db_config.php';

// Get candidate ID from URL
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Fetch candidate data with prepared statement
$query = "SELECT * FROM candidates WHERE id = ?";
$stmt = mysqli_prepare($con, $query);
mysqli_stmt_bind_param($stmt, "i", $id);
mysqli_stmt_execute($stmt);
$data = mysqli_stmt_get_result($stmt);
$candidate = mysqli_fetch_assoc($data);
mysqli_stmt_close($stmt);

if(!$candidate) {
    echo "<script>alert('Candidate not found!'); location.href='candidates.php';</script>";
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Candidate - TEC Online Voting</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/all.min.css">
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
</head>
<body>
   <div class="container">
        <form action="" method="POST" enctype="multipart/form-data">
            <div class="heading"><h1><a href="admin-panel.php" style="all: unset; cursor: pointer">TEC Online Voting</a></h1></div>
            <div class="form">
                <h4>Edit Candidate</h4>
                
                <label class="label">Candidate Name:</label>
                <input type="text" name="cname" class="input" value="<?php echo htmlspecialchars($candidate['name']); ?>" required>

                <label class="label">NIM (Student ID):</label>
                <input type="text" name="cnim" class="input" value="<?php echo htmlspecialchars($candidate['nim']); ?>" minlength="9" maxlength="9" pattern="[0-9]{9}" title="NIM must be exactly 9 digits" required>

                <label class="label">Major / Faculty:</label>
                <input type="text" name="cmajor" class="input" value="<?php echo htmlspecialchars($candidate['major']); ?>" required>

                <label class="label">Batch (Year):</label>
                <input type="number" name="cbatch" class="input" value="<?php echo htmlspecialchars($candidate['batch']); ?>" min="2000" max="2099" required>

                <label class="label">Current Photo:</label>
                <div style="margin-bottom: 10px;">
                    <img src="<?php echo htmlspecialchars($candidate['photo']); ?>" style="max-width: 100px; max-height: 100px; border-radius: 5px;">
                </div>

                <label class="label">New Photo (leave empty to keep current):</label>
                <input type="file" accept="image/*" name="cphoto" class="input">

                <input type="hidden" name="old_photo" value="<?php echo htmlspecialchars($candidate['photo']); ?>">
                <input type="hidden" name="id" value="<?php echo $candidate['id']; ?>">

                <button class="button" name="update">Update Candidate</button>
                <div class="link1"><a href="candidates.php"><i class="fa-solid fa-arrow-left"></i> Back to Candidates</a></div>
            </div>
        </form>
   </div>
</body>
</html>

<?php

    if(isset($_POST['update']))
    {
        $id = (int)$_POST['id'];
        $cname = trim($_POST['cname']);
        $cnim = trim($_POST['cnim']);
        $cmajor = trim($_POST['cmajor']);
        $cbatch = trim($_POST['cbatch']);
        $old_photo = $_POST['old_photo'];
        
        // Validate NIM format
        if (!preg_match('/^[0-9]{9}$/', $cnim)) {
            echo "<script>alert('NIM must be exactly 9 digits!')</script>";
        } else {
            // Check if new photo is uploaded
            if($_FILES["cphoto"]["name"] != '') {
                // Handle new file upload
                $filename = $_FILES["cphoto"]["name"];
                $tempname = $_FILES["cphoto"]["tmp_name"];
                $folder = "candidate_photos/".$cnim."_".basename($filename);
                
                // Create folder if it doesn't exist
                if (!file_exists("candidate_photos")) {
                    mkdir("candidate_photos", 0777, true);
                }
                
                move_uploaded_file($tempname, $folder);
                
                // Update with new photo using prepared statement
                $query = "UPDATE candidates SET name=?, nim=?, major=?, batch=?, photo=? WHERE id=?";
                $stmt = mysqli_prepare($con, $query);
                mysqli_stmt_bind_param($stmt, "sssssi", $cname, $cnim, $cmajor, $cbatch, $folder, $id);
            } else {
                // Update without changing photo using prepared statement
                $query = "UPDATE candidates SET name=?, nim=?, major=?, batch=? WHERE id=?";
                $stmt = mysqli_prepare($con, $query);
                mysqli_stmt_bind_param($stmt, "ssssi", $cname, $cnim, $cmajor, $cbatch, $id);
            }

            $data = mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);

            if($data)
            {
                echo "<script>
                        alert('Candidate Updated successfully')
                        location.href='candidates.php'
                    </script>";
            }
            else
            {
                echo "<script> alert('Error: NIM may already exist for another candidate!') </script>";
            }
        }
    }

?>
