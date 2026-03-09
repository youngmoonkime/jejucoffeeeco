import { useState, useEffect, FormEvent } from 'react';
import { RefreshCw, Truck, X, Calendar, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { APPS_SCRIPT_URLS } from '../utils/constants';

interface Location {
  id: number;
  name: string;
}

interface DataInputViewProps {
  locations: Location[];
  availableYears: string[];
  selectedYear: string;
  availableMonths: string[];
  selectedMonth: string;
  availableWeeks: string[];
  initialStoreName?: string;
  editRecord?: any; // Add editRecord prop
  onSuccess: (year: string, month: string, storeName: string, weight: number, date: string, time: string) => void;
  isDarkMode: boolean;
}

export default function DataInputView({ locations, availableYears, selectedYear, availableMonths, selectedMonth, availableWeeks, initialStoreName, editRecord, onSuccess, isDarkMode }: DataInputViewProps) {
  const [inputData, setInputData] = useState({ 
    year: editRecord?.year || selectedYear || '', 
    month: editRecord?.month || selectedMonth || '', 
    week: editRecord?.week || availableWeeks[0] || '', 
    storeName: editRecord?.storeName || initialStoreName || '', 
    weight: editRecord?.weight?.toString() || '',
    date: editRecord?.date || new Date().toISOString().split('T')[0],
    time: editRecord?.time || new Date().toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' })
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (availableYears.length > 0 && !inputData.year) setInputData(d => ({...d, year: availableYears[0]})); }, [availableYears]);
  useEffect(() => { if (availableMonths.length > 0 && !inputData.month) setInputData(d => ({...d, month: availableMonths[0]})); }, [availableMonths]);
  useEffect(() => { if (availableWeeks.length > 0 && !inputData.week) setInputData(d => ({...d, week: availableWeeks[0]})); }, [availableWeeks]);
  useEffect(() => { if (initialStoreName && !editRecord) setInputData(d => ({...d, storeName: initialStoreName})); }, [initialStoreName, editRecord]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); 
    if (inputData.storeName === "" || inputData.weight === "") return;
    setIsSubmitting(true);
    try {
      const location = locations.find(l => l.name === inputData.storeName);
      if (!location) throw new Error("매장 정보를 찾을 수 없습니다.");

      const urlBase = APPS_SCRIPT_URLS[inputData.year];
      if (!urlBase) {
        throw new Error(`${inputData.year}년 데이터 주소가 설정되지 않았습니다.`);
      }

      const response = await fetch(urlBase, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify({
          ...inputData,
          weight: parseFloat(inputData.weight)
        }) 
      });

      setTimeout(async () => { 
        await onSuccess(inputData.year, inputData.month, inputData.storeName, parseFloat(inputData.weight), inputData.date, inputData.time); 
        setInputData(p => ({ ...p, weight: '' })); 
        setIsSubmitting(false); 
      }, 500);

    } catch (error: any) { 
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다: " + error.message);
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="max-w-[500px] mx-auto pt-4">
      <h2 className={`text-[32px] font-black text-center mb-10 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {editRecord ? '기록 수정' : '기록 등록'}
      </h2>
      <form onSubmit={handleSubmit} className={`p-8 rounded-[40px] shadow-2xl border space-y-8 glass`}>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#86868B] uppercase tracking-wider ml-1">연도</label>
            <select value={inputData.year} onChange={e => setInputData({...inputData, year: e.target.value})} className={`w-full p-4 border-none rounded-2xl font-black ${isDarkMode ? 'bg-white/5 text-white' : 'bg-[#F5F5F7] text-gray-900 shadow-inner'}`}>
              {availableYears.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#86868B] uppercase tracking-wider ml-1">월</label>
            <select value={inputData.month} onChange={e => setInputData({...inputData, month: e.target.value})} className={`w-full p-4 border-none rounded-2xl font-black ${isDarkMode ? 'bg-white/5 text-white' : 'bg-[#F5F5F7] text-gray-900 shadow-inner'}`}>
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#86868B] uppercase tracking-wider ml-1">주차</label>
            <select value={inputData.week} onChange={e => setInputData({...inputData, week: e.target.value})} className={`w-full p-4 border-none rounded-2xl font-black ${isDarkMode ? 'bg-white/5 text-white' : 'bg-[#F5F5F7] text-gray-900 shadow-inner'}`}>
              {availableWeeks.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black text-[#86868B] uppercase tracking-wider ml-1">지점</label>
          <select value={inputData.storeName} onChange={e => setInputData({...inputData, storeName: e.target.value})} className={`w-full p-4 border-none rounded-2xl font-black ${isDarkMode ? 'bg-white/5 text-white' : 'bg-[#F5F5F7] text-gray-900 shadow-inner'}`} required>
            <option value="">매장 선택</option>
            {[...locations].sort((a,b)=>a.id-b.id).map(loc => <option key={loc.id} value={loc.name}>{loc.id}. {loc.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#86868B] uppercase tracking-wider ml-1">수거 날짜</label>
            <div className={`w-full p-4 border-none rounded-2xl font-black flex items-center gap-3 ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-[#F5F5F7] text-gray-400 shadow-inner'} ${editRecord ? 'cursor-not-allowed opacity-80' : ''}`}>
              <Calendar size={18} className="text-emerald-500/50" />
              {editRecord ? (
                <span className="text-[15px]">{inputData.date}</span>
              ) : (
                <input 
                  type="date" 
                  value={inputData.date} 
                  onChange={e => setInputData({...inputData, date: e.target.value})} 
                  className="bg-transparent border-none p-0 focus:ring-0 w-full cursor-pointer" 
                  required 
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#86868B] uppercase tracking-wider ml-1">수거 시간</label>
            <div className={`w-full p-4 border-none rounded-2xl font-black flex items-center gap-3 ${isDarkMode ? 'bg-white/5 text-gray-400' : 'bg-[#F5F5F7] text-gray-400 shadow-inner'} ${editRecord ? 'cursor-not-allowed opacity-80' : ''}`}>
              <Clock size={18} className="text-emerald-500/50" />
              {editRecord ? (
                <span className="text-[15px]">{inputData.time}</span>
              ) : (
                <input 
                  type="time" 
                  value={inputData.time} 
                  onChange={e => setInputData({...inputData, time: e.target.value})} 
                  className="bg-transparent border-none p-0 focus:ring-0 w-full cursor-pointer" 
                  required 
                />
              )}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black text-[#86868B] uppercase tracking-wider ml-1">중량(kg)</label>
          <input type="number" step="0.1" value={inputData.weight} onChange={e => setInputData({...inputData, weight: e.target.value})} className={`w-full p-6 border-none rounded-2xl font-black text-[32px] text-center focus:ring-0 ${isDarkMode ? 'bg-white/5 text-white' : 'bg-[#F5F5F7] text-gray-900 shadow-inner'}`} placeholder="0.0" required />
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          disabled={isSubmitting} 
          className="w-full py-6 bg-[#059669] text-white rounded-[24px] font-black text-[20px] shadow-xl shadow-emerald-500/20 flex justify-center items-center gap-2 hover:bg-[#047857] transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed tracking-tight"
        >
          {isSubmitting ? <RefreshCw className="animate-spin" /> : <Truck size={24} />} 
          {editRecord ? '수정 완료' : '전송하기'}
        </motion.button>
      </form>
    </div>
  );
}
