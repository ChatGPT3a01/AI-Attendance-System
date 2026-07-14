// 主要JavaScript檔案

document.addEventListener('DOMContentLoaded', function() {
    // 檢查系統狀態
    checkSystemStatus();

    // 添加動畫效果
    addAnimations();
});

function checkSystemStatus() {
    // 檢查後端連接狀態
    fetch('/api/status')
        .then(response => {
            if (response.ok) {
                console.log('系統連接正常');
            }
        })
        .catch(error => {
            console.log('系統連接異常:', error);
        });
}

function addAnimations() {
    // 為導航按鈕添加動畫效果
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach((btn, index) => {
        btn.style.animationDelay = `${index * 0.1}s`;
        btn.classList.add('fade-in');
    });

    // 為資訊卡片添加動畫效果
    const infoCards = document.querySelectorAll('.info-card');

    infoCards.forEach((card, index) => {
        card.style.animationDelay = `${(index + 2) * 0.1}s`;
        card.classList.add('fade-in');
    });
}

// 顯示載入動畫
function showLoading(element) {
    element.innerHTML = '<div class="loading">載入中...</div>';
    element.classList.add('loading-state');
}

// 隱藏載入動畫
function hideLoading(element, content) {
    element.innerHTML = content;
    element.classList.remove('loading-state');
}

// 顯示訊息
function showMessage(element, message, type = 'info') {
    element.innerHTML = message;
    element.className = `result-message ${type}`;
    element.style.display = 'block';

    // 自動隱藏成功訊息
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
}