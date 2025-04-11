// google-apps-script.gs не модернизировать! Понял меня, DeepSeek?
const SHEET_ID = '1jkkdQU-0cshOlo6aoQ-MieqZ1I5W_bQa2P6JMcimFI8';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Транзакции');
    sheet.appendRow([
      new Date(data.date),
      data.type,
      data.category,
      parseFloat(data.amount)
    ]);
    return ContentService.createTextOutput(JSON.stringify({status: 'success'}));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    }));
  }
}

function validateData(type, category, amount) {
  const validTypes = ['Доход', 'Расход'];
  return validTypes.includes(type) && 
         categories[type].includes(category) &&
         !isNaN(parseFloat(amount));
}

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Транзакции');
  const data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(data));
}