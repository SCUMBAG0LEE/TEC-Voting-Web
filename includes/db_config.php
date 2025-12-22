<?php
/**
 * Database Configuration File
 * Tarumanagara English Club Voting System
 * 
 * All database connection settings are centralized here.
 * Include this file wherever database connection is needed.
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'voting');

// Create connection
$con = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if (!$con) {
    die("Connection failed: " . mysqli_connect_error());
}
?>
