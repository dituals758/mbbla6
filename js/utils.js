import { DOM } from './dom-elements.js';
import { state } from './state.js';

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value).replace('₽', '₽');
};

export const updateVersionDisplay = (version = null) => {
  const currentVersion = version || state.currentVersion || localStorage.getItem('appVersion') || 'unknown';
  
  const updateElement = (selector, text, title = '') => {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = text;
      if (title) element.title = title;
    }
  };

  updateElement(DOM.appVersion, currentVersion, `Последнее обновление: ${new Date().toLocaleDateString('ru-RU')}`);
  updateElement('#versionOffline', currentVersion);
  
  state.currentVersion = currentVersion;
  localStorage.setItem('appVersion', currentVersion);
};