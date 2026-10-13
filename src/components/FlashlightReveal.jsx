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
  // Màu nền của quầng sáng đèn pin (phần không có nhân vật trong vùng chiếu)
  const [beamBgColor, setBeamBgColor] = useState(initialSettings.beamBgColor || '#fef08a'); // Mặc định vàng nhạt rực rỡ
  const [enableBeamBg, setEnableBeamBg] = useState(initialSettings.enableBeamBg ?? true);
  const [beamOpacity, setBeamOpacity] = useState(initialSettings.beamOpacity ?? 100);

  // Watermark
  const [watermarkText, setWatermarkText] = useState(initialSettings.watermarkText !== undefined ? initialSettings.watermarkText : '@Soonix');
  const [enableWatermark, setEnableWatermark] = useState(initialSettings.enableWatermark ?? true);
  const [watermarkFontSize, setWatermarkFontSize] = useState(initialSettings.watermarkFontSize ?? 14);
  const [watermarkColor, setWatermarkColor] = useState(initialSettings.watermarkColor || '#94a3b8');
  const [watermarkOpacity, setWatermarkOpacity] = useState(initialSettings.watermarkOpacity ?? 50);
  const [watermarkOffset, setWatermarkOffset] = useState(initialSettings.watermarkOffset ?? 0); // Vị trí căn dọc theo mép (-200 đến 200px)
  const [watermarkDistance, setWatermarkDistance] = useState(initialSettings.watermarkDistance ?? 16); // Khoảng cách tới mép phải (4px đến 100px)

  // Hiệu ứng đổi màu Watermark khi chiếu đèn
  const [enableWatermarkBeamEffect, setEnableWatermarkBeamEffect] = useState(initialSettings.enableWatermarkBeamEffect ?? true);
  const [watermarkActiveColor, setWatermarkActiveColor] = useState(initialSettings.watermarkActiveColor || '#facc15'); // Mặc định vàng nổi bật khi chiếu đèn

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
        imageSrc,
        beamBgColor,
        enableBeamBg,
        beamOpacity,
        watermarkText,
        enableWatermark,
        watermarkFontSize,
        watermarkColor,
        watermarkOpacity,
        watermarkOffset,
        watermarkDistance,
        enableWatermarkBeamEffect,
        watermarkActiveColor
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt:', e);
    }
  }, [radius, spotlightType, beamAngle, coneSpread, handSize, scale, offsetY, imageSrc, beamBgColor, enableBeamBg, beamOpacity, watermarkText, enableWatermark, watermarkFontSize, watermarkColor, watermarkOpacity, watermarkOffset, watermarkDistance, enableWatermarkBeamEffect, watermarkActiveColor]);

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

    // BƯỚC 4: Vẽ Ảnh của nhân vật lên trên vùng đã được soi đèn (giữ nguyên màu gốc sắc nét của ảnh)
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(activeImg, drawX, drawY, drawW, drawH);
    ctx.restore();

    // BƯỚC 5: Tô màu quầng sáng đèn pin cho toàn bộ phần còn lại trong vùng chiếu (chỗ không có nhân vật)
    if (enableBeamBg) {
      ctx.save();
      // Vẽ xuống lớp dưới cùng của canvas (dưới lớp ảnh nhân vật và lớp đen)
      ctx.globalCompositeOperation = 'destination-over';
      ctx.globalAlpha = Math.max(0, Math.min(1, beamOpacity / 100));
      ctx.fillStyle = beamBgColor;

      if (spotlightType === 'circle') {
        ctx.beginPath();
        ctx.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
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
      }
      ctx.restore();
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [cursorPos, radius, spotlightType, beamAngle, coneSpread, imageSrc, is916Mode, offsetY, beamBgColor, enableBeamBg, beamOpacity]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageSrc(URL.createObjectURL(file));
    }
  };

  // Tính toán xem đèn pin có đang chiếu trúng Watermark hay không
  const isWatermarkLit = (() => {
    if (!enableWatermark || !enableWatermarkBeamEffect || !containerRef.current) return false;
    const cW = containerRef.current.clientWidth || 0;
    const cH = containerRef.current.clientHeight || 0;
    if (cW === 0 || cH === 0) return false;

    // Vị trí tâm Watermark trên container
    const wmX = cW - watermarkDistance;
    const wmY = cH / 2;

    // Bán kính đèn thực tế quy đổi sang container pixels (canvas 540x960 xoay -90deg)
    // Tỉ lệ scale thực tế của canvas hiển thị
    const canvasScale = (scale / 100) * (is916Mode ? 1.25 : 0.95);
    const effectiveRadius = radius * canvasScale;

    if (spotlightType === 'circle') {
      const dist = Math.hypot(cursorPos.rawX - wmX, cursorPos.rawY - wmY);
      return dist <= (effectiveRadius + 25);
    } else {
      // Dạng hình nón: tính góc và khoảng cách
      // Chú ý: beamAngle trên canvas đã xoay -90deg so với container
      // Trên canvas: vector đèn (cos(beamAngle), sin(beamAngle)).
      // Do canvas xoay -90deg: góc trên container = beamAngle - 90 deg
      const containerAngle = ((beamAngle - 90) * Math.PI) / 180;
      const dx = wmX - cursorPos.rawX;
      const dy = wmY - cursorPos.rawY;
      const dist = Math.hypot(dx, dy);
      if (dist < 20) return true; // Ngay tại nguồn sáng đèn pin

      const angleToWm = Math.atan2(dy, dx);
      let angleDiff = Math.abs(angleToWm - containerAngle);
      while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

      const halfSpread = ((coneSpread / 2) * Math.PI) / 180;
      return angleDiff <= (halfSpread + 0.15);
    }
  })();

  const currentWatermarkColor = (enableWatermarkBeamEffect && isWatermarkLit) ? watermarkActiveColor : watermarkColor;
  const currentWatermarkOpacity = (enableWatermarkBeamEffect && isWatermarkLit) ? 1 : (watermarkOpacity / 100);

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

          {/* Màu Quầng Sáng Đèn Pin (Phần chiếu ngoài nhân vật) */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-sky-500/20">
            <div className="flex items-center justify-between">
              <label className="text-xs text-sky-300 font-bold flex items-center gap-1.5">
                <span>🔦 Màu Quầng Sáng Đèn:</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableBeamBg}
                  onChange={(e) => setEnableBeamBg(e.target.checked)}
                  className="accent-sky-400 cursor-pointer"
                />
                <span>Đổi màu</span>
              </label>
            </div>

            {enableBeamBg && (
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Màu ánh đèn:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={beamBgColor}
                      onChange={(e) => setBeamBgColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                    />
                    <span className="text-xs font-mono text-white uppercase">{beamBgColor}</span>
                  </div>
                </div>

                {/* Độ mờ / trong suốt */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Độ đậm ánh sáng:</span>
                    <span className="text-white font-mono">{beamOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={beamOpacity}
                    onChange={(e) => setBeamOpacity(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>

                {/* Gợi ý các màu ánh đèn sặc sỡ: Đỏ, Cam, Vàng, Lục, Lam, Tím */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {[
                    { label: 'Đỏ', color: '#ff0033' },
                    { label: 'Cam', color: '#ff6600' },
                    { label: 'Vàng', color: '#ffee00' },
                    { label: 'Lục', color: '#00e640' },
                    { label: 'Lam', color: '#00a8ff' },
                    { label: 'Tím', color: '#9c27b0' },
                    { label: 'Hồng Neon', color: '#ff007f' },
                    { label: 'Trắng Sáng', color: '#ffffff' }
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setBeamBgColor(preset.color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 cursor-pointer shadow-sm ${
                        beamBgColor.toLowerCase() === preset.color.toLowerCase()
                          ? 'ring-2 ring-sky-400 scale-125 border-white'
                          : 'border-slate-700 opacity-90 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>
            )}
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

          {/* Watermark Logo / Tên kênh */}
          <div className="flex flex-col gap-2.5 p-3 bg-slate-900/60 rounded-xl border border-sky-500/20">
            <div className="flex items-center justify-between">
              <label className="text-xs text-sky-300 font-bold flex items-center gap-1.5">
                <span>🏷️ Watermark Phía Dưới:</span>
              </label>
              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer font-normal">
                <input
                  type="checkbox"
                  checked={enableWatermark}
                  onChange={(e) => setEnableWatermark(e.target.checked)}
                  className="accent-sky-400 cursor-pointer"
                />
                <span>Bật</span>
              </label>
            </div>
            {enableWatermark && (
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Nhập watermark (ví dụ: @Soonix)"
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />

                {/* Kích thước phông chữ & Màu sắc */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Cỡ chữ:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="8"
                          max="200"
                          value={watermarkFontSize}
                          onChange={(e) => setWatermarkFontSize(Math.max(1, Number(e.target.value)))}
                          className="w-12 px-1.5 py-0.5 bg-slate-700 text-white rounded text-[11px] text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                        />
                        <span className="text-[10px] text-slate-400">px</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="120"
                      value={Math.min(120, Math.max(8, watermarkFontSize))}
                      onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                      className="accent-sky-400 cursor-pointer h-1.5"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Màu chữ:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="color"
                          value={watermarkColor}
                          onChange={(e) => setWatermarkColor(e.target.value)}
                          className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 justify-end pt-0.5">
                      {['#94a3b8', '#ffffff', '#000000', '#facc15', '#38bdf8'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setWatermarkColor(c)}
                          className={`w-3.5 h-3.5 rounded-full border ${watermarkColor === c ? 'border-sky-400 scale-110' : 'border-slate-600'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Độ mờ (Opacity) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Độ mờ / trong suốt:</span>
                    <span className="text-white font-mono">{watermarkOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>

                {/* Vị trí căn chỉnh */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Khoảng cách cách mép:</span>
                    <span className="text-white font-mono">{watermarkDistance}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="120"
                    value={watermarkDistance}
                    onChange={(e) => setWatermarkDistance(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>

                {/* Hiệu ứng đổi màu Watermark khi đèn pin soi qua */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                      <span>💡 Đổi màu khi chiếu đèn:</span>
                    </span>
                    <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableWatermarkBeamEffect}
                        onChange={(e) => setEnableWatermarkBeamEffect(e.target.checked)}
                        className="accent-amber-400 cursor-pointer"
                      />
                      <span className="text-amber-300 font-medium">{enableWatermarkBeamEffect ? 'Bật' : 'Tắt'}</span>
                    </label>
                  </div>

                  {enableWatermarkBeamEffect && (
                    <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-amber-500/30">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Màu khi đèn soi vào:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={watermarkActiveColor}
                            onChange={(e) => setWatermarkActiveColor(e.target.value)}
                            className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                          />
                          <span className="text-xs font-mono text-white uppercase">{watermarkActiveColor}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 justify-end pt-0.5">
                        {['#facc15', '#f97316', '#ef4444', '#22c55e', '#06b6d4', '#a855f7', '#ffffff'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setWatermarkActiveColor(c)}
                            className={`w-3.5 h-3.5 rounded-full border transition-transform ${watermarkActiveColor === c ? 'border-amber-400 scale-125' : 'border-slate-600'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Mặc định: @Soonix</span>
                  <button
                    type="button"
                    onClick={() => {
                      setWatermarkText('@Soonix');
                      setWatermarkFontSize(14);
                      setWatermarkColor('#94a3b8');
                      setWatermarkOpacity(50);
                      setWatermarkDistance(16);
                      setEnableWatermarkBeamEffect(true);
                      setWatermarkActiveColor('#facc15');
                    }}
                    className="text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    Đặt lại mặc định
                  </button>
                </div>
              </div>
            )}
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

          {/* WATERMARK PHÍA DƯỚI NỘI DUNG (Văn bản mờ ở mép chân nội dung, xoay -90deg theo hướng đọc dọc) */}
          {enableWatermark && watermarkText && (
            <div
              className="absolute z-20 pointer-events-none select-none flex items-center justify-center whitespace-nowrap"
              style={{
                right: `${watermarkDistance}px`,
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                transformOrigin: 'center center'
              }}
            >
              <span
                className="font-semibold tracking-widest font-sans select-none transition-all duration-150"
                style={{
                  fontSize: `${watermarkFontSize}px`,
                  color: currentWatermarkColor,
                  opacity: currentWatermarkOpacity,
                  textShadow: (enableWatermarkBeamEffect && isWatermarkLit)
                    ? `0 0 10px ${currentWatermarkColor}, 0 0 20px ${currentWatermarkColor}88`
                    : '0 1px 2px rgba(0,0,0,0.3)',
                  filter: (enableWatermarkBeamEffect && isWatermarkLit) ? 'brightness(1.2)' : 'none'
                }}
              >
                {watermarkText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
