<?php
/**
 * Admin Dashboard
 * TEC Voting System - Admin Panel
 */
$page_title = 'Dashboard';
$extra_css = '<script src="../js/chart.js"></script>';
include '../includes/admin_header.php';

// Count voters who have voted
$voter_voted_query = "SELECT COUNT(*) as count FROM voters WHERE vote=1";
$voter_voted_data = mysqli_query($con, $voter_voted_query);
$voter_voted = mysqli_fetch_assoc($voter_voted_data)['count'];
?>

<div class="info-box" id="box1">
    <h1><?php echo $_SESSION["total_voters"]; ?></h1>
    <h3>Total Voters</h3>
    <a href="voters.php">More Info <i class="fa-solid fa-circle-arrow-right"></i></a>
</div>
<div class="info-box" id="box2">
    <h1><?php echo $_SESSION["total_cand"]; ?></h1>
    <h3>Candidates</h3>
    <a href="candidates.php">More Info <i class="fa-solid fa-circle-arrow-right"></i></a>
</div>
<div class="info-box" id="box4">
    <h1><?php echo $voter_voted; ?></h1>
    <h3>Voters Voted</h3>
    <a href="voters.php">More Info <i class="fa-solid fa-circle-arrow-right"></i></a>
</div>
<div class="result-box">
    <h2 class="result-title">Presidential Election Tally</h2>
    <div class="result"><canvas class="myChart"></canvas></div>
</div>

<?php
$extra_js = '';
// Chart script is included inline below
?>
<script>
    var ctx = [];
    var myChart = [];
    <?php include "../includes/candidate_result.php"; ?>
</script>
<?php include '../includes/admin_footer.php'; ?>