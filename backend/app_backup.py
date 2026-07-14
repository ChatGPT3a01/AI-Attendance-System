from flask import Flask, render_template, request, jsonify, send_file, redirect, url_for
import os
import csv
import json
import sqlite3
from datetime import datetime
from werkzeug.utils import secure_filename
import io

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = '../uploads'
app.config['PHOTOS_FOLDER'] = '../photos'
app.config['DATA_FOLDER'] = '../data'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# 確保資料夾存在
for folder in [app.config['UPLOAD_FOLDER'], app.config['PHOTOS_FOLDER'], app.config['DATA_FOLDER']]:
    os.makedirs(folder, exist_ok=True)

# 初始化資料庫
def init_db():
    conn = sqlite3.connect(os.path.join(app.config['DATA_FOLDER'], 'attendance.db'))
    cursor = conn.cursor()

    # 學生資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_name TEXT NOT NULL,
            seat_number INTEGER NOT NULL,
            name TEXT NOT NULL,
            position TEXT,
            photo_path TEXT,
            UNIQUE(class_name, seat_number)
        )
    ''')

    # 打卡記錄表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            class_name TEXT NOT NULL,
            seat_number INTEGER NOT NULL,
            name TEXT NOT NULL,
            record_type TEXT NOT NULL,  -- 'in' for 到班, 'out' for 離班
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students (id)
        )
    ''')

    conn.commit()
    conn.close()

# 首頁
@app.route('/')
def index():
    return render_template('index.html')

# 管理介面
@app.route('/admin')
def admin():
    return render_template('admin.html')

# 打卡介面
@app.route('/attendance')
def attendance():
    return render_template('attendance.html')

# 下載CSV模板
@app.route('/download_template')
def download_template():
    # 使用BytesIO來處理編碼
    output = io.BytesIO()
    
    # 寫入BOM標記，確保Excel能正確識別UTF-8編碼
    output.write('\ufeff'.encode('utf-8'))
    
    # 建立CSV內容
    csv_content = io.StringIO()
    writer = csv.writer(csv_content)
    writer.writerow(['班級', '座號', '姓名', '幹部職稱'])
    writer.writerow(['範例:107', '1', '張三', '班長'])
    writer.writerow(['範例:107', '2', '李四', ''])
    
    # 將CSV內容編碼為UTF-8並寫入
    output.write(csv_content.getvalue().encode('utf-8'))
    output.seek(0)

    # 建立回應
    response = app.response_class(
        output.getvalue(),
        mimetype='text/csv; charset=utf-8',
        headers={
            "Content-disposition": "attachment; filename=student_template.csv",
            "Content-Type": "text/csv; charset=utf-8"
        }
    )
    return response

# 上傳CSV檔案
@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '沒有選擇檔案'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': '沒有選擇檔案'})

    if file and file.filename.endswith('.csv'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # 解析CSV檔案
        try:
            success_count = 0
            error_messages = []

            conn = sqlite3.connect(os.path.join(app.config['DATA_FOLDER'], 'attendance.db'))
            cursor = conn.cursor()

            # 嘗試多種編碼格式來讀取CSV檔案
            encodings_to_try = ['utf-8-sig', 'utf-8', 'big5', 'gbk', 'cp950']
            csvfile = None
            
            for encoding in encodings_to_try:
                try:
                    csvfile = open(filepath, 'r', encoding=encoding)
                    # 嘗試讀取第一行來測試編碼是否正確
                    csvfile.readline()
                    csvfile.seek(0)
                    break
                except (UnicodeDecodeError, UnicodeError):
                    if csvfile:
                        csvfile.close()
                    continue
            
            if csvfile is None:
                return jsonify({'success': False, 'message': 'CSV檔案編碼格式不支援，請使用UTF-8編碼儲存檔案'})

            try:
                reader = csv.DictReader(csvfile)
                for row_num, row in enumerate(reader, start=2):
                    try:
                        class_name = row['班級'].strip()
                        seat_number = int(row['座號'])
                        name = row['姓名'].strip()
                        position = row['幹部職稱'].strip() if row['幹部職稱'] else ''

                        # 檢查照片是否存在
                        photo_filename = f"{class_name}{seat_number}.jpg"
                        photo_path = os.path.join(app.config['PHOTOS_FOLDER'], photo_filename)

                        if not os.path.exists(photo_path):
                            photo_filename = f"{class_name}{seat_number}.png"
                            photo_path = os.path.join(app.config['PHOTOS_FOLDER'], photo_filename)

                        photo_exists = os.path.exists(photo_path)

                        # 插入或更新學生資料
                        cursor.execute('''
                            INSERT OR REPLACE INTO students
                            (class_name, seat_number, name, position, photo_path)
                            VALUES (?, ?, ?, ?, ?)
                        ''', (class_name, seat_number, name, position,
                              photo_filename if photo_exists else None))

                        success_count += 1

                    except Exception as e:
                        error_messages.append(f"第{row_num}行錯誤: {str(e)}")

                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': f'成功匯入 {success_count} 筆資料',
                    'errors': error_messages
                })
                
            finally:
                csvfile.close()
                conn.close()

        except Exception as e:
            return jsonify({'success': False, 'message': f'解析檔案時發生錯誤: {str(e)}'})

    return jsonify({'success': False, 'message': '請上傳CSV檔案'})

