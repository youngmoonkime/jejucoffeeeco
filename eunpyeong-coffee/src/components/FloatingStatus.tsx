import { BatteryCharging } from 'lucide-react';

interface FloatingStatusProps {
  isDarkMode?: boolean;
}

export default function FloatingStatus({ isDarkMode = false }: FloatingStatusProps) {
  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className={`px-5 py-3 md:px-6 md:py-4 rounded-[30px] shadow-2xl flex items-center gap-3 md:gap-4 border transition-colors ${isDarkMode ? 'bg-[#1D1D1F] text-white border-white/10' : 'bg-white text-gray-900 border-gray-200'}`}>
        <div className="flex items-center gap-2 md:gap-3">
          <span className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#059669] rounded-full animate-pulse shadow-[0_0_10px_rgba(5,150,105,0.5)]"></span>
          <span className="text-xs md:text-sm font-medium tracking-wide whitespace-nowrap">차량: EV-JEJU-04</span>
        </div>
        <div className={`w-px h-4 md:h-5 ${isDarkMode ? 'bg-white/20' : 'bg-gray-300'}`}></div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <BatteryCharging className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#059669]" />
          <span className="text-xs md:text-sm font-medium">84%</span>
        </div>
      </div>
    </div>
  );
}
