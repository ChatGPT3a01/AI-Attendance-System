// 打卡介面JavaScript

let currentStudent = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeAttendance();
});

function initializeAttendance() {
    // 查詢學生按鈕
    const searchBtn = document.getElementById('searchStudent');
    searchBtn.addEventListener('click', searchStudent);

    // 打卡按鈕
    const punchInBtn = document.getElementById('punchIn');
    const punchOutBtn = document.getElementById('punchOut');

    punchInBtn.addEventListener('click', () => punchCard('in'));
    punchOutBtn.addEventListener('click', () => punchCard('out'));

    // 輸入框回車事件
    const inputs = document.querySelectorAll('#className, #seatNumber');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchStudent();
            }
        });
    });

    // 座號輸入框自動跳轉
    document.getElementById('seatNumber').addEventListener('input', function(e) {
        if (e.target.value && e.target.value.length >= 1) {
            // 自動查詢
            setTimeout(searchStudent, 500);
        }
    });

    // 載入最近記錄
    loadRecentRecords();
    
    // 設定焦點到班級輸入框
    document.getElementById('className').focus();
}

function searchStudent() {
    const className = document.getElementById('className').value.trim();
    const seatNumber = document.getElementById('seatNumber').value.trim();

    if (!className || !seatNumber) {
        alert('請輸入班級和座號');
        return;
    }

    const searchBtn = document.getElementById('searchStudent');
    const originalText = searchBtn.textContent;
    searchBtn.textContent = '查詢中...';
    searchBtn.disabled = true;

    fetch('/get_student', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            class_name: className,
            seat_number: parseInt(seatNumber)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentStudent = data.student;
            displayStudent(data.student);
        } else {
            alert(data.message);
            hideStudentInfo();
        }
    })
    .catch(error => {
        console.error('查詢錯誤:', error);
        alert('查詢時發生錯誤，請稍後重試');
    })
    .finally(() => {
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
    });
}

function displayStudent(student) {
    // 顯示學生資訊
    document.getElementById('studentName').textContent = student.name;
    document.getElementById('displayClass').textContent = student.class_name;
    document.getElementById('displaySeat').textContent = student.seat_number;
    document.getElementById('studentPosition').textContent = student.position || '無';

    // 設定照片
    const photoImg = document.getElementById('studentPhoto');
    if (student.photo_path) {
        photoImg.src = `/get_photo/${student.class_name}/${student.seat_number}`;
        photoImg.alt = `${student.name}的照片`;
        photoImg.onerror = function() {
            this.src = '/static/images/default-avatar.svg';
            this.alt = '預設頭像';
        };
    } else {
        photoImg.src = '/static/images/default-avatar.svg';
        photoImg.alt = '預設頭像';
    }

    // 顯示學生資訊區塊
    document.getElementById('studentInfo').style.display = 'block';

    // 清空之前的打卡結果
    document.getElementById('punchResult').style.display = 'none';
}

function hideStudentInfo() {
    document.getElementById('studentInfo').style.display = 'none';
    currentStudent = null;
}

function punchCard(type) {
    if (!currentStudent) {
        alert('請先查詢學生資料');
        return;
    }

    const resultDiv = document.getElementById('punchResult');
    const typeName = type === 'in' ? '到班' : '離班';

    // 確認打卡
    if (!confirm(`確定要為 ${currentStudent.name} 進行${typeName}打卡嗎？`)) {
        return;
    }

    showMessage(resultDiv, '打卡中...', 'info');

    fetch('/punch_card', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            class_name: currentStudent.class_name,
            seat_number: currentStudent.seat_number,
            type: type
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(resultDiv, `${data.message}<br>時間：${data.timestamp}`, 'success');

            // 更新最近記錄
            updateRecentRecords();

            // 自動清空輸入框，準備下一次打卡
            setTimeout(() => {
                document.getElementById('className').value = '';
                document.getElementById('seatNumber').value = '';
                hideStudentInfo();
                document.getElementById('className').focus();
            }, 2000);
        } else {
            showMessage(resultDiv, data.message, 'error');
        }
    })
    .catch(error => {
        console.error('打卡錯誤:', error);
        showMessage(resultDiv, '打卡時發生錯誤，請稍後重試', 'error');
    });
}

function loadRecentRecords() {
    fetch('/get_recent_records')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayRecentRecords(data.records);
        }
    })
    .catch(error => {
        console.error('載入最近記錄錯誤:', error);
    });
}

function updateRecentRecords() {
    // 重新載入最近記錄
    loadRecentRecords();
}

function displayRecentRecords(records) {
    const recordsDiv = document.getElementById('recentRecords');
    recordsDiv.innerHTML = '';

    if (records.length === 0) {
        recordsDiv.innerHTML = '<div class="no-records">暫無打卡記錄</div>';
        return;
    }

    records.forEach(record => {
        const recordItem = document.createElement('div');
        recordItem.className = 'record-item';
        
        const timestamp = new Date(record.timestamp);
        const timeStr = timestamp.toLocaleString('zh-TW');
        
        recordItem.innerHTML = `
            <div class="record-info">
                <strong>${record.name}</strong>
                <span>${record.class_name}班 ${record.seat_number}號</span>
                <span class="record-type ${record.type === '到班' ? 'in' : 'out'}">${record.type}</span>
            </div>
            <div class="record-time">${timeStr}</div>
        `;

        recordsDiv.appendChild(recordItem);
    });
}

function showMessage(element, message, type = 'info') {
    element.innerHTML = message;
    element.className = `result-message ${type}`;
    element.style.display = 'block';

    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 4000);
    }
}