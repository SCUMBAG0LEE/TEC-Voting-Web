<?php

    session_start();
    error_reporting(0);
    if($_SESSION['userLogin']!=1)
    {
        header("location:index.php");
        exit();
    }
    include "includes/all-select-data.php";

    $start = isset($_GET['start']) ? $_GET['start'] : '';

    if($_SESSION['vote']==1)
    {
        header("location:voted.php");
        exit();
    }
    
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vote - TEC Online Voting</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/all.min.css">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <style>
        .table
        {
            margin-top: 1rem;
        }
        .button
        {
            width: 15rem;
            margin: auto;
            margin-top: 1rem;
            margin-bottom: 1rem;
        }
        .candidate-card {
            text-align: center;
            padding: 1rem;
        }
        .candidate-card img {
            max-width: 150px;
            max-height: 150px;
            border-radius: 10px;
        }
        .candidate-info {
            margin-top: 0.5rem;
        }
        .candidate-name {
            font-size: 1.2rem;
            font-weight: bold;
        }
        .candidate-details {
            color: #666;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
    <div class="heading"><h1>TEC Online Voting</h1></div>
    <div class="header">
            <span class="logo">TEC Online Voting</span>
            <span class="profile" onclick="showProfile()"><img src="res/user3.jpg" alt=""><label><?php echo $_SESSION['nim'];?></label></span>
        </div>
        <div id="profile-panel">
            <i class="fa-solid fa-circle-xmark" onclick="hidePanel()"></i>
            <div class="dp"><img src="res/user3.jpg" alt=""></div>
            <div class="info">
                <h2><?php echo $_SESSION['nim'];?></h2>
            </div>
            <div class="link"><a href="includes/user-logout.php" class="del"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a></div>
        </div>
        <div class="main">
            <h2 style="text-align:center; margin: 1rem 0;">Vote for President</h2>
            <form action="cal_vote.php" method="POST">
            <table class="table">
                <thead>
                    <th>Select</th>
                    <th>Photo</th>
                    <th>Candidate</th>
                    <th>Major/Faculty</th>
                    <th>Batch</th>
                </thead>
                <tbody>
                <?php 
                    $query = "SELECT * FROM candidates ORDER BY id ASC";
                    $data = mysqli_query($con, $query);
                    
                    while($result = mysqli_fetch_assoc($data))
                    {
                        echo "
                        <tr>
                            <td>
                                <input type='radio' name='candidate' value='".$result['id']."' class='vote' required>
                                <label class='check'>&#10004;</label>
                            </td>
                            <td>
                                <a href='admin/".$result['photo']."'><img src='admin/".$result['photo']."' style='max-width:80px; max-height:80px; border-radius:5px;'></a>
                            </td>
                            <td>
                                <div class='candidate-name'>".$result['name']."</div>
                                <div class='candidate-details'>NIM: ".$result['nim']."</div>
                            </td>
                            <td>".$result['major']."</td>
                            <td>".$result['batch']."</td>
                        </tr>";
                    }
                ?>
                </tbody>
            </table>
            <button class="button" name="vote">Submit Vote</button>
            </form>
        </div>
    </div>
   <script>
        //logout user after 5 minutes
        setTimeout(() => {
            location.replace("includes/user-logout.php");
        }, 300000);

    </script>
    <script src="js/script.js"></script>
</body>
</html>