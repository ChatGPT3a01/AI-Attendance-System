# 到班打卡系統

一個基於Flask的地端學生到班打卡系統，支援CSV學生名單匯入、照片管理、打卡記錄和出缺勤報表匯出。

## 功能特色

- 📋 CSV學生名單模板下載與上傳
- 📸 學生照片自動配對顯示
- ⏰ 到班/離班打卡記錄
- 📊 出缺勤記錄匯出
- 💾 本地SQLite資料庫儲存
- 🎨 響應式網頁設計

## 系統需求

- Python 3.7 或更高版本
- Windows/macOS/Linux 作業系統

## 安裝與設定

### 1. 下載專案
```bash
# 請確保您已下載了整個 attendance_system 資料夾
```

### 2. 安裝Python依賴套件
```bash
cd attendance_system
pip install -r requirements.txt
```

### 3. 執行系統
```bash
cd backend
python app.py
```

系統將會在 `http://localhost:5000` 啟動

## 使用說明

### 初次設定

1. **下載CSV模板**
   - 開啟瀏覽器，前往 `http://localhost:5000`
   - 點選「管理」進入管理介面
   - 點選「下載CSV模板」

2. **填寫學生資料**
   - 在CSV模板中填入：
     - 班級（例如：107）
     - 座號（例如：23）
     - 姓名（例如：張三）
     - 幹部職稱（例如：班長，可留空）

3. **上傳學生名單**
   - 在管理介面點選「選擇CSV檔案」
   - 選擇填好的CSV檔案
   - 點選「上傳」

4. **放置學生照片**
   - 將學生照片放入 `photos` 資料夾
   - 照片命名規則：`班級+座號`
   - 例如：107班23號 → `10723.jpg` 或 `10723.png`
   - 例如：107班6號 → `1076.jpg` 或 `1076.png`
   - 注意：座號不需要補零，直接使用實際座號數字
   - 支援的格式：jpg, jpeg, png, gif

### 日常使用

1. **學生打卡**
   - 點選「打卡」進入打卡介面
   - 輸入班級和座號
   - 點選「查詢學生」
   - 確認學生資訊後點選「到班打卡」或「離班打卡」

2. **匯出出缺勤記錄**
   - 進入管理介面
   - 選擇開始和結束日期
   - 點選「匯出出缺勤記錄」
   - 系統會下載CSV格式的報表

## 資料夾結構

```
attendance_system/
├── backend/
│   ├── app.py              # Flask主程式
│   ├── templates/          # HTML模板
│   │   ├── index.html      # 首頁
│   │   ├── admin.html      # 管理介面
│   │   └── attendance.html # 打卡介面
│   └── static/             # 靜態檔案
│       ├── css/
│       │   └── style.css   # 樣式表
│       ├── js/
│       │   ├── main.js     # 主要JavaScript
│       │   ├── admin.js    # 管理介面JavaScript
│       │   └── attendance.js # 打卡介面JavaScript
│       └── images/         # 圖片資源
├── photos/                 # 學生照片存放處
├── uploads/                # 上傳檔案暫存
├── data/                   # 資料庫檔案
└── requirements.txt        # Python依賴套件
```

## 資料庫結構

系統使用SQLite資料庫，包含以下資料表：

### students（學生資料表）
- id: 主鍵
- class_name: 班級
- seat_number: 座號
- name: 姓名
- position: 幹部職稱
- photo_path: 照片路徑

### attendance_records（打卡記錄表）
- id: 主鍵
- student_id: 學生ID（外鍵）
- class_name: 班級
- seat_number: 座號
- name: 姓名
- record_type: 記錄類型（'in'=到班, 'out'=離班）
- timestamp: 時間戳記

## 常見問題

### Q: 照片無法顯示？
A: 請檢查：
1. 照片檔案名稱是否正確（班級+座號）
2. 照片是否放在 `photos` 資料夾中
3. 照片格式是否為 jpg, jpeg, png, gif

### Q: CSV上傳失敗？
A: 請檢查：
1. CSV檔案格式是否正確
2. 欄位名稱是否為：班級、座號、姓名、幹部職稱
3. 資料是否有缺漏或格式錯誤
4. 如果出現亂碼，請確保CSV檔案以UTF-8編碼儲存

### Q: CSV檔案出現亂碼？
A: 本系統已改善編碼處理：
1. 下載的CSV模板已包含BOM標記，確保Excel能正確顯示繁體中文
2. 上傳功能支援多種編碼格式（UTF-8、Big5、GBK等）
3. 如果仍有問題，建議使用記事本開啟CSV檔案，另存為UTF-8編碼

### Q: 打卡時找不到學生？
A: 請確認：
1. 學生資料是否已正確上傳
2. 輸入的班級和座號是否正確
3. 資料庫是否正常運作

## 技術支援

如有問題或建議，請檢查：
1. Python錯誤訊息
2. 瀏覽器控制台錯誤
3. 系統log檔案

## 版本資訊

- 版本：1.0.0
- 開發語言：Python + Flask
- 前端技術：HTML5 + CSS3 + JavaScript
- 資料庫：SQLite
- 支援瀏覽器：Chrome、Firefox、Safari、Edge

## 安全說明

- 本系統為地端應用，資料儲存在本機
- 建議定期備份 `data` 資料夾中的資料庫檔案
- 如需網路存取，請注意設定適當的安全措施