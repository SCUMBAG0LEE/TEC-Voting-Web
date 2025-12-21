<?php
session_start();
if($_SESSION['adminLogin']!=1)
{
    header("location:index.php");
    exit();
}

require_once '../includes/db_config.php';

// Reset all candidate votes to 0
$rst_cand_query = "UPDATE candidates SET votes=0";
$rst_cand_data = mysqli_query($con,$rst_cand_query);

// Reset all voters' vote status to 0 (not voted)
$rst_voter_query = "UPDATE voters SET vote=0";
$rst_voter_data = mysqli_query($con,$rst_voter_query);

if($rst_voter_data)
{
    echo "<script>
            alert('Voting reset successfully!')
            location.href='admin-panel.php'
         </script>";
}
else
{
    echo "<script>
            alert('Error resetting votes!')
            history.back()
         </script>";
}
?>