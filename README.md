# TEC Online Voting System

A web-based voting system for presidential elections, built with PHP and MySQL. Designed for student organization elections using NIM (Student ID) authentication.

## Features

### Voter Features
- **NIM-based Login** - Voters authenticate using their 9-digit Student ID (NIM)
- **One Vote Per Voter** - System prevents duplicate voting
- **Real-time Results** - View election results after voting period ends
- **Responsive Design** - Works on desktop and mobile devices

### Admin Features
- **Dashboard** - Overview of voters, candidates, and live vote tally
- **Voter Management** - Add/delete voters by NIM
- **Candidate Management** - Register, edit, and delete presidential candidates
- **Election Settings** - Set election title and voting schedule
- **Election History** - Automatic saving of past election results
- **Manual Reset** - Option to manually reset votes
- **Auto-Reset** - Automatically resets votes when election period ends

## Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- Web browser with JavaScript enabled

## Installation

### 1. Clone/Download the Project

Place the project files in your web server directory (e.g., `htdocs`, `www`, or `public_html`).

### 2. Database Setup

Create a MySQL database and import the following tables:

```sql
-- Create database
CREATE DATABASE voting;
USE voting;

-- Admin table
CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Insert default admin (change password after first login!)
INSERT INTO admin (name, email, password) VALUES ('Admin', 'admin@tec.ac.id', 'admin123');

-- Voters table
CREATE TABLE voters (
    no INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(9) UNIQUE NOT NULL,
    vote TINYINT(1) DEFAULT 0
);

-- Candidates table
CREATE TABLE candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nim VARCHAR(9) UNIQUE NOT NULL,
    major VARCHAR(100),
    batch VARCHAR(4),
    photo VARCHAR(255),
    votes INT DEFAULT 0
);

-- Voting settings table
CREATE TABLE voting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voting_title VARCHAR(255) DEFAULT 'Presidential Election',
    vot_start_date DATETIME,
    vot_end_date DATETIME,
    last_reset DATETIME
);

-- Insert default voting row
INSERT INTO voting (voting_title) VALUES ('Presidential Election');

-- Election history table
CREATE TABLE election_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    election_title VARCHAR(255),
    winner_name VARCHAR(100),
    winner_nim VARCHAR(9),
    winner_major VARCHAR(100),
    winner_batch VARCHAR(4),
    winner_votes INT,
    winner_photo VARCHAR(255),
    total_votes INT,
    total_voters INT,
    voters_participated INT,
    start_date DATETIME,
    end_date DATETIME,
    candidates_data JSON,
    saved_at DATETIME
);
```

### 3. Configure Database Connection

Edit `includes/db_config.php` with your database credentials:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
define('DB_NAME', 'voting');

$con = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
?>
```

### 4. Set File Permissions

Ensure the `admin/candidate_photos/` directory is writable:

```bash
chmod 755 admin/candidate_photos/
```

## Usage

### For Administrators

1. Navigate to `/admin/` 
2. Login with admin credentials
3. **Set up election:**
   - Go to "Election Title" to set the election name
   - Go to "Voting Schedule" to set start and end dates
   - Go to "Candidates" to register presidential candidates
   - Go to "Voters" to add eligible voters by NIM

### For Voters

1. Navigate to the main page `/index.php`
2. Enter your 9-digit NIM
3. Select your preferred candidate
4. Submit your vote
5. View results after voting period ends

## Project Structure

```
TECVotingWeb/
├── index.html              # Landing page
├── index.php               # Voter login page
├── voting-system.php       # Voter authentication handler
├── ballet.php              # Ballot/voting page
├── cal_vote.php            # Vote submission handler
├── voted.php               # Post-vote confirmation page
│
├── admin/
│   ├── index.php           # Admin login page
│   ├── admin_welcome.php   # Admin authentication handler
│   ├── admin-panel.php     # Admin dashboard
│   ├── candidates.php      # Candidates list
│   ├── cand-register.php   # Add candidate
│   ├── cand-update.php     # Edit candidate
│   ├── can-delete.php      # Delete candidate
│   ├── voters.php          # Voters list
│   ├── voter-add.php       # Add voter
│   ├── voter-delete.php    # Delete voter
│   ├── voting-title.php    # Set election title
│   ├── voting_schedule.php # Set voting schedule
│   ├── reset_voting.php    # Manual vote reset
│   ├── history.php         # Election history
│   └── candidate_photos/   # Uploaded candidate photos
│
├── includes/
│   ├── db_config.php       # Database configuration
│   ├── admin_header.php    # Shared admin header
│   ├── admin_footer.php    # Shared admin footer
│   ├── menu.php            # Admin sidebar menu
│   ├── all-select-data.php # Common data queries
│   ├── check_voting_status.php  # Auto-reset logic
│   ├── candidate_result.php     # Chart data generator
│   ├── admin-logout.php    # Admin logout handler
│   └── user-logout.php     # Voter logout handler
│
├── css/
│   ├── style.css           # Main stylesheet
│   └── all.min.css         # Font Awesome icons
│
├── js/
│   ├── script.js           # UI interactions
│   └── chart.js            # Chart.js library
│
├── res/                    # Static resources
└── webfonts/               # Font files
```

## Security Features

- **Prepared Statements** - All database queries use parameterized queries to prevent SQL injection
- **Session Authentication** - Admin and voter sessions are validated on each protected page
- **Input Validation** - NIM format validation (9 digits only)
- **XSS Prevention** - Output escaping with `htmlspecialchars()`
- **Access Control** - Admin pages require authentication

## Auto-Reset Feature

When the voting end date passes:
1. Election results are automatically saved to `election_history` table
2. All voter `vote` status is reset to 0
3. All candidate `votes` are reset to 0
4. The system is ready for the next election

## License

This project is for educational purposes.

## Support

For issues or questions, please contact the system administrator.

---

**TEC Online Voting System** © 2025
