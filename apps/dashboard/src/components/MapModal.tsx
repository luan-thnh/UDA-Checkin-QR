import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation, Check } from 'lucide-react';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const customIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface MapModalProps {
  initialLat: number;
  initialLng: number;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

export function MapModal({ initialLat, initialLng, onConfirm, onClose }: MapModalProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [locating, setLocating] = useState(false);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Create map instance
    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 16);
    mapInstanceRef.current = map;

    // Add TileLayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add initial Marker
    const marker = L.marker([initialLat, initialLng], { icon: customIcon }).addTo(map);
    markerRef.current = marker;

    // Click event to update position
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      marker.setLatLng([lat, lng]);
    });

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // Run once on mount

  // Sync position state changes to map if updated via geolocation
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng(position);
      mapInstanceRef.current.setView(position);
    }
  }, [position]);

  function handleGetLocation() {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setLocating(false);
        },
        (err) => {
          alert('Không thể lấy vị trí hiện tại: ' + err.message);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Trình duyệt không hỗ trợ Geolocation.');
      setLocating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh] max-h-[700px]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Chọn vị trí điểm danh</h3>
            <p className="text-sm text-slate-500">Click trên bản đồ để ghim vị trí hoặc lấy vị trí hiện tại.</p>
          </div>
          <button className="text-slate-400 hover:text-danger transition-colors p-1" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative bg-slate-200">
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap gap-3 items-center justify-between">
          <div className="text-sm text-slate-600 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}
          </div>
          <div className="flex gap-2">
            <button 
              className="btn btn-outline text-slate-700 hover:bg-slate-100" 
              onClick={handleGetLocation} 
              disabled={locating}
            >
              <Navigation size={18} className={`mr-2 ${locating ? 'animate-pulse text-primary' : ''}`} />
              {locating ? 'Đang định vị...' : 'Vị trí của tôi'}
            </button>
            <button 
              className="btn bg-primary text-white hover:bg-primary-dark"
              onClick={() => {
                onConfirm(position[0], position[1]);
                onClose();
              }}
            >
              <Check size={18} className="mr-2" /> Lưu toạ độ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
