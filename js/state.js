// js/state.js
export const state = {
  chartInstance: null,
  pendingTransactions: [],
  networkStatus: navigator.onLine,
  currentVersion: localStorage.getItem('appVersion') || '0.0.1'
};