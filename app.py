from flask import Flask, send_from_directory
import os

# 初始化 Flask，將靜態檔案目錄設為當前目錄
app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    """首頁路由，回傳 index.html"""
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    print("StudyPlayer 伺服器啟動中...")
    print("網址: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
