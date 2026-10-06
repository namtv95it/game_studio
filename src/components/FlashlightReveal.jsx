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
    <div style={{ display: 'flex', width: '100%', height: '100vh', background: '#0f172a' }}>
      {/* SIDEBAR SETTINGS */}
      <div style={{ width: '320px', background: '#1e293b', padding: '20px', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔦 CÀI ĐẶT SOI ĐÈN PIN
        </h2>

        {/* Upload Image */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Tải Ảnh Gốc (PNG/JPG):</label>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: '#334155', borderRadius: '8px', cursor: 'pointer', border: '1px dashed #64748b' }}>
            <Upload size={16} /> Chọn Ảnh Tải Lên
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Radius */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Bán Kính Quầng Sáng ({radius}px):</label>
          <input type="range" min="50" max="300" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ accentColor: '#38bdf8' }} />
        </div>

        {/* Spotlight Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Kiểu Chiếu Đèn Pin:</label>
          <select value={spotlightType} onChange={(e) => setSpotlightType(e.target.value)} style={{ padding: '10px', background: '#334155', color: 'white', borderRadius: '8px', border: 'none' }}>
            <option value="circle">🔵 Quầng Sáng Tròn (Circle)</option>
            <option value="cone">📐 Vệt Nón Chiếu Chéo (Cone Beam)</option>
          </select>
        </div>

        {/* Hand Size */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Kích Thước Bàn Tay 👆 ({handSize}px):</label>
          <input type="range" min="24" max="100" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} style={{ accentColor: '#38bdf8' }} />
        </div>

        {/* Scale */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Tỉ Lệ Phóng To ({scale}%):</label>
          <input type="range" min="50" max="200" value={scale} onChange={(e) => setScale(Number(e.target.value))} style={{ accentColor: '#38bdf8' }} />
        </div>

        {/* Offset Y */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Vị Trí Lên/Xuống ({offsetY}px):</label>
          <input type="range" min="-300" max="300" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} style={{ accentColor: '#38bdf8' }} />
        </div>

        {/* 9:16 Run Mode Button */}
        <button 
          onClick={() => setIs916Mode(!is916Mode)} 
          style={{ marginTop: 'auto', padding: '12px', background: is916Mode ? '#ef4444' : '#0284c7', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Play size={18} /> {is916Mode ? 'Thoát Chế Độ 9:16' : 'Khởi Chạy Soi Đèn Pin (9:16)'}
        </button>
      </div>

      {/* STAGE DISPLAY AREA */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', position: 'relative', overflow: 'hidden' }}>
        <div 
          ref={containerRef}
          onMouseMove={handleMouseMove}
          style={{ 
            width: is916Mode ? '450px' : '600px', 
            height: is916Mode ? '800px' : '600px', 
            position: 'relative', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            cursor: 'none',
            transform: `scale(${scale / 100}) translateY(${offsetY}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <canvas 
            ref={canvasRef} 
            width={is916Mode ? 450 : 600} 
            height={is916Mode ? 800 : 600} 
            style={{ width: '100%', height: '100%' }}
          />

          {/* HAND CURSOR OVERLAY 👆 */}
          <div 
            style={{ 
              position: 'absolute', 
              left: `${cursorPos.x}px`, 
              top: `${cursorPos.y}px`, 
              fontSize: `${handSize}px`, 
              pointerEvents: 'none',
              transform: 'translate(-30%, -20%)',
              userSelect: 'none',
              filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))'
            }}
          >
            👆
          </div>
        </div>
      </div>
    </div>
  );
}
