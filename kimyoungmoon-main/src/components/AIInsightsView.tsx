import { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, MessageSquare, Lightbulb, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAIInsights } from '../utils/aiService';
import distilledHistory from '../data/distilled_history_2025.json';

interface AIInsightsViewProps {
  isDarkMode: boolean;
}

export default function AIInsightsView({ isDarkMode }: AIInsightsViewProps) {
  const [selectedStore, setSelectedStore] = useState('');
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const stores = Object.keys(distilledHistory);

  const fetchInsight = async (storeName: string) => {
    setIsLoading(true);
    try {
      const result = await getAIInsights(storeName);
      setInsight(result);
    } catch (error) {
      setInsight("분석 데이터를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStore) {
      fetchInsight(selectedStore);
    }
  }, [selectedStore]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-2"
        >
          <Brain className="w-8 h-8 text-emerald-500" />
        </motion.div>
        <h1 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          AI 인사이트 리포트
        </h1>
        <p className={`text-lg font-medium opacity-70 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          2025년 수거 기록과 메모를 바탕으로 Gemini AI가 추출한 전략적 통계입니다.
        </p>
      </header>

      <div className="grid gap-6">
        <section className={`p-8 rounded-[32px] border glass shadow-2xl space-y-6`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>분석할 매장 선택</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {stores.map((store) => (
              <button
                key={store}
                onClick={() => setSelectedStore(store)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  selectedStore === store 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105' 
                  : (isDarkMode ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                {store}
              </button>
            ))}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-12 text-center"
            >
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
              <p className={`font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gemini AI가 데이터를 심층 분석 중입니다...</p>
            </motion.div>
          ) : selectedStore && insight ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-10 rounded-[40px] border glass shadow-2xl relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Brain className="w-32 h-32" />
              </div>
              
              <div className="prose prose-emerald max-w-none prose-lg">
                <div 
                  className={`markdown-content ${isDarkMode ? 'text-gray-200 prose-invert' : 'text-gray-800'}`}
                  dangerouslySetInnerHTML={{ 
                    __html: insight
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-500 font-extrabold">$1</strong>')
                      .replace(/### (.*?)\n/g, '<h3 class="text-2xl font-black mt-8 mb-4 border-l-4 border-emerald-500 pl-4">$1</h3>')
                      .replace(/- (.*?)\n/g, '<li class="mb-2 ml-4 list-disc">$1</li>')
                      .replace(/\n/g, '<br/>')
                  }} 
                />
              </div>

              <div className="mt-12 flex flex-wrap gap-4 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-black text-blue-500 uppercase">Trend Analysis</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-black text-purple-500 uppercase">Contextual NLP</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-full">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-amber-500 uppercase">Strategic Advice</span>
                </div>
              </div>
            </motion.div>
          ) : !selectedStore && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-12 text-center rounded-[32px] border border-dashed ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}
            >
              매장을 선택하면 AI 분석 리포트가 생성됩니다.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
