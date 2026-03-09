import { ChevronRight } from 'lucide-react';

interface RemainingRoutesProps {
  routes: any[];
  isDarkMode: boolean;
}

export default function RemainingRoutes({ routes, isDarkMode }: RemainingRoutesProps) {
  return (
    <div className={`backdrop-blur-xl border shadow-sm rounded-[32px] p-6 md:p-8 ${isDarkMode ? 'bg-[#2C2C2E] border-gray-800' : 'bg-white border-white/60'}`}>
      <h3 className={`text-lg md:text-xl font-bold mb-6 md:mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>남은 경로</h3>
      {/* 
         Height Calculation:
         - Each item is approx 80-90px.
         - 2 items = ~180px.
         - Added max-h-[240px] to comfortably fit 2 items and show scroll for more.
         - md:max-h-[220px] for desktop.
      */}
      <div className="space-y-3 md:space-y-4 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
        {routes.length > 0 ? (
          routes.map((route) => (
            <div key={route.id} className={`flex items-center justify-between p-4 md:p-5 rounded-3xl transition-all border group cursor-pointer shrink-0 ${isDarkMode ? 'hover:bg-gray-800 border-transparent hover:border-gray-700' : 'hover:bg-gray-50 border-transparent hover:border-gray-100'}`}>
              <div className="flex items-center gap-4 md:gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-colors shrink-0 ${isDarkMode ? 'bg-gray-800 text-gray-400 group-hover:bg-[#059669] group-hover:text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-[#059669] group-hover:text-white'}`}>
                  {route.id}
                </div>
                <div>
                  <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{route.name}</h4>
                  <p className="text-sm text-gray-400">예상 수거 대기중</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#059669] transition-colors" />
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-400 text-sm md:text-base">남은 경로가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
