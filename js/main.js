import { CONFIG } from './config.js';
import { DOM } from './dom-elements.js';
import { state } from './state.js';
import { initServiceWorker, handleSWMessages } from './service-worker.js';
import { addTransaction, checkPendingTransactions } from './transactions.js';
import { loadStats } from './stats.js';
import { showScreen, updateVersionDisplay } from './ui.js';
import { renderCategories } from './ui.js';

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
  addTransaction,
  showScreen
};

const initEventListeners = () => {
  document.querySelector(DOM.amount).addEventListener('keypress', e => {
    if (e.key === 'Enter') App.addTransaction();
  });
};

const initYearSelector = () => {
  const yearSelect = document.querySelector(DOM.yearSelect);
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

export default App;
window.App = App;