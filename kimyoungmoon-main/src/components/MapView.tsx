import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Map as MapIcon } from 'lucide-react';
import { JEJU_COORDS } from '../utils/constants';

interface MapViewProps {
  locations: any[];
  isDarkMode: boolean;
}

declare global {
  interface Window {
    naver: any;
  }
}

export default function MapView({ locations, isDarkMode }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<any>(null);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.naver?.maps) return;

      const mapOptions = {
        center: new window.naver.maps.LatLng(33.4890, 126.4983),
        zoom: 12,
        minZoom: 10,
        mapTypeId: window.naver.maps.MapTypeId.NORMAL,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
          style: window.naver.maps.ZoomControlStyle.SMALL
        },
        background: isDarkMode ? '#111827' : '#f8fafc'
      };

      const map = new window.naver.maps.Map(mapRef.current, mapOptions);
      naverMapRef.current = map;

      locations.forEach((loc) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(loc.lat, loc.lng),
          map: map,
          title: loc.name,
          icon: {
            content: `
              <div class="group relative">
                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-xl border-2 border-[#059669] transform transition-transform group-hover:scale-125">
                  <div class="w-6 h-6 text-[#059669]">
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                       <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                       <circle cx="12" cy="10" r="3"></circle>
                     </svg>
                  </div>
                </div>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-black rounded-lg opacity-0 transition-opacity whitespace-nowrap group-hover:opacity-100 z-50 pointer-events-none shadow-2xl">
                   ${loc.name}
                </div>
              </div>
            `,
            anchor: new window.naver.maps.Point(20, 20)
          }
        });

        const infowindow = new window.naver.maps.InfoWindow({
          content: `
            <div class="p-4 min-w-[200px] rounded-2xl bg-white shadow-2xl border-0">
               <h4 class="text-sm font-black text-gray-900 mb-1">${loc.name}</h4>
               <p class="text-xs font-bold text-gray-500 mb-2">상태: ${loc.status === 'done' ? '기록완료' : '대기중'}</p>
               <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                 <span class="text-[10px] font-black text-[#059669] uppercase tracking-wider">Logistics Point</span>
               </div>
            </div>
          `,
          borderWidth: 0,
          backgroundColor: 'transparent',
          anchorSize: new window.naver.maps.Size(0, 0),
          pixelOffset: new window.naver.maps.Point(0, -20)
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (infowindow.getMap()) {
            infowindow.close();
          } else {
            infowindow.open(map, marker);
          }
        });
      });
    };

    if (window.naver?.maps) {
      initMap();
    } else {
      const interval = setInterval(() => {
        if (window.naver?.maps) {
          initMap();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [locations, isDarkMode]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <MapIcon className="w-7 h-7 text-emerald-500" />
          </div>
          <div>
            <h2 className={`text-[28px] font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>수거 노선 지도</h2>
            <p className={`text-sm font-bold opacity-70 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>제주도 내 커피박 수거 지점의 실시간 위치 현황입니다.</p>
          </div>
        </div>
        <div className="flex gap-2">
           <div className={`px-4 py-2 rounded-xl text-xs font-black glass border shadow-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              총 {locations.length}개 지점
           </div>
           <div className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              실시간 동기화됨
           </div>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex-1 rounded-[40px] border shadow-2xl overflow-hidden glass relative`}
      >
        <div ref={mapRef} className="w-full h-full grayscale-[0.2]" />
        
        {/* Map Overlays */}
        <div className="absolute bottom-6 left-6 z-[100] flex flex-col gap-2">
           <button 
             onClick={() => {
               if (naverMapRef.current && window.naver?.maps?.LatLng) {
                 naverMapRef.current.setCenter(new window.naver.maps.LatLng(33.4890, 126.4983));
               }
             }}
             className="p-3 bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl shadow-2xl border transition-all active:scale-95"
           >
             <Navigation className="w-5 h-5" />
           </button>
        </div>
      </motion.div>
    </div>
  );
}
