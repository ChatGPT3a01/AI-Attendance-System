// 管理介面JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

function initializeAdmin() {
    // 下載模板按鈕
    const downloadBtn = document.getElementById('downloadTemplate');
    downloadBtn.addEventListener('click', downloadTemplate);

    // 上傳CSV按鈕
    const uploadBtn = document.getElementById('uploadCsv');
    uploadBtn.addEventListener('click', uploadCsv);

    // 匯出資料按鈕
    const exportBtn = document.getElementById('exportData');
    exportBtn.addEventListener('click', exportAttendance);

    // 檔案選擇變化
    const fileInput = document.getElementById('csvFile');
    fileInput.addEventListener('change', handleFileSelect);

    // 設定預設日期
    setDefaultDates();
}

function downloadTemplate() {
    window.location.href = '/download_template';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    const label = document.querySelector('.file-label');

    if (file) {
        label.textContent = `已選擇: ${file.name}`;
        label.style.background = '#e7f3ff';
        label.style.border = '2px solid #007bff';
    } else {
        label.textContent = '選擇CSV檔案';
        label.style.background = '#f8f9fa';
        label.style.border = '2px dashed #667eea';
    }
}

function uploadCsv() {
    const fileInput = document.getElementById('csvFile');
    const resultDiv = document.getElementById('uploadResult');

    if (!fileInput.files.length) {
        showMessage(resultDiv, '請先選擇CSV檔案', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    showLoading(resultDiv);

    fetch('/upload_csv', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let message = data.message;
            if (data.errors && data.errors.length > 0) {
                message += '<br><br>錯誤詳情:<br>' + data.errors.join('<br>');
            }
            showMessage(resultDiv, message, 'success');

            // 清空檔案選擇
            fileInput.value = '';
            handleFileSelect({target: {files: []}});
        } else {
            showMessage(resultDiv, data.message, 'error');
        }
    })
    .catch(error => {
        console.error('上傳錯誤:', error);
        showMessage(resultDiv, '上傳時發生錯誤，請稍後重試', 'error');
    });
}

function exportAttendance() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        alert('請選擇開始和結束日期');
        return;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert('開始日期不能晚於結束日期');
        return;
    }

    // 顯示載入狀態
    const exportBtn = document.getElementById('exportData');
    const originalText = exportBtn.textContent;
    exportBtn.textContent = '匯出中...';
    exportBtn.disabled = true;

    fetch('/export_attendance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            start_date: startDate,
            end_date: endDate
        })
    })
    .then(response => {
        if (response.ok) {
            return response.blob();
        }
        throw new Error('匯出失敗');
    })
    .then(blob => {
        // 建立下載連結
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `attendance_${startDate}_to_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('出缺勤記錄已匯出成功！');
    })
    .catch(error => {
        console.error('匯出錯誤:', error);
        alert('匯出時發生錯誤，請稍後重試');
    })
    .finally(() => {
        // 恢復按鈕狀態
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
    });
}

function setDefaultDates() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // 本月第一天
    const endDate = today; // 今天

    document.getElementById('startDate').value = formatDate(startDate);
    document.getElementById('endDate').value = formatDate(endDate);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function showMessage(element, message, type = 'info') {
    element.innerHTML = message;
    element.className = `result-message ${type}`;
    element.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function showLoading(element) {
    element.innerHTML = '<div class="loading">處理中...</div>';
    element.className = 'result-message';
    element.style.display = 'block';
}