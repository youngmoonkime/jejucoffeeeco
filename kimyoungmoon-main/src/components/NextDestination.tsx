import { MapPin, PlusCircle, Navigation, Phone, FileText, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

interface NextDestinationProps {
  location: any;
  onRecordClick: (storeName?: string, forceCategory?: string) => void;
  isDarkMode: boolean;
}

export default function NextDestination({ location, onRecordClick, isDarkMode }: NextDestinationProps) {
  if (!location) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass rounded-[32px] md:rounded-[40px] p-6 md:p-10 relative overflow-hidden flex flex-col items-center justify-center text-center h-full min-h-[300px] md:min-h-[400px] shadow-2xl shadow-emerald-500/10`}
      >
        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 md:p-6 rounded-full mb-4 md:mb-6 shadow-inner">
          <PlusCircle className="w-10 h-10 md:w-12 md:h-12 text-emerald-600" />
        </div>
        <h2 className={`text-2xl md:text-3xl font-extrabold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>모든 수거 완료!</h2>
        <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>오늘 예정된 모든 매장의 수거가 완료되었습니다.</p>
        <p className={`mt-4 text-xs font-bold ${isDarkMode ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>최종 목장 작업은 좌측 서비스 메뉴의 '제주우유' 탭에서 진행해주세요.</p>
      </motion.div>
    );
  }

  // 실제 데이터 기반 이력 (history prop이 없을 경우 mock 데이터 유지)
  const historyData = location.history || [
    { name: '1주차', weight: 0 },
    { name: '2주차', weight: 0 },
    { name: '3주차', weight: 0 },
  ];

  return (
      <div className={`glass rounded-[32px] p-6 md:p-8 relative overflow-hidden group h-full flex flex-col shadow-2xl shadow-emerald-500/5`}>
        {/* Background Decoration */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Header Section */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-emerald-500 text-sm font-bold">• {location.id}번 경로</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="mb-6">
            <h2 className={`text-3xl md:text-4xl font-black mb-2 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{location.name}</h2>
            <p className={`text-sm md:text-base flex items-center gap-2 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
              제주시 지역
            </p>
          </div>

          {/* Grid Layout for Tablet/Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 flex-1">
            {/* Left: Status & Memo */}
            <div className="space-y-4 flex flex-col">
               {/* Status Cards Row */}
               <div className="grid grid-cols-2 gap-3">
                  <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white'}`}>
                    <p className={`text-[10px] font-bold uppercase mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>수거 주기</p>
                    <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>주간</p>
                  </div>
                  <div className={`p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">상태</p>
                    <div className="flex items-center gap-2 text-[#059669]">
                      <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
                      <span className="text-base font-bold whitespace-nowrap">대기중</span>
                    </div>
                  </div>
               </div>

               {/* Memo Section */}
               <div className={`p-5 rounded-3xl border flex-1 flex flex-col transition-all ${isDarkMode ? 'bg-amber-500/[0.08] border-amber-500/20' : 'bg-amber-50/50 border-amber-100 hover:bg-amber-50'}`}>
                  <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400">
                    <FileText size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">특이사항 / 메모</span>
                  </div>
                  <div className={`text-sm leading-relaxed space-y-1 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {location.note ? (
                      location.note.split('\n').map((line: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">• <span>{line}</span></div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2">• <span className="opacity-50">등록된 특이사항이 없습니다.</span></div>
                    )}
                  </div>
               </div>
            </div>

            {/* Right: Last Week Record & Graph */}
            <div className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${isDarkMode ? 'bg-emerald-500/[0.03] border-emerald-500/20' : 'bg-emerald-50/30 border-emerald-100/50 hover:bg-emerald-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                  <History size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">전 주차 수거 기록</span>
                </div>
              </div>
              
              <div className="flex items-end justify-between mb-4">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {location.lastWeekWeight || 0}
                  </span>
                  <span className={`text-lg font-bold ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>kg</span>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-bold uppercase mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>지난주 대비</p>
                  <span className={`text-sm font-black flex items-center justify-end gap-1 ${location.currentWeight > location.lastWeekWeight ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {location.currentWeight > location.lastWeekWeight ? '↑' : '↓'} {Math.abs(location.currentWeight - location.lastWeekWeight).toFixed(1)} <span className="text-[10px] font-bold">kg</span>
                  </span>
                </div>
              </div>

              {/* Enhanced History Graph */}
              <div className="flex-1 min-h-[120px] mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: isDarkMode ? '#6B7280' : '#9CA3AF', fontWeight: 600 }}
                      dy={10}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', backgroundColor: isDarkMode ? '#1C1C1E' : '#fff', fontSize: '12px'}}
                      itemStyle={{color: '#059669', fontWeight: '800'}}
                      cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" dot={{ r: 3, fill: '#059669', strokeWidth: 2, stroke: isDarkMode ? '#111827' : '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t border-emerald-500/10 flex justify-between items-center bg-white/5 dark:bg-transparent -mx-5 px-5 py-2 mt-2">
                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} uppercase tracking-widest`}>이번달 누적 수거량</span>
                <span className={`text-sm font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {location.total || 0} kg
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-auto">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onRecordClick(location.name)}
              className="sm:col-span-2 bg-[#059669] text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-[#047857] transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-xl tracking-tight"
            >
              <PlusCircle className="w-6 h-6" />
              수거 기록하기
            </motion.button>
            <div className="grid grid-cols-2 gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                <Navigation className="w-6 h-6 text-emerald-500" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 ${isDarkMode ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                <Phone className="w-6 h-6 text-emerald-500" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
  );
}
