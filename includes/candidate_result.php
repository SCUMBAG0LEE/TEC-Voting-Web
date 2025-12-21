<?php
        // Get all candidates for the single presidential election
        $can_query="SELECT * FROM candidates ORDER BY id ASC";
        $can_data=mysqli_query($con,$can_query);

        echo "ctx[0] = document.getElementsByClassName('myChart')[0].getContext('2d');
            myChart[0] = new Chart(ctx[0], {
                type: 'bar',
                data: {
                    labels: ["; 
                    
                    // First pass: get names
                    while($can_row=mysqli_fetch_assoc($can_data))
                    {
                        echo "'$can_row[name]',";
                    }
             

                    echo "],
                    datasets: [{
                        label: 'Presidential Election',
                        data: [";
                        // Second pass: get votes
                        $can_query2="SELECT * FROM candidates ORDER BY id ASC";
                        $can_data2=mysqli_query($con,$can_query2);
                        while($can_row2=mysqli_fetch_assoc($can_data2))
                        {
                            echo "$can_row2[votes],";
                        }
                        echo" ],
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.2)'
                        ],
                        borderColor: [
                            'rgba(54, 162, 235, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
            });
        ";
    ?>