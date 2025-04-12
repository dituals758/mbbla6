import { CONFIG, DOM } from './config.js';
import { state } from './state.js';
import { formatCurrency } from './utils.js';


export const addTransaction = async () => {
  const button = document.querySelector('.ios-button');
  const amountInput = document.querySelector(DOM.amount);
  
  try {
    startLoading(button);
    const transaction = prepareTransactionData(amountInput.value);
    
    if (!state.networkStatus) {
      cacheTransaction(transaction);
      throw new Error('Оффлайн. Данные сохранены локально');
    }

    await sendTransaction(transaction);
    amountInput.value = '';
    showNotification('✔ Успешно сохранено!', 'success');
    loadStats();
  } catch (error) {
    showNotification(`❌ ${error.message}`, 'error');
  } finally {
    finishLoading(button);
  }
};

const prepareTransactionData = (value) => {
  const numericValue = parseFloat(value.replace(',', '.'));
  
  if (isNaN(numericValue)) throw new Error('Некорректная сумма');
  if (numericValue <= 0) throw new Error('Сумма должна быть положительной');

  return {
    date: new Date().toISOString(),
    type: document.querySelector(DOM.type).value,
    category: document.querySelector(DOM.category).value,
    amount: numericValue.toFixed(2).replace('.', ',')
  };
};

const sendTransaction = async (data) => {
  const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Ошибка сохранения');
};

export const cacheTransaction = (transaction) => {
  state.pendingTransactions.push(transaction);
  localStorage.setItem('pending', JSON.stringify(state.pendingTransactions));
};

export const checkPendingTransactions = async () => {
  const pending = JSON.parse(localStorage.getItem('pending')) || [];
  if (pending.length && state.networkStatus) {
    await Promise.all(pending.map(sendTransaction));
    localStorage.removeItem('pending');
    loadStats();
  }
};

const startLoading = (button) => {
  button.classList.add('loading');
  button.disabled = true;
};

const finishLoading = (button) => {
  setTimeout(() => {
    button.classList.remove('loading');
    button.disabled = false;
  }, 100);
};