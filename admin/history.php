<?php
/**
 * Election History Page
 * TEC Voting System - Admin Panel
 */
$page_title = 'Election History';
$extra_css = '<style>
    .history-container { padding: 20px 0; }
    .history-card {
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        margin-bottom: 20px;
        overflow: hidden;
    }
    .history-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
    }
    .history-header h3 { margin: 0; font-size: 1.3em; }
    .history-header .date-range { font-size: 0.85em; opacity: 0.9; margin-top: 5px; }
    .history-body { padding: 20px; }
    .winner-section {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 15px;
        flex-wrap: wrap;
    }
    .winner-photo {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #ffd700;
    }
    .winner-info h4 { margin: 0 0 5px 0; color: #333; }
    .winner-info .badge {
        background: #ffd700;
        color: #333;
        padding: 3px 10px;
        border-radius: 15px;
        font-size: 0.8em;
        font-weight: bold;
    }
    .winner-info p { margin: 5px 0; color: #666; font-size: 0.9em; }
    .winner-votes { font-size: 1.5em; font-weight: bold; color: #667eea; }
    .stats-row { display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
    .stat-box {
        flex: 1;
        min-width: 100px;
        background: #f0f4ff;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
    }
    .stat-box .number { font-size: 1.4em; font-weight: bold; color: #667eea; }
    .stat-box .label { font-size: 0.8em; color: #666; }
    .toggle-candidates {
        background: none;
        border: 1px solid #667eea;
        color: #667eea;
        padding: 5px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.85em;
    }
    .toggle-candidates:hover { background: #667eea; color: white; }
    .candidates-detail { display: none; margin-top: 15px; }
    .candidates-detail.show { display: block; }
    .candidates-list h5 { margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .candidate-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    .candidate-row:last-child { border-bottom: none; }
    .candidate-row img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    .candidate-row .rank {
        width: 25px;
        height: 25px;
        background: #e0e0e0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8em;
        font-weight: bold;
    }
    .candidate-row .rank.first { background: #ffd700; }
    .candidate-row .rank.second { background: #c0c0c0; }
    .candidate-row .rank.third { background: #cd7f32; color: white; }
    .candidate-row .name { flex: 1; }
    .candidate-row .votes { font-weight: bold; color: #667eea; }
    .no-history { text-align: center; padding: 50px; color: #666; }
    .no-history i { font-size: 4em; color: #ddd; margin-bottom: 15px; display: block; }
</style>';
include '../includes/admin_header.php';
?>

<div class="heading"><h2><i class="fa-solid fa-clock-rotate-left"></i> Election History</h2></div>

<div class="history-container">
<?php
// Get all election history
$history_query = "SELECT * FROM election_history ORDER BY saved_at DESC";
$history_result = mysqli_query($con, $history_query);

if ($history_result && mysqli_num_rows($history_result) > 0) {
    $election_num = mysqli_num_rows($history_result);
    while ($history = mysqli_fetch_assoc($history_result)) {
        $candidates_data = json_decode($history['candidates_data'], true);
        $participation_rate = $history['total_voters'] > 0 
            ? round(($history['voters_participated'] / $history['total_voters']) * 100, 1) 
            : 0;
        ?>
        <div class="history-card">
            <div class="history-header">
                <h3><?php echo htmlspecialchars($history['election_title']); ?></h3>
                <div class="date-range">
                    <i class="fa-solid fa-calendar"></i> 
                    <?php 
                    echo date('M d, Y H:i', strtotime($history['start_date'])); 
                    echo ' - ';
                    echo date('M d, Y H:i', strtotime($history['end_date']));
                    ?>
                </div>
            </div>
            <div class="history-body">
                <div class="winner-section">
                    <img src="<?php echo htmlspecialchars($history['winner_photo']); ?>" 
                         alt="Winner Photo" class="winner-photo"
                         onerror="this.src='../res/user3.jpg'">
                    <div class="winner-info">
                        <span class="badge"><i class="fa-solid fa-crown"></i> WINNER</span>
                        <h4><?php echo htmlspecialchars($history['winner_name']); ?></h4>
                        <p>NIM: <?php echo htmlspecialchars($history['winner_nim']); ?></p>
                        <p><?php echo htmlspecialchars($history['winner_major']); ?> - Batch <?php echo htmlspecialchars($history['winner_batch']); ?></p>
                    </div>
                    <div class="winner-votes">
                        <?php echo number_format($history['winner_votes']); ?> votes
                    </div>
                </div>
                
                <div class="stats-row">
                    <div class="stat-box">
                        <div class="number"><?php echo number_format($history['total_votes']); ?></div>
                        <div class="label">Total Votes</div>
                    </div>
                    <div class="stat-box">
                        <div class="number"><?php echo number_format($history['voters_participated']); ?></div>
                        <div class="label">Voters Participated</div>
                    </div>
                    <div class="stat-box">
                        <div class="number"><?php echo number_format($history['total_voters']); ?></div>
                        <div class="label">Total Registered</div>
                    </div>
                    <div class="stat-box">
                        <div class="number"><?php echo $participation_rate; ?>%</div>
                        <div class="label">Participation Rate</div>
                    </div>
                </div>
                
                <?php if ($candidates_data && count($candidates_data) > 1): ?>
                <button class="toggle-candidates" onclick="toggleCandidates(<?php echo $election_num; ?>)">
                    <i class="fa-solid fa-users"></i> View All Candidates
                </button>
                
                <div class="candidates-detail" id="candidates-<?php echo $election_num; ?>">
                    <div class="candidates-list">
                        <h5>All Candidates Results</h5>
                        <?php 
                        $rank = 1;
                        foreach ($candidates_data as $cand): 
                            $rank_class = '';
                            if ($rank == 1) $rank_class = 'first';
                            else if ($rank == 2) $rank_class = 'second';
                            else if ($rank == 3) $rank_class = 'third';
                        ?>
                        <div class="candidate-row">
                            <span class="rank <?php echo $rank_class; ?>"><?php echo $rank; ?></span>
                            <img src="<?php echo htmlspecialchars($cand['photo']); ?>" 
                                 alt="<?php echo htmlspecialchars($cand['name']); ?>"
                                 onerror="this.src='../res/user3.jpg'">
                            <div class="name">
                                <strong><?php echo htmlspecialchars($cand['name']); ?></strong>
                                <br><small><?php echo htmlspecialchars($cand['major']); ?> - Batch <?php echo htmlspecialchars($cand['batch']); ?></small>
                            </div>
                            <div class="votes"><?php echo number_format($cand['votes']); ?> votes</div>
                        </div>
                        <?php 
                            $rank++;
                        endforeach; 
                        ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
        $election_num--;
    }
} else {
    ?>
    <div class="no-history">
        <i class="fa-solid fa-inbox"></i>
        <h3>No Election History</h3>
        <p>Past election results will appear here after elections end.</p>
    </div>
    <?php
}
?>
</div>

<?php
$extra_js = "<script>
function toggleCandidates(id) {
    var element = document.getElementById('candidates-' + id);
    element.classList.toggle('show');
}
</script>";
include '../includes/admin_footer.php';
?>
