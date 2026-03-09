export const NAVER_MAP_CLIENT_ID = "YOUR_NAVER_CLIENT_ID"; 
export const APPS_SCRIPT_URLS: Record<string, string> = {
  "2025": "https://script.google.com/macros/s/AKfycbyK85yXiY0oMkMzbqFrUPSbFYJOttvZsqePJ5OPYmdtRaHKgO_bUhxhyDFb8-n0_416/exec", // 2025년 데이터 URL (사용자 입력 필요)
  "2026": "https://script.google.com/macros/s/AKfycbx3CIMOKJF_XreMA78tbVfdb0zQlFnX6oyxFK9ZTbiHovBCvwDpBM7DmNBXQSWz3WQp/exec"
};

export const JEJU_COORDS: Record<string, { lat: number; lng: number }> = {
  "에이바우트커피 첨단점": { lat: 33.4507, lng: 126.5706 },
  "에이바우트커피 제대후문점": { lat: 33.4550, lng: 126.5610 },
  "카페봄봄 제주대후문점": { lat: 33.4540, lng: 126.5600 },
  "카페봄봄 제주대점": { lat: 33.4510, lng: 126.5615 },
  "에이바우트커피 베라체점": { lat: 33.4839, lng: 126.5395 },
  "텐퍼센트커피 제주법원점": { lat: 33.4930, lng: 126.5360 },
  "블루샥 제주법원점": { lat: 33.4935, lng: 126.5355 },
  "에이바우트커피 법원점": { lat: 33.4940, lng: 126.5365 },
  "메가MGC커피 제일도점": { lat: 33.5080, lng: 126.5350 },
  "빽다방 일도인제점": { lat: 33.5075, lng: 126.5345 },
  "기본": { lat: 33.4890, lng: 126.4983 } 
};
