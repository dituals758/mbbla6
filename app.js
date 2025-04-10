// Конфигурация Google Sheets
const scriptURL = 'https://script.google.com/macros/s/AKfycbzz9Sawvd12eWPW2v1dxadalZQ1GIWEfuTgrJ1VqiTBKzOfLY52PeQlU05OhVepd7C1/exec'; // Замените на ваш URL
const categories = {
    expense: ['Еда', 'Одежда', 'Дом', 'Транспорт', 'Связь', 'Другое'],
    income: ['Зарплата', 'Аванс', '% по вкладу', 'Другое']
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Установка текущей даты по умолчанию
    document.getElementById('date').valueAsDate = new Date();
    
    // Инициализация категорий
    updateCategories();
    
    // Обработчики событий
    setupEventListeners();
    
    // Загрузка данных
    loadTransactions();
});

function setupEventListeners() {
    // Переключение между расходами и доходами
    document.querySelectorAll('.segment').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.segment').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateCategories();
        });
    });
    
    // Переключение между вкладками
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tab}-tab`).classList.add('active');
            
            if (tab === 'stats') {
                updateStats();
            }
        });
    });
    
    // Сохранение транзакции
    document.getElementById('save-btn').addEventListener('click', saveTransaction);
    
    // Изменение периода статистики
    document.getElementById('stats-period').addEventListener('change', updateStats);
}

function updateCategories() {
    const type = document.querySelector('.segment.active').getAttribute('data-type');
    const categorySelect = document.getElementById('category');
    
    categorySelect.innerHTML = '';
    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

async function saveTransaction() {
    const type = document.querySelector('.segment.active').getAttribute('data-type');
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value || '';
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Пожалуйста, введите корректную сумму');
      return;
    }
    
    if (!date) {
      alert('Пожалуйста, укажите дату');
      return;
    }
    
    const data = {
      type,
      amount: parseFloat(amount),
      category,
      date,
      description
    };
    
    try {
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        // Добавляем режим CORS
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error('Ошибка сети');
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        alert('Данные сохранены');
        document.getElementById('amount').value = '';
        document.getElementById('description').value = '';
        loadTransactions();
      } else {
        throw new Error(result.message || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Произошла ошибка: ${error.message}`);
    }
  }

async function loadTransactions() {
    try {
        const response = await fetch(`${scriptURL}?action=getTransactions`);
        const transactions = await response.json();
        
        const list = document.getElementById('transactions-list');
        list.innerHTML = '';
        
        if (transactions.length === 0) {
            list.innerHTML = '<p>Нет данных</p>';
            return;
        }
        
        transactions.forEach(trans => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            
            const left = document.createElement('div');
            left.innerHTML = `
                <div>${trans.category}</div>
                <div class="transaction-category">${formatDate(trans.date)} ${trans.description ? '· ' + trans.description : ''}</div>
            `;
            
            const right = document.createElement('div');
            right.className = `transaction-amount ${trans.type}`;
            right.textContent = `${trans.type === 'expense' ? '-' : '+'}${trans.amount} ₽`;
            
            item.appendChild(left);
            item.appendChild(right);
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactions-list').innerHTML = '<p>Ошибка загрузки данных</p>';
    }
}

async function updateStats() {
    const period = document.getElementById('stats-period').value;
    
    try {
        const response = await fetch(`${scriptURL}?action=getStats&period=${period}`);
        const stats = await response.json();
        
        document.getElementById('total-income').textContent = `${stats.totalIncome} ₽`;
        document.getElementById('total-expense').textContent = `${stats.totalExpense} ₽`;
        document.getElementById('total-balance').textContent = `${stats.totalIncome - stats.totalExpense} ₽`;
        
        // Здесь можно добавить отрисовку графиков с использованием Chart.js или аналогичной библиотеки
        // Для простоты просто выведем текстовую информацию
        document.getElementById('expense-chart').innerHTML = '<p>График расходов по категориям</p>';
        document.getElementById('income-chart').innerHTML = '<p>График доходов по категориям</p>';
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}