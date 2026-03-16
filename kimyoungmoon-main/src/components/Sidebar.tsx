import { RefreshCw, Map as MapIcon, BarChart3, MapPin, Truck, Settings, LayoutDashboard, PenTool, LogOut, Brain, Milk } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isDarkMode, isOpen, onClose }: SidebarProps) {
  // Floating dock style
  const containerClass = isDarkMode 
    ? 'glass border-gray-800' 
    : 'glass border-white/60 shadow-xl shadow-gray-200/50';

  const activeClass = 'bg-[#059669] text-white shadow-lg shadow-emerald-200';
  const inactiveClass = isDarkMode ? 'text-gray-400 hover:bg-white/10' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside 
        className={`fixed left-4 top-4 bottom-4 z-50 w-[88px] rounded-[32px] flex flex-col items-center py-8 border transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-[150%]'} ${containerClass}`}
      >
        {/* Brand Logo */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-[#059669] flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

          {/* Navigation Links */}
        <nav className="flex-1 flex flex-col gap-4 w-full px-4">
          {[
            { id: 'home', icon: LayoutDashboard, label: '홈' },
            { id: 'analysis', icon: BarChart3, label: '분석' },
            { id: 'ai_insights', icon: Brain, label: 'AI 인사이트' },
            { id: 'map', icon: MapPin, label: '지도' },
            { id: 'logistics', icon: Truck, label: '내역' },
            { id: 'jeju_milk', icon: Milk, label: '제주우유' },
          ].map((item) => (
            <motion.button 
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveTab(item.id); onClose(); }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group relative ${activeTab === item.id ? activeClass : inactiveClass}`}
            >
              <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              
              {/* Tooltip */}
              <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900/90 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 pointer-events-none whitespace-nowrap z-50 backdrop-blur-md">
                {item.label}
              </span>
            </motion.button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col gap-4 w-full px-4">
          <button className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${inactiveClass}`}>
            <Settings className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm mx-auto">
             <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC96NKTCCIMjn9zxHwjfN-DLy3ZpUpOAH4c4wQgW2yPFCDzZ8zlRNYqc37NHPTKOA25XqEjDwyP8XNvEalgXCJz3Dc2XGVo6iPmYpIVxUpTocTYAuieAh61rX8zdZI5Dp98XcDg8XvkIZ7pHtrI-Lujoy235SPIGlOyiGJN9Nh_Vl1IEvOLLwTo6_wgkFQFuGQu9Zipd7tUdHuWl6ebHIL6sMLoPlocywswI38q8MD1PpjbsiyoKVYHhIJcA68Jrt4K2ySACm9Ku_nD" 
                alt="User" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
          </div>
        </div>
      </aside>
    </>
  );
}
