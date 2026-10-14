import React, { useRef, useEffect, useState } from 'react';
import { Upload, Play, ChevronDown, ChevronUp, HelpCircle, Trash2, Plus, RotateCcw } from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';

const STORAGE_KEY = 'flashlight_game_settings';

const DEFAULT_SETTINGS = {
  imageSrc: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
  radius: 80,
  spotlightType: 'circle',
  beamAngle: -135,
  coneSpread: 45,
  handSize: 48,
  scale: 100,
  offsetY: 0,
  beamBgColor: '#fef08a',
  enableBeamBg: true,
  beamOpacity: 100,
  watermarkText: '@Soonix',
  enableWatermark: true,
  watermarkFontSize: 14,
  watermarkColor: '#94a3b8',
  watermarkOpacity: 50,
  watermarkOffset: 0,
  watermarkDistance: 16,
  enableWatermarkBeamEffect: true,
  watermarkActiveColor: '#facc15',
  enableWatermarkBg: true,
  watermarkBgColor: '#ffcc00',
  watermarkBgOpacity: 100,
  enableQuestionMarks: true,
  questionMarks: [],
  qmColor: '#ef4444',
  qmDefaultSize: 48
};

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

  // Màu nền Watermark (dạng thẻ/badge bo góc)
  const [enableWatermarkBg, setEnableWatermarkBg] = useState(initialSettings.enableWatermarkBg ?? true);
  const [watermarkBgColor, setWatermarkBgColor] = useState(initialSettings.watermarkBgColor || '#ffcc00'); // Màu vàng giống trong ảnh
  const [watermarkBgOpacity, setWatermarkBgOpacity] = useState(initialSettings.watermarkBgOpacity ?? 100);

  // Trạng thái Dấu Hỏi Chấm trên bóng đen (mặc định trống để người dùng tự bấm thêm)
  const [enableQuestionMarks, setEnableQuestionMarks] = useState(initialSettings.enableQuestionMarks ?? true);
  const [questionMarks, setQuestionMarks] = useState(initialSettings.questionMarks || []);
  const [qmColor, setQmColor] = useState(initialSettings.qmColor || '#ef4444'); // Đỏ tươi như trong ảnh
  const [qmDefaultSize, setQmDefaultSize] = useState(initialSettings.qmDefaultSize ?? 48);
  const [isPlacingQm, setIsPlacingQm] = useState(false); // Bật chế độ bấm để thêm dấu ?

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, rawX: -100, rawY: -100 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);
  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  // Trạng thái mở Accordion (chỉ mở 1 mục duy nhất tại một thời điểm, mở cái này thì đóng cái kia)
  const [activeSection, setActiveSection] = useState('flashlight');

  const toggleSection = (key) => {
    setActiveSection((prev) => (prev === key ? null : key));
  };

  const handleResetSettings = () => {
    setImageSrc('');
    setQuestionMarks([]);
    setIsPlacingQm(false);
  };

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
        watermarkActiveColor,
        enableWatermarkBg,
        watermarkBgColor,
        watermarkBgOpacity,
        enableQuestionMarks,
        questionMarks,
        qmColor,
        qmDefaultSize
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt:', e);
    }
  }, [radius, spotlightType, beamAngle, coneSpread, handSize, scale, offsetY, imageSrc, beamBgColor, enableBeamBg, beamOpacity, watermarkText, enableWatermark, watermarkFontSize, watermarkColor, watermarkOpacity, watermarkOffset, watermarkDistance, enableWatermarkBeamEffect, watermarkActiveColor, enableWatermarkBg, watermarkBgColor, watermarkBgOpacity, enableQuestionMarks, questionMarks, qmColor, qmDefaultSize]);

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
    if (!imageSrc) {
      imgRef.current = null;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
  }, [imageSrc]);

  // Tính toán tọa độ Canvas 540x960 từ tọa độ chuột thực tế
  const getCanvasCoords = (e) => {
    if (!containerRef.current || !canvasRef.current) return { canvasX: 0, canvasY: 0, rawX: 0, rawY: 0 };

    const containerRect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - containerRect.left;
    const rawY = e.clientY - containerRect.top;

    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width === 0 || canvasRect.height === 0) return { canvasX: 0, canvasY: 0, rawX, rawY };

    const cRawX = e.clientX - canvasRect.left;
    const cRawY = e.clientY - canvasRect.top;

    const canvasY = (cRawX / canvasRect.width) * canvas.height;
    const canvasX = (1 - (cRawY / canvasRect.height)) * canvas.width;

    return { canvasX, canvasY, rawX, rawY };
  };

  // Handle Mouse Move: Tính toán ma trận đồng bộ 100% khi nằm ngang 90deg ở cả 2 trạng thái
  const handleMouseMove = (e) => {
    const { canvasX, canvasY, rawX, rawY } = getCanvasCoords(e);
    setCursorPos({ x: canvasX, y: canvasY, rawX, rawY });
  };

  // Khi đang ở chế độ Đặt Dấu '?', nhấp chuột vào sân khấu để thêm hoặc xóa dấu ?
  const handleStageClick = (e) => {
    if (is916Mode || !isPlacingQm) return;
    const { canvasX, canvasY } = getCanvasCoords(e);
    const roundX = Math.round(canvasX);
    const roundY = Math.round(canvasY);

    // Kiểm tra xem có nhấp trúng dấu ? đã có nào để xóa không (bán kính 25px)
    const existingIdx = questionMarks.findIndex(
      (qm) => Math.hypot(qm.x - roundX, qm.y - roundY) < Math.max(25, (qm.size || qmDefaultSize) / 2)
    );

    if (existingIdx !== -1) {
      // Xóa dấu ? vừa bấm trúng
      setQuestionMarks((prev) => prev.filter((_, idx) => idx !== existingIdx));
    } else {
      // Thêm dấu ? mới tại vị trí nhấp
      const newQm = {
        id: `qm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        x: roundX,
        y: roundY,
        size: qmDefaultSize
      };
      setQuestionMarks((prev) => [...prev, newQm]);
    }
  };

  // Render Canvas Logic
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeImg = imgRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    if (!activeImg || !activeImg.width || !activeImg.height) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

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

    // BƯỚC 2.5: Vẽ các Dấu Hỏi Chấm '?' lên lớp bóng đen (chỉ hiển thị trên phần bóng đen)
    if (enableQuestionMarks && questionMarks.length > 0) {
      ctx.globalCompositeOperation = 'source-over';
      questionMarks.forEach((qm) => {
        const qmSize = qm.size || qmDefaultSize;
        ctx.save();
        ctx.font = `900 ${qmSize}px "Arial Black", "Arial", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Viền đỏ tươi rực rỡ và đổ bóng nhẹ
        ctx.fillStyle = qmColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;
        ctx.fillText('?', qm.x, qm.y);
        ctx.restore();
      });
    }

    // BƯỚC 3 & 4: Đục thủng vệt sáng Đèn Pin SẮC NÉT (chỉ khi KHÔNG ở chế độ đặt dấu hỏi ? hoặc khi đang chạy 9:16)
    if (!isPlacingQm || is916Mode) {
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
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [cursorPos, radius, spotlightType, beamAngle, coneSpread, imageSrc, is916Mode, offsetY, beamBgColor, enableBeamBg, beamOpacity, enableQuestionMarks, questionMarks, qmColor, qmDefaultSize, isPlacingQm]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageSrc(URL.createObjectURL(file));
    }
  };

  // Tính toán xem đèn pin có đang chiếu trúng Watermark hay không (tính trực tiếp trên hệ tọa độ Canvas 540x960)
  const isWatermarkLit = (() => {
    if (!enableWatermark || !enableWatermarkBeamEffect) return false;

    // Tọa độ Watermark trên canvas (Canvas: X=270, Y = 960 - watermarkDistance)
    const wmCanvasX = 270 + (watermarkOffset || 0);
    const wmCanvasY = 960 - watermarkDistance;

    if (spotlightType === 'circle') {
      const dist = Math.hypot(cursorPos.x - wmCanvasX, cursorPos.y - wmCanvasY);
      return dist <= (radius + 20);
    } else {
      const dx = wmCanvasX - cursorPos.x;
      const dy = wmCanvasY - cursorPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 20) return true;

      const angleToWm = Math.atan2(dy, dx);
      const centerRad = (beamAngle * Math.PI) / 180;
      let angleDiff = Math.abs(angleToWm - centerRad);
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

          {/* NHÓM 1: NHÂN VẬT & KHUNG HÌNH */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('character')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🖼️</span>
                <span className="text-xs font-bold text-sky-300">Nhân Vật & Khung Hình</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {scale}% • Y:{offsetY}px
                </span>
                {activeSection === 'character' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'character' && (
              <div className="p-3.5 flex flex-col gap-4 border-t border-slate-800">
                {/* Upload 1 PNG Image */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Tải Ảnh Nhân Vật (PNG):</label>
                  <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-700/90 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer border border-dashed border-slate-500 text-xs font-semibold text-center transition-colors">
                    <Upload size={15} /> Đổi Ảnh Nhân Vật (.PNG)
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {/* Scale */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Tỉ Lệ Phóng To:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="50"
                        max="200"
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>

                {/* Offset Y */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Vị Trí Lên/Xuống:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="-300"
                        max="300"
                        value={offsetY}
                        onChange={(e) => setOffsetY(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* NHÓM 2: VỆT SÁNG & ĐÈN PIN */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('flashlight')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🔦</span>
                <span className="text-xs font-bold text-sky-300">Vệt Sáng & Đèn Pin</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {radius}px • {spotlightType === 'circle' ? 'Tròn' : 'Nón'}
                </span>
                {activeSection === 'flashlight' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'flashlight' && (
              <div className="p-3.5 flex flex-col gap-4 border-t border-slate-800">
                {/* Spotlight Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-slate-400 font-medium">Kiểu Chiếu Đèn Pin:</label>
                  <select
                    value={spotlightType}
                    onChange={(e) => setSpotlightType(e.target.value)}
                    className="p-2 bg-slate-700/90 text-white rounded-lg border border-slate-600 focus:border-sky-400 text-xs outline-none cursor-pointer"
                  >
                    <option value="circle">🔵 Vệt Sáng Tròn (Sắc Nét)</option>
                    <option value="cone">📐 Vệt Nón Chiếu Chéo (Sắc Nét)</option>
                  </select>
                </div>

                {/* Radius */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Bán Kính Vệt Sáng:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="30"
                        max="250"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="250"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>

                {/* Cone options */}
                {spotlightType === 'cone' && (
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/40 rounded-xl border border-sky-500/20">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[11px] text-slate-300 font-semibold">
                        <span>Hướng:</span>
                        <span className="text-sky-400 font-mono">{beamAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={beamAngle}
                        onChange={(e) => setBeamAngle(Number(e.target.value))}
                        className="accent-sky-400 cursor-pointer h-1.5"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[11px] text-slate-300 font-semibold">
                        <span>Độ Mở:</span>
                        <span className="text-sky-400 font-mono">{coneSpread}°</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="160"
                        value={coneSpread}
                        onChange={(e) => setConeSpread(Number(e.target.value))}
                        className="accent-sky-400 cursor-pointer h-1.5"
                      />
                    </div>
                  </div>
                )}

                {/* Màu Quầng Sáng Đèn Pin */}
                <div className="flex flex-col gap-2 p-2.5 bg-slate-950/40 rounded-xl border border-sky-500/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-sky-300 font-bold flex items-center gap-1.5">
                      <span>Màu Quầng Sáng Đèn:</span>
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
                            className="w-6 h-6 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                          />
                          <span className="text-xs font-mono text-white uppercase">{beamBgColor}</span>
                        </div>
                      </div>

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

                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
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
                            className={`w-5 h-5 rounded-full border transition-transform hover:scale-125 cursor-pointer shadow-sm ${
                              beamBgColor.toLowerCase() === preset.color.toLowerCase()
                                ? 'ring-2 ring-sky-400 scale-110 border-white'
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

                {/* Hand Size */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Bàn Tay Chỉ 👆:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="24"
                        max="500"
                        value={handSize}
                        onChange={(e) => setHandSize(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="500"
                    value={handSize}
                    onChange={(e) => setHandSize(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* NHÓM MỚI: DẤU HỎI CHẤM TRÊN BÓNG ĐEN (?) */}
          <div className="bg-slate-900/50 rounded-xl border border-rose-500/30 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('questionMarks')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base text-rose-400 font-black">❓</span>
                <span className="text-xs font-bold text-rose-300">Dấu Hỏi Chấm (?) Trên Bóng</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${enableQuestionMarks ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-400'}`}>
                  {enableQuestionMarks ? `${questionMarks.length} dấu` : 'Tắt'}
                </span>
                {activeSection === 'questionMarks' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'questionMarks' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Bật Dấu Hỏi Chấm:</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableQuestionMarks}
                      onChange={(e) => setEnableQuestionMarks(e.target.checked)}
                      className="accent-rose-500 cursor-pointer"
                    />
                    <span className={enableQuestionMarks ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                      {enableQuestionMarks ? 'Đang Bật' : 'Đang Tắt'}
                    </span>
                  </label>
                </div>

                {enableQuestionMarks && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
                    {/* Nút bấm để Bật/Tắt chế độ nhấp chuột đặt dấu ? */}
                    <button
                      type="button"
                      onClick={() => setIsPlacingQm(!isPlacingQm)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        isPlacingQm
                          ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400 animate-pulse'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
                      }`}
                    >
                      <Plus size={14} />
                      {isPlacingQm ? '📍 ĐANG BẬT ĐẶT DẤU ? (Nhấp lên bóng để thêm)' : '➕ Nhấp chuột để đặt dấu ?'}
                    </button>

                    <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                      💡 <b>Hướng dẫn:</b> Bật nút trên, sau đó nhấp trực tiếp vào hình nhân vật trên khung để đặt thêm dấu <b>?</b>. Nhấp trúng dấu <b>?</b> đã có để xóa nó.
                    </p>

                    {/* Cỡ chữ mặc định & Màu sắc */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Cỡ chữ:</span>
                          <span className="font-mono text-white text-[11px]">{qmDefaultSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="120"
                          value={qmDefaultSize}
                          onChange={(e) => {
                            const newSize = Number(e.target.value);
                            setQmDefaultSize(newSize);
                            // Cập nhật kích thước cho toàn bộ dấu ? hiện có
                            setQuestionMarks((prev) => prev.map((q) => ({ ...q, size: newSize })));
                          }}
                          className="accent-rose-500 cursor-pointer h-1.5"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Màu chữ:</span>
                          <input
                            type="color"
                            value={qmColor}
                            onChange={(e) => setQmColor(e.target.value)}
                            className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                          />
                        </div>
                        <div className="flex items-center gap-1 justify-end pt-1">
                          {['#ef4444', '#f97316', '#facc15', '#22c55e', '#ffffff'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setQmColor(c)}
                              className={`w-3.5 h-3.5 rounded-full border ${qmColor === c ? 'border-rose-400 scale-110' : 'border-slate-600'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Danh sách các dấu hỏi chấm & nút xóa tất cả */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Đang có: <b className="text-white">{questionMarks.length}</b> dấu hỏi
                      </span>
                      {questionMarks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setQuestionMarks([])}
                          className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} /> Xóa tất cả dấu ?
                        </button>
                      )}
                    </div>

                    {/* Nút Đặt lại 5 dấu hỏi mẫu */}
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionMarks([
                          { id: 'qm-1', x: 270, y: 350, size: 55 },
                          { id: 'qm-2', x: 220, y: 440, size: 45 },
                          { id: 'qm-3', x: 320, y: 440, size: 45 },
                          { id: 'qm-4', x: 270, y: 530, size: 50 },
                          { id: 'qm-5', x: 270, y: 640, size: 45 }
                        ]);
                        setQmColor('#ef4444');
                        setQmDefaultSize(48);
                      }}
                      className="text-xs text-sky-400 hover:text-sky-300 hover:underline text-left cursor-pointer pt-0.5"
                    >
                      ↺ Khôi phục vị trí 5 dấu ? mẫu
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NHÓM 3: WATERMARK / LOGO KÊNH */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('watermark')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🏷️</span>
                <span className="text-xs font-bold text-sky-300">Watermark / Logo Kênh</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${enableWatermark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                  {enableWatermark ? 'Bật' : 'Tắt'}
                </span>
                {activeSection === 'watermark' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'watermark' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Bật Watermark:</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={(e) => setEnableWatermark(e.target.checked)}
                      className="accent-sky-400 cursor-pointer"
                    />
                    <span className={enableWatermark ? 'text-sky-300 font-bold' : 'text-slate-400'}>
                      {enableWatermark ? 'Đang Bật' : 'Đang Tắt'}
                    </span>
                  </label>
                </div>

                {enableWatermark && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-400">Nội dung watermark:</label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="Nhập watermark (ví dụ: @Soonix)"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                      />
                    </div>

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
                              className="w-12 px-1 py-0.5 bg-slate-700 text-white rounded text-[11px] text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
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
                          <input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                          />
                        </div>
                        <div className="flex items-center gap-1 justify-end pt-1">
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

                    {/* Khoảng cách cách mép & Độ mờ */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Cách mép:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={watermarkDistance}
                              onChange={(e) => setWatermarkDistance(Number(e.target.value))}
                              className="w-12 px-1 py-0.5 bg-slate-700 text-white rounded text-[11px] text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                            />
                            <span className="text-[10px] text-slate-400">px</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="-120"
                          max="200"
                          value={watermarkDistance}
                          onChange={(e) => setWatermarkDistance(Number(e.target.value))}
                          className="accent-sky-400 cursor-pointer h-1.5"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Độ mờ:</span>
                          <span className="text-white font-mono text-[11px]">{watermarkOpacity}%</span>
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
                    </div>

                    {/* Nền Thẻ Watermark (Badge bo góc) */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                          <span>🎨 Màu nền Thẻ Watermark:</span>
                        </span>
                        <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enableWatermarkBg}
                            onChange={(e) => setEnableWatermarkBg(e.target.checked)}
                            className="accent-amber-400 cursor-pointer"
                          />
                          <span className="text-amber-300 font-medium">{enableWatermarkBg ? 'Bật' : 'Tắt'}</span>
                        </label>
                      </div>

                      {enableWatermarkBg && (
                        <div className="flex flex-col gap-2 pl-2 border-l-2 border-amber-500/30">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Màu nền & Độ đậm:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={watermarkBgColor}
                                onChange={(e) => setWatermarkBgColor(e.target.value)}
                                className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                              />
                              <span className="text-[11px] font-mono text-white">{watermarkBgOpacity}%</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 justify-end">
                            {[
                              { name: 'Vàng rực', color: '#ffcc00' },
                              { name: 'Vàng chanh', color: '#facc15' },
                              { name: 'Cam', color: '#fb923c' },
                              { name: 'Đen mờ', color: '#0f172a' },
                              { name: 'Trắng', color: '#ffffff' },
                              { name: 'Đỏ', color: '#ef4444' },
                              { name: 'Xanh ngọc', color: '#06b6d4' }
                            ].map((p) => (
                              <button
                                key={p.color}
                                type="button"
                                onClick={() => setWatermarkBgColor(p.color)}
                                className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 ${
                                  watermarkBgColor.toLowerCase() === p.color.toLowerCase() ? 'border-white ring-1 ring-amber-400 scale-110' : 'border-slate-600'
                                }`}
                                style={{ backgroundColor: p.color }}
                                title={p.name}
                              />
                            ))}
                          </div>

                          <input
                            type="range"
                            min="10"
                            max="100"
                            value={watermarkBgOpacity}
                            onChange={(e) => setWatermarkBgOpacity(Number(e.target.value))}
                            className="accent-amber-400 cursor-pointer h-1.5"
                          />
                        </div>
                      )}
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
                      <span>Mẫu: Thẻ Vàng @Snake Magic</span>
                      <button
                        type="button"
                        onClick={() => {
                          setWatermarkText('@Snake Magic');
                          setWatermarkFontSize(18);
                          setWatermarkColor('#000000');
                          setWatermarkOpacity(100);
                          setEnableWatermarkBg(true);
                          setWatermarkBgColor('#ffcc00');
                          setWatermarkBgOpacity(100);
                          setWatermarkDistance(20);
                          setEnableWatermarkBeamEffect(false);
                        }}
                        className="text-amber-400 hover:text-amber-300 cursor-pointer underline font-medium"
                      >
                        Dùng mẫu Thẻ Vàng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nút Reset: Xóa Hết Hình Ảnh & Dấu ? */}
          <button
            type="button"
            onClick={handleResetSettings}
            className="mt-2 p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
            title="Xóa hết hình ảnh và dấu ? trên sân khấu, giữ nguyên toàn bộ thông số đèn pin và watermark"
          >
            <RotateCcw size={15} className="text-amber-400" /> Reset (Xóa Ảnh & Dấu ?)
          </button>

          {/* Nút Chuyển Sang Trạng Thái 1: Ẩn Hết Để Quay Video */}
          <button
            onClick={() => setIs916Mode(true)}
            className="p-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:shadow-sky-500/20 active:scale-98"
          >
            <Play size={18} /> Khởi Chạy
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
          onClick={handleStageClick}
          className={`relative overflow-hidden transition-all duration-300 ${
            isPlacingQm && !is916Mode ? 'cursor-crosshair' : 'cursor-none'
          } ${is916Mode
            ? 'w-full h-full bg-white flex items-center justify-center'
            : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
            }`}
        >
          {/* BANNER HƯỚNG DẪN KHI ĐANG BẬT CHẾ ĐỘ ĐẶT DẤU HỎI ? */}
          {isPlacingQm && !is916Mode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-rose-950/90 text-rose-200 text-xs font-semibold px-4 py-2 rounded-full border border-rose-500/50 shadow-2xl backdrop-blur-sm z-40 pointer-events-none flex items-center gap-2">
              <span className="animate-ping w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Đang bật chế độ đặt dấu <b>?</b>: Nhấp lên vị trí bóng đen để thêm, nhấp vào dấu <b>?</b> đã có để xóa</span>
            </div>
          )}
          {/* Lớp nền sân khấu linh hoạt (thay đổi theo cài đặt người dùng) */}
          <StageBackgroundOverlay />

          {/* QUẦNG SÁNG ĐÈN PIN NỀN TRÊN CONTAINER (Không bao giờ bị cắt viền do mép canvas) - Tắt khi đang ở chế độ đặt dấu hỏi ? */}
          {enableBeamBg && (!isPlacingQm || is916Mode) && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
              style={{ opacity: Math.max(0, Math.min(1, beamOpacity / 100)) }}
            >
              {spotlightType === 'circle' ? (
                <circle
                  cx={cursorPos.rawX}
                  cy={cursorPos.rawY}
                  r={radius * ((scale / 100) * (is916Mode ? 1.25 : 0.95))}
                  fill={beamBgColor}
                />
              ) : (() => {
                const effectiveR = Math.max(1200, radius * 8);
                const containerAngle = ((beamAngle - 90) * Math.PI) / 180;
                const halfSpread = ((coneSpread / 2) * Math.PI) / 180;
                const a1 = containerAngle - halfSpread;
                const a2 = containerAngle + halfSpread;
                const x1 = cursorPos.rawX + Math.cos(a1) * effectiveR;
                const y1 = cursorPos.rawY + Math.sin(a1) * effectiveR;
                const x2 = cursorPos.rawX + Math.cos(a2) * effectiveR;
                const y2 = cursorPos.rawY + Math.sin(a2) * effectiveR;
                return (
                  <path
                    d={`M ${cursorPos.rawX} ${cursorPos.rawY} L ${x1} ${y1} L ${x2} ${y2} Z`}
                    fill={beamBgColor}
                  />
                );
              })()}
            </svg>
          )}

          {/* CANVAS XOAY NẰM NGANG 90 ĐỘ GIỐNG HỆT KHI ĐANG CHẠY */}
          <div
            className="relative z-10"
            style={{
              transform: `rotate(-90deg) scale(${(scale / 100) * (is916Mode ? 1.25 : 0.95)})`,
              transformOrigin: 'center center',
              width: '540px',
              height: '960px'
            }}
          >
            <canvas
              ref={canvasRef}
              width={540}
              height={960}
              className="block"
            />

            {/* WATERMARK PHÍA DƯỚI NỘI DUNG (Nằm trực tiếp trong hệ quy chiếu tranh 540x960, xoay và phóng to đồng bộ 100% với bức tranh) */}
            {enableWatermark && watermarkText && (
              <div
                className="absolute pointer-events-none select-none flex items-center justify-center whitespace-nowrap transition-all duration-150"
                style={{
                  left: `${watermarkOffset !== undefined ? 270 + watermarkOffset : 270}px`,
                  bottom: `${watermarkDistance}px`,
                  transform: 'translateX(-50%)',
                  transformOrigin: 'center center',
                  zIndex: 25,
                  ...(enableWatermarkBg
                    ? {
                      backgroundColor: watermarkBgColor,
                      opacity: Math.max(0.1, Math.min(1, watermarkBgOpacity / 100)),
                      padding: `${Math.max(4, Math.round(watermarkFontSize * 0.35))}px ${Math.max(12, Math.round(watermarkFontSize * 0.9))}px`,
                      borderRadius: `${Math.max(8, Math.round(watermarkFontSize * 0.65))}px`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }
                    : {})
                }}
              >
                <span
                  className="font-bold tracking-normal font-sans select-none transition-all duration-150"
                  style={{
                    fontSize: `${watermarkFontSize}px`,
                    color: currentWatermarkColor,
                    opacity: enableWatermarkBg ? 1 : currentWatermarkOpacity,
                    textShadow: (enableWatermarkBeamEffect && isWatermarkLit)
                      ? `0 0 10px ${currentWatermarkColor}, 0 0 20px ${currentWatermarkColor}88`
                      : (enableWatermarkBg ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'),
                    filter: (enableWatermarkBeamEffect && isWatermarkLit) ? 'brightness(1.2)' : 'none'
                  }}
                >
                  {watermarkText}
                </span>
              </div>
            )}
          </div>

          {/* HAND CURSOR OVERLAY 👆 (Chỉ hiển thị khi KHÔNG ở chế độ đặt dấu hỏi ? để tiện quan sát vị trí đặt) */}
          {(!isPlacingQm || is916Mode) && (
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
          )}
        </div>
      </div>
    </div>
  );
}
