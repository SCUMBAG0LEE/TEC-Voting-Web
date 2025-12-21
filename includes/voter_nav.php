<?php
/**
 * Navigation bar for logged-in voters
 * Requires: $_SESSION['nim'] to be set
 */
?>
<div class="header">
    <span class="logo">TEC Online Voting</span>
    <span class="profile" onclick="showProfile()">
        <img src="res/user3.jpg" alt="">
        <label><?php echo htmlspecialchars($_SESSION['nim']); ?></label>
    </span>
</div>
<div id="profile-panel">
    <i class="fa-solid fa-circle-xmark" onclick="hidePanel()"></i>
    <div class="dp"><img src="res/user3.jpg" alt=""></div>
    <div class="info">
        <h2><?php echo htmlspecialchars($_SESSION['nim']); ?></h2>
        <h5>Voter</h5>
    </div>
    <div class="link">
        <a href="includes/user-logout.php" class="del">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Logout
        </a>
    </div>
</div>
