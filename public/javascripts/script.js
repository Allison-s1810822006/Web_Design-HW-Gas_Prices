// 🔁 商品名稱對應中文
function mapProductName(shortName) {
    if (shortName === '工業及其他用戶') return '工業及其他用戶 (液化天然氣) 元/公斤';
    if (shortName === '公用天然氣用戶') return '公用天然氣用戶 (液化天然氣) 元/公斤';
    return shortName;
}

// ➕ 新增資料
document.getElementById('insertForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        date: document.getElementById('date').value,
        product: document.getElementById('product').value,
        price: parseFloat(document.getElementById('price').value)
    };

    if (!data.date || !data.product || isNaN(data.price)) {
        alert('請完整填寫資料');
        return;
    }

    const res = await fetch('/api/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        alert('✅ 新增成功！');
        document.getElementById('insertForm').reset();
        fetchData();
    } else {
        alert('❌ 新增失敗');
    }
});

// 🔍 查詢功能
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const product = document.getElementById('productSelect').value;
    const rawDate = document.getElementById('dateSelect').value;

    let date = '';
    if (rawDate) {
        const parts = rawDate.split('-');
        date = `${parseInt(parts[0])}/${parseInt(parts[1])}/${parseInt(parts[2])}`;
    }

    let url = '/api/quotes?';
    if (product) url += `product=${encodeURIComponent(product)}&`;
    if (date) url += `date=${encodeURIComponent(date)}`;

    const res = await fetch(url);
    const data = await res.json();
    renderTable(data);
});

// 📊 顯示統計圖
document.getElementById('showChart').addEventListener('click', async () => {
    const selected = document.getElementById('chartSelect').value;
    const ctx = document.getElementById('priceChart').getContext('2d');
    if (window.chartInstance) window.chartInstance.destroy();

    if (!selected) return alert('請選擇商品類別');

    if (selected === 'both') {
        const [industrialRes, publicRes] = await Promise.all([
            fetch('/api/quotes?product=' + encodeURIComponent('工業及其他用戶')),
            fetch('/api/quotes?product=' + encodeURIComponent('公用天然氣用戶'))
        ]);

        const industrialData = await industrialRes.json();
        const publicData = await publicRes.json();

        const dates = industrialData.map(d => d.date).reverse();
        const industrialPrices = industrialData.map(d => d.price).reverse();
        const publicPrices = publicData.map(d => d.price).reverse();

        window.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: mapProductName('工業及其他用戶'),
                        data: industrialPrices,
                        borderColor: 'orange',
                        fill: false,
                        tension: 0.2
                    },
                    {
                        label: mapProductName('公用天然氣用戶'),
                        data: publicPrices,
                        borderColor: '#00bcd4', // 水藍色
                        fill: false,
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: '天然氣價格走勢圖' },
                    legend: { position: 'top' }
                }
            }
        });

    } else {
        const res = await fetch(`/api/quotes?product=${encodeURIComponent(selected)}`);
        const data = await res.json();

        if (!data.length) return alert('沒有資料可繪製統計圖');

        const labels = data.map(d => d.date).reverse();
        const prices = data.map(d => d.price).reverse();

        window.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: mapProductName(selected),
                    data: prices,
                    borderColor: selected === '工業及其他用戶' ? 'orange' : '#00bcd4',
                    fill: false,
                    tension: 0.2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: '天然氣價格走勢圖' },
                    legend: { display: true }
                }
            }
        });
    }
});

// 📋 顯示表格
function renderTable(data) {
    const tbody = document.getElementById('resultBody');
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3">目前尚無資料</td></tr>`;
        return;
    }

    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.date}</td>
            <td>${mapProductName(row.product)}</td>
            <td>${row.price}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 🚀 初始化
async function fetchData() {
    const res = await fetch('/api/quotes');
    const data = await res.json();
    renderTable(data);
}

fetchData();
