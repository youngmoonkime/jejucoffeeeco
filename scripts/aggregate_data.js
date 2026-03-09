const fs = require('fs');

const YEARS = ['2025'];
const MONTHS = ['4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const URL_2025 = "https://script.google.com/macros/s/AKfycbyK85yXiY0oMkMzbqFrUPSbFYJOttvZsqePJ5OPYmdtRaHKgO_bUhxhyDFb8-n0_416/exec";

async function fetchAll() {
    const allData = {};
    for (const month of MONTHS) {
        console.log(`Fetching ${month}...`);
        try {
            const res = await fetch(`${URL_2025}?month=${month}`);
            const json = await res.json();
            allData[month] = json.data;
        } catch (e) {
            console.error(`Error fetching ${month}:`, e);
        }
    }
    fs.writeFileSync('history_2025.json', JSON.stringify(allData, null, 2));
    console.log('Done! Saved to history_2025.json');
}

fetchAll();
