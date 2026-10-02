import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2 } from 'lucide-react';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const customIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface MiniMapProps {
  lat: number;
  lng: number;
  radius: number;
  onClick: () => void;
}

export function MiniMap({ lat, lng, radius, onClick }: MiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Create static-like map instance (no zoom/drag allowed)
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false, // hide attribution for mini map to save space
    }).setView([lat, lng], 15);
    
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    circleRef.current = L.circle([lat, lng], { 
      radius: radius || 2000, 
      color: '#099153', 
      fillColor: '#099153', 
      fillOpacity: 0.15,
      weight: 1
    }).addTo(map);

    // Fit bounds to show the whole circle if radius is valid
    if (radius > 0) {
      map.fitBounds(circleRef.current.getBounds(), { padding: [20, 20], maxZoom: 17 });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Sync state changes to map
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      const validRadius = radius > 0 ? radius : 2000;
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(validRadius);
      mapInstanceRef.current.setView([lat, lng]);
      if (validRadius > 0) {
        mapInstanceRef.current.fitBounds(circleRef.current.getBounds(), { padding: [20, 20], maxZoom: 17 });
      }
    }
  }, [lat, lng, radius]);

  return (
    <div 
      className="relative w-full h-full min-h-[220px] rounded-xl overflow-hidden cursor-pointer group border border-slate-200 shadow-inner bg-slate-100" 
      onClick={onClick}
    >
      <div ref={mapContainerRef} className="w-full h-full z-0 pointer-events-none" />
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors z-10 flex items-center justify-center">
        <div className="bg-white/95 text-primary px-4 py-2 rounded-full font-semibold text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-2">
          <Maximize2 size={16} /> Bấm để phóng to và chọn vị trí
        </div>
      </div>
    </div>
  );
}
