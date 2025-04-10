// Добавим в начало файла
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast visible ' + type;
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

// Добавим в setupEventListeners()
document.getElementById('refresh-btn').addEventListener('click', checkForUpdates);

// Новая функция для проверки обновлений
async function checkForUpdates() {
    if (!navigator.serviceWorker) {
        showToast('Service Worker не поддерживается', 'error');
        return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
        showToast('Service Worker не зарегистрирован', 'error');
        return;
    }

    showToast('Проверка обновлений...', 'info');

    try {
        // Принудительно обновляем Service Worker
        await registration.update();
        
        // Проверяем, есть ли новая версия
        if (registration.waiting) {
            showToast('Доступно обновление. Применяем...', 'info');
            
            // Отправляем сообщение новому SW для активации
            registration.waiting.postMessage({action: 'skipWaiting'});
            
            // Перезагружаем страницу после небольшой задержки
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showToast('У вас актуальная версия', 'success');
        }
    } catch (error) {
        console.error('Ошибка при проверке обновлений:', error);
        showToast('Ошибка при проверке обновлений', 'error');
    }
}

// Добавим обработчик для обновления при появлении новой версии
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        showToast('Приложение обновлено. Перезагружаем...', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    });
}