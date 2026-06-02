import { Check, Sun, Wind, Droplets, Cloud, CloudRain, CloudSun, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface RightColumnProps {
  weather: { temp: number | string; condition: string; humidity: string; windSpeed: string; rain: string };
  forecast: any[];
  completedRoutes: any[];
  isDarkMode: boolean;
  onWeatherRefresh: () => void;
  isWeatherSyncing: boolean;
}

export default function RightColumn({ weather, forecast, completedRoutes, isDarkMode, onWeatherRefresh, isWeatherSyncing }: RightColumnProps) {
  const getIcon = (condition: string) => {
    switch (condition) {
      case '맑음': return <Sun size={20} className="text-amber-500" />;
      case '구름': return <CloudSun size={20} className="text-amber-500" />;
      case '비/눈': return <CloudRain size={20} className="text-blue-400" />;
      default: return <Sun size={20} className="text-amber-500" />;
    }
  };

  return (
    <aside className="col-span-12 lg:col-span-4 h-full flex flex-col">
      {/* Weather Card */}
      <div className={`glass rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden h-full shadow-2xl shadow-emerald-500/5`}>
        {/* Background decoration */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-2 w-full">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-3 rounded-full text-[#059669]">
                        <Sun className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-bold text-gray-500 tracking-tight">은평구 날씨</span>
                </div>
                <button 
                  onClick={onWeatherRefresh}
                  disabled={isWeatherSyncing}
                  className={`p-2.5 rounded-2xl flex items-center justify-center border transition-all active:scale-90 shadow-md ${
                    isDarkMode 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                      : 'bg-emerald-50 border-emerald-200 text-[#059669] hover:bg-emerald-100 shadow-emerald-100/30'
                  } ${isWeatherSyncing ? 'animate-spin' : ''}`}
                  title="날씨 새로고침"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
            </div>
            <div className="flex items-baseline gap-2 mt-4 mb-8">
                <span className={`text-6xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.temp}°</span>
                <span className="text-2xl font-bold text-emerald-500/80">{weather.condition}</span>
            </div>
        </div>

        {/* Hourly Forecast */}
        <div className="mb-8 relative z-10">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-white/5 pb-2">시간대별 예보</p>
          <div className="flex justify-between items-center px-1">
            {forecast.map((item, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ y: -5 }}
                className="flex flex-col items-center gap-3"
              >
                <span className="text-[11px] text-gray-400 font-bold">{item.time}</span>
                <div className={`p-2.5 rounded-2xl ${isDarkMode ? 'bg-white/5 shadow-inner' : 'bg-gray-50/80 shadow-sm'}`}>
                  {getIcon(item.condition)}
                </div>
                <span className={`text-[13px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.temp}°</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Weather Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 relative z-10 mt-auto">
            <div className={`p-3.5 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white shadow-sm'}`}>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Wind className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">풍속</span>
                </div>
                <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.windSpeed}<span className="text-[10px] text-gray-400 font-medium ml-0.5">m/s</span></p>
            </div>
            <div className={`p-3.5 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white shadow-sm'}`}>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Droplets className="w-4 h-4 text-sky-500" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">습도</span>
                </div>
                <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.humidity}<span className="text-[10px] text-gray-400 font-medium ml-0.5">%</span></p>
            </div>
            <div className={`p-3.5 rounded-2xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-white shadow-sm'}`}>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <CloudRain className="w-4 h-4 text-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-wider">강수</span>
                </div>
                <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{weather.rain}<span className="text-[10px] text-gray-400 font-medium ml-0.5">mm</span></p>
            </div>
        </div>
      </div>
    </aside>
  );
}
