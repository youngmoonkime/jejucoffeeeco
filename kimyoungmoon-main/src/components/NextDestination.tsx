import { MapPin, PlusCircle, Navigation, Phone, FileText, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

interface NextDestinationProps {
  location: any;
  onRecordClick: (storeName?: string) => void;
  isDarkMode: boolean;
}

export default function NextDestination({ location, onRecordClick, isDarkMode }: NextDestinationProps) {
  // Mock data for history chart
  const historyData = [
    { name: '3주전', weight: 3.8 },
    { name: '2주전', weight: 4.5 },
    { name: '지난주', weight: 4.1 },
  ];

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
      </motion.div>
    );
  }

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
                    <div className="flex items-center gap-2">• <span className={`${isDarkMode ? 'text-gray-300' : 'opacity-80'}`}>후문 주차장 이용 가능</span></div>
                    <div className="flex items-center gap-2">• <span className={`${isDarkMode ? 'text-gray-300' : 'opacity-80'}`}>도착 5분 전 연락 요망</span></div>
                    <div className="flex items-center gap-2">• <span className={`${isDarkMode ? 'text-gray-300' : 'opacity-80'}`}>담당: 김매니저 (010-1234-5678)</span></div>
                  </div>
               </div>
            </div>

            {/* Right: History Chart */}
            <div className={`p-5 rounded-3xl border flex flex-col transition-all ${isDarkMode ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white'}`}>
              <div className={`flex items-center gap-2 mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                <History size={16} className="text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider">최근 수거 이력</span>
              </div>
              <div className="flex-1 min-h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 600}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backgroundColor: isDarkMode ? '#1C1C1E' : '#fff'}}
                      itemStyle={{color: '#059669', fontWeight: '800'}}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#059669" strokeWidth={4} fillOpacity={1} fill="url(#colorWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-right">
                <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>지난주 평균: </span>
                <span className={`text-sm font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>4.1 kg</span>
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
