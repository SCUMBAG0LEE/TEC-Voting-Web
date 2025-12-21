<?php
error_reporting(0);
require_once __DIR__ . '/db_config.php';

// candidate data (from candidates table)
$can_query="SELECT * FROM candidates";
$can_data=mysqli_query($con,$can_query);
$_SESSION["total_cand"]=mysqli_num_rows($can_data);
$total_cand=mysqli_num_rows($can_data);

// voter data (from voters table)
$voter_query="SELECT * FROM voters";
$voter_data=mysqli_query($con,$voter_query);
$_SESSION["total_voters"]=mysqli_num_rows($voter_data);

?>