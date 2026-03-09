import { useState, useMemo, useEffect } from 'react';
import { Search, Clock, Calendar, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LogisticsViewProps {
  logs: any[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onEdit: (log: any) => void; // Add onEdit prop
  isDarkMode: boolean;
}

export default function LogisticsView({ logs, searchTerm, setSearchTerm, onEdit, isDarkMode }: LogisticsViewProps) {
  const availableWeeks = useMemo(() => { 
    const weeks = [...new Set(logs.map(l => l.weekLabel || l.date))]; 
    return weeks.sort((a, b) => parseInt(a) - parseInt(b)); 
  }, [logs]);
  
  const [selectedWeek, setSelectedWeek] = useState('');
  
  useEffect(() => { 
    if (availableWeeks.length > 0 && (!selectedWeek || !availableWeeks.includes(selectedWeek))) {
      setSelectedWeek(availableWeeks[0]); 
    }
  }, [availableWeeks, selectedWeek]);
  
  const displayedLogs = useMemo(() => { 
    return logs.filter(l => (l.weekLabel || l.date) === selectedWeek && l.storeName.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.seq - b.seq); 
  }, [logs, selectedWeek, searchTerm]);
  
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
                      </div>
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
