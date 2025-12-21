<?php
/**
 * Candidates Management Page
 * TEC Voting System - Admin Panel
 */
$page_title = 'Candidates';
$extra_css = '<style>
    .add-btn { text-decoration: none; }
    td img { max-width: 80px; max-height: 80px; border-radius: 5px; }
</style>';
include '../includes/admin_header.php';
?>

<div class="heading">
    <a href="cand-register.php" class="add-btn">+ Add</a>
    <h2>Presidential Candidates</h2>
</div>

<table class="table">
    <thead>
        <th>Photo</th>
        <th>Name</th>
        <th>NIM</th>
        <th>Major/Faculty</th>
        <th>Batch</th>
        <th>Votes</th>
        <th>Action</th>
    </thead>
    <tbody>
    <?php
    $query = "SELECT * FROM candidates ORDER BY id ASC";
    $data = mysqli_query($con, $query);
    
    while ($result = mysqli_fetch_assoc($data)) {
        echo "<tr>
            <td><a href='{$result['photo']}'><img src='{$result['photo']}'></a></td>
            <td>{$result['name']}</td>
            <td>{$result['nim']}</td>
            <td>{$result['major']}</td>
            <td>{$result['batch']}</td>
            <td>{$result['votes']}</td>
            <td>
                <a href='cand-update.php?id={$result['id']}' class='edit'>
                    <i class='fa-solid fa-pen-to-square'></i> Edit
                </a>
                <a href='can-delete.php?id={$result['id']}' class='del' onClick='return delconfirm()'>
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
        return confirm('Delete this Candidate?');
    }
</script>";
include '../includes/admin_footer.php';
?>