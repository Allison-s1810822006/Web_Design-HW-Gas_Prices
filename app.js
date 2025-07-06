// app.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// 中介層
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // 提供前端頁面

// 連接 SQLite 資料庫
const db = new sqlite3.Database('./db/gas_prices.db', (err) => {
    if (err) return console.error(err.message);
    console.log('✅ 成功連接 SQLite 資料庫');
});

// 建立資料表
db.run(`
  CREATE TABLE IF NOT EXISTS gas_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    product TEXT NOT NULL,
    price REAL NOT NULL
  )
`);

// 🔍 查詢 API（支援條件查詢）
app.get('/api/quotes', (req, res) => {
    const { product, date } = req.query;
    let sql = `SELECT * FROM gas_prices WHERE 1=1`;
    const params = [];

    if (product) {
        sql += ` AND product = ?`;
        params.push(product);
    }

    if (date) {
        sql += ` AND date = ?`;
        params.push(date); // ✅ 不再解析或轉換日期格式
    }

    sql += ` ORDER BY date DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ➕ 新增資料 API
app.post('/api/insert', (req, res) => {
    const { date, product, price } = req.body;

    if (!date || !product || isNaN(price)) {
        return res.status(400).json({ error: '資料格式錯誤' });
    }

    const sql = `INSERT INTO gas_prices (date, product, price) VALUES (?, ?, ?)`;
    db.run(sql, [date, product, price], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, date, product, price });
    });
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`🚀 伺服器啟動：http://localhost:${port}`);
});
