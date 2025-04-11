const app = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxTy8SEdp91qYJET71cto0yhCuoA0q-y5AJkVIKIKzwgLpT_dIgGA-AesxiQRldaYyivg/exec',
  chart: null,
  pendingTransactions: [],
  
  init() {
    this.setupCategories();
    this.setupServiceWorker();
    this.setupEventListeners();
    this.loadInitialData();
  },

  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('sw.js')
        .then(() => console.log('SW Registered'))
        .catch(console.error);
    }
  },

  setupEventListeners() {
    document.getElementById('type').addEventListener('change', () => this.setupCategories());
    document.addEventListener('online', () => this.syncPendingTransactions());
  },

  setupCategories() {
    const categories = {
      'Доход': ['Зарплата', 'Аванс', 'Инвестиции', 'Другое'],
      'Расход': ['Жильё', 'Транспорт', 'Еда', 'Одежда', 'Развлечения', 'Связь', 'Личные', 'Другое']
    };
    
    const type = document.getElementById('type').value;
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = categories[type].map(c => `<option>${c}</option>`).join('');
  },

  async addTransaction() {
    const amountInput = document.getElementById('amount');
    const button = document.querySelector('button');
    
    try {
      button.disabled = true;
      const amount = parseFloat(amountInput.value);
      
      if (!amount || amount <= 0) {
        throw new Error('Введите корректную сумму');
      }

      const transaction = {
        date: new Date().toISOString(),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        amount: amount.toFixed(2)
      };

      if (!navigator.onLine) {
        this.storePendingTransaction(transaction);
        throw new Error('Оффлайн. Данные сохранены локально');
      }

      await this.sendToServer(transaction);
      amountInput.value = '';
      this.showSuccess(button);
      this.loadStats();
    } catch (error) {
      this.showError(error.message);
    } finally {
      button.disabled = false;
    }
  },

  async sendToServer(data) {
    const response = await fetch(this.SCRIPT_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Ошибка сохранения');
  },

  storePendingTransaction(transaction) {
    const pending = JSON.parse(localStorage.getItem('pendingTransactions')) || [];
    pending.push(transaction);
    localStorage.setItem('pendingTransactions', JSON.stringify(pending));
    this.pendingTransactions = pending;
  },

  async syncPendingTransactions() {
    const pending = JSON.parse(localStorage.getItem('pendingTransactions')) || [];
    if (pending.length === 0) return;

    try {
      await Promise.all(pending.map(t => this.sendToServer(t)));
      localStorage.removeItem('pendingTransactions');
      this.pendingTransactions = [];
      this.loadStats();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  },

  async loadStats() {
    try {
      const period = document.getElementById('period').value;
      const response = await fetch(`${this.SCRIPT_URL}?period=${period}`);
      const data = await response.json();
      
      this.updateTotals(data);
      this.renderChart(data);
      this.renderCategoryList(data);
    } catch (error) {
      this.showError('Ошибка загрузки данных');
    }
  },

  updateTotals(data) {
    const totals = data.reduce((acc, row) => {
      acc[row[1]] += parseFloat(row[3]);
      return acc;
    }, {'Доход': 0, 'Расход': 0});

    document.getElementById('total-income').textContent = `${this.formatCurrency(totals['Доход'])} ₽`;
    document.getElementById('total-expense').textContent = `${this.formatCurrency(totals['Расход'])} ₽`;
  },

  renderChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categories = this.groupByCategory(data);
    
    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: ['#34C759', '#007AFF', '#8B4513', '#FFD700', '#1F9038', '#2DAE4E']
        }]
      },
      options: {
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${this.formatCurrency(ctx.raw)} ₽`
            }
          }
        }
      }
    });
  },

  groupByCategory(data) {
    return data.reduce((acc, row) => {
      const category = row[2];
      acc[category] = (acc[category] || 0) + parseFloat(row[3]);
      return acc;
    }, {});
  },

  formatCurrency(amount) {
    return parseFloat(amount).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  showSuccess(button) {
    button.textContent = '✅ Успешно!';
    setTimeout(() => {
      button.textContent = 'Добавить';
    }, 1500);
  },

  showError(message) {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.textContent = message;
    document.getElementById('mainScreen').appendChild(error);
    setTimeout(() => error.remove(), 3000);
  },

  showScreen(screenId, event) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');
  }
};

// Инициализация
app.init();