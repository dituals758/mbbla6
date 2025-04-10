const app = (() => {
        // Конфигурация
        const CONFIG = {
            SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwj94YEJ7CKe_cEGTngykKzTg9W1F9ZIheIeXvbJBJOsHBGAh1dhlAUie60zmEPffCv8Q/exec',
            CATEGORIES: {
                'Доход': ['Зарплата', 'Аванс', 'Инвестиции', 'Другое'],
                'Расход': ['Жильё', 'Транспорт', 'Еда', 'Одежда', 'Развлечения', 'Связь', 'Личные', 'Другое']
            }
        };
    
        // Инициализация приложения
        function init() {
            // Настройка категорий
            updateCategories();
            
            // Обработчик изменения типа транзакции
            document.getElementById('type').addEventListener('change', updateCategories);
            
            // Блокировка масштабирования
            document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
            document.addEventListener('touchstart', e => {
                if(e.touches.length > 1) e.preventDefault();
            }, { passive: false });
    
            // Регистрация Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js')
                    .then(() => console.log('Service Worker зарегистрирован'))
                    .catch(err => console.error('Ошибка регистрации SW:', err));
            }
        }
    
        // Обновление списка категорий
        function updateCategories() {
            const type = document.getElementById('type').value;
            const categorySelect = document.getElementById('category');
            categorySelect.innerHTML = CONFIG.CATEGORIES[type]
                .map(c => `<option value="${c}">${c}</option>`)
                .join('');
        }
    
        // Добавление транзакции
        async function addTransaction() {
            const amountInput = document.getElementById('amount');
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            
            try {
                // Очистка предыдущих ошибок
                document.querySelectorAll('.error-message').forEach(el => el.remove());
    
                // Валидация данных
                if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
                    throw new Error(amountInput.value ? 
                        'Сумма должна быть больше нуля' : 
                        'Введите сумму');
                }
    
                // Формирование данных транзакции
                const transactionData = {
                    date: new Date().toISOString(),
                    type: document.getElementById('type').value,
                    category: document.getElementById('category').value,
                    amount: parseFloat(amountInput.value).toFixed(2)
                };
    
                // Отправка данных
                const response = await fetch(CONFIG.SCRIPT_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(transactionData),
                    redirect: 'follow'
                });
    
                // Проверка ответа
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Ошибка сервера');
                }
    
                // Очистка поля ввода
                amountInput.value = '';
                console.log('Транзакция успешно добавлена');
    
            } catch (error) {
                // Обработка ошибок
                errorMessage.textContent = error.message;
                amountInput.parentNode.insertBefore(errorMessage, amountInput.nextSibling);
                errorMessage.style.display = 'block';
                amountInput.focus();
                console.error('Ошибка добавления:', error);
            }
        }
    
        // Загрузка статистики
        async function loadStats() {
            try {
                const response = await fetch(CONFIG.SCRIPT_URL);
                const data = await response.json();
                console.log('Получены данные:', data);
                // Здесь можно добавить обработку данных
            } catch (error) {
                console.error('Ошибка загрузки:', error);
                alert('Не удалось загрузить статистику');
            }
        }
    
        // Переключение экранов
        function showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
        }
    
        // Публичные методы
        return {
            init,
            addTransaction,
            loadStats,
            showScreen
        };
    })();
    
    // Запуск приложения после полной загрузки страницы
    document.addEventListener('DOMContentLoaded', app.init);