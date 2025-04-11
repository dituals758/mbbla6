const app = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxTy8SEdp91qYJET71cto0yhCuoA0q-y5AJkVIKIKzwgLpT_dIgGA-AesxiQRldaYyivg/exec',
    
    init: function() {
      this.setupCategories();
      document.getElementById('type').addEventListener('change', () => this.setupCategories());
      document.addEventListener('DOMContentLoaded', () => {
        this.setupServiceWorker();
        this.setupUpdateChecks();
      });
    },
  
    setupServiceWorker: function() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
          .catch(err => console.error('SW error:', err));
      }
    },
  
    setupCategories: function() {
      const categories = {
        'Доход': ['Зарплата', 'Аванс', 'Инвестиции', 'Другое'],
        'Расход': ['Жильё', 'Транспорт', 'Еда', 'Одежда', 'Развлечения', 'Связь', 'Личные', 'Другое']
      };
      
      const type = document.getElementById('type').value;
      document.getElementById('category').innerHTML = categories[type]
        .map(c => `<option>${c}</option>`)
        .join('');
    },
  
    addTransaction: async function() {
      const amountInput = document.getElementById('amount');
      const submitButton = document.querySelector('button');
      
      try {
        // Блокировка кнопки
        submitButton.disabled = true;
        submitButton.textContent = 'Добавляем...';
        submitButton.style.opacity = '0.7';

        if (!this.validateInput(amountInput.value)) {
          this.showError('Некорректная сумма');
          return;
        }

        const transaction = {
          date: new Date().toISOString(),
          type: document.getElementById('type').value,
          category: document.getElementById('category').value,
          amount: parseFloat(amountInput.value).toFixed(2)
        };

        await this.sendData(transaction);
        amountInput.value = '';
        
        // Успешное добавление
        submitButton.textContent = '✅ Добавлено!';
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        this.showError(error.message);
      } finally {
        // Всегда разблокируем кнопку
        submitButton.disabled = false;
        submitButton.textContent = 'Добавить';
        submitButton.style.opacity = '1';
      }
    },
  
    validateInput: function(value) {
      return value && !isNaN(value) && parseFloat(value) > 0;
    },
  
    sendData: async function(data) {
      const response = await fetch(this.SCRIPT_URL, {
        method: 'POST',
        headers: { // Добавлен заголовок Content-Type
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Ошибка сохранения');
      }
    },
  
    showError: function(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      
      document.getElementById('amount')
        .insertAdjacentElement('afterend', errorDiv);
    },

    showScreen: function(screenId, event) {
      // Скрыть все экраны
      document.querySelectorAll('.screen').forEach(s => {
          s.classList.remove('active');
          s.style.opacity = '0';
      });
      
      // Показать выбранный экран
      const activeScreen = document.getElementById(screenId);
      activeScreen.classList.add('active');
      setTimeout(() => activeScreen.style.opacity = '1', 50);
      
      // Обновить навигацию
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      event.currentTarget.classList.add('active');
  },

  setupUpdateChecks: function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Проверка при загрузке приложения
        registration.update();
        
        // Отправляем версию в Service Worker
        this.getCacheVersion();
      });
    }
  },

  getCacheVersion: function() {
    if ('serviceWorker' in navigator) {
      const channel = new MessageChannel();
      navigator.serviceWorker.controller.postMessage(
        'getVersion',
        [channel.port2]
      );
      
      channel.port1.onmessage = (event) => {
        this.currentVersion = event.data.version;
      };
    }
  },
  loadStats: async function() {
    try {
      const period = document.getElementById('period').value;
      const response = await fetch(`${this.SCRIPT_URL}?period=${period}`);
      const stats = await response.json();
      
      this.updateTotalCards(stats.total);
      this.renderCategoryChart(stats.categories);
      this.renderCategoryList(stats.categories);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  },

  updateTotalCards: function(totals) {
    document.getElementById('total-income').textContent = 
      `${this.formatCurrency(totals['Доход'] || 0)} ₽`;
    document.getElementById('total-expense').textContent = 
      `${this.formatCurrency(totals['Расход'] || 0)} ₽`;
  },

  renderCategoryChart: function(categories) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Уничтожаем предыдущий график
    if(this.chart) this.chart.destroy();
    
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categories['Расход']),
        datasets: [{
          data: Object.values(categories['Расход']),
          backgroundColor: [
            '#34C759', '#2DAE4E', '#269F43', '#1F9038', '#18812D'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  },

  renderCategoryList: function(categories) {
    const container = document.getElementById('categoryStats');
    const maxAmount = Math.max(...Object.values(categories['Расход']));
    
    container.innerHTML = Object.entries(categories['Расход'])
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => `
        <div class="category-item">
          <div class="category-name">${category}</div>
          <div class="category-progress">
            <div class="category-progress-bar" 
                 style="width: ${(amount / maxAmount) * 100}%"></div>
          </div>
          <div class="category-amount">${this.formatCurrency(amount)} ₽</div>
        </div>
      `).join('');
  },

  formatCurrency: function(amount) {
    return parseFloat(amount || 0).toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  };
  
  // Инициализация
  app.init();