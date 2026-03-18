import { BarChart3, TrendingUp, Users, Leaf, Calculator } from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { motion } from 'motion/react';

interface AnalysisViewProps {
  locations: any[];
  weeklyTotals: any[];
  availableYears: string[];
  selectedYear: string;
  availableMonths: string[];
  selectedMonth: string;
  syncWithGoogleSheet: (year: string, month: string) => void;
  isDarkMode: boolean;
}

export default function AnalysisView({ locations, weeklyTotals, availableYears, selectedYear, availableMonths, selectedMonth, syncWithGoogleSheet, isDarkMode }: AnalysisViewProps) {
  const total = locations.reduce((s, l) => s + l.total, 0);
  
  return (
    <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-10">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex justify-center overflow-x-auto pb-4"
      >
        <div className={`glass p-2 rounded-[28px] flex shadow-2xl border border-white/10 whitespace-nowrap`}>
          {availableMonths.map(m => (
            <button 
              key={m} 
              onClick={() => syncWithGoogleSheet(selectedYear, m)} 
              className={`px-6 md:px-8 py-3 text-sm md:text-[15px] font-black rounded-2xl transition-all duration-300 ${selectedMonth === m ? 'bg-[#059669] text-white shadow-lg shadow-emerald-500/30 scale-105' : (isDarkMode ? 'text-gray-400 hover:text-white' : 'text-[#8E8E93] hover:text-[#1D1D1F]')}`}
            >
              {m}
            </button>
          ))}
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          {title:'수거량', val:total.toLocaleString(), c:'text-[#059669]', unit: 'kg', icon: TrendingUp},
          {title:'매장', val:locations.length, c:'text-[#F59E0B]', unit: '곳', icon: Users},
          {title:'탄소저감', val:(total*0.51).toFixed(0), c:'text-[#10B981]', unit: 'kg', icon: Leaf},
          {title:'평균', val:(total/locations.length || 0).toFixed(1), c:'text-[#8B5CF6]', unit: 'kg', icon: Calculator}
        ].map((s,i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className={`p-6 md:p-7 rounded-[32px] border shadow-xl glass group`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className={`text-[13px] font-black uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-[#8E8E93]'}`}>{s.title}</p>
              <s.icon className={`w-5 h-5 ${s.c} ${isDarkMode ? 'opacity-80' : 'opacity-50'} group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl md:text-[36px] font-black tracking-tighter ${s.c}`}>{s.val}</span>
              <span className={`text-[15px] font-bold ${isDarkMode ? 'text-gray-400' : 'text-[#8E8E93]'}`}>{s.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 md:p-10 rounded-[40px] border shadow-2xl glass`}
      >
        <h3 className={`text-xl md:text-[24px] font-black flex items-center gap-3 mb-8 md:mb-10 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <div className="bg-[#059669]/10 p-2.5 rounded-2xl">
            <BarChart3 className="text-[#059669]" />
          </div>
          <span className="tracking-tight">{selectedMonth} 주간 수거 통계</span>
        </h3>
        <div>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={weeklyTotals}>
              <defs>
                <linearGradient id="appleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: isDarkMode ? '#9CA3AF' : '#8E8E93', fontSize: 13, fontWeight: 700}} 
                dy={15} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: isDarkMode ? '#9CA3AF' : '#8E8E93', fontSize: 13, fontWeight: 700}} 
                dx={-10}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }} 
                itemStyle={{ color: '#059669', fontWeight: '900' }}
                cursor={{ stroke: '#059669', strokeWidth: 2, strokeDasharray: '5 5' }}
              />
              <Area 
                type="monotone" 
                dataKey="weight" 
                stroke="#059669" 
                strokeWidth={6} 
                fill="url(#appleGrad)" 
                dot={{ r: 8, fill: '#059669', strokeWidth: 4, stroke: isDarkMode ? '#1C1C1E' : '#fff' }} 
                activeDot={{ r: 10, fill: '#059669', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
