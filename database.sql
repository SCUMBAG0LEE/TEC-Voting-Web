-- SQL to create the new database tables
-- Run this in your MySQL database

-- =====================================================
-- VOTERS TABLE
-- =====================================================
-- First, you may want to backup or drop the old register table
-- DROP TABLE IF EXISTS register;

-- Create the new voters table
CREATE TABLE IF NOT EXISTS voters (
    no INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(9) NOT NULL UNIQUE,
    vote TINYINT(1) DEFAULT 0
);

-- Note: The 'no' column auto-increments
-- The 'nim' column must be unique and is the student ID (9 digits)
-- The 'vote' column: 0 = not voted, 1 = voted

-- Example: Insert voters manually
-- INSERT INTO voters (nim) VALUES ('535220092');


-- =====================================================
-- CANDIDATES TABLE (for Presidential Election)
-- =====================================================
-- Drop old candidate table if exists
-- DROP TABLE IF EXISTS candidate;

CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    nim VARCHAR(9) NOT NULL UNIQUE,
    major VARCHAR(100) NOT NULL,
    batch INT NOT NULL,
    photo VARCHAR(255),
    votes INT DEFAULT 0
);

-- Note: 
-- 'id' auto-increments
-- 'name' is the candidate's full name
-- 'nim' is the candidate's student ID (9 digits, must be unique)
-- 'major' is their major/faculty
-- 'batch' is their enrollment year (e.g., 2022)
-- 'photo' is the path to their photo
-- 'votes' counts how many votes they received

-- Example: Insert candidates
-- INSERT INTO candidates (name, nim, major, batch, photo) VALUES 
-- ('John Doe', '535220001', 'Computer Science', 2022, 'candidate_photos/john.jpg'),
-- ('Jane Smith', '705210002', 'Business Management', 2021, 'candidate_photos/jane.jpg');


-- =====================================================
-- NOTES
-- =====================================================
-- The old tables (register, candidate, can_position) are no longer used
-- You can drop them after backing up:
-- DROP TABLE IF EXISTS register;
-- DROP TABLE IF EXISTS candidate;  
-- DROP TABLE IF EXISTS can_position;


-- =====================================================
-- UPDATE VOTING TABLE (add last_reset column)
-- =====================================================
-- Run this to add the last_reset column for auto-reset feature
ALTER TABLE voting ADD COLUMN last_reset DATETIME DEFAULT NULL;

-- The last_reset column tracks when voters were last reset
-- This prevents multiple resets for the same election end date


-- =====================================================
-- ELECTION HISTORY TABLE
-- =====================================================
-- This table stores past election results
CREATE TABLE IF NOT EXISTS election_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    election_title VARCHAR(255) NOT NULL,
    winner_name VARCHAR(100) NOT NULL,
    winner_nim VARCHAR(9) NOT NULL,
    winner_major VARCHAR(100),
    winner_batch INT,
    winner_votes INT DEFAULT 0,
    winner_photo VARCHAR(255),
    total_votes INT DEFAULT 0,
    total_voters INT DEFAULT 0,
    voters_participated INT DEFAULT 0,
    start_date DATETIME,
    end_date DATETIME,
    candidates_data TEXT,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Note:
-- 'election_title' - The title of the election
-- 'winner_*' fields - Information about the winning candidate
-- 'total_votes' - Sum of all votes cast
-- 'total_voters' - Number of registered voters at the time
-- 'voters_participated' - Number of voters who actually voted
-- 'start_date' / 'end_date' - When the election was scheduled
-- 'candidates_data' - JSON containing all candidates and their results
-- 'saved_at' - When this record was saved
