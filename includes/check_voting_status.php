<?php
/**
 * Check if voting has ended and reset voters if needed
 * This file should be included in pages that need to check voting status
 */

require_once __DIR__ . '/db_config.php';

// Get voting schedule
$voting_query = "SELECT * FROM voting";
$voting_data = mysqli_query($con, $voting_query);
$voting_result = mysqli_fetch_assoc($voting_data);

$vot_end_date = $voting_result['vot_end_date'];
$vot_start_date = $voting_result['vot_start_date'] ?? null;
$vot_title = $voting_result['voting_title'] ?? 'Election';

// Check if voting has ended
if ($vot_end_date != null && $vot_end_date != '') {
    $end_timestamp = strtotime($vot_end_date);
    $current_timestamp = time();
    
    // If voting has ended, check if we need to reset
    if ($current_timestamp > $end_timestamp) {
        // Check if there's a flag indicating we already reset for this election
        $last_reset = $voting_result['last_reset'] ?? null;
        
        // If last_reset doesn't match the current end date, we need to reset
        if ($last_reset != $vot_end_date) {
            
            // ========== SAVE ELECTION HISTORY BEFORE RESET ==========
            
            // Get total voters and voters who voted
            $total_voters_query = "SELECT COUNT(*) as total FROM voters";
            $total_voters_result = mysqli_query($con, $total_voters_query);
            $total_voters = mysqli_fetch_assoc($total_voters_result)['total'];
            
            $voted_count_query = "SELECT COUNT(*) as voted FROM voters WHERE vote=1";
            $voted_count_result = mysqli_query($con, $voted_count_query);
            $voted_count = mysqli_fetch_assoc($voted_count_result)['voted'];
            
            // Get total votes cast
            $total_votes_query = "SELECT SUM(votes) as total_votes FROM candidates";
            $total_votes_result = mysqli_query($con, $total_votes_query);
            $total_votes = mysqli_fetch_assoc($total_votes_result)['total_votes'] ?? 0;
            
            // Get all candidates with their votes for this election
            $candidates_query = "SELECT * FROM candidates ORDER BY votes DESC";
            $candidates_result = mysqli_query($con, $candidates_query);
            
            // Get the winner (candidate with most votes)
            $winner_query = "SELECT * FROM candidates ORDER BY votes DESC LIMIT 1";
            $winner_result = mysqli_query($con, $winner_query);
            $winner = mysqli_fetch_assoc($winner_result);
            
            if ($winner && $total_votes > 0) {
                // Build candidates JSON for history
                mysqli_data_seek($candidates_result, 0);
                $candidates_data = [];
                while ($cand = mysqli_fetch_assoc($candidates_result)) {
                    $candidates_data[] = [
                        'name' => $cand['name'],
                        'nim' => $cand['nim'],
                        'major' => $cand['major'],
                        'batch' => $cand['batch'],
                        'votes' => (int)$cand['votes'],
                        'photo' => $cand['photo']
                    ];
                }
                $candidates_json = json_encode($candidates_data);
                
                // Insert into election history using prepared statement
                $history_insert = "INSERT INTO election_history 
                    (election_title, winner_name, winner_nim, winner_major, winner_batch, winner_votes, winner_photo, 
                     total_votes, total_voters, voters_participated, start_date, end_date, candidates_data, saved_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
                $stmt = mysqli_prepare($con, $history_insert);
                mysqli_stmt_bind_param($stmt, "sssssissiisss", 
                    $vot_title, 
                    $winner['name'], 
                    $winner['nim'], 
                    $winner['major'], 
                    $winner['batch'], 
                    $winner['votes'], 
                    $winner['photo'],
                    $total_votes, 
                    $total_voters, 
                    $voted_count, 
                    $vot_start_date, 
                    $vot_end_date, 
                    $candidates_json
                );
                mysqli_stmt_execute($stmt);
                mysqli_stmt_close($stmt);
            }
            
            // ========== END SAVE HISTORY ==========
            
            // Reset all voters' vote status
            $reset_voters = "UPDATE voters SET vote=0";
            mysqli_query($con, $reset_voters);
            
            // Reset all candidates' votes to 0
            $reset_candidates = "UPDATE candidates SET votes=0";
            mysqli_query($con, $reset_candidates);
            
            // Update the last_reset to current end date so we don't reset again
            $update_reset = "UPDATE voting SET last_reset = ?";
            $stmt2 = mysqli_prepare($con, $update_reset);
            mysqli_stmt_bind_param($stmt2, "s", $vot_end_date);
            mysqli_stmt_execute($stmt2);
            mysqli_stmt_close($stmt2);
        }
    }
}
?>
