// Jeju Coffee eCommerce Logistics Dashboard - Cloudflare Build Trigger
import { useState, useEffect, useCallback, useRef } from 'react';
import { Menu, Sun, Moon, RefreshCw, CloudRain, Cloud, Check, Download, X, Milk, PenTool, MapPin, PlusCircle, Navigation, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import NextDestination from './components/NextDestination';
import RemainingRoutes from './components/RemainingRoutes';
import RightColumn from './components/RightColumn';
import FloatingStatus from './components/FloatingStatus';
import DataInputView from './components/DataInputView';
import AnalysisView from './components/AnalysisView';
import LogisticsView from './components/LogisticsView';
import MapView from './components/MapView';
import AIInsightsView from './components/AIInsightsView';
import { APPS_SCRIPT_URLS, JEJU_COORDS } from './utils/constants';

const RANCHES = [
  { id: 1, name: "다원 목장" }
];

import { supabase } from './utils/supabase';

// Helper to parse sheet data (Legacy - kept for fallback or reference)
const parseSheetData = (result: any, currentRequestMonth: string) => {
  // ... (기존 로직 유지하되 사용 안 함)
  return { locations: [], weeklyTotals: [], logs: [], monthsFromSheet: [], resolvedMonth: '' };
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('jejueco_activeTab') || 'home';
  });

  useEffect(() => {
    localStorage.setItem('jejueco_activeTab', activeTab);
  }, [activeTab]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // 현재 날짜 기준 초기값 설정 (시스템 시간)
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1) + '월';

  // Home View State
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth); 
  const [selectedWeek, setSelectedWeek] = useState('1주차');
  const availableYears = ['2025', '2026'];
  const availableMonths = selectedYear === '2025' 
    ? ['4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    : ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const [availableWeeks, setAvailableWeeks] = useState<string[]>(['1주차', '2주차', '3주차', '4주차', '5주차']);
  const [locations, setLocations] = useState<any[]>([]);
  const [weeklyTotals, setWeeklyTotals] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [ranchLogs, setRanchLogs] = useState<any[]>([]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [targetStore, setTargetStore] = useState("");
  const [weather, setWeather] = useState({ temp: '--', condition: '로딩중', humidity: '--', windSpeed: '--', rain: '0' });
  const [forecast, setForecast] = useState<any[]>([]);
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [forcedCategory, setForcedCategory] = useState<string | undefined>(undefined);
  const isFirstLoad = useRef(true);
  const submissionsRef = useRef<{[key: string]: {date: string, time: string}}>(
    JSON.parse(localStorage.getItem('recentSubmissions') || '{}')
  );

  // 2.1 날씨 데이터 페칭 (OpenWeatherMap 적용)
  const fetchWeather = async () => {
    try {
      const API_KEY = "47ddd74a02e783d6951c2727cb2f7c52";
      const lat = 33.489;
      const lon = 126.498;
      
      // 현재 날씨
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      const weatherData = await weatherRes.json();
      
      const temp = Math.round(weatherData.main.temp).toString();
      const humidity = weatherData.main.humidity.toString();
      const windSpeed = weatherData.wind.speed.toFixed(1);
      const rain = (weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0).toString();
      const mainCondition = weatherData.weather[0].main.toLowerCase();
      
      let condition = "맑음";
      if (mainCondition.includes('cloud')) condition = "구름";
      else if (mainCondition.includes('rain') || mainCondition.includes('drizzle') || mainCondition.includes('snow') || mainCondition.includes('thunderstorm')) condition = "비/눈";
      
      setWeather({ temp, condition, humidity, windSpeed, rain });

      // 시간대별 예보 (1시간 단위 제공을 위해 Open-Meteo 사용)
      const forecastRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&forecast_days=1&timezone=auto`);
      const forecastData = await forecastRes.json();
      
      const currentHour = new Date().getHours();
      const hourly = [];
      
      for (let i = 0; i < 5; i++) {
        const targetIdx = currentHour + i;
        if (forecastData.hourly.time[targetIdx]) {
          const temp = Math.round(forecastData.hourly.temperature_2m[targetIdx]);
          const code = forecastData.hourly.weathercode[targetIdx];
          
          let cond = "맑음";
          if (code > 0 && code < 4) cond = "구름";
          else if (code >= 51) cond = "비/눈";
          
          hourly.push({
            time: `${targetIdx % 24}시`,
            temp: temp,
            condition: cond
          });
        }
      }
      
      setForecast(hourly);
    } catch (e) { 
      console.error("날씨 정보 불러오기 실패", e); 
    }
  };

  useEffect(() => { fetchWeather(); }, []);

  // 2.2 Google Sheet 데이터 동기화 (Supabase 제거)
  const syncWithSupabase = useCallback(async (targetYear = selectedYear, targetMonth = selectedMonth, targetWeek = selectedWeek) => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const timestamp = new Date().getTime();
      const urlBase = APPS_SCRIPT_URLS[targetYear];
      
      if (!urlBase) {
        throw new Error(`${targetYear}년 데이터 주소가 설정되지 않았습니다.`);
      }

      // 파일이 연도별로 분리되어 있으므로 시트 이름은 공통적으로 "1월" 형태를 사용한다고 가정합니다.
      // 만약 2025년 파일의 시트 이름이 "2025년 1월" 형태라면 아래 주석을 해제하고 수정하세요.
      // const sheetName = targetYear === '2025' ? `${targetYear}년 ${targetMonth}` : targetMonth;
      const sheetName = targetMonth; 
      
      const url = `${urlBase}?sheet=${encodeURIComponent(sheetName)}&t=${timestamp}`;
      const response = await fetch(url, { redirect: 'follow' });
      const result = await response.json();

      if (result.error) {
        throw new Error(`${result.error} (요청한 시트: '${sheetName}') - 시트 하단의 탭 이름과 정확히 일치하는지 확인해주세요.`);
      }

      const { data } = result;
      const headerRow = data.find((row: any[]) => row.includes('매장명'));
      if (!headerRow) throw new Error("시트 양식 에러");

      const nameColIndex = headerRow.indexOf('매장명');
      const timeColIndex = headerRow.findIndex((cell: any) => {
        const s = String(cell).toLowerCase().replace(/\s/g, '');
        return s.includes('시간') || s.includes('시각') || s.includes('time') || s.includes('시분') || s.includes('기록시') || s.includes('등록시') || s.includes('작성시') || s.includes('수거시');
      });
      const dateColIndex = headerRow.findIndex((cell: any) => {
        const s = String(cell).toLowerCase().replace(/\s/g, '');
        return s.includes('날짜') || s.includes('일자') || s.includes('일시') || s.includes('date') || s.includes('기록일') || s.includes('등록일') || s.includes('작성일') || s.includes('수거일') || s.includes('timestamp') || s.includes('created');
      });
      const weekColIndices = headerRow.reduce((acc: {label: string, idx: number}[], cell: any, idx: number) => {
        if (String(cell).includes('주차')) {
          acc.push({ label: String(cell).split('(')[0].trim(), idx });
        }
        return acc;
      }, []);

      const memoColIndex = headerRow.findIndex((cell: any) => {
        const s = String(cell).toLowerCase().replace(/\s/g, '');
        return s.includes('비고') || s.includes('메모') || s.includes('특이사항') || s.includes('note') || s.includes('memo');
      });
      
      const categoryColIndex = headerRow.findIndex((cell: any) => {
        const s = String(cell).toLowerCase().replace(/\s/g, '');
        return s.includes('카테고리') || s.includes('구분') || s.includes('category');
      });

      const mixtureColIndex = headerRow.findIndex((cell: any) => {
        const s = String(cell).toLowerCase().replace(/\s/g, '');
        return s.includes('진행내용') || s.includes('혼합');
      });
      const tempColIndex = headerRow.findIndex((cell: any) => {
        const s = String(cell).toLowerCase().replace(/\s/g, '');
        return s.includes('심도온도') || s.includes('온도'); // 우선 심도온도가 있으면 찾고, 아니면 일반 온도
      });
      const workingTimeColIndex = headerRow.findIndex((cell: any) => {
        const s = String(cell).toLowerCase().replace(/\s/g, '');
        return s.includes('외부온도') || s.includes('작업시간') || s.includes('소요시간');
      });
      const depthColIndex = headerRow.findIndex((cell: any) => String(cell).includes('심도') || String(cell).includes('높이'));
      const humidityColIndex = headerRow.findIndex((cell: any) => String(cell).includes('외부습도') || String(cell).includes('습도'));

      const validRows = data.filter((row: any[]) => row[0] && !isNaN(Number(row[0])) && row[nameColIndex] && !String(row[nameColIndex]).includes('총계'));

      // 병합된 셀(연휴 등) 채우기
      weekColIndices.forEach(({ idx }) => {
        let currentMergeValue = '';
        for (let i = 0; i < validRows.length; i++) {
          const val = validRows[i][idx];
          const strVal = (val !== undefined && val !== null) ? String(val).trim() : '';
          if (strVal !== '' && isNaN(Number(strVal)) && strVal !== '-') {
            currentMergeValue = strVal;
          } else if (strVal === '' && currentMergeValue !== '') {
            validRows[i][idx] = currentMergeValue;
          } else if (strVal !== '') {
            currentMergeValue = '';
          }
        }
      });

      const getHistoryForMonth = (headerRow: any[], rows: any[], targetLocName: string) => {
        const hNameColIdx = headerRow.indexOf('매장명');
        const hWeekColIndices = headerRow.reduce((acc: {label: string, idx: number}[], cell: any, idx: number) => {
          if (String(cell).includes('주차')) {
            acc.push({ label: String(cell).split('(')[0].trim(), idx });
          }
          return acc;
        }, []);
        
        const row = rows.find(r => String(r[hNameColIdx]).trim() === targetLocName);
        if (!row) return [];

        return hWeekColIndices.map(({label, idx}) => {
          const weightVal = row[idx];
          const numVal = parseFloat(String(weightVal || '').trim());
          return { name: label, weight: isNaN(numVal) ? 0 : numVal };
        });
      };

      const parsedLocations = validRows.map((row: any[]) => {
        const locId = parseInt(row[0]);
        const locName = String(row[nameColIndex]).trim();
        const lat = JEJU_COORDS[locName]?.lat || JEJU_COORDS["기본"].lat;
        const lng = JEJU_COORDS[locName]?.lng || JEJU_COORDS["기본"].lng;

        // history calculation
        let combinedHistory: { name: string, weight: number }[] = [];
        
        // 이전 달 데이터는 합치지 않음 (해당 달 데이터만 표시해달라는 요청 반영)
        // if (prevMonthResult && prevMonthResult.data) {
        //   const prevRows = prevMonthResult.data.slice(1);
        //   const prevHeader = prevMonthResult.data[0];
        //   const prevHist = getHistoryForMonth(prevHeader, prevRows, locName);
        //   combinedHistory = prevHist;
        // }

        // Add current month history
        weekColIndices.forEach(({label, idx}) => {
          const weightVal = row[idx];
          const numVal = parseFloat(String(weightVal || '').trim());
          combinedHistory.push({ name: label, weight: isNaN(numVal) ? 0 : numVal });
        });

        // Current status/weight based on targetWeek
        // Use findLastIndex or search backwards because same week labels ("1주차") can exist in prevMonthResult
        const targetCombinedIdx = combinedHistory.map(h => h.name).lastIndexOf(targetWeek);
        // Show last 4 weeks trend ending before current target week
        const historyToShow = targetCombinedIdx !== -1 
          ? combinedHistory.slice(Math.max(0, targetCombinedIdx - 4), targetCombinedIdx)
          : [];
        
        let lastWeekWeight = 0;
        if (historyToShow.length > 0) {
          lastWeekWeight = historyToShow[historyToShow.length - 1].weight;
        }

        let totalWeight = 0;
        let currentWeight = 0;
        let status = 'pending';
        let note = '';

        weekColIndices.forEach(({label, idx}) => {
          const val = row[idx];
          const strVal = (val !== undefined && val !== null) ? String(val).trim() : '';
          const numVal = parseFloat(strVal);

          if (strVal !== "") {
            if (strVal === '-' || (isNaN(Number(strVal)) && strVal !== '')) {
              if (label === targetWeek) {
                status = 'skipped';
                note = strVal;
              }
            } else if (!isNaN(numVal)) {
              totalWeight += numVal;
              if (label === targetWeek) {
                currentWeight = numVal;
                status = 'done';
                // 해당 주차에만 메모를 표시 (다른 주차로 메모 누수 방지)
                if (note === '' && memoColIndex !== -1 && row[memoColIndex] !== undefined && row[memoColIndex] !== null) {
                  note = String(row[memoColIndex]);
                }
              }
            }
          }
        });

        return {
          id: locId,
          name: locName,
          lat,
          lng,
          total: totalWeight,
          currentWeight: currentWeight,
          status,
          note: note,
          category: (() => {
            // 1. storeName 기반 우선 판별 (시트에 카테고리 컬럼이 없는 경우 대비)
            if (locName === '다원목장') return '목장 데이터';
            // 2. 카테고리 컬럼이 있으면 해당 컬럼 값으로 판별
            const cat = categoryColIndex !== -1 && row[categoryColIndex] !== undefined && row[categoryColIndex] !== null ? String(row[categoryColIndex]).trim().replace(/\s/g, '') : '';
            if (cat === '제주우유까대기' || cat === '목장데이터') return '목장 데이터';
            return '커피박 수거';
          })(),
          mixture: mixtureColIndex !== -1 && row[mixtureColIndex] !== undefined && row[mixtureColIndex] !== null ? String(row[mixtureColIndex]) : '',
          temp: tempColIndex !== -1 && row[tempColIndex] !== undefined && row[tempColIndex] !== null ? String(row[tempColIndex]) : '',
          workingTime: workingTimeColIndex !== -1 && row[workingTimeColIndex] !== undefined && row[workingTimeColIndex] !== null ? String(row[workingTimeColIndex]) : '',
          depth: depthColIndex !== -1 && row[depthColIndex] !== undefined && row[depthColIndex] !== null ? String(row[depthColIndex]) : '',
          humidity: humidityColIndex !== -1 && row[humidityColIndex] !== undefined && row[humidityColIndex] !== null ? String(row[humidityColIndex]) : '',
          history: historyToShow.length > 0 ? historyToShow : [{name: '데이터 없음', weight: 0}, {name: '데이터 없음', weight: 0}],
          lastWeekWeight
        };
      });



      // 로그 데이터 가공 (전체 주차)
      const tempLogs: any[] = [];
      validRows.forEach((row: any[]) => {
        const locId = parseInt(row[0]);
        const locName = String(row[nameColIndex]).trim();
        // 첫번째 패스: 해당 행의 주차별 항목 수집
        const rowEntries: any[] = [];
        let lastFilledWeekIdx = -1;

        weekColIndices.forEach(({label, idx}, weekIdx) => {
          const weightVal = row[idx];
          const strVal = weightVal !== undefined && weightVal !== null ? String(weightVal).trim() : '';
          
          if (strVal !== "") {
            const weekTimeIndex = headerRow.findIndex((cell: any) => String(cell).includes(label) && (String(cell).includes('시간') || String(cell).includes('시각')));
            const weekDateIndex = headerRow.findIndex((cell: any) => String(cell).includes(label) && (String(cell).includes('날짜') || String(cell).includes('일자')));

            const actualTime = weekTimeIndex !== -1 && row[weekTimeIndex] ? String(row[weekTimeIndex]) : 
                              (timeColIndex !== -1 && row[timeColIndex] ? String(row[timeColIndex]) : 
                               (submissionsRef.current[`${locName}-${label}`]?.time || '기록됨'));
            const actualDate = weekDateIndex !== -1 && row[weekDateIndex] ? String(row[weekDateIndex]) : 
                              (dateColIndex !== -1 && row[dateColIndex] ? String(row[dateColIndex]) : 
                               (submissionsRef.current[`${locName}-${label}`]?.date || label));

            const rawCategory = categoryColIndex !== -1 && row[categoryColIndex] !== undefined && row[categoryColIndex] !== null ? String(row[categoryColIndex]).trim().replace(/\s/g, '') : '';
            const isRanchData = locName === '다원목장' || rawCategory === '제주우유까대기' || rawCategory === '목장데이터';

            if (strVal === '-' || (isNaN(Number(strVal)) && strVal !== '')) {
              rowEntries.push({
                id: `${locId}-${label}`,
                seq: locId,
                storeName: locName,
                date: actualDate,
                time: actualTime === '기록됨' ? '제외됨' : actualTime,
                weight: strVal,
                isSkipped: true,
                weekLabel: label,
                category: isRanchData ? '목장 데이터' : '커피박 수거',
                memo: '',
              });
            } else if (!isNaN(parseFloat(strVal))) {
              if (!isRanchData) {
                lastFilledWeekIdx = rowEntries.length; // 마지막 유효 항목 인덱스 추적
                rowEntries.push({
                  id: `${locId}-${label}`,
                  seq: locId,
                  storeName: locName,
                  date: actualDate,
                  time: actualTime,
                  weight: parseFloat(strVal),
                  isSkipped: false,
                  weekLabel: label,
                  memo: '', // 나중에 마지막 주차에만 채워넣음
                  category: '커피박 수거',
                  mixture: mixtureColIndex !== -1 && row[mixtureColIndex] !== undefined && row[mixtureColIndex] !== null ? String(row[mixtureColIndex]) : '',
                  temp: tempColIndex !== -1 && row[tempColIndex] !== undefined && row[tempColIndex] !== null ? String(row[tempColIndex]) : '',
                  workingTime: workingTimeColIndex !== -1 && row[workingTimeColIndex] !== undefined && row[workingTimeColIndex] !== null ? String(row[workingTimeColIndex]) : '',
                  depth: depthColIndex !== -1 && row[depthColIndex] !== undefined && row[depthColIndex] !== null ? String(row[depthColIndex]) : '',
                  humidity: humidityColIndex !== -1 && row[humidityColIndex] !== undefined && row[humidityColIndex] !== null ? String(row[humidityColIndex]) : '',
                });
              }
            }
          }
        });

        // 두번째 패스: 가장 마지막에 기록된 주차에만 메모를 붙여서 tempLogs에 추가
        const rowMemo = memoColIndex !== -1 && row[memoColIndex] !== undefined && row[memoColIndex] !== null ? String(row[memoColIndex] || '') : '';
        rowEntries.forEach((entry, idx) => {
          if (idx === lastFilledWeekIdx && rowMemo) {
            tempLogs.push({ ...entry, memo: rowMemo });
          } else {
            tempLogs.push(entry);
          }
        });
      });

      // 주차별 합계 계산 (AnalysisView 용)
      const dynamicWeeks = weekColIndices.map(wi => wi.label);
      if (dynamicWeeks.length > 0) {
        setAvailableWeeks(dynamicWeeks);
        if (!dynamicWeeks.includes(targetWeek)) {
          setSelectedWeek(dynamicWeeks[0]);
        }
      }

      // 정렬 (completed 뒤로, pending 앞으로)
      parsedLocations.sort((a: any, b: any) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return a.id - b.id;
      });

      // Next location logic (isNext) -> 목장 데이터는 메인 수거 동선에서 제외
      let foundNext = false;
      const locationsWithNext = parsedLocations.map((loc: any) => {
        if (loc.category !== '목장 데이터' && loc.status === 'pending' && !foundNext) {
          foundNext = true;
          return { ...loc, isNext: true };
        }
        return { ...loc, isNext: false };
      });

      // Weekly Data for Graph
      const tempWeeklyTotals = dynamicWeeks.map(w => {
        const weekInfo = weekColIndices.find(wi => wi.label === w);
        let weight = 0;
        if (weekInfo) {
          validRows.forEach((row: any[]) => {
            const locName = String(row[nameColIndex]).trim();
            const rawCategory = categoryColIndex !== -1 && row[categoryColIndex] !== undefined && row[categoryColIndex] !== null ? String(row[categoryColIndex]).trim().replace(/\s/g, '') : '';
            const isRanchData = locName === '다원목장' || rawCategory === '제주우유까대기' || rawCategory === '목장데이터';

            if (!isRanchData) {
              const val = row[weekInfo.idx];
              if (val !== undefined && val !== null && val !== "" && !isNaN(parseFloat(val))) {
                weight += parseFloat(val);
              }
            }
          });
        }
        return { name: w, weight };
      });

      setLocations(locationsWithNext);
      setLogs(tempLogs);

      // 목장 데이터 따로 수집 (다원목장 위치 항목에서 주차별 데이터를 추출)
      const ranchRow = validRows.find((row: any[]) => String(row[nameColIndex]).trim() === '다원목장');
      if (ranchRow) {
        // 1단계: 수거량이 있는 주차 인덱스 수집
        const filledWeeks: {label: string, idx: number, weight: number}[] = [];
        weekColIndices.forEach(({label, idx}) => {
          const weightVal = ranchRow[idx];
          const strVal = weightVal !== undefined && weightVal !== null ? String(weightVal).trim() : '';
          if (strVal !== '' && !isNaN(parseFloat(strVal)) && parseFloat(strVal) > 0) {
            filledWeeks.push({ label, idx, weight: parseFloat(strVal) });
          }
        });

        // 2단계: 상세 필드는 마지막 기록 주차에만 붙이기 (시트에서 행 하나에 하나의 값만 있으므로)
        const detailFields = {
          depth: depthColIndex !== -1 && ranchRow[depthColIndex] !== undefined ? String(ranchRow[depthColIndex]) : '',
          temp: tempColIndex !== -1 && ranchRow[tempColIndex] !== undefined ? String(ranchRow[tempColIndex]) : '',
          humidity: humidityColIndex !== -1 && ranchRow[humidityColIndex] !== undefined ? String(ranchRow[humidityColIndex]) : '',
          workingTime: workingTimeColIndex !== -1 && ranchRow[workingTimeColIndex] !== undefined ? String(ranchRow[workingTimeColIndex]) : '',
          mixture: mixtureColIndex !== -1 && ranchRow[mixtureColIndex] !== undefined ? String(ranchRow[mixtureColIndex]) : '',
          memo: memoColIndex !== -1 && ranchRow[memoColIndex] !== undefined ? String(ranchRow[memoColIndex]) : '',
        };

        const tempRanchLogs = filledWeeks.map((fw, i) => ({
          id: `ranch-${fw.label}`,
          weekLabel: fw.label,
          weight: fw.weight,
          date: dateColIndex !== -1 && ranchRow[dateColIndex] ? String(ranchRow[dateColIndex]) : fw.label,
          time: timeColIndex !== -1 && ranchRow[timeColIndex] ? String(ranchRow[timeColIndex]) : '기록됨',
          // 상세 필드는 마지막 주차에만 첨부
          ...(i === filledWeeks.length - 1 ? detailFields : { depth: '', temp: '', humidity: '', workingTime: '', mixture: '', memo: '' }),
        }));
        setRanchLogs(tempRanchLogs);
      } else {
        setRanchLogs([]);
      }
      setWeeklyTotals(tempWeeklyTotals);
      setLastSyncTime(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

      // 처음 로드되거나 수동 새로고침 시, 데이터가 아예 없는 첫 주차를 자동으로 선택
      if (isFirstLoad.current) {
        const firstEmptyWeek = tempWeeklyTotals.find(w => w.weight === 0);
        if (firstEmptyWeek && firstEmptyWeek.name !== targetWeek) {
          setSelectedWeek(firstEmptyWeek.name);
        }
        isFirstLoad.current = false;
      }

    } catch (e: any) { 
      console.error("데이터 연동 에러:", e);
      setErrorMessage(`연동 에러: ${e.message}`); 
    } finally { 
      setIsSyncing(false); 
    }
  }, [selectedMonth, selectedWeek]);

  // Initial Load
  useEffect(() => {
    syncWithSupabase(selectedYear, selectedMonth, selectedWeek);
  }, [selectedYear, selectedMonth, selectedWeek, syncWithSupabase]);

  // Derived state for Home View -> 목장 데이터 제외
  const cafeLocations = locations.filter(l => l.category !== '목장 데이터');
  const doneCount = cafeLocations.filter(l => l.status === 'done' || l.status === 'skipped').length;
  const progress = Math.round((doneCount / (cafeLocations.length || 1)) * 100);
  const totalWeight = cafeLocations.reduce((sum, l) => sum + (l.status === 'done' ? l.currentWeight : 0), 0);
  const nextLocation = cafeLocations.find(l => l.isNext);
  const pendingLocations = cafeLocations.filter(l => l.status === 'pending' && !l.isNext);
  const completedLocations = cafeLocations.filter(l => l.status === 'done' || l.status === 'skipped');

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDarkMode ? "dark bg-[#1C1C1E] text-[#F5F5F7]" : "bg-[#F5F5F7] text-[#1D1D1F]"}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDarkMode={isDarkMode} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className={`flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-6 transition-all duration-300 lg:ml-[100px] flex flex-col`}>
        <div className="w-full h-full flex flex-col pb-20 lg:pb-0">
          {/* Header */}
          <header className={`p-4 md:p-6 rounded-[32px] mb-6 gap-4 md:gap-0 shrink-0 relative glass flex flex-col md:flex-row justify-between items-start md:items-end`}>
            {/* Toast Message */}
            {errorMessage && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-4 px-4 py-2 bg-gray-800 text-white text-sm rounded-full shadow-lg z-50 animate-in slide-in-from-top-4">
                {errorMessage}
              </div>
            )}
            <div className="flex items-center gap-3 md:block w-full md:w-auto">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 rounded-xl lg:hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 shadow-sm'}`}
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div>
                {activeTab !== 'jeju_milk' && (
                  <p className={`text-base font-medium flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <select 
                      value={selectedYear}
                      onChange={(e) => {
                        const newYear = e.target.value;
                        setSelectedYear(newYear);
                        let nextMonth = selectedMonth;
                        if (newYear === '2025' && ['1월', '2월', '3월'].includes(selectedMonth)) {
                          nextMonth = '4월';
                          setSelectedMonth('4월');
                        }
                        syncWithSupabase(newYear, nextMonth, selectedWeek);
                      }}
                      className={`bg-transparent border-none font-bold focus:ring-0 cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {availableYears.map(y => <option key={y} value={y}>{y}년</option>)}
                    </select>
                    <select 
                      value={selectedMonth}
                      onChange={(e) => {
                        const newMonth = e.target.value;
                        setSelectedMonth(newMonth);
                        isFirstLoad.current = true; // 월 변경 시에도 최적 주차 자동 선택 활성화
                        syncWithSupabase(selectedYear, newMonth, selectedWeek);
                      }}
                      className={`bg-transparent border-none font-bold focus:ring-0 cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {activeTab !== 'analysis' && (
                      <select 
                        value={selectedWeek}
                        onChange={(e) => {
                          const newWeek = e.target.value;
                          setSelectedWeek(newWeek);
                          syncWithSupabase(selectedYear, selectedMonth, newWeek);
                        }}
                        className={`bg-transparent border-none font-bold focus:ring-0 cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {availableWeeks.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    )}
                    {lastSyncTime && <span className="text-xs opacity-70 hidden sm:inline">({lastSyncTime} 업데이트)</span>}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6 self-end md:self-auto w-full md:w-auto justify-between md:justify-end">
              {/* Weather Widget (Small - Header) */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="w-7 h-7 rounded-lg bg-[#059669]/10 flex items-center justify-center text-[#059669]">
                  {weather.condition === '맑음' ? <Sun size={14} /> : weather.condition === '비/눈' ? <CloudRain size={14} /> : <Cloud size={14} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8E8E93] leading-none">제주</span>
                  <span className={`text-sm font-bold leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.temp}°</span>
                </div>
              </div>

              {/* Vehicle Status */}
              <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/10 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#059669] rounded-full animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]"></span>
                  <span className={`text-xs font-bold tracking-wide whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>815소 4465</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 pl-2">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-full transition-all active:scale-95 ${isDarkMode ? 'bg-yellow-400 text-black' : 'bg-white text-gray-400 hover:text-gray-600 shadow-sm'}`}>
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button onClick={() => syncWithSupabase(selectedYear, selectedMonth, selectedWeek)} disabled={isSyncing} className={`p-3 rounded-full hover:opacity-80 active:scale-95 transition-all ${isDarkMode ? 'bg-gray-800' : 'bg-[#059669] text-white shadow-lg shadow-emerald-200'}`}>
                  <RefreshCw size={20} className={`${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Sections with Animations */}
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col gap-6 flex-1 min-h-0"
              >
                {/* Progress Bar Card (Count based) */}
                <div className={`shrink-0 backdrop-blur-xl border shadow-sm rounded-[32px] px-6 py-5 flex items-center gap-6 glass`}>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>수거 진행률</span>
                      <span className="text-sm font-bold text-[#059669]">{Math.round((completedLocations.length / ((completedLocations.length + pendingLocations.length) || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full h-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((completedLocations.length / ((completedLocations.length + pendingLocations.length) || 1)) * 100)}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                        className="h-full bg-[#059669] rounded-full shadow-[0_0_12px_rgba(5,150,105,0.4)]"
                      />
                    </div>
                  </div>
                  <div className="text-right border-l border-emerald-100 dark:border-emerald-500/20 pl-6">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>남은 곳</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1D1D1F]'}`}>{pendingLocations.length} <span className="text-sm text-gray-500 font-medium">곳</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[400px]">
                  {/* Left Column - Next Destination */}
                  <section className="col-span-1 lg:col-span-8 h-full">
                    <NextDestination 
                      location={nextLocation} 
                      onRecordClick={(storeName, forceCategory) => {
                        setTargetStore(storeName || "");
                        setForcedCategory(forceCategory);
                        setIsInputModalOpen(true);
                      }} 
                      isDarkMode={isDarkMode} 
                    />
                  </section>

                  {/* Right Column - Weather */}
                  <section className="col-span-1 lg:col-span-4 h-full">
                    <RightColumn 
                      weather={weather} 
                      forecast={forecast}
                      completedRoutes={completedLocations} 
                      isDarkMode={isDarkMode} 
                    />
                  </section>
                </div>
              </motion.div>
            )}

            {activeTab === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
              >
                <AnalysisView 
                  locations={cafeLocations} 
                  weeklyTotals={weeklyTotals} 
                  availableYears={availableYears}
                  selectedYear={selectedYear}
                  availableMonths={availableMonths} 
                  selectedMonth={selectedMonth} 
                  syncWithGoogleSheet={(y, m) => {
                    setSelectedYear(y);
                    setSelectedMonth(m);
                    syncWithSupabase(y, m, selectedWeek);
                  }} 
                  isDarkMode={isDarkMode} 
                />
              </motion.div>
            )}

            {activeTab === 'ai_insights' && (
              <motion.div
                key="ai_insights"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4 }}
              >
                <AIInsightsView isDarkMode={isDarkMode} />
              </motion.div>
            )}

            {activeTab === 'jeju_milk' && (
              <motion.div 
                key="jeju_milk"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-6 max-w-4xl mx-auto w-full pt-6 pb-20"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-500/10 rounded-[28px] flex items-center justify-center text-blue-500 mb-6 border border-blue-500/20 shadow-xl shadow-blue-500/10">
                    <Milk size={40} />
                  </div>
                  <h2 className={`text-[36px] font-black mb-3 tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>목장 데이터</h2>
                  <p className={`text-base font-medium max-w-lg leading-relaxed mb-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    목장용 커피박의 부숙(발효) 과정을 관리하고 심도, 온도, 습도를 기록합니다.
                  </p>
                  
                  {/* 진행 상태 카드 */}
                  <div className="w-full mb-8">
                    <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-blue-50/50 border-blue-100 shadow-sm'}`}>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5">진행 상태</p>
                      <p className={`text-xl font-black text-blue-600`}>{ranchLogs.length > 0 ? `기록 진행 중 (${ranchLogs.length}건 완료)` : '기록 대기 중'}</p>
                    </div>
                  </div>

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setTargetStore('다원목장');
                      setForcedCategory('목장 데이터');
                      setIsInputModalOpen(true);
                    }}
                    className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 transition-all mb-8"
                  >
                    <PenTool className="w-6 h-6" />
                    새 목장 데이터 기록하기
                  </motion.button>

                  {/* 주차별 기록 목록 */}
                  {ranchLogs.length > 0 && (
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between px-2 mb-2">
                        <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>목장 기록 내역</h3>
                        <span className="text-[11px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">{ranchLogs.length}건</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {ranchLogs.map((l, i) => (
                          <motion.div
                            key={l.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`rounded-[28px] border overflow-hidden glass ${isDarkMode ? 'border-white/5' : 'border-blue-100 shadow-sm'}`}
                          >
                            {/* 헤더 */}
                            <div className={`flex items-center justify-between px-6 py-4 ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                              <div className="flex items-center gap-3">
                                <span className="text-blue-500 font-black text-[15px]">{l.weekLabel}</span>
                                <span className={`text-[11px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{l.date}</span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-blue-500 font-black text-xl">{l.weight}</span>
                                <span className="text-[10px] font-black text-gray-400">kg 수거</span>
                              </div>
                            </div>
                            {/* 상세 데이터 */}
                            <div className="px-6 py-4 grid grid-cols-2 gap-3">
                              {l.depth && <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>심도</span>
                                <span className={`text-[14px] font-black text-blue-500`}>{l.depth}<span className="text-[10px] ml-0.5">cm</span></span>
                              </div>}
                              {l.temp && <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>심도온도</span>
                                <span className={`text-[14px] font-black text-blue-500`}>{l.temp}<span className="text-[10px] ml-0.5">°C</span></span>
                              </div>}
                              {l.workingTime && <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>외부온도</span>
                                <span className={`text-[14px] font-black text-blue-500`}>{l.workingTime}<span className="text-[10px] ml-0.5">°C</span></span>
                              </div>}
                              {l.humidity && <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>외부습도</span>
                                <span className={`text-[14px] font-black text-blue-500`}>{l.humidity}<span className="text-[10px] ml-0.5">%</span></span>
                              </div>}
                              {l.mixture && <div className="col-span-2 flex items-start gap-2">
                                <span className={`text-[11px] font-black uppercase tracking-wider mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>진행내용</span>
                                <span className={`text-[13px] font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{l.mixture}</span>
                              </div>}
                              {l.memo && <div className="col-span-2 flex items-start gap-2">
                                <span className={`text-[11px] font-black uppercase tracking-wider mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>특이사항</span>
                                <span className={`text-[13px] font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{l.memo}</span>
                              </div>}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[600px] md:h-[700px] rounded-[40px] overflow-hidden shadow-2xl border border-gray-200/20 glass"
              >
                <MapView 
                  locations={locations} 
                  isDarkMode={isDarkMode} 
                />
              </motion.div>
            )}

            {activeTab === 'logistics' && (
              <motion.div
                key="logistics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <LogisticsView 
                  logs={logs} 
                  searchTerm={searchTerm} 
                  setSearchTerm={setSearchTerm} 
                  onEdit={(log) => {
                    setEditingRecord(log);
                    setTargetStore(log.storeName);
                    setIsInputModalOpen(true);
                  }}
                  isDarkMode={isDarkMode} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Input Modal */}
      <AnimatePresence>
        {isInputModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[500px]"
            >
              <button 
                onClick={() => {
                  setIsInputModalOpen(false);
                  setEditingRecord(null);
                  setForcedCategory(undefined);
                }}
                className={`absolute top-6 right-6 p-2 rounded-full z-10 transition-colors ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                <X size={20} />
              </button>
              <DataInputView 
                locations={locations}
                availableYears={availableYears}
                selectedYear={selectedYear}
                availableMonths={availableMonths}
                selectedMonth={selectedMonth}
                availableWeeks={availableWeeks}
                selectedWeek={selectedWeek}
                initialStoreName={targetStore} 
                editRecord={editingRecord}
                forceCategory={forcedCategory}
                ranches={RANCHES}
                logs={logs}
                onSuccess={(year, month, week, storeName, weight, date, time) => {
                  const newSubmissions = {
                    ...submissionsRef.current,
                    [`${storeName}-${week}`]: { date, time }
                  };
                  submissionsRef.current = newSubmissions;
                  localStorage.setItem('recentSubmissions', JSON.stringify(newSubmissions));
                  
                  setIsInputModalOpen(false);
                  setEditingRecord(null);
                  setForcedCategory(undefined);
                  setIsSuccessModalOpen(true);
                  
                  setSelectedYear(year);
                  setSelectedMonth(month);
                  setSelectedWeek(week);
                  syncWithSupabase(year, month, week);
                }} 
                isDarkMode={isDarkMode} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`glass p-8 rounded-[40px] max-w-sm w-full text-center shadow-2xl relative overflow-hidden`}
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className={`text-2xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>저장 완료!</h3>
              <p className="text-gray-500 font-medium mb-8 text-sm">기록이 성공적으로 전송되었습니다.</p>
              <button 
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full bg-[#059669] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
              >
                확인
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
