import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const classIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-[140deg]' // Makes the default blue marker green for the classroom
});

const studentIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: 'hue-rotate-[320deg]' // Makes the default blue marker red/pink for the student
});

interface StudentMapProps {
  sessionLat: number;
  sessionLng: number;
  radius: number;
  studentLat: number;
  studentLng: number;
}

export function StudentMap({ sessionLat, sessionLng, radius, studentLat, studentLng }: StudentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Create map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false,
      attributionControl: false,
    });
    
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Add session marker and circle
    L.marker([sessionLat, sessionLng], { icon: classIcon }).addTo(map).bindPopup('Tọa độ lớp học');
    L.circle([sessionLat, sessionLng], { 
      radius: radius || 2000, 
      color: '#099153', 
      fillColor: '#099153', 
      fillOpacity: 0.15,
      weight: 1
    }).addTo(map);

    // Add student marker
    L.marker([studentLat, studentLng], { icon: studentIcon }).addTo(map).bindPopup('Vị trí của bạn').openPopup();

    // Fit bounds to show both markers
    const group = new L.FeatureGroup([
      L.marker([sessionLat, sessionLng]),
      L.marker([studentLat, studentLng])
    ]);
    
    map.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 17 });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [sessionLat, sessionLng, radius, studentLat, studentLng]);

  return (
    <div className="w-full h-[200px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative mb-6">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      <div className="absolute top-2 right-2 z-[400] bg-white/90 px-2 py-1 flex flex-col gap-1 rounded text-[10px] font-medium shadow border border-slate-200 pointer-events-none">
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#099153]"></div> Lớp học</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-danger"></div> Vị trí của bạn</div>
      </div>
    </div>
  );
}
