<?php
error_reporting(0);
session_start();

require_once "includes/db_config.php";
include "includes/check_voting_status.php";

// Direct NIM login
$nim = isset($_POST['nim']) ? trim($_POST['nim']) : '';

if (!empty($nim)) {
    // Validate NIM is exactly 9 digits
    if (!preg_match('/^[0-9]{9}$/', $nim)) {
        $_SESSION['error'] = "NIM must be exactly 9 digits";
        header("location:index.php");
        exit();
    }
    
    // New login attempt - check if NIM exists in voters table
    $login_query = "SELECT * FROM voters WHERE nim = ?";
    $stmt = mysqli_prepare($con, $login_query);
    mysqli_stmt_bind_param($stmt, "s", $nim);
    mysqli_stmt_execute($stmt);
    $login_data = mysqli_stmt_get_result($stmt);
    $result = mysqli_fetch_assoc($login_data);
    mysqli_stmt_close($stmt);
    
    if ($result) {
        // NIM exists, allow login
        $_SESSION['nim'] = $result['nim'];
        $_SESSION['vote'] = $result['vote'];
        $_SESSION['userLogin'] = 1;
        $_SESSION['error'] = "";
        
        // Check if already voted
        if ($result['vote'] == 1) {
            header("location:voted.php");
            exit();
        }
    } else {
        // NIM not registered
        $_SESSION['error'] = "NIM not registered. Please contact admin.";
        header("location:index.php");
        exit();
    }
} else if (!isset($_SESSION['nim']) || empty($_SESSION['nim'])) {
    // No NIM in POST and no session
    header("location:index.php");
    exit();
}


require_once 'includes/db_config.php';
$val_query = "SELECT * FROM voting";
$val_data = mysqli_query($con, $val_query);
$val_result = mysqli_fetch_assoc($val_data);

$voting_title = $val_result['voting_title'];
$vot_start_date = $val_result['vot_start_date'];
$vot_end_date = $val_result['vot_end_date'];

?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - TEC Online Voting</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/all.min.css">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <script src="js/chart.js"></script>
    <style>
        .box {
            display: none;
        }
        .warning
        {
            color: tomato;
            text-align: center;
            background-color: rgba(255, 255, 255, 0.5);
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <span class="logo">TEC Online Voting</span>
            <span class="profile" onclick="showProfile()"><img src="res/user3.jpg" alt=""><label><?php echo $_SESSION['nim']; ?></label></span>
        </div>
        <div id="profile-panel">
            <i class="fa-solid fa-circle-xmark" onclick="hidePanel()"></i>
            <div class="dp"><img src="res/user3.jpg" alt=""></div>
            <div class="info">
                <h2><?php echo $_SESSION['nim']; ?></h2>
                <h5>Voter</h5>
            </div>
            <div class="link"><a href="includes/user-logout.php" class="del"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a></div>
        </div>
        <div class="main">

            <h1 class="heading">Welcome <?php echo $_SESSION['nim']; ?>!</h1>
            <h2 class="warning">Voting will start soon...</h2>

            <div class="box">
                <h4 class="heading">Start Voting</h4>
                <table>
                    <tr>
                        <td class="bold">Voting Title :</td>
                        <td><?php echo $voting_title; ?></td>
                    </tr>
                    <tr>
                        <td class="bold">Voting Start :</td>
                        <td><?php echo $vot_start_date; ?></td>
                    </tr>
                    <tr>
                        <td class="bold">Voting End :</td>
                        <td><?php echo $vot_end_date; ?></td>
                    </tr>
                </table>
                <div class="link1"><a href="ballet.php?start=1">Start</a></div>
            </div>
        </div>

    </div>
    <script src="js/script.js"></script>
    <script>
        //logout user after 5 minutes
        setTimeout(() => {
            location.replace("includes/user-logout.php");
        }, 300000);

        //php to js variable
        var vot_start_date = "<?php echo $vot_start_date; ?>";
        var vot_end_date = "<?php echo $vot_end_date; ?>";


        //convert in millisecond
        var start_date = Date.parse(vot_start_date);
        var end_date = Date.parse(vot_end_date);

        var current_date = Date.parse(new Date());

        start_vot = start_date - current_date;
        end_vot = end_date - current_date;

        var box = document.getElementsByClassName("box");
        var warning = document.getElementsByClassName("warning");

        //start voting....
        setTimeout(() => {
            box["0"].style.display = "block";
            warning["0"].style.display="none";
        }, start_vot)

        //end voting....
        setTimeout(() => {
            box["0"].style.display = "none";
            warning["0"].style.display="block";
            warning["0"].innerHTML="No voting available!";
        }, end_vot)
    </script>
</body>

</html>