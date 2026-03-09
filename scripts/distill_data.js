const fs = require('fs');
const history = JSON.parse(fs.readFileSync('history_2025.json', 'utf8'));

const distilled = {};

Object.entries(history).forEach(([month, rows]) => {
    // Header is row 0, sub-header is row 1
    // Data starts from row 2
    rows.slice(2).forEach(row => {
        const storeName = row[1];
        if (!storeName || storeName.trim() === "") return;
        
        const total = row[8] || 0;
        const memo = row[9] || "";
        
        if (!distilled[storeName]) {
            distilled[storeName] = {
                monthlyTotals: {},
                memos: []
            };
        }
        
        distilled[storeName].monthlyTotals[month] = total;
        if (memo.trim() !== "") {
            distilled[storeName].memos.push({ month, text: memo });
        }
    });
});

fs.writeFileSync('distilled_history_2025.json', JSON.stringify(distilled, null, 2));
console.log('Distilled data saved to distilled_history_2025.json');