# 查詢學生資料
@app.route('/get_student', methods=['POST'])
def get_student():
    data = request.json
    class_name = data.get('class_name')
    seat_number = data.get('seat_number')

    conn = sqlite3.connect(os.path.join(app.config['DATA_FOLDER'], 'attendance.db'))
    cursor = conn.cursor()

    cursor.execute('''
        SELECT * FROM students
        WHERE class_name = ? AND seat_number = ?
    ''', (class_name, seat_number))

    student = cursor.fetchone()
    conn.close()

    if student:
        return jsonify({
            'success': True,
            'student': {
                'id': student[0],
                'class_name': student[1],
                'seat_number': student[2],
                'name': student[3],
                'position': student[4] or '',
                'photo_path': student[5]
            }
        })
    else:
        return jsonify({'success': False, 'message': '找不到學生資料'})

# 打卡
@app.route('/punch_card', methods=['POST'])
def punch_card():
    data = request.json
    class_name = data.get('class_name')
    seat_number = data.get('seat_number')
    record_type = data.get('type')  # 'in' or 'out'

    # 先查詢學生資料
    conn = sqlite3.connect(os.path.join(app.config['DATA_FOLDER'], 'attendance.db'))
    cursor = conn.cursor()

    cursor.execute('''
        SELECT id, name FROM students
        WHERE class_name = ? AND seat_number = ?
    ''', (class_name, seat_number))

    student = cursor.fetchone()

    if not student:
        conn.close()
        return jsonify({'success': False, 'message': '找不到學生資料'})

    student_id, student_name = student

    # 記錄打卡
    cursor.execute('''
        INSERT INTO attendance_records
        (student_id, class_name, seat_number, name, record_type, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (student_id, class_name, seat_number, student_name, record_type, datetime.now()))

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': f"{student_name} {'到班' if record_type == 'in' else '離班'}打卡成功",
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })

# 匯出出缺勤記錄
@app.route('/export_attendance', methods=['POST'])
def export_attendance():
    data = request.json
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    conn = sqlite3.connect(os.path.join(app.config['DATA_FOLDER'], 'attendance.db'))
    cursor = conn.cursor()

    cursor.execute('''
        SELECT class_name, seat_number, name, record_type, timestamp
        FROM attendance_records
        WHERE DATE(timestamp) BETWEEN ? AND ?
        ORDER BY timestamp
    ''', (start_date, end_date))

    records = cursor.fetchall()
    conn.close()

    # 建立CSV輸出
    output = io.BytesIO()
    
    # 寫入BOM標記，確保Excel能正確識別UTF-8編碼
    output.write('\ufeff'.encode('utf-8'))
    
    # 建立CSV內容
    csv_content = io.StringIO()
    writer = csv.writer(csv_content)
    writer.writerow(['班級', '座號', '姓名', '類型', '時間'])

    for record in records:
        writer.writerow([
            record[0],
            record[1],
            record[2],
            '到班' if record[3] == 'in' else '離班',
            record[4]
        ])

    # 將CSV內容編碼為UTF-8並寫入
    output.write(csv_content.getvalue().encode('utf-8'))
    output.seek(0)

    response = app.response_class(
        output.getvalue(),
        mimetype='text/csv; charset=utf-8',
        headers={
            "Content-disposition": f"attachment; filename=attendance_{start_date}_to_{end_date}.csv",
            "Content-Type": "text/csv; charset=utf-8"
        }
    )
    return response

# 取得學生照片
@app.route('/get_photo/<class_name>/<int:seat_number>')
def get_photo(class_name, seat_number):
    photo_filename = f"{class_name}{seat_number}"

    # 嘗試不同的圖片格式
    for ext in ['.jpg', '.jpeg', '.png', '.gif']:
        photo_path = os.path.join(app.config['PHOTOS_FOLDER'], photo_filename + ext)
        if os.path.exists(photo_path):
            return send_file(photo_path)

    # 如果沒有找到照片，返回預設圖片或錯誤
    return jsonify({'error': '照片不存在'}), 404

# 取得最近打卡記錄
@app.route('/get_recent_records')
def get_recent_records():
    conn = sqlite3.connect(os.path.join(app.config['DATA_FOLDER'], 'attendance.db'))
    cursor = conn.cursor()

    cursor.execute('''
        SELECT class_name, seat_number, name, record_type, timestamp
        FROM attendance_records
        ORDER BY timestamp DESC
        LIMIT 10
    ''')

    records = cursor.fetchall()
    conn.close()

    recent_records = []
    for record in records:
        recent_records.append({
            'class_name': record[0],
            'seat_number': record[1],
            'name': record[2],
            'type': '到班' if record[3] == 'in' else '離班',
            'timestamp': record[4]
        })

    return jsonify({'success': True, 'records': recent_records})

# 取得學生列表（用於管理）
@app.route('/get_students')
def get_students():
    conn = sqlite3.connect(os.path.join(app.config['DATA_FOLDER'], 'attendance.db'))
    cursor = conn.cursor()

    cursor.execute('''
        SELECT class_name, seat_number, name, position, photo_path
        FROM students
        ORDER BY class_name, seat_number
    ''')

    students = cursor.fetchall()
    conn.close()

    student_list = []
    for student in students:
        student_list.append({
            'class_name': student[0],
            'seat_number': student[1],
            'name': student[2],
            'position': student[3] or '',
            'has_photo': bool(student[4])
        })

    return jsonify({'success': True, 'students': student_list})

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)