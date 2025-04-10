// app.js
import { LocalStorage } from './lib/storage.js';
import { renderCharts } from './lib/charts.js';
import { formatDate, showToast } from './lib/utils.js';
import { syncData, getStats } from './lib/api.js';

class FinanceTracker {
  constructor() {
    this.storage = new LocalStorage('finance-tracker');
    this.categories = {
      expense: ['Еда', 'Транспорт', 'Жилье', 'Развлечения', 'Здоровье', 'Другое'],
      income: ['Зарплата', 'Аванс', 'Инвестиции', 'Подарки', 'Другое']
    };
    
    this.init();
  }

  async init() {
    this.setupUI();
    this.setupEventListeners();
    await this.loadData();
    this.updateStats();
  }

  setupUI() {
    // Установка текущей даты
    document.getElementById('date').valueAsDate = new Date();
    this.updateCategories();
    
    // Инициализация графиков
    this.expenseChart = renderCharts('expense-canvas', [], 'Расходы');
    this.incomeChart = renderCharts('income-canvas', [], 'Доходы');
  }

  setupEventListeners() {
    // Сегментированный контрол
    document.querySelectorAll('.segment').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.segment').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateCategories();
      });
    });
    
    // Вкладки
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        if (tab === 'stats') this.updateStats();
      });
    });
    
    // Сохранение транзакции
    document.getElementById('save-btn').addEventListener('click', () => this.saveTransaction());
    
    // Синхронизация
    document.getElementById('sync-btn').addEventListener('click', () => this.syncWithServer());
    
    // Очистка истории
    document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
    
    // Период статистики
    document.getElementById('stats-period').addEventListener('change', () => this.updateStats());
  }

  async loadData() {
    try {
      // Попытка загрузить из сети
      const onlineData = await syncData();
      if (onlineData) {
        this.storage.set('transactions', onlineData);
        showToast('Данные синхронизированы', 'success');
      }
      
      // Загрузка из локального хранилища
      const transactions = this.storage.get('transactions') || [];
      this.renderTransactions(transactions);
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      showToast('Оффлайн режим: данные загружены локально', 'warning');
      
      const localData = this.storage.get('transactions') || [];
      this.renderTransactions(localData);
    }
  }

  async saveTransaction() {
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.querySelector('.button-text').textContent = 'Сохранение...';
    saveBtn.querySelector('.spinner').classList.remove('hidden');
    
    try {
      const transaction = this.getFormData();
      const transactions = this.storage.get('transactions') || [];
      
      transactions.push(transaction);
      this.storage.set('transactions', transactions);
      
      // Очистка формы
      document.getElementById('amount').value = '';
      document.getElementById('description').value = '';
      
      // Обновление UI
      this.renderTransactions(transactions);
      this.updateStats();
      showToast('Транзакция сохранена', 'success');
      
      // Фоновая синхронизация
      if (navigator.onLine) {
        await syncData(transactions);
      }
      
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      showToast('Ошибка сохранения', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.querySelector('.button-text').textContent = 'Сохранить';
      saveBtn.querySelector('.spinner').classList.add('hidden');
    }
  }

  getFormData() {
    const type = document.querySelector('.segment.active').dataset.type;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value.trim();
    
    if (!amount || !category || !date) {
      throw new Error('Заполните обязательные поля');
    }
    
    return {
      id: Date.now().toString(),
      type,
      amount,
      category,
      date: new Date(date).toISOString(),
      description,
      createdAt: new Date().toISOString()
    };
  }

  renderTransactions(transactions) {
    const list = document.getElementById('transactions-list');
    
    if (!transactions.length) {
      list.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24"><path fill="var(--text-secondary)" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <p>Нет данных</p>
        </div>
      `;
      return;
    }
    
    list.innerHTML = '';
    transactions.slice().reverse().forEach(trans => {
      const item = document.createElement('div');
      item.className = 'transaction-item';
      item.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-category">${trans.category}</div>
          <div class="transaction-date">${formatDate(trans.date)}${trans.description ? ' · ' + trans.description : ''}</div>
        </div>
        <div class="transaction-amount ${trans.type}">
          ${trans.type === 'expense' ? '-' : '+'}${trans.amount.toFixed(2)} ₽
        </div>
      `;
      list.appendChild(item);
    });
  }

  updateCategories() {
    const type = document.querySelector('.segment.active').dataset.type;
    const categorySelect = document.getElementById('category');
    
    categorySelect.innerHTML = `
      <option value="" disabled selected>Категория</option>
      ${this.categories[type].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
    `;
  }

  async updateStats() {
    try {
      const period = document.getElementById('stats-period').value;
      const transactions = this.storage.get('transactions') || [];
      
      // Локальная обработка или запрос к серверу
      const stats = navigator.onLine 
        ? await getStats(period) 
        : this.calculateLocalStats(transactions, period);
      
      // Обновление UI
      document.getElementById('total-income').textContent = `${stats.totalIncome.toFixed(2)} ₽`;
      document.getElementById('total-expense').textContent = `${stats.totalExpense.toFixed(2)} ₽`;
      document.getElementById('total-balance').textContent = `${(stats.totalIncome - stats.totalExpense).toFixed(2)} ₽`;
      
      // Обновление графиков
      this.expenseChart.data = stats.byCategory.expense;
      this.incomeChart.data = stats.byCategory.income;
      this.expenseChart.update();
      this.incomeChart.update();
      
    } catch (error) {
      console.error('Ошибка обновления статистики:', error);
      showToast('Ошибка загрузки статистики', 'error');
    }
  }

  calculateLocalStats(transactions, period) {
    // Логика расчета статистики локально
    // ...
    return {
      totalIncome: 0,
      totalExpense: 0,
      byCategory: { income: {}, expense: {} }
    };
  }

  async syncWithServer() {
    try {
      showToast('Синхронизация...', 'info');
      const transactions = this.storage.get('transactions') || [];
      await syncData(transactions);
      showToast('Данные синхронизированы', 'success');
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      showToast('Ошибка синхронизации', 'error');
    }
  }

  clearHistory() {
    if (confirm('Вы уверены, что хотите очистить историю?')) {
      this.storage.remove('transactions');
      this.renderTransactions([]);
      this.updateStats();
      showToast('История очищена', 'success');
    }
  }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  new FinanceTracker();
  
  // Регистрация Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('ServiceWorker зарегистрирован'))
      .catch(err => console.error('Ошибка регистрации ServiceWorker:', err));
  }
  
  // Обработка онлайн/оффлайн статуса
  window.addEventListener('online', () => showToast('Соединение восстановлено', 'success'));
  window.addEventListener('offline', () => showToast('Работа в оффлайн режиме', 'warning'));
});