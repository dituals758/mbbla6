const app = (() => {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwj94YEJ7CKe_cEGTngykKzTg9W1F9ZIheIeXvbJBJOsHBGAh1dhlAUie60zmEPffCv8Q/exec';
    
    const categories = {
        'Доход': ['Зарплата', 'Аванс', 'Инвестиции', 'Другое'],
        'Расход': ['Жильё', 'Транспорт', 'Еда', 'Одежда', 'Развлечения', 'Связь', 'Личные', 'Другое']
    };

    function init() {
        updateCategories();
        document.getElementById('type').addEventListener('change', updateCategories);
        
        // Блокировка масштабирования
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchstart', (e) => {
            if(e.touches.length > 1) e.preventDefault();
        }, { passive: false });

        // Инициализация Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    }

    function updateCategories() {
        const type = document.getElementById('type').value;
        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = categories[type].map(c => `<option>${c}</option>`).join('');
    }

    async function addTransaction() {
        const amountInput = document.getElementById('amount');
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'Введите сумму';
        
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
            errorMessage.textContent = amountInput.value ? 
                'Сумма должна быть больше нуля' : 
                'Введите сумму';
            
            amountInput.parentNode.insertBefore(errorMessage, amountInput.nextSibling);
            errorMessage.style.display = 'block';
            amountInput.focus();
            return;
        }

        const transaction = {
            date: new Date().toISOString(),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            amount: amountInput.value
        };

        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(transaction)
            });
            amountInput.value = '';
        } catch (error) {
            alert('Ошибка сохранения: ' + error.message);
        }
    }

    async function loadStats() {
        try {
            const response = await fetch(SCRIPT_URL);
            const data = await response.json();
            document.getElementById('stats').innerHTML = JSON.stringify(data);
        } catch (error) {
            alert('Ошибка загрузки статистики');
        }
    }

    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
    }

    return {
        init,
        addTransaction,
        loadStats,
        showScreen
    };
})();

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', app.init);