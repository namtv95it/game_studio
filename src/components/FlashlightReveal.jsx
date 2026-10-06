import React, { useRef, useEffect, useState } from 'react';
import { Upload, Play } from 'lucide-react';

export default function FlashlightReveal({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  const [imageSrc, setImageSrc] = useState('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'); // Ảnh 1
  const [imageSrc2, setImageSrc2] = useState(null); // Ảnh 2
  const [targetSlot, setTargetSlot] = useState(1); // 1 | 2
  const [radius, setRadius] = useState(80);
  const [spotlightType, setSpotlightType] = useState('circle'); // 'circle' | 'cone'
  const [beamAngle, setBeamAngle] = useState(-135); // Góc chiếu vệt nón chéo
  const [handSize, setHandSize] = useState(48);
  const [scale, setScale] = useState(100);
  const [offsetY, setOffsetY] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, rawX: -100, rawY: -100 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef1 = useRef(null);
  const imgRef2 = useRef(null);

  // Bắt phím ESC để thoát chế độ Ẩn Giao Diện (Quay về giữ nguyên Sidebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        setIs916Mode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIs916Mode]);

  // Load Images
  useEffect(() => {
    const img1 = new Image();
    img1.crossOrigin = 'Anonymous';
    img1.src = imageSrc;
    img1.onload = () => {
      imgRef1.current = img1;
      renderCanvas();
    };

    if (imageSrc2) {
      const img2 = new Image();
      img2.crossOrigin = 'Anonymous';
      img2.src = imageSrc2;
      img2.onload = () => {
        imgRef2.current = img2;
        renderCanvas();
      };
    }
  }, [imageSrc, imageSrc2]);

  // Handle Mouse Move: Tính toán ma trận đồng bộ 100% khi nằm ngang 90deg ở cả 2 trạng thái
  const handleMouseMove = (e) => {
    if (!containerRef.current || !canvasRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - containerRect.left;
    const rawY = e.clientY - containerRect.top;

    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width === 0 || canvasRect.height === 0) return;

    const cRawX = e.clientX - canvasRect.left;
    const cRawY = e.clientY - canvasRect.top;

    const canvasY = (cRawX / canvasRect.width) * canvas.height;
    const canvasX = (1 - (cRawY / canvasRect.height)) * canvas.width;

    setCursorPos({ x: canvasX, y: canvasY, rawX, rawY });
  };

  // Render Canvas Logic
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeImg = targetSlot === 1 ? imgRef1.current : (imgRef2.current || imgRef1.current);
    if (!activeImg) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // BƯỚC 1: Vẽ Ảnh màu gốc ở dưới cùng
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(activeImg, 0, offsetY, width, height);

    // BƯỚC 2: Phủ lớp Đen ĐẶC CHỈ lên khu vực hình ảnh PNG (vùng Alpha > 0)
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // BƯỚC 3: Đục thủng vệt sáng Đèn Pin SẮC NÉT
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'black';

    if (spotlightType === 'circle') {
      ctx.beginPath();
      ctx.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Vệt Nón Chiếu Chéo theo beamAngle linh hoạt
      ctx.save();
      const rad = (beamAngle * Math.PI) / 180;
      const length = Math.max(width, height) * 1.5;
      const endX = cursorPos.x + Math.cos(rad) * length;
      const endY = cursorPos.y + Math.sin(rad) * length;

      const perpX = -Math.sin(rad);
      const perpY = Math.cos(rad);

      const p1x = cursorPos.x + perpX * radius;
      const p1y = cursorPos.y + perpY * radius;
      const p2x = cursorPos.x - perpX * radius;
      const p2y = cursorPos.y - perpY * radius;
      const p3x = endX - perpX * radius * 1.5;
      const p3y = endY - perpY * radius * 1.5;
      const p4x = endX + perpX * radius * 1.5;
      const p4y = endY + perpY * radius * 1.5;

      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p4x, p4y);
      ctx.lineTo(p3x, p3y);
      ctx.lineTo(p2x, p2y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // BƯỚC 4: Vẽ lại Màu Gốc ở các vùng đã được đục thủng
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(activeImg, 0, offsetY, width, height);
  };

  useEffect(() => {
    renderCanvas();
  }, [cursorPos, radius, spotlightType, beamAngle, targetSlot, imageSrc, imageSrc2, is916Mode, offsetY]);

  const handleImageUpload1 = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageSrc(URL.createObjectURL(file));
    }
  };

  const handleImageUpload2 = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageSrc2(URL.createObjectURL(file));
    }
  };

  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      {/* TRẠNG THÁI 2: GIỮ NGUYÊN SIDEBAR (Nút Khởi Chạy dùng để bật Trạng Thái 1: Ẩn Hết) */}
      {!is916Mode && (
        <div className="w-80 bg-slate-800 p-5 border-r border-slate-700 flex flex-col gap-5 overflow-y-auto">
          <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2">
            🔦 CÀI ĐẶT SOI ĐÈN PIN (PNG)
          </h2>

          {/* Upload 2 PNG Images */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Tải 2 Ảnh Nhân Vật (PNG Trong Suốt):</label>
            <div className="flex gap-2">
              <label className="flex-1 flex flex-col items-center justify-center p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer border border-dashed border-slate-500 text-xs text-center">
                <Upload size={14} className="mb-1" /> Ảnh 1
                <input type="file" accept="image/*" onChange={handleImageUpload1} className="hidden" />
              </label>
              <label className="flex-1 flex flex-col items-center justify-center p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer border border-dashed border-slate-500 text-xs text-center">
                <Upload size={14} className="mb-1" /> Ảnh 2
                <input type="file" accept="image/*" onChange={handleImageUpload2} className="hidden" />
              </label>
            </div>
          </div>

          {/* Select Target Image Slot */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Chọn Ảnh Hiển Thị Soi Đèn:</label>
            <select value={targetSlot} onChange={(e) => setTargetSlot(Number(e.target.value))} className="p-2.5 bg-slate-700 text-white rounded-lg border-none focus:ring-2 focus:ring-sky-400 outline-none cursor-pointer">
              <option value={1}>Ảnh Số 1 (Mặc định)</option>
              <option value={2}>Ảnh Số 2</option>
            </select>
          </div>

          {/* Radius */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Bán Kính Vệt Sáng ({radius}px):</label>
            <input type="range" min="30" max="250" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />
          </div>

          {/* Spotlight Type & Beam Angle */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Kiểu Chiếu Đèn Pin:</label>
            <select value={spotlightType} onChange={(e) => setSpotlightType(e.target.value)} className="p-2.5 bg-slate-700 text-white rounded-lg border-none focus:ring-2 focus:ring-sky-400 outline-none cursor-pointer">
              <option value="circle">🔵 Vệt Sáng Tròn (Sắc Nét)</option>
              <option value="cone">📐 Vệt Nón Chiếu Chéo (Sắc Nét)</option>
            </select>
          </div>

          {spotlightType === 'cone' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-medium">Góc Chiếu Nón ({beamAngle}°):</label>
              <input type="range" min="-180" max="180" value={beamAngle} onChange={(e) => setBeamAngle(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />
            </div>
          )}

          {/* Hand Size */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Kích Thước Bàn Tay 👆 ({handSize}px):</label>
            <input type="range" min="24" max="100" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />
          </div>

          {/* Scale */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Tỉ Lệ Phóng To ({scale}%):</label>
            <input type="range" min="50" max="200" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />
          </div>

          {/* Offset Y */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Vị Trí Lên/Xuống ({offsetY}px):</label>
            <input type="range" min="-300" max="300" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />
          </div>

          {/* Nút Chuyển Sang Trạng Thái 1: Ẩn Hết Để Quay Video */}
          <button 
            onClick={() => setIs916Mode(true)} 
            className="mt-auto p-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Play size={18} /> Ẩn Giao Diện Quay Video (ESC Quay Lại)
          </button>
        </div>
      )}

      {/* KHUNG HIỂN THỊ KHU VỰC SÂN KHẤU (LUÔN LUÔN HIỂN THỊ GIỐNG KHI ĐANG CHẠY) */}
      <div className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${
        is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
      }`}>
        {/* CONTAINER KHUNG NẰM NGANG NỀN GRID TRẮNG GIỐNG HỆT KHI ĐANG CHẠY */}
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className={`relative overflow-hidden cursor-none transition-all duration-300 ${
            is916Mode 
              ? 'w-full h-full bg-white flex items-center justify-center' 
              : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
          }`}
        >
          {/* Nền Grid Kẻ Ô Mờ Chuẩn Nhất Xuất Hiện Ở Cả 2 Trạng Thái */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* CANVAS XOAY NẰM NGANG 90 ĐỘ GIỐNG HỆT KHI ĐANG CHẠY */}
          <div 
            style={{ 
              transform: `rotate(-90deg) scale(${(scale / 100) * (is916Mode ? 1.25 : 0.95)})`,
              transformOrigin: 'center center'
            }}
          >
            <canvas 
              ref={canvasRef} 
              width={540} 
              height={960} 
              className=""
            />
          </div>

          {/* HAND CURSOR OVERLAY 👆 (Bám sát theo ngón tay) */}
          <div 
            className="absolute pointer-events-none select-none z-30 transition-transform"
            style={{ 
              left: `${cursorPos.rawX}px`, 
              top: `${cursorPos.rawY}px`, 
              fontSize: `${handSize}px`, 
              transform: 'translate(-50%, -50%) rotate(-90deg)'
            }}
          >
            👆
          </div>
        </div>
      </div>
    </div>
  );
}
