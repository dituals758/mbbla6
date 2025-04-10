// Конфигурация
const CONFIG = {
  sheetId: '1jkkdQU-0cshOlo6aoQ-MieqZ1I5W_bQa2P6JMcimFI8', // Замените на ID вашей таблицы
  sheetName: 'Transactions'        // Название листа для данных
};

/**
 * Обработчик GET запросов
 */
function doGet(e) {
  try {
    // Проверка и получение параметров
    const params = e?.parameter || {};
    const action = params.action;
    
    // Получаем данные из таблицы
    const sheet = SpreadsheetApp.openById(CONFIG.sheetId).getSheetByName(CONFIG.sheetName);
    const data = sheet.getDataRange().getValues();
    
    // Обработка разных действий
    switch(action) {
      case 'getTransactions':
        return handleGetTransactions(data);
      case 'getStats':
        return handleGetStats(data, params.period || 'month');
      default:
        return buildResponse({error: 'Invalid action'}, 400);
    }
    
  } catch (error) {
    return buildResponse({error: error.message}, 500);
  }
}

/**
 * Обработчик POST запросов
 */
function doPost(e) {
  try {
    // Получаем данные из тела запроса
    const data = JSON.parse(e.postData.contents);
    
    // Валидация данных
    if (!data.type || !data.amount || !data.category || !data.date) {
      return buildResponse({error: 'Missing required fields'}, 400);
    }
    
    // Записываем в таблицу
    const sheet = SpreadsheetApp.openById(CONFIG.sheetId).getSheetByName(CONFIG.sheetName);
    sheet.appendRow([
      data.type === 'income' ? 'Доход' : 'Расход',
      data.category,
      parseFloat(data.amount),
      new Date(data.date),
      data.description || '',
      new Date() // Дата записи
    ]);
    
    return buildResponse({status: 'success'});
    
  } catch (error) {
    return buildResponse({error: error.message}, 500);
  }
}

/**
 * Получение последних транзакций
 */
function handleGetTransactions(data) {
  // Пропускаем заголовок, берем последние 50 записей, переворачиваем порядок
  const transactions = data.slice(1)
    .slice(-50)
    .reverse()
    .map(row => ({
      type: row[0] === 'Доход' ? 'income' : 'expense',
      category: row[1],
      amount: row[2],
      date: row[3]?.toISOString?.() || new Date().toISOString(),
      description: row[4] || ''
    }));
  
  return buildResponse({transactions});
}

/**
 * Получение статистики
 */
function handleGetStats(data, period) {
  const now = new Date();
  let startDate;
  
  // Определяем период
  switch(period) {
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default: // month
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }
  
  // Фильтруем данные по периоду
  const filteredData = data.slice(1).filter(row => {
    const rowDate = new Date(row[3]);
    return rowDate >= startDate;
  });
  
  // Считаем статистику
  const stats = {
    totalIncome: filteredData
      .filter(row => row[0] === 'Доход')
      .reduce((sum, row) => sum + (row[2] || 0), 0),
    totalExpense: filteredData
      .filter(row => row[0] === 'Расход')
      .reduce((sum, row) => sum + (row[2] || 0), 0),
    byCategory: {
      income: {},
      expense: {}
    }
  };
  
  // Статистика по категориям
  filteredData.forEach(row => {
    const type = row[0] === 'Доход' ? 'income' : 'expense';
    const category = row[1];
    const amount = row[2] || 0;
    
    if (!stats.byCategory[type][category]) {
      stats.byCategory[type][category] = 0;
    }
    stats.byCategory[type][category] += amount;
  });
  
  return buildResponse({stats});
}

function buildResponse(data, statusCode = 200) {
  const response = {
    data: JSON.stringify(data),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    },
    status: statusCode
  };
  
  return ContentService
    .createTextOutput(response.data)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(response.headers);
}

/**
 * Для отладки - создает лист если его нет
 */
function setup() {
  const ss = SpreadsheetApp.openById(CONFIG.sheetId);
  let sheet = ss.getSheetByName(CONFIG.sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.sheetName);
    sheet.appendRow(['Тип', 'Категория', 'Сумма', 'Дата', 'Описание', 'Дата записи']);
  }
}