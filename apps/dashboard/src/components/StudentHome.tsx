import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, ClipboardEdit, AlertTriangle, ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react';

export function StudentHome() {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();

  function goToSession(code: string) {
    if (!code.trim()) return;
    navigate(`/c/${code.trim()}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl p-8 relative overflow-hidden">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent"></div>
        
        <div className="flex flex-col items-center text-center mb-8 pt-4">
          <div className="w-16 h-16 bg-primary-light text-primary rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-primary/20">
            <BookOpen size={32} />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold tracking-wide text-slate-500 uppercase mb-4 border border-slate-200">
            <CheckCircle2 size={14} className="text-primary" />
            Hệ thống điểm danh UDA
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 leading-tight mb-3">
            Điểm danh<br/>Sinh viên
          </h1>
          <p className="text-slate-500 text-sm">
            Quét mã QR trên máy chiếu hoặc nhập<br/>mã điểm danh để bắt đầu tiết học
          </p>
        </div>

        {/* Scan Button */}
        {!isScanning ? (
          <button 
            onClick={() => setIsScanning(true)}
            className="w-full h-16 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-3 group mb-6 hover:-translate-y-1"
          >
            <QrCode size={24} className="group-hover:scale-110 transition-transform" />
            QUÉT MÃ QR
          </button>
        ) : (
          <div className="mb-6 border-2 border-primary/20 rounded-2xl p-2 bg-slate-50 relative animate-in fade-in zoom-in duration-300">
            <QRScanner onClose={() => setIsScanning(false)} onScan={goToSession} />
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">HOẶC</span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Manual Input */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <ClipboardEdit size={16} className="text-slate-500" />
              Mã điểm danh
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="VD: SS-ABCXYZ"
              className="flex-1 h-12 bg-white border border-slate-300 rounded-xl px-4 font-mono text-sm uppercase outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-slate-800"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && goToSession(manualCode)}
            />
            <button 
              onClick={() => goToSession(manualCode)}
              disabled={!manualCode.trim()}
              className="h-12 px-5 bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              Tiếp <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-100/50 p-3 rounded-xl border border-slate-100">
          <AlertTriangle size={14} className="shrink-0 text-slate-400 mt-0.5" />
          <span>Nếu không thể dùng Camera quét mã, hãy yêu cầu Giảng viên cung cấp Mã Phiên (ID) để nhập thủ công.</span>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-slate-400 font-medium">
        UDA Check-in System &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}

// Separate component for the scanner to manage lifecycle correctly
function QRScanner({ onScan, onClose }: { onScan: (code: string) => void, onClose: () => void }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );
    
    scannerRef.current.render((text) => {
      // Pause or stop right after scanning
      if (scannerRef.current) {
         scannerRef.current.clear();
      }
      // If it's a deep link (e.g. https://zalo.me/s/.../?session=...), extract session
      // For this app, Zalo deep link usually contains `?session=UUID` or just raw UUID
      let code = text;
      try {
         const url = new URL(text);
         if (url.searchParams.has('session')) {
           code = url.searchParams.get('session')!;
         }
      } catch (e) {
         // Not a URL, use raw string
      }
      onScan(code);
    }, (err) => {
      // ignore frame scan errors (normal)
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col relative bg-black/5 rounded-xl overflow-hidden">
      <div id="qr-reader" className="w-full [&>div]:!border-none [&_video]:rounded-lg"></div>
      <button 
        onClick={onClose}
        className="mt-2 text-sm text-danger font-medium hover:underline p-2 mx-auto"
      >
        Hủy quét
      </button>
    </div>
  );
}
