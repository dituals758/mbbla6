// main.js
import { initServiceWorker, handleSWMessages } from 'https://dituals758.github.io/mbbla6/js/service-worker.js';
import { initEventListeners, renderCategories, showScreen } from 'https://dituals758.github.io/mbbla6/js/ui.js';
import { checkPendingTransactions, addTransaction } from 'https://dituals758.github.io/mbbla6/js/transactions.js';
import { loadStats } from 'https://dituals758.github.io/mbbla6/js/stats.js';
import { updateVersionDisplay } from 'https://dituals758.github.io/mbbla6/js/utils.js';
import { state } from 'https://dituals758.github.io/mbbla6/js/state.js';
import { CONFIG } from 'https://dituals758.github.io/mbbla6/js/config.js';

// Создаем глобальный объект App
const App = {
  init() {
    initServiceWorker();
    initEventListeners();
    renderCategories();
    initYearSelector();
    loadInitialData();
    checkPendingTransactions();
    handleSWMessages();
    updateVersionDisplay();
  },
  addTransaction: addTransaction, // Явно присваиваем метод
  loadStats: loadStats,
  showScreen: showScreen
};

// Экспортируем и делаем глобальным
export default App;
window.App = App; // Теперь App доступен глобально

// Остальной код...

const initYearSelector = () => {
  const yearSelect = document.querySelector('#yearSelect');
  if (!yearSelect) return;

  yearSelect.innerHTML = '<option value="all">Все годы</option>';
  const currentYear = new Date().getFullYear();
  const years = new Set([currentYear]);

  fetch(CONFIG.API_URL)
    .then(response => response.json())
    .then(transactions => {
      transactions.forEach(transaction => {
        const date = new Date(transaction[0]);
        if (!isNaN(date)) years.add(date.getFullYear());
      });

      Array.from(years)
        .sort((a, b) => b - a)
        .forEach(year => {
          const option = document.createElement('option');
          option.value = year;
          option.textContent = year;
          yearSelect.appendChild(option);
        });
    })
    .catch(() => {
      yearSelect.innerHTML = `<option value="${currentYear}">${currentYear}</option>`;
    });
};

const loadInitialData = () => {
  loadStats();
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.showScreen('mainScreen');
});