const SHEET_ID = '1jkkdQU-0cshOlo6aoQ-MieqZ1I5W_bQa2P6JMcimFI8';

function doPost(e) {
  const {date, type, category, amount} = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Транзакции');
  sheet.appendRow([new Date(date), type, category, parseFloat(amount)]);
  return ContentService.createTextOutput(JSON.stringify({status: 'success'}));
}

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Транзакции');
  const data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(data));
}
