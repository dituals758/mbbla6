const SHEET_ID = '1jkkdQU-0cshOlo6aoQ-MieqZ1I5W_bQa2P6JMcimFI8';
const SHEET_NAME = 'Транзакции';

// Валидные типы и категории
const VALID_TYPES = ['income', 'expense'];
const VALID_CATEGORIES = {
  income: ['Зарплата', 'Аванс', 'Инвестиции', 'Другое'],
  expense: ['Жильё', 'Транспорт', 'Еда', 'Одежда', 'Развлечения', 'Связь', 'Личное', 'Другое']
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Валидация данных
    if (!validateData(data)) {
      return createResponse(400, {error: 'Неверный формат данных'});
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const amount = parseFloat(data.amount.replace(',', '.')); // Конвертация запятой в точку
    
    sheet.appendRow([
      new Date(data.date), 
      data.type === 'income' ? 'Доход' : 'Расход',
      data.category,
      amount
    ]);
    
    return createResponse(200, {status: 'success'});
    
  } catch (error) {
    return createResponse(500, {error: error.message});
  }
}

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Фильтрация по периоду
    const filteredData = filterData(data, e.parameter.period);
    
    return createResponse(200, filteredData);
    
  } catch (error) {
    return createResponse(500, {error: error.message});
  }
}

// Фильтрация данных по дате
function filterData(data, period = 'all-all') {
  const [year, month] = period.split('-');
  
  return data.filter(row => {
    try {
      const date = new Date(row[0]);
      if (isNaN(date)) return false;
      
      const rowYear = date.getFullYear();
      const rowMonth = String(date.getMonth() + 1).padStart(2, '0');
      
      return (year === 'all' || rowYear == year) && 
             (month === 'all' || rowMonth === month);
    } catch (e) {
      return false;
    }
  });
}

// Валидация входящих данных
function validateData(data) {
  return VALID_TYPES.includes(data.type) &&
         VALID_CATEGORIES[data.type].includes(data.category) &&
         !isNaN(parseFloat(data.amount.replace(',', '.')));
}

// Формирование ответа
function createResponse(code, data) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(data));
  output.setStatusCode(code);
  return output;
}