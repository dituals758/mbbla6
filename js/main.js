import { initServiceWorker, handleSWMessages } from './service-worker.js';
import { initEventListeners, renderCategories, showScreen } from './ui.js';
import { checkPendingTransactions, addTransaction } from './transactions.js';
import { loadStats } from './stats.js';
import { updateVersionDisplay } from './utils.js';
import { state } from './state.js';
import { CONFIG } from './config.js';

export const App = {
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
  loadStats,
  showScreen
};

window.App = App

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