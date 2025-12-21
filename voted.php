<?php
    session_start();
    error_reporting(0);

    if($_SESSION['userLogin']!=1)
    {
        header("location:index.php");
        exit();
    }
    include "includes/all-select-data.php";

    $val_query="SELECT * FROM voting";
    $val_data=mysqli_query($con,$val_query);
    $val_result=mysqli_fetch_assoc($val_data);

    $vot_start_date=$val_result['vot_start_date'];
    $vot_end_date=$val_result['vot_end_date'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vote Submitted - TEC Online Voting</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/all.min.css">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <script src="js/chart.js"></script>
    <style>
         .result-box
        {
            display: none;
        }
        h4.heading
        {
            color: tomato;
        }
    </style>
</head>
<body>
    <div class="container">
    <div class="header">
            <span class="logo">TEC Online Voting</span>
            <span class="profile" onclick="showProfile()"><img src="res/user3.jpg" alt=""><label><?php echo $_SESSION['nim'];?></label></span>
        </div>
        <div id="profile-panel">
            <span class="fa-solid fa-circle-xmark" onclick="hidePanel()"></span>
            <div class="dp"><img src="res/user3.jpg" alt=""></div>
            <div class="info">
                <h2><?php echo $_SESSION['nim'];?></h2>
                <h5>Voter</h5>
            </div>
            <div class="link"><a href="includes/user-logout.php" class="del"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a></div>
        </div>
    <h2 class="heading center">Your vote Submitted Successfully!</h2>
    <h4 class="heading">Result Show After Voting ends</h4>
    <div class="result-box">
                <h2 class="result-title">Presidential Election Result</h2>
                <div class="result"><canvas class="myChart"></canvas></div>
            </div>
    </div>
    

    <script src="js/script.js"></script>
    <script>

        //php to js variable
        var vot_start_date="<?php echo $vot_start_date; ?>";
        var vot_end_date="<?php echo $vot_end_date; ?>";
        console.log(vot_end_date)
        

        //convert in millisecond
        var start_date=Date.parse(vot_start_date);
        var end_date=Date.parse(vot_end_date);

        var current_date=Date.parse(new Date());

        start_vot = start_date - current_date;
        end_vot = end_date - current_date;
        
        var vresult = document.getElementsByClassName("result-box");
        var heading = document.getElementsByClassName("heading");

         //start voting....
         setTimeout(()=>{
            vresult["0"].style.display="none";
        },start_vot)

        //end voting....
        setTimeout(()=>{
            vresult["0"].style.display="block";
            heading["1"].style.display="none";

        },end_vot)

        //voting result
        var ctx = [];
        var myChart = [];
        <?php
            include "includes/candidate_result.php";
        ?>
    </script>
</body>
</html>