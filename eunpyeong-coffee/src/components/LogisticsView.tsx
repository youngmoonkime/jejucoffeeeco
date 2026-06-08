import { useState, useMemo, useEffect } from 'react';
import { Search, Clock, Calendar, Edit2, Scale, ChevronDown, ChevronUp, Sliders, RefreshCw, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APPS_SCRIPT_URLS } from '../utils/constants';

interface LogisticsViewProps {
  logs: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onEdit: (log: any) => void;
  isDarkMode: boolean;
  selectedYear: string;
  selectedMonth: string;
  onRefresh: () => Promise<void>;
}

export default function LogisticsView({ logs, searchTerm, setSearchTerm, onEdit, isDarkMode, selectedYear, selectedMonth, onRefresh }: LogisticsViewProps) {
  const availableWeeks = useMemo(() => { 
    const weeks = [...new Set(logs.map(l => l.weekLabel || l.date))]; 
    return weeks.sort((a, b) => parseInt(a) - parseInt(b)); 
  }, [logs]);
  
  const [selectedWeek, setSelectedWeek] = useState('');
  
  const [isAdjustPanelOpen, setIsAdjustPanelOpen] = useState(false);
  const [actualWeightInput, setActualWeightInput] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [adjustmentProgress, setAdjustmentProgress] = useState(0);
  const [totalToAdjust, setTotalToAdjust] = useState(0);

  const backupKey = `eunpyeong_backup_${selectedYear}_${selectedMonth}_${selectedWeek}`;
  const [hasBackup, setHasBackup] = useState(false);

  useEffect(() => {
    const backup = localStorage.getItem(backupKey);
    setHasBackup(!!backup);
  }, [selectedYear, selectedMonth, selectedWeek, isSubmittingAdjustment]);
  
  useEffect(() => { 
    if (availableWeeks.length > 0 && (!selectedWeek || !availableWeeks.includes(selectedWeek))) {
      setSelectedWeek(availableWeeks[0]); 
    }
  }, [availableWeeks, selectedWeek]);
  
  const weekLogs = useMemo(() => {
    return logs.filter(l => 
      (l.weekLabel || l.date) === selectedWeek && 
      l.category !== '목장 데이터' && 
      l.category !== '목장데이터' && 
      l.storeName !== '다원목장'
    );
  }, [logs, selectedWeek]);

  // 10kg 이상 수거된 매장들만 보정 대상으로 필터링
  const activeLogsToAdjust = useMemo(() => {
    return weekLogs.filter(l => !l.isSkipped && typeof l.weight === 'number' && l.weight >= 10);
  }, [weekLogs]);

  // 10kg 미만 매장들 (보정 제외, 고정값)
  const fixedLogs = useMemo(() => {
    return weekLogs.filter(l => l.isSkipped || typeof l.weight !== 'number' || l.weight < 10);
  }, [weekLogs]);

  // 10kg 미만 매장들의 중량 합계
  const fixedSum = useMemo(() => {
    return fixedLogs.reduce((sum, l) => sum + (typeof l.weight === 'number' ? l.weight : 0), 0);
  }, [fixedLogs]);

  // 10kg 이상 매장들의 중량 합계
  const activeSum = useMemo(() => {
    return activeLogsToAdjust.reduce((sum, l) => sum + l.weight, 0);
  }, [activeLogsToAdjust]);

  // 전체 기록실 합계 (10kg 미만 + 10kg 이상)
  const currentTotalSum = useMemo(() => {
    return fixedSum + activeSum;
  }, [fixedSum, activeSum]);

  const actualWeightVal = parseFloat(actualWeightInput) || 0;

  // 보정 비율 계산: (실제 계근값 - 고정값 합계) / 10kg 이상 매장 합계
  const ratio = useMemo(() => {
    if (activeSum <= 0 || actualWeightVal <= 0) return 1;
    const targetAdjustSum = actualWeightVal - fixedSum;
    return targetAdjustSum > 0 ? (targetAdjustSum / activeSum) : 1;
  }, [activeSum, actualWeightVal, fixedSum]);

  const adjustedPreview = useMemo(() => {
    if (ratio === 1 || actualWeightVal <= 0) return [];
    return activeLogsToAdjust.map(l => {
      const original = l.weight;
      const adjusted = Math.round(original * ratio);
      return {
        id: l.id,
        storeName: l.storeName,
        original,
        adjusted,
      };
    });
  }, [activeLogsToAdjust, ratio, actualWeightVal]);

  const handleApplyAdjustment = async () => {
    if (!selectedYear) return;
    const urlBase = APPS_SCRIPT_URLS[selectedYear];
    if (!urlBase) {
      alert(`${selectedYear}년 데이터 주소가 설정되지 않았습니다.`);
      return;
    }
    if (activeLogsToAdjust.length === 0) {
      alert("보정 대상(10kg 이상 매장)이 없습니다.");
      return;
    }
    
    const confirmMessage = `${selectedWeek}의 ${activeLogsToAdjust.length}개 매장(10kg 이상)에 대해 비례 배분 보정을 진행하시겠습니까?\n` +
      `- 전체 기존 합계: ${currentTotalSum.toFixed(1)} kg\n` +
      `- 10kg 미만 고정 합계: ${fixedSum.toFixed(1)} kg\n` +
      `- 10kg 이상 보정 대상 합계: ${activeSum.toFixed(1)} kg\n` +
      `- 실제 계근값: ${actualWeightVal.toFixed(1)} kg\n` +
      `- 보정 비율: x${ratio.toFixed(4)}\n\n` +
      `* 10kg 미만 매장 및 제외(-) 매장은 원래 값이 유지됩니다.`;
      
    if (!confirm(confirmMessage)) return;

    setIsSubmittingAdjustment(true);
    setAdjustmentProgress(0);
    setTotalToAdjust(activeLogsToAdjust.length);
    
    try {
      // 보정 전 원래 값 로컬스토리지 백업 저장
      const backupData = activeLogsToAdjust.map(log => ({
        storeName: log.storeName,
        weight: log.weight,
        date: log.date,
        time: log.time,
        category: log.category,
        memo: log.memo,
        mixture: log.mixture,
        temp: log.temp,
        workingTime: log.workingTime,
        depth: log.depth,
        humidity: log.humidity,
        moisture: log.moisture
      }));
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      for (let i = 0; i < activeLogsToAdjust.length; i++) {
        const log = activeLogsToAdjust[i];
        const original = log.weight;
        const adjusted = Math.round(original * ratio);
        
        const payload = {
          year: selectedYear,
          month: selectedMonth,
          week: selectedWeek,
          storeName: log.storeName,
          weight: adjusted.toString(),
          date: log.date,
          time: log.time,
          category: log.category || '커피박 수거',
          memo: log.memo || '',
          mixture: log.mixture || '',
          temp: log.temp || '',
          workingTime: log.workingTime || '',
          depth: log.depth || '',
          humidity: log.humidity || '',
          moisture: log.moisture || ''
        };
        
        await fetch(urlBase, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
        
        setAdjustmentProgress(i + 1);
        await new Promise(r => setTimeout(r, 350));
      }
      
      alert(`성공적으로 ${activeLogsToAdjust.length}개 지점의 수거량이 정산 및 조절되었습니다.`);
      setActualWeightInput('');
      setIsAdjustPanelOpen(false);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      console.error("정산 업데이트 실패:", error);
      alert("일괄 정산 업데이트 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const handleRevertAdjustment = async () => {
    if (!selectedYear) return;
    const urlBase = APPS_SCRIPT_URLS[selectedYear];
    if (!urlBase) {
      alert(`${selectedYear}년 데이터 주소가 설정되지 않았습니다.`);
      return;
    }

    const backupStr = localStorage.getItem(backupKey);
    if (!backupStr) {
      alert("복구할 백업 데이터가 없습니다.");
      return;
    }

    const backupData = JSON.parse(backupStr);
    if (backupData.length === 0) {
      alert("백업 데이터가 비어 있습니다.");
      return;
    }

    const confirmMessage = `${selectedWeek}의 데이터를 보정 전 원래 값으로 복구하시겠습니까?\n` +
      `- 복구 대상 매장: ${backupData.length}곳`;
      
    if (!confirm(confirmMessage)) return;

    setIsSubmittingAdjustment(true);
    setAdjustmentProgress(0);
    setTotalToAdjust(backupData.length);

    try {
      for (let i = 0; i < backupData.length; i++) {
        const log = backupData[i];
        
        const payload = {
          year: selectedYear,
          month: selectedMonth,
          week: selectedWeek,
          storeName: log.storeName,
          weight: log.weight.toString(),
          date: log.date,
          time: log.time,
          category: log.category || '커피박 수거',
          memo: log.memo || '',
          mixture: log.mixture || '',
          temp: log.temp || '',
          workingTime: log.workingTime || '',
          depth: log.depth || '',
          humidity: log.humidity || '',
          moisture: log.moisture || ''
        };
        
        await fetch(urlBase, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });
        
        setAdjustmentProgress(i + 1);
        await new Promise(r => setTimeout(r, 350));
      }
      
      alert(`성공적으로 ${backupData.length}개 지점의 수거량이 원래 값으로 복구되었습니다.`);
      localStorage.removeItem(backupKey);
      setActualWeightInput('');
      setIsAdjustPanelOpen(false);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error: any) {
      console.error("복구 업데이트 실패:", error);
      alert("복구 업데이트 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const displayedLogs = useMemo(() => { 
    return weekLogs.filter(l => l.storeName.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.seq - b.seq); 
  }, [weekLogs, searchTerm]);
  
  return (
    <div className="max-w-[900px] mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className={`text-[36px] font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>기록실</h2>
          <p className="text-[#8E8E93] font-medium flex items-center gap-2">
            <Calendar size={14} className="text-emerald-500" /> 
            과거 수거 내역을 확인하고 검색합니다.
          </p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-emerald-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="지점명으로 검색..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className={`w-full pl-11 pr-5 py-4 rounded-2xl outline-none text-[15px] font-bold transition-all border-none ${isDarkMode ? 'bg-white/5 text-white focus:bg-white/10' : 'bg-white text-gray-900 shadow-xl shadow-gray-200/50 focus:shadow-emerald-500/10'}`} 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
        <AnimatePresence>
          {availableWeeks.map(w => (
            <motion.button 
              key={w} 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedWeek(w)} 
              className={`px-6 py-3 text-[14px] font-black rounded-2xl transition-all whitespace-nowrap ${selectedWeek === w ? 'bg-[#059669] text-white shadow-xl shadow-emerald-500/30' : 'glass text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white'}`}
            >
              {w}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {selectedWeek && weekLogs.length > 0 && (
        <div className={`rounded-[32px] border shadow-xl glass p-6 md:p-8 transition-all duration-300 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200/50 bg-white'}`}>
          <button 
            onClick={() => setIsAdjustPanelOpen(!isAdjustPanelOpen)}
            className="w-full flex items-center justify-between font-black text-lg text-left"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#059669]/10 p-2.5 rounded-2xl text-[#059669] flex items-center justify-center">
                <Scale size={20} />
              </div>
              <div>
                <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight font-black`}>{selectedWeek} 실제 계근값 비례 배분</span>
                <p className="text-xs text-gray-500 font-bold mt-0.5">10kg 이상 배출된 매장들만 비례 보정합니다. (10kg 미만은 고정)</p>
              </div>
            </div>
            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {isAdjustPanelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          <AnimatePresence>
            {isAdjustPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-wider">기록실 총 합계량</span>
                    <p className="text-2xl font-black text-[#059669] mt-2 leading-none">
                      {currentTotalSum.toFixed(1)} <span className="text-xs font-bold text-gray-500">kg</span>
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-2">보정 대상(10kg 이상): {activeSum.toFixed(1)}kg ({activeLogsToAdjust.length}곳)</p>
                  </div>

                  <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-wider">실제 차량 계근값 (B)</span>
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="number" 
                        step="0.1" 
                        placeholder="0.0"
                        value={actualWeightInput} 
                        onChange={e => setActualWeightInput(e.target.value)} 
                        disabled={isSubmittingAdjustment}
                        className={`w-full bg-transparent border-b-2 border-emerald-500/30 focus:border-emerald-500 outline-none text-2xl font-black p-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      />
                      <span className="text-sm font-bold text-gray-500">kg</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold mt-2">계량 증명서의 최종 실중량</p>
                  </div>

                  <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-wider">보정 비율 (대상 배분 비율)</span>
                    <p className={`text-2xl font-black mt-2 leading-none ${ratio === 1 ? 'text-[#8E8E93]' : 'text-blue-500'}`}>
                      x{ratio.toFixed(4)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-2">
                      오차: {(actualWeightVal - currentTotalSum).toFixed(1)} kg
                    </p>
                  </div>
                </div>

                {adjustedPreview.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[11px] font-black text-[#8E8E93] uppercase tracking-wider">보정 예정 중량 미리보기</span>
                    <div className={`border rounded-2xl overflow-hidden max-h-48 overflow-y-auto ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50/50'}`}>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className={`border-b ${isDarkMode ? 'border-white/10 bg-white/5 text-gray-400' : 'border-gray-200/50 bg-gray-100 text-gray-500'}`}>
                            <th className="p-3 font-black">매장명</th>
                            <th className="p-3 font-black text-right">기존 중량</th>
                            <th className="p-3 font-black text-center">➔</th>
                            <th className="p-3 font-black text-right text-emerald-500">보정 후</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adjustedPreview.map(p => (
                            <tr key={p.id} className={`border-b ${isDarkMode ? 'border-white/5 hover:bg-white/10' : 'border-gray-100 hover:bg-gray-100/50'}`}>
                              <td className="p-3 font-bold text-gray-700 dark:text-gray-300">{p.storeName}</td>
                              <td className="p-3 text-right font-medium text-gray-500">{p.original.toFixed(1)} kg</td>
                              <td className="p-3 text-center text-gray-400 font-black">➔</td>
                              <td className="p-3 text-right font-black text-emerald-500">{p.adjusted} kg</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {isSubmittingAdjustment && (
                  <div className="space-y-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#059669] flex items-center gap-2">
                        <RefreshCw size={12} className="animate-spin" />
                        구글 시트 업데이트 중...
                      </span>
                      <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {adjustmentProgress} / {totalToAdjust} 완료
                      </span>
                    </div>
                    <div className="w-full h-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#059669] rounded-full transition-all duration-300"
                        style={{ width: `${(adjustmentProgress / (totalToAdjust || 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 text-center font-medium">API 연동 속도 유지를 위해 순차 전송하고 있습니다. 창을 닫지 마세요.</p>
                  </div>
                )}

                {!isSubmittingAdjustment && actualWeightVal > 0 && ratio !== 1 && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleApplyAdjustment}
                    className="w-full py-4 bg-[#059669] text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 flex justify-center items-center gap-2 hover:bg-[#047857] transition-all"
                  >
                    <Sliders size={18} />
                    일괄 보정값 구글 시트에 반영하기
                  </motion.button>
                )}

                {hasBackup && !isSubmittingAdjustment && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleRevertAdjustment}
                    className={`w-full py-3.5 border border-dashed rounded-2xl font-black text-xs flex justify-center items-center gap-2 transition-all ${
                      isDarkMode 
                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/5 bg-red-500/5' 
                        : 'border-red-500/20 text-red-600 hover:bg-red-50 bg-red-50/20'
                    }`}
                  >
                    <RotateCcw size={14} />
                    보정 전 원래 값으로 복구하기 (백업 데이터 복원)
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      
      <div className={`rounded-[40px] shadow-2xl overflow-hidden p-3 glass border border-white/10`}>
        <div className="grid grid-cols-1 gap-1">
          <AnimatePresence mode="popLayout">
            {displayedLogs.length > 0 ? (
              displayedLogs.map((l, i) => (
                <motion.div 
                  key={l.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center justify-between p-6 rounded-3xl hover:bg-emerald-500/5 transition-colors group ${i !== displayedLogs.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[15px] transition-all group-hover:scale-110 ${isDarkMode ? 'bg-white/5 text-emerald-400 border border-white/10' : 'bg-gray-50 text-emerald-600 border border-gray-100 shadow-sm'}`}>
                      {l.seq}
                    </div>
                    <div>
                      <p className={`font-black text-[18px] tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{l.storeName}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 opacity-70">
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <Calendar size={13} />
                          <span className={`font-bold text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{l.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <Clock size={13} />
                          <span className={`font-bold text-[13px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{l.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${l.category === '목장 데이터' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {l.category}
                          </span>
                        </div>
                        {l.category === '목장 데이터' && (
                          <>
                            {l.depth !== undefined && l.depth !== '' && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <span className="text-[11px] font-bold">심도:</span>
                                <span className="text-[11px] font-medium">{l.depth}cm</span>
                              </div>
                            )}
                            {l.temp !== undefined && l.temp !== '' && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <span className="text-[11px] font-bold">온도:</span>
                                <span className="text-[11px] font-medium">{l.temp}°C</span>
                              </div>
                            )}
                            {l.humidity !== undefined && l.humidity !== '' && (
                              <div className="flex items-center gap-1 text-gray-400">
                                <span className="text-[11px] font-bold">습도:</span>
                                <span className="text-[11px] font-medium">{l.humidity}%</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {l.memo && l.memo.trim() !== '' && (
                        <div className={`mt-2.5 text-[12px] p-2.5 rounded-xl border flex gap-2 items-start ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                          <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase mt-0.5 shrink-0 tracking-widest">메모</span>
                          <span className={`font-medium leading-snug ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{l.memo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {l.isSkipped ? (
                        <span className="font-black text-[16px] text-[#8E8E93] tracking-tight">{l.weight}</span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="font-black text-[22px] text-[#059669] tracking-tighter">{l.weight}</span>
                          <span className="text-[13px] font-black text-[#8E8E93] uppercase tracking-widest">kg</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => onEdit(l)}
                      className={`p-3 rounded-xl transition-all ${isDarkMode ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:text-[#059669] hover:bg-emerald-50'}`}
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center text-gray-500 font-bold"
              >
                검색 결과가 없습니다.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
