async function testApi() {
  const url = 'https://script.google.com/macros/s/AKfycbx3CIMOKJF_XreMA78tbVfdb0zQlFnX6oyxFK9ZTbiHovBCvwDpBM7DmNBXQSWz3WQp/exec';
  const payload = {
    year: "2026",
    month: "3월",
    week: "2주차",
    storeName: "에이바우트커피 베라체점",
    weight: 0,
    date: "2026-03-18",
    time: "20:00",
    category: "커피박 수거",
    memo: "테스트 0",
    mixture: "",
    temp: "",
    workingTime: "",
    depth: "",
    humidity: ""
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain' }
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch(e) {
    console.error("Error:", e);
  }
}

testApi();
