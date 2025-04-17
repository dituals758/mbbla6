document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('transactionForm');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const errorDiv = document.getElementById('error');
    const transactionsList = document.getElementById('transactionsList');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const description = descriptionInput.value.trim();
        const amount = parseFloat(amountInput.value);

        if (description && !isNaN(amount)) {
            addTransaction(description, amount);
        } else {
            errorDiv.textContent = 'Please enter valid data.';
        }
    });

    function addTransaction(description, amount) {
        // Sanitize input
        const sanitizedDescription = encodeURIComponent(description);

        fetch('https://script.google.com/macros/s/your-script-id/exec', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `description=${sanitizedDescription}&amount=${amount}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                displayTransaction(description, amount);
                descriptionInput.value = '';
                amountInput.value = '';
                errorDiv.textContent = '';
            } else {
                errorDiv.textContent = data.message;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorDiv.textContent = 'An error occurred. Please try again later.';
        });
    }

    function displayTransaction(description, amount) {
        const listItem = document.createElement('li');
        listItem.textContent = `${description}: $${amount.toFixed(2)}`;
        transactionsList.appendChild(listItem);
    }

    // Fetch transactions on load
    fetchTransactions();
});

function fetchTransactions() {
    fetch('https://script.google.com/macros/s/your-script-id/exec?action=getTransactions')
    .then(response => response.json())
    .then(data => {
        data.transactions.forEach(transaction => {
            displayTransaction(transaction.description, transaction.amount);
        });
    })
    .catch(error => {
        console.error('Error fetching transactions:', error);
    });
}