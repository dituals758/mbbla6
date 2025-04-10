const SHEET_ID = '1eWIIK9DU80lgjg8bet-N98XPpuk2MCn7YAGKyMdREpE'; // Замените на ID вашей таблицы
const SHEET_NAME = 'Transactions'; // Название листа

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    sheet.getRange(newRow, 1).setValue(data.type === 'income' ? 'Доход' : 'Расход');
    sheet.getRange(newRow, 2).setValue(data.category);
    sheet.getRange(newRow, 3).setValue(data.amount);
    sheet.getRange(newRow, 4).setValue(new Date(data.date));
    sheet.getRange(newRow, 5).setValue(data.description || '');
    sheet.getRange(newRow, 6).setValue(new Date());
    
    // Добавляем CORS заголовки
    return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*')
      .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .addHeader('Access-Control-Allow-Headers', 'Content-Type');
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.message}))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*');
  }
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