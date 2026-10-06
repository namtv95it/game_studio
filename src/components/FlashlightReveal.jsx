import React, { useRef, useEffect, useState } from 'react';
import { Circle, Maximize2, MoveVertical, Hand, Upload, Play } from 'lucide-react';

export default function FlashlightReveal() {
  const [imageSrc, setImageSrc] = useState('https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80');
  const [radius, setRadius] = useState(120);
  const [spotlightType, setSpotlightType] = useState('circle'); // 'circle' | 'cone'
  const [handSize, setHandSize] = useState(48);
  const [scale, setScale] = useState(100);
  const [offsetY, setOffsetY] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [is916Mode, setIs916Mode] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  // Load Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
  }, [imageSrc]);

  // Handle Mouse Move
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  // Render Canvas (Spotlight Masking)
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Original Color Image
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(imgRef.current, 0, 0, width, height);

    // 2. Draw Black Mask
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // 3. Cut Hole (Destination-Out)
    ctx.globalCompositeOperation = 'destination-out';

    if (spotlightType === 'circle') {
      const gradient = ctx.createRadialGradient(cursorPos.x, cursorPos.y, radius * 0.4, cursorPos.x, cursorPos.y, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cone Beam Spotlight
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cursorPos.x, cursorPos.y);
      ctx.lineTo(cursorPos.x - radius * 1.2, cursorPos.y - radius * 2.5);
      ctx.lineTo(cursorPos.x + radius * 1.2, cursorPos.y - radius * 2.5);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(cursorPos.x, cursorPos.y, 10, cursorPos.x, cursorPos.y, radius * 2.5);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [cursorPos, radius, spotlightType, imageSrc]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-56px)] bg-slate-900">
      {/* SIDEBAR SETTINGS WITH TAILWIND */}
      <div className="w-80 bg-slate-800 p-5 border-r border-slate-700 flex flex-col gap-5 overflow-y-auto">
        <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2">
          🔦 CÀI ĐẶT SOI ĐÈN PIN
        </h2>

        {/* Upload Image */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium">Tải Ảnh Gốc (PNG/JPG):</label>
          <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer border border-dashed border-slate-500 transition-colors">
            <Upload size={16} /> Chọn Ảnh Tải Lên
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        {/* Radius */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium">Bán Kính Quầng Sáng ({radius}px):</label>
          <input type="range" min="50" max="300" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="accent-sky-400" />
        </div>

        {/* Spotlight Type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium">Kiểu Chiếu Đèn Pin:</label>
          <select value={spotlightType} onChange={(e) => setSpotlightType(e.target.value)} className="p-2.5 bg-slate-700 text-white rounded-lg border-none focus:ring-2 focus:ring-sky-400 outline-none">
            <option value="circle">🔵 Quầng Sáng Tròn (Circle)</option>
            <option value="cone">📐 Vệt Nón Chiếu Chéo (Cone Beam)</option>
          </select>
        </div>

        {/* Hand Size */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium">Kích Thước Bàn Tay 👆 ({handSize}px):</label>
          <input type="range" min="24" max="100" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="accent-sky-400" />
        </div>

        {/* Scale */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium">Tỉ Lệ Phóng To ({scale}%):</label>
          <input type="range" min="50" max="200" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="accent-sky-400" />
        </div>

        {/* Offset Y */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium">Vị Trí Lên/Xuống ({offsetY}px):</label>
          <input type="range" min="-300" max="300" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} className="accent-sky-400" />
        </div>

        {/* 9:16 Run Mode Button */}
        <button 
          onClick={() => setIs916Mode(!is916Mode)} 
          className={`mt-auto p-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
            is916Mode ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          <Play size={18} /> {is916Mode ? 'Thoát Chế Độ 9:16' : 'Khởi Chạy Soi Đèn Pin (9:16)'}
        </button>

      </div>

      {/* STAGE DISPLAY AREA WITH TAILWIND */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 relative overflow-hidden">
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className={`relative rounded-2xl overflow-hidden shadow-2xl cursor-none transition-transform duration-100 ${
            is916Mode ? 'w-[450px] h-[800px]' : 'w-[600px] h-[600px]'
          }`}
          style={{ 
            transform: `scale(${scale / 100}) translateY(${offsetY}px)`
          }}
        >
          <canvas 
            ref={canvasRef} 
            width={is916Mode ? 450 : 600} 
            height={is916Mode ? 800 : 600} 
            className="w-full h-full"
          />

          {/* HAND CURSOR OVERLAY 👆 */}
          <div 
            className="absolute pointer-events-none select-none drop-shadow-2xl transition-transform"
            style={{ 
              left: `${cursorPos.x}px`, 
              top: `${cursorPos.y}px`, 
              fontSize: `${handSize}px`, 
              transform: 'translate(-30%, -20%)'
            }}
          >
            👆
          </div>
        </div>
      </div>
    </div>
  );
}
