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
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('dataForm');
        const status = document.getElementById('status');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            status.textContent = "Отправка...";
            
            // Создаем скрытую форму для отправки
            const formData = new FormData();
            formData.append('operationType', document.getElementById('operationType').value);
            formData.append('category', document.getElementById('category').value);
            formData.append('amount', document.getElementById('amount').value.replace(',', '.'));
            
            // Используем XMLHttpRequest вместо fetch
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://script.google.com/macros/s/AKfycbzz9Sawvd12eWPW2v1dxadalZQ1GIWEfuTgrJ1VqiTBKzOfLY52PeQlU05OhVepd7C1/exec', true);
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    status.textContent = "✓ Успешно!";
                    form.reset();
                } else {
                    status.textContent = "Ошибка отправки";
                }
            };
            
            xhr.onerror = function() {
                status.textContent = "Ошибка соединения";
            };
            
            xhr.send(formData);
        });
    });

    // Простая валидация суммы
    amount.addEventListener('input', function() {
        this.value = this.value.replace(/[^\d,]/g, '')
                               .replace(/(,.*?),/g, '$1');
    });
});