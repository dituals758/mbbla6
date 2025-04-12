import { CONFIG } from 'https://dituals758.github.io/mbbla6/js/config.js';
import { DOM } from 'https://dituals758.github.io/mbbla6/js/dom-elements.js';
import { state } from 'https://dituals758.github.io/mbbla6/js/state.js';
import { formatCurrency } from 'https://dituals758.github.io/mbbla6/js/utils.js';
import { showNotification } from 'https://dituals758.github.io/mbbla6/js/ui.js';

export const loadStats = async () => {
  try {
    const period = getSelectedPeriod();
    const data = await fetchStats(period);
    updateSummary(data);
    renderChart(data);
    renderCategoryDetails(data);
  } catch (error) {
    showNotification('Ошибка загрузки статистики', 'error');
  }
};

const fetchStats = async (period) => {
  const response = await fetch(`${CONFIG.API_URL}?period=${period}`);
  return await response.json();
};

const updateSummary = (data) => {
  const totals = data.reduce((acc, row) => {
    const type = row[1] === 'Доход' ? 'income' : 'expense';
    acc[type] += parseFloat(row[3]);
    return acc;
  }, { income: 0, expense: 0 });

  document.querySelector(DOM.totalIncome).textContent = formatCurrency(totals.income);
  document.querySelector(DOM.totalExpense).textContent = formatCurrency(totals.expense);
  document.querySelector(DOM.totalBalance).textContent = formatCurrency(totals.income - totals.expense);
};

export const renderChart = (data) => {
  const ctx = document.querySelector(DOM.chart).getContext('2d');
  const categories = groupByCategory(data);
  
  if (state.chartInstance) state.chartInstance.destroy();

  state.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: CONFIG.CHART_COLORS,
        borderWidth: 0
      }]
    },
    options: {
      plugins: {
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${formatCurrency(ctx.raw)} ₽`
          }
        }
      }
    }
  });
};

export const groupByCategory = (data) => {
  return data.reduce((acc, transaction) => {
    const category = transaction[2];
    const amount = parseFloat(transaction[3]);
    
    if (!category || isNaN(amount)) return acc;
    
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});
};

export const renderCategoryDetails = (data) => {
  const container = document.querySelector(DOM.categoryDetails);
  if (!container) return;

  container.innerHTML = '';
  const categories = Object.entries(groupByCategory(data)).sort((a, b) => b[1] - a[1]);

  if (categories.length === 0) {
    container.innerHTML = '<div class="empty-state">Нет данных для отображения</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  categories.forEach(([name, amount]) => {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.innerHTML = `
      <div class="category-name">${name}</div>
      <div class="category-amount">${formatCurrency(amount)} ₽</div>
      <div class="category-progress">
        <div class="progress-bar" style="width: ${(amount / getTotalAmount(categories) * 100)}%"></div>
      </div>
    `;
    fragment.appendChild(item);
  });

  container.appendChild(fragment);
};

const getTotalAmount = (categories) => {
  return categories.reduce((total, [_, amount]) => total + amount, 0);
};

export const getSelectedPeriod = () => {
  const year = document.querySelector(DOM.yearSelect).value;
  const month = document.querySelector(DOM.monthSelect).value;
  return `${year}-${month}`;
};