function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data') || 
                 SpreadsheetApp.getActiveSpreadsheet().insertSheet('Data');
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Тип операции', 'Категория', 'Сумма', 'Timestamp']);
    }
    
    const data = JSON.parse(e.postData.contents);
    const timestamp = new Date();
    
    sheet.appendRow([
      data.operationType,
      data.category,
      data.amount,
      timestamp
    ]);
    
    // Возвращаем простой текст вместо JSON
    return ContentService.createTextOutput("Данные сохранены");
    
  } catch(e) {
    return ContentService.createTextOutput("Ошибка: " + e.message);
  }
}

function doGet(e) {
  const response = {
    status: 'API работает',
    timestamp: new Date().toISOString()
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON)
    .addHttpHeader('Access-Control-Allow-Origin', '*');
}