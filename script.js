document.addEventListener('DOMContentLoaded', function() {
    // Элементы формы
    const form = document.getElementById('dataForm');
    const operationType = document.getElementById('operationType');
    const category = document.getElementById('category');
    const amount = document.getElementById('amount');
    const status = document.getElementById('status');

    // Заполняем категории
    function updateCategories() {
        const categories = operationType.value === 'Доход' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        category.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    // Обновляем при изменении типа операции
    operationType.addEventListener('change', updateCategories);
    updateCategories(); // Инициализация

    // Отправка формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        status.textContent = SUBMITTING_MSG;
        
        const formData = new FormData();
        formData.append('operationType', operationType.value);
        formData.append('category', category.value);
        formData.append('amount', amount.value.replace(',', '.'));
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_URL, true);
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                status.textContent = SUCCESS_MSG;
                form.reset();
            } else {
                status.textContent = ERROR_MSG;
            }
        };
        
        xhr.onerror = function() {
            status.textContent = ERROR_MSG;
        };
        
        xhr.send(formData);
    });

    // Валидация суммы
    amount.addEventListener('input', function() {
        this.value = this.value.replace(/[^\d,]/g, '')
                               .replace(/(,.*?),/g, '$1');
    });
});