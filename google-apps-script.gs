const SHEET_ID = '1eWIIK9DU80lgjg8bet-N98XPpuk2MCn7YAGKyMdREpE'; // Замените на ID вашей таблицы
const SHEET_NAME = 'Transactions'; // Название листа

// В файле Google Apps Script замените doPost на это:
function doPost(e) {
  const data = e.parameter; // Получаем данные как параметры URL
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  sheet.appendRow([
    data.type === 'income' ? 'Доход' : 'Расход',
    data.category,
    data.amount,
    new Date(data.date),
    data.description || '',
    new Date()
  ]);
  
  // Простейший ответ без CORS заголовков
  return ContentService.createTextOutput("Успешно сохранено");
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    let response;
    
    if (action === 'getTransactions') {
      const transactions = data.slice(1).slice(-50).reverse().map(row => ({
        type: row[0] === 'Доход' ? 'income' : 'expense',
        category: row[1],
        amount: row[2],
        date: row[3]?.toISOString?.() || new Date().toISOString(),
        description: row[4]
      }));
      
      response = { status: 'success', data: transactions };
    } 
    else if (action === 'getStats') {
      const period = e.parameter.period || 'month';
      const now = new Date();
      let startDate;
      
      if (period === 'week') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      } else {
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      }
      
      const filteredData = data.slice(1).filter(row => {
        const rowDate = new Date(row[3]);
        return rowDate >= startDate;
      });
      
      response = {
        status: 'success',
        data: {
          totalIncome: filteredData.filter(row => row[0] === 'Доход').reduce((sum, row) => sum + (row[2] || 0), 0),
          totalExpense: filteredData.filter(row => row[0] === 'Расход').reduce((sum, row) => sum + (row[2] || 0), 0)
        }
      };
    } 
    else {
      response = { status: 'error', message: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*');
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.message}))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*');
  }
}