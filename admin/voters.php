<?php
/**
 * Voters Management Page
 * TEC Voting System - Admin Panel
 */
$page_title = 'Voters';
$extra_css = '<style>
    .voted-yes { color: green; font-weight: bold; }
    .voted-no { color: gray; }
    .add-voter-form { margin-bottom: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 5px; }
    .add-voter-form input { padding: 0.5rem; margin-right: 0.5rem; }
    .add-voter-form button { padding: 0.5rem 1rem; }
    .msg-success { color: green; padding: 0.5rem; background: #d4edda; border-radius: 5px; margin-bottom: 1rem; }
    .msg-error { color: red; padding: 0.5rem; background: #f8d7da; border-radius: 5px; margin-bottom: 1rem; }
</style>';
include '../includes/admin_header.php';

// Display flash messages
if (isset($_SESSION['message'])) {
    $msg_class = $_SESSION['msg_type'] == 'success' ? 'msg-success' : 'msg-error';
    echo "<div class='{$msg_class}'>{$_SESSION['message']}</div>";
    unset($_SESSION['message']);
    unset($_SESSION['msg_type']);
}
?>

<div class="heading"><h2>Voters Management</h2></div>

<!-- Quick Add Voter Form -->
<div class="add-voter-form">
    <form action="voter-add.php" method="POST" style="display:inline;">
        <input type="text" name="nim" placeholder="Enter 9-digit NIM" 
               pattern="[0-9]{9}" minlength="9" maxlength="9" required>
        <button type="submit" class="verify">
            <i class="fa-solid fa-plus"></i> Add Voter
        </button>
    </form>
</div>

<table class="table">
    <thead>
        <th>No.</th>
        <th>NIM</th>
        <th>Vote Status</th>
        <th>Action</th>               
    </thead>
    <tbody>
        <?php
        $query = "SELECT * FROM voters ORDER BY no ASC";
        $data = mysqli_query($con, $query);
        
        while ($result = mysqli_fetch_assoc($data)) {
            $vote_status = $result['vote'] == 1 
                ? "<span class='voted-yes'>Voted</span>" 
                : "<span class='voted-no'>Not Voted</span>";
            echo "<tr>
                <td>{$result['no']}</td>
                <td>{$result['nim']}</td>
                <td>{$vote_status}</td>
                <td>
                    <a href='voter-delete.php?nim={$result['nim']}' class='del' onClick='return delconfirm()'>
                        <i class='fa-solid fa-trash-can'></i> Delete
                    </a>
                </td>
            </tr>";
        }
                      ?>
               </tbody>
           </table>

<?php
$extra_js = "<script>
    function delconfirm() {
        return confirm('Delete this Voter?');
    }
</script>";
include '../includes/admin_footer.php';
?>