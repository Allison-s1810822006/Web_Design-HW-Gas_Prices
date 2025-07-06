const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

// 初始化 SQLite 資料庫
const db = new sqlite3.Database('./db/gas_prices.db');

// 建立資料表
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS gas_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      product TEXT NOT NULL,
      price REAL NOT NULL
    )
  `, async (err) => {
        if (err) {
            console.error("❌ 資料表建立失敗", err.message);
            return;
        }

        const results = [];
        const rl = readline.createInterface({
            input: fs.createReadStream('gas_prices.csv'),
            crlfDelay: Infinity
        });

        let isFirstLine = true;
        for await (const line of rl) {
            if (isFirstLine) {
                isFirstLine = false; // 跳過欄位名稱列
                continue;
            }

            const [date, industrialStr, publicStr] = line.split(',');
            const industrial = parseFloat(industrialStr);
            const publicUse = parseFloat(publicStr);

            if (date && !isNaN(industrial)) {
                results.push({ date: date.trim(), product: '工業及其他用戶', price: industrial });
            }
            if (date && !isNaN(publicUse)) {
                results.push({ date: date.trim(), product: '公用天然氣用戶', price: publicUse });
            }
        }

        console.log(`✅ 準備匯入 ${results.length} 筆資料...`);

        const insert = db.prepare("INSERT INTO gas_prices (date, product, price) VALUES (?, ?, ?)");
        results.forEach(row => {
            insert.run(row.date, row.product, row.price);
        });
        insert.finalize(() => {
            db.close();
            console.log("✅ 匯入完成！");
        });
    });
});
