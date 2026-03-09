import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Map as MapIcon, Loader2, AlertCircle } from 'lucide-react';
import { NAVER_MAP_CLIENT_ID } from '../utils/constants';

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
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    let interval: any;
    let timeout: any;

    const loadScript = () => {
      if (window.naver?.maps) {
        setLoadState('loaded');
        return;
      }

      // 스크립트가 이미 있는지 확인
      const existingScript = document.getElementById('naver-map-sdk');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'naver-map-sdk';
        script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_MAP_CLIENT_ID}`;
        script.async = true;
        document.head.appendChild(script);
        console.log("Naver Map SDK script injected");
      }

      // 스크립트 로드 대기 폴링
      interval = setInterval(() => {
        if (window.naver?.maps) {
          console.log("Naver Map SDK loaded successfully");
          setLoadState('loaded');
          clearInterval(interval);
          clearTimeout(timeout);
        }
      }, 100);

      // 10초 후에도 로드 안되면 에러 처리
      timeout = setTimeout(() => {
        clearInterval(interval);
        if (!window.naver?.maps) {
          console.error("Naver Map SDK load timeout");
          setLoadState('error');
        }
      }, 10000);
    };

    loadScript();

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // 지도 초기화 (최초 1회)
  useEffect(() => {
    if (loadState !== 'loaded' || !mapRef.current || !window.naver?.maps || naverMapRef.current) return;

    try {
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
      console.log("Map initialized successfully");
    } catch (e) {
      console.error("Map initialization failed", e);
      setLoadState('error');
    }
  }, [loadState, isDarkMode]);

  // 마커 업데이트 (데이터 변경 시)
  useEffect(() => {
    const map = naverMapRef.current;
    if (!map || !window.naver?.maps) return;

    const markers: any[] = [];

    locations.forEach((loc) => {
      if (!loc.lat || !loc.lng || !window.naver?.maps?.Marker) return;

      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(loc.lat, loc.lng),
        map: map,
        title: loc.name,
        icon: {
          content: `
            <div class="group relative" style="cursor: pointer;">
              <div class="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-xl border-2 border-[#059669] transform transition-transform group-hover:scale-125">
                <div class="w-6 h-6 text-[#059669]">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                     <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                     <circle cx="12" cy="10" r="3"></circle>
                   </svg>
                </div>
              </div>
            </div>
          `,
          anchor: new window.naver.maps.Point(20, 20)
        }
      });

      if (window.naver?.maps?.InfoWindow) {
        const infowindow = new window.naver.maps.InfoWindow({
          content: `
            <div style="padding: 16px; min-width: 200px; border-radius: 20px; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: none;">
               <h4 style="margin: 0 0 4px; font-weight: 900; color: #111; font-size: 14px;">${loc.name}</h4>
               <p style="margin: 0 0 8px; color: #666; font-size: 12px;">상태: ${loc.status === 'done' ? '기록완료' : '대기중'}</p>
               <div style="height: 1px; background: #eee; margin-bottom: 8px;"></div>
               <span style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase;">Logistics Point</span>
            </div>
          `,
          borderWidth: 0,
          backgroundColor: 'transparent',
          anchorSize: new window.naver.maps.Size(0, 0),
          pixelOffset: new window.naver.maps.Point(0, -10)
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (infowindow.getMap()) {
            infowindow.close();
          } else {
            infowindow.open(map, marker);
          }
        });
      }

      markers.push(marker);
    });

    return () => {
      markers.forEach(m => m.setMap(null));
    };
  }, [locations, loadState]); // locations가 바뀔 때만 마커 갱신

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
        className={`flex-1 rounded-[40px] border shadow-2xl overflow-hidden glass relative flex items-center justify-center ${isDarkMode ? 'bg-gray-900/50' : 'bg-white/50'}`}
      >
        <div ref={mapRef} className="absolute inset-0 w-full h-full grayscale-[0.2]" />
        
        <AnimatePresence>
          {loadState === 'loading' && (
            <motion.div 
              key="loading"
              exit={{ opacity: 0 }}
              className="z-10 flex flex-col items-center gap-4"
            >
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>지도를 불러오는 중...</p>
            </motion.div>
          )}

          {loadState === 'error' && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="z-10 max-w-md p-8 text-center bg-red-500/10 rounded-[32px] border border-red-500/20"
            >
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-red-500 mb-2">지도를 표시할 수 없습니다</h3>
              <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                네이버 클라우드 플랫폼 콘솔에서 다음 사항을 확인해 주세요:<br/>
                1. **Web Dynamic Map** 서비스 활성화<br/>
                2. **서비스 URL**에 현재 주소 등록<br/>
                (<code className="font-bold">http://localhost:3000</code> 또는 <code className="font-bold">jejucoffeeeco.pages.dev</code>)
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20"
              >
                새로고침
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Overlays */}
        {loadState === 'loaded' && (
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
        )}
      </motion.div>
    </div>
  );
}
