import { useRef, useEffect, useState } from 'react';
import { Navigation } from 'lucide-react';
import { NAVER_MAP_CLIENT_ID } from '../utils/constants';

interface NaverMapViewProps {
  locations: any[];
  selectedLocation: any;
  setSelectedLocation: (loc: any) => void;
  isDarkMode: boolean;
}

declare global {
  interface Window {
    naver: any;
  }
}

export default function NaverMapView({ locations, selectedLocation, setSelectedLocation, isDarkMode }: NaverMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null); 
  const mapInstance = useRef<any>(null); 
  const markers = useRef<any[]>([]); 
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => { 
    if (!document.getElementById('naver-map-script')) { 
      const s = document.createElement('script'); 
      s.id = 'naver-map-script'; 
      s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_MAP_CLIENT_ID}`; 
      s.async = true; 
      s.onload = () => { 
        const check = setInterval(() => { 
          if (window.naver?.maps) { 
            setIsScriptLoaded(true); 
            clearInterval(check); 
          } 
        }, 100); 
      }; 
      document.head.appendChild(s); 
    } else if (window.naver?.maps) {
      setIsScriptLoaded(true); 
    }
  }, []);

  useEffect(() => { 
    if (isScriptLoaded && mapRef.current && !mapInstance.current) { 
      mapInstance.current = new window.naver.maps.Map(mapRef.current, { 
        center: new window.naver.maps.LatLng(33.489, 126.55), 
        zoom: 12 
      }); 
    } 
  }, [isScriptLoaded]);

  useEffect(() => { 
    if (mapInstance.current && locations.length > 0) { 
      markers.current.forEach(m => m.setMap(null)); 
      markers.current = locations.map(loc => { 
        const c = loc.status === 'done' ? '#34C759' : (loc.isNext ? '#FF3B30' : '#8E8E93'); 
        const m = new window.naver.maps.Marker({ 
          position: new window.naver.maps.LatLng(loc.lat, loc.lng), 
          map: mapInstance.current, 
          icon: { 
            content: `<div style="cursor:pointer; display:flex; flex-direction:column; align-items:center;"><div style="background:${c}; width:32px; height:32px; border-radius:50%; border:3px solid white; box-shadow:0 4px 12px rgba(0,0,0,0.2); display:flex; items-center; justify-content:center; color:white; font-weight:bold; font-size:14px;">${loc.id}</div>${loc.isNext ? '<div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid #FF3B30; margin-top:-2px;"></div>' : ''}</div>`, 
            anchor: new window.naver.maps.Point(16, 32) 
          } 
        }); 
        window.naver.maps.Event.addListener(m, 'click', () => setSelectedLocation(loc)); 
        return m; 
      }); 
    } 
  }, [locations, isScriptLoaded, setSelectedLocation]);

  return (
    <div className={`h-full flex relative overflow-hidden transition-colors ${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-[#F5F5F7]'}`}>
      <div ref={mapRef} className="flex-1 w-full h-full" />
      <div className={`absolute top-0 right-0 h-full w-[400px] border-l border-white/10 p-10 transition-transform duration-700 z-20 ${isDarkMode ? 'bg-[#1C1C1E]/90 backdrop-blur-3xl' : 'bg-white/90 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.05)]'} ${selectedLocation ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedLocation && (
          <div className="flex flex-col h-full animate-in slide-in-from-right duration-700">
            <h3 className={`text-[28px] font-bold mb-10 tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedLocation.name}</h3>
            <div className={`p-10 rounded-[40px] border shadow-sm text-center mb-10 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
              <p className="text-[13px] font-black text-[#8E8E93] mb-3 uppercase tracking-widest">Route Number</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-[64px] font-black tracking-tighter text-[#059669]">{selectedLocation.id}</span>
                <span className="text-[24px] font-bold text-[#8E8E93]">Stop</span>
              </div>
            </div>
            <div className="space-y-4 mt-auto">
              <button className="w-full py-5 bg-[#059669] text-white rounded-3xl font-black text-[17px] shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Navigation size={20} /> 네이버 내비 안내
              </button>
              <button onClick={() => setSelectedLocation(null)} className={`w-full py-5 rounded-3xl font-bold text-[17px] active:scale-95 transition-all ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
