import { CONFIG } from './config.js';
import { state } from './state.js';
import { checkPendingTransactions, loadStats } from './stats.js';
import { updateVersionDisplay } from './utils.js';

export const initServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('sw.js')
      .catch(error => console.error('SW registration failed:', error));
  }
};

export const handleSWMessages = () => {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', event => {
    const { data } = event;
    
    switch(data.type) {
      case 'VERSION_UPDATE':
        handleVersionUpdate(data.version);
        break;
      case 'CURRENT_VERSION':
        updateVersionDisplay(data.version);
        break;
      case 'SYNC_TRANSACTIONS':
        handleSyncEvent();
        break;
      default:
        console.warn('Неизвестный тип сообщения:', data.type);
    }
  });
};

const handleVersionUpdate = (version) => {
  state.currentVersion = version;
  localStorage.setItem('appVersion', version);
  updateVersionDisplay(version);
};

const handleSyncEvent = () => {
  checkPendingTransactions();
  loadStats();
};