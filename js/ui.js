import { DOM } from './dom-elements.js';
import { state } from './state.js';
import { loadStats } from './stats.js';
import { checkPendingTransactions } from './transactions.js';

export const initEventListeners = () => {
  document.addEventListener('online', handleNetworkChange);
  document.addEventListener('offline', handleNetworkChange);
  document.querySelector(DOM.type).addEventListener('change', renderCategories);
};

export const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
};

export const showScreen = (screenId) => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelector(`#${screenId}`).classList.add('active');
  updateTabState(screenId);
};

const handleNetworkChange = () => {
  state.networkStatus = navigator.onLine;
  if (state.networkStatus) checkPendingTransactions();
};

export const renderCategories = () => {
  const type = document.querySelector(DOM.type).value;
  const categorySelect = document.querySelector(DOM.category);
  categorySelect.innerHTML = CONFIG.CATEGORIES[type]
    .map(c => `<option>${c}</option>`)
    .join('');
};

const updateTabState = (screenId) => {
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.screen === screenId);
  });
};