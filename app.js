const app = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxTy8SEdp91qYJET71cto0yhCuoA0q-y5AJkVIKIKzwgLpT_dIgGA-AesxiQRldaYyivg/exec',
    chart: null,
    throttleTimer: null,
  
    init() {
      this.setupEventListeners();
      this.setupServiceWorker();
      this.setupCategories();
    },
  
    setupEventListeners() {
      document.addEventListener('DOMContentLoaded', () => {
        const typeSelect = document.getElementById('type');
        const periodSelect = document.getElementById('period');
  
        if (typeSelect) {
          typeSelect.addEventListener('change', () => this.setupCategories());
        }
  
        if (periodSelect) {
          periodSelect.addEventListener('change', () => this.throttleLoadStats());
        }
  
        document.querySelector('button')?.addEventListener('click', (e) => {
          e.preventDefault();
          this.addTransaction();
        });
      });
    },
  
    setupServiceWorker() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
          .then(registration => {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  window.location.reload();
                }
              });
            });
          })
          .catch(console.error);
      }
    },
  
    setupCategories() {
      const categories = {
        'Доход': ['Зарплата', 'Аванс', 'Инвестиции', 'Другое'],
        'Расход': ['Жильё', 'Транспорт', 'Еда', 'Одежда', 'Развлечения', 'Связь', 'Личные', 'Другое']
      };
  
      const typeSelect = document.getElementById('type');
      const categorySelect = document.getElementById('category');
      if (!typeSelect || !categorySelect) return;
  
      categorySelect.innerHTML = categories[typeSelect.value]
        .map(cat => `<option>${this.escapeHTML(cat)}</option>`)
        .join('');
    },
  
    async addTransaction() {
      const amountInput = document.getElementById('amount');
      const submitButton = document.querySelector('button');
      if (!amountInput || !submitButton) return;
  
      try {
        this.toggleButtonState(submitButton, true);
        const normalizedValue = amountInput.value.replace(/,/g, '.');
  
        if (!this.validateInput(normalizedValue)) {
          this.showError('Некорректная сумма');
          return;
        }
  
        await this.sendTransaction({
          date: new Date().toISOString(),
          type: document.getElementById('type').value,
          category: document.getElementById('category').value,
          amount: parseFloat(normalizedValue).toFixed(2)
        });
  
        amountInput.value = '';
        this.showSuccessFeedback(submitButton);
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.toggleButtonState(submitButton, false);
      }
    },
  
    async sendTransaction(data) {
      const response = await fetch(this.SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка: ${errorText.slice(0, 100)}`);
      }
    },
  
    async loadStats() {
      const loader = document.getElementById('stats-loader');
      try {
        if (loader) loader.style.display = 'block';
        const period = document.getElementById('period').value;
        const response = await fetch(`${this.SCRIPT_URL}?period=${period}`);
        const stats = await response.json();
  
        this.updateTotalCards(stats.total);
        this.renderCategoryChart(stats.categories);
        this.renderCategoryList(stats.categories);
      } catch (error) {
        this.showError('Не удалось загрузить статистику');
      } finally {
        if (loader) loader.style.display = 'none';
      }
    },
  
    updateTotalCards(totals) {
      document.getElementById('total-income').textContent = `${this.formatCurrency(totals?.Доход || 0)} ₽`;
      document.getElementById('total-expense').textContent = `${this.formatCurrency(totals?.Расход || 0)} ₽`;
    },
  
    renderCategoryChart(categories) {
      const ctx = document.getElementById('categoryChart');
      if (!ctx || !categories?.Расход) return;
  
      if (this.chart) this.chart.destroy();
  
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(categories.Расход),
          datasets: [{
            data: Object.values(categories.Расход),
            backgroundColor: ['#34C759', '#2DAE4E', '#269F43', '#1F9038', '#18812D'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    },
  
    renderCategoryList(categories) {
      const container = document.getElementById('categoryStats');
      if (!container || !categories?.Расход) return;
  
      const maxAmount = Math.max(...Object.values(categories.Расход));
      container.innerHTML = Object.entries(categories.Расход)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => `
          <div class="category-item">
            <div class="category-name">${this.escapeHTML(category)}</div>
            <div class="category-progress">
              <div class="category-progress-bar" style="width: ${(amount / maxAmount) * 100}%"></div>
            </div>
            <div class="category-amount">${this.formatCurrency(amount)} ₽</div>
          </div>
        `).join('');
    },
  
    // Утилиты
    validateInput(value) {
      return !!value && !isNaN(value) && parseFloat(value) > 0;
    },
  
    escapeHTML(str) {
      return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
  
    toggleButtonState(button, isLoading) {
      button.disabled = isLoading;
      button.innerHTML = isLoading 
        ? '<div class="spinner"></div>' 
        : 'Добавить';
    },
  
    showSuccessFeedback(button) {
      button.innerHTML = '✅ Добавлено!';
      setTimeout(() => button.innerHTML = 'Добавить', 1000);
    },
  
    showError(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      document.getElementById('amount')?.after(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    },
  
    throttleLoadStats() {
      if (this.throttleTimer) return;
      this.throttleTimer = setTimeout(() => {
        this.loadStats();
        this.throttleTimer = null;
      }, 500);
    },
  
    formatCurrency(amount) {
      return parseFloat(amount || 0).toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },
  
    showScreen(screenId) {
      document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.opacity = '0';
      });
      const activeScreen = document.getElementById(screenId);
      if (activeScreen) {
        activeScreen.classList.add('active');
        setTimeout(() => activeScreen.style.opacity = '1', 50);
      }
    }
  };
  
  app.init();