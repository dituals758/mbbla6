const SHEET_ID = '1eWIIK9DU80lgjg8bet-N98XPpuk2MCn7YAGKyMdREpE'; // Замените на ID вашей таблицы
const SHEET_NAME = 'Transactions'; // Название листа

function doPost(e) {
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
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
    const action = e.parameter.action;
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    if (action === 'getTransactions') {
        // Пропускаем заголовки и берем последние 50 записей
        const transactions = data.slice(1).slice(-50).reverse().map(row => ({
            type: row[0] === 'Доход' ? 'income' : 'expense',
            category: row[1],
            amount: row[2],
            date: row[3].toISOString(),
            description: row[4]
        }));
        
        return ContentService.createTextOutput(JSON.stringify(transactions)).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'getStats') {
        const period = e.parameter.period || 'month';
        const now = new Date();
        let startDate;
        
        if (period === 'week') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        } else { // year
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        }
        
        const filteredData = data.slice(1).filter(row => new Date(row[3]) >= startDate);
        
        const stats = {
            totalIncome: filteredData
                .filter(row => row[0] === 'Доход')
                .reduce((sum, row) => sum + row[2], 0),
            totalExpense: filteredData
                .filter(row => row[0] === 'Расход')
                .reduce((sum, row) => sum + row[2], 0)
        };
        
        return ContentService.createTextOutput(JSON.stringify(stats)).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}))
        .setMimeType(ContentService.MimeType.JSON);
}