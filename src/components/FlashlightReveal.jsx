import React, { useRef, useEffect, useState } from 'react';
import { Upload, Play } from 'lucide-react';

const STORAGE_KEY = 'flashlight_game_settings';

export default function FlashlightReveal({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  const getSavedSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const initialSettings = getSavedSettings();

  const [imageSrc, setImageSrc] = useState(initialSettings.imageSrc || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png');
  const [radius, setRadius] = useState(initialSettings.radius ?? 80);
  const [spotlightType, setSpotlightType] = useState(initialSettings.spotlightType || 'circle');
  const [beamAngle, setBeamAngle] = useState(initialSettings.beamAngle ?? -135);
  const [coneSpread, setConeSpread] = useState(initialSettings.coneSpread ?? 45);
  const [handSize, setHandSize] = useState(initialSettings.handSize ?? 48);
  const [scale, setScale] = useState(initialSettings.scale ?? 100);
  const [offsetY, setOffsetY] = useState(initialSettings.offsetY ?? 0);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, rawX: -100, rawY: -100 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  // Tự động lưu cài đặt vào localStorage khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        radius,
        spotlightType,
        beamAngle,
        coneSpread,
        handSize,
        scale,
        offsetY,
        imageSrc
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt:', e);
    }
  }, [radius, spotlightType, beamAngle, coneSpread, handSize, scale, offsetY, imageSrc]);

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
    const activeImg = imgRef.current;
    if (!activeImg || !activeImg.width || !activeImg.height) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Aspect ratio fit (contain mode) - giữ tỉ lệ gốc của ảnh PNG, không bị méo hay cắt mép ở chân/đầu
    const imgRatio = activeImg.width / activeImg.height;
    const canvasRatio = width / height;

    let drawW, drawH, drawX, drawY;
    if (imgRatio > canvasRatio) {
      drawW = width * 0.85; // Thu vừa vặn 85% để tạo khoảng lùi an toàn
      drawH = drawW / imgRatio;
      drawX = (width - drawW) / 2;
      drawY = (height - drawH) / 2 + offsetY;
    } else {
      drawH = height * 0.85;
      drawW = drawH * imgRatio;
      drawX = (width - drawW) / 2;
      drawY = (height - drawH) / 2 + offsetY;
    }

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // BƯỚC 1: Vẽ Ảnh màu gốc ở dưới cùng (dịch chuyển theo offsetY & tỉ lệ chuẩn)
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(activeImg, drawX, drawY, drawW, drawH);

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
      // Vệt Nón Chiếu Chéo theo beamAngle (Góc Hướng) và coneSpread (Độ Mở Góc Chiếu)
      ctx.save();
      const centerRad = (beamAngle * Math.PI) / 180;
      const halfSpreadRad = ((coneSpread / 2) * Math.PI) / 180;
      const length = Math.max(width, height) * 2.5;

      const angle1 = centerRad - halfSpreadRad;
      const angle2 = centerRad + halfSpreadRad;

      const x1 = cursorPos.x + Math.cos(angle1) * length;
      const y1 = cursorPos.y + Math.sin(angle1) * length;
      const x2 = cursorPos.x + Math.cos(angle2) * length;
      const y2 = cursorPos.y + Math.sin(angle2) * length;

      ctx.beginPath();
      ctx.moveTo(cursorPos.x, cursorPos.y);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // BƯỚC 4: Vẽ lại Màu Gốc ở các vùng đã được đục thủng
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(activeImg, drawX, drawY, drawW, drawH);
  };

  useEffect(() => {
    renderCanvas();
  }, [cursorPos, radius, spotlightType, beamAngle, coneSpread, imageSrc, is916Mode, offsetY]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageSrc(URL.createObjectURL(file));
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

          {/* Upload 1 PNG Image */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Tải Ảnh Nhân Vật (PNG Trong Suốt):</label>
            <label className="flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer border border-dashed border-slate-500 text-xs font-semibold text-center transition-colors">
              <Upload size={16} /> Tải Ảnh Mới (.PNG)
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {/* Radius */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Bán Kính Vệt Sáng:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
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
            <>
              {/* Beam Angle */}
              <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-sky-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-bold flex items-center gap-1">
                    🧭 Hướng Góc Chiếu:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="-180"
                      max="180"
                      value={beamAngle}
                      onChange={(e) => setBeamAngle(Number(e.target.value))}
                      className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-bold"
                    />
                    <span className="text-xs text-sky-400 font-bold">°</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={beamAngle}
                  onChange={(e) => setBeamAngle(Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer"
                />
              </div>

              {/* Cone Spread Angle */}
              <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-sky-500/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-bold flex items-center gap-1">
                    📐 Độ Mở Góc Chiếu:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="5"
                      max="160"
                      value={coneSpread}
                      onChange={(e) => setConeSpread(Number(e.target.value))}
                      className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-bold"
                    />
                    <span className="text-xs text-sky-400 font-bold">°</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="5"
                  max="160"
                  value={coneSpread}
                  onChange={(e) => setConeSpread(Number(e.target.value))}
                  className="accent-sky-400 cursor-pointer"
                />
              </div>
            </>
          )}

          {/* Hand Size */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Kích Thước Bàn Tay 👆:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="24"
                  max="500"
                  value={handSize}
                  onChange={(e) => setHandSize(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            <input type="range" min="24" max="500" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />
          </div>

          {/* Scale */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Tỉ Lệ Phóng To:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="50"
                  max="200"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>
            <input type="range" min="50" max="200" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />
          </div>

          {/* Offset Y */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Vị Trí Lên/Xuống:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="-300"
                  max="300"
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
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
      <div className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
        }`}>
        {/* CONTAINER KHUNG NẰM NGANG NỀN GRID TRẮNG GIỐNG HỆT KHI ĐANG CHẠY */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className={`relative overflow-hidden cursor-none transition-all duration-300 ${is916Mode
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

          {/* HAND CURSOR OVERLAY 👆 (Đầu ngón tay trỏ đúng vị trí con trỏ) */}
          <div
            className="absolute pointer-events-none select-none z-30 transition-transform"
            style={{
              left: `${cursorPos.rawX}px`,
              top: `${cursorPos.rawY}px`,
              fontSize: `${handSize}px`,
              transformOrigin: '50% 12%',
              transform: 'translate(-50%, -12%) rotate(-90deg)'
            }}
          >
            👆
          </div>
        </div>
      </div>
    </div>
  );
}
