const SHEET_ID = '1jkkdQU-0cshOlo6aoQ-MieqZ1I5W_bQa2P6JMcimFI8';

function doPost(e) {
  try {
    console.log('Received POST request:', e);
    const {date, type, category, amount} = JSON.parse(e.postData.contents);
    
    // Валидация данных
    if (!date || !type || !category || isNaN(amount)) {
      throw new Error('Invalid data format');
    }
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Транзакции');
    sheet.appendRow([new Date(date), type, category, parseFloat(amount)]);
    
    console.log('Data added successfully');
    return ContentService.createTextOutput(JSON.stringify({status: 'success'}));
    
  } catch (error) {
    console.error('Error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    }));
  }
}