const app = {
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwj94YEJ7CKe_cEGTngykKzTg9W1F9ZIheIeXvbJBJOsHBGAh1dhlAUie60zmEPffCv8Q/exec',
    
    init: function() {
      this.setupCategories();
      document.getElementById('type').addEventListener('change', () => this.setupCategories());
      document.addEventListener('DOMContentLoaded', () => this.setupServiceWorker());
    },
  
    setupServiceWorker: function() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
          .catch(err => console.error('SW error:', err));
      }
    },
  
    setupCategories: function() {
      const categories = {
        'Доход': ['Зарплата', 'Аванс', 'Инвестиции', 'Другое'],
        'Расход': ['Жильё', 'Транспорт', 'Еда', 'Одежда', 'Развлечения', 'Связь', 'Личные', 'Другое']
      };
      
      const type = document.getElementById('type').value;
      document.getElementById('category').innerHTML = categories[type]
        .map(c => `<option>${c}</option>`)
        .join('');
    },
  
    addTransaction: async function() {
      const amountInput = document.getElementById('amount');
      const submitButton = document.querySelector('button');
      
      try {
        // Блокировка кнопки
        submitButton.disabled = true;
        submitButton.textContent = 'Добавляем...';
        submitButton.style.opacity = '0.7';

        if (!this.validateInput(amountInput.value)) {
          this.showError('Некорректная сумма');
          return;
        }

        const transaction = {
          date: new Date().toISOString(),
          type: document.getElementById('type').value,
          category: document.getElementById('category').value,
          amount: parseFloat(amountInput.value).toFixed(2)
        };

        await this.sendData(transaction);
        amountInput.value = '';
        
        // Успешное добавление
        submitButton.textContent = '✅ Добавлено!';
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        this.showError(error.message);
      } finally {
        // Всегда разблокируем кнопку
        submitButton.disabled = false;
        submitButton.textContent = 'Добавить';
        submitButton.style.opacity = '1';
      }
    },
  
    validateInput: function(value) {
      return value && !isNaN(value) && parseFloat(value) > 0;
    },
  
    sendData: async function(data) {
      const response = await fetch(this.SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Ошибка сохранения');
      }
    },
  
    showError: function(message) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message;
      
      document.getElementById('amount')
        .insertAdjacentElement('afterend', errorDiv);
    },

    showScreen: function(screenId) {
      // Скрыть все экраны
      document.querySelectorAll('.screen').forEach(s => {
          s.classList.remove('active');
          s.style.opacity = '0';
      });
      
      // Показать выбранный экран
      const activeScreen = document.getElementById(screenId);
      activeScreen.classList.add('active');
      setTimeout(() => activeScreen.style.opacity = '1', 50);
      
      // Обновить навигацию
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      event.currentTarget.classList.add('active');
  },
  
  setupUpdateChecks: function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Проверка при загрузке приложения
        registration.update();
        
        // Отправляем версию в Service Worker
        this.getCacheVersion();
      });
    }
  },

  getCacheVersion: function() {
    if ('serviceWorker' in navigator) {
      const channel = new MessageChannel();
      navigator.serviceWorker.controller.postMessage(
        'getVersion',
        [channel.port2]
      );
      
      channel.port1.onmessage = (event) => {
        this.currentVersion = event.data.version;
      };
    }
  }
  };
  
  // Инициализация
  app.init();