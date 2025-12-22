<?php
/**
 * Database Configuration File (EXAMPLE)
 * Tarumanagara English Club Voting System
 * 
 * INSTRUCTIONS:
 * 1. Copy this file and rename it to 'db_config.php'
 * 2. Fill in your actual database credentials below
 * 3. Never commit db_config.php to version control!
 */

// Database credentials - CHANGE THESE!
define('DB_HOST', 'localhost');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
define('DB_NAME', 'voting');

// Create connection
$con = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if (!$con) {
    die("Connection failed: " . mysqli_connect_error());
}
?>
