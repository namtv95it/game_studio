import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Play } from 'lucide-react';

const POKEMON_IMAGES = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', // Pikachu PNG
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',  // Charmander PNG
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png'   // Squirtle PNG
];

const STORAGE_KEY = 'shadow_game_settings_v3';

export default function ShadowMatch({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  const getSavedSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const initialSettings = getSavedSettings();

  const [images, setImages] = useState(initialSettings.images || POKEMON_IMAGES);
  const [targetIndex, setTargetIndex] = useState(initialSettings.targetIndex ?? 0);
  const [handSize, setHandSize] = useState(initialSettings.handSize ?? 48);
  const [targetScale, setTargetScale] = useState(initialSettings.targetScale ?? 100);
  const [targetOffsetY, setTargetOffsetY] = useState(initialSettings.targetOffsetY ?? 0);

  // Cài đặt khay ảnh thu nhỏ
  const [trayOffsetX, setTrayOffsetX] = useState(initialSettings.trayOffsetX ?? 112);
  const [trayOffsetY, setTrayOffsetY] = useState(initialSettings.trayOffsetY ?? 0);
  const [trayItemSize, setTrayItemSize] = useState(initialSettings.trayItemSize ?? 80);
  const [trayGap, setTrayGap] = useState(initialSettings.trayGap ?? 24);

  // States for Interactivity
  const [pickedItem, setPickedItem] = useState(null); // { index, src }
  const [placedItems, setPlacedItems] = useState([]); // [{ index, src, x, y, width, height }]
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const cardRefs = useRef([]);
  const [isResetting, setIsResetting] = useState(false);

  // Tự động lưu cài đặt vào localStorage khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        targetIndex,
        handSize,
        targetScale,
        targetOffsetY,
        trayOffsetX,
        trayOffsetY,
        trayItemSize,
        trayGap,
        images
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt ShadowMatch:', e);
    }
  }, [targetIndex, handSize, targetScale, targetOffsetY, trayOffsetX, trayOffsetY, trayItemSize, trayGap, images]);

  // Load Image for Canvas Silhouette (Copy chính xác từ FlashlightReveal)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = images[targetIndex];
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
  }, [images, targetIndex]);

  // Render Canvas Silhouette: COPY 100% CÔNG THỨC VÀ TỶ LỆ TỪ FLASHLIGHT REVEAL
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const activeImg = imgRef.current;
    if (!activeImg || !activeImg.width || !activeImg.height) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Aspect ratio fit (contain mode) - 100% GIỐNG FLASHLIGHT REVEAL
    const imgRatio = activeImg.width / activeImg.height;
    const canvasRatio = width / height;

    let drawW, drawH, drawX, drawY;
    if (imgRatio > canvasRatio) {
      drawW = width * 0.85; // Thu vừa vặn 85% để tạo khoảng lùi an toàn
      drawH = drawW / imgRatio;
      drawX = (width - drawW) / 2;
      drawY = (height - drawH) / 2 + targetOffsetY;
    } else {
      drawH = height * 0.85;
      drawW = drawH * imgRatio;
      drawX = (width - drawW) / 2;
      drawY = (height - drawH) / 2 + targetOffsetY;
    }

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // BƯỚC 1: Vẽ Ảnh màu gốc
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(activeImg, drawX, drawY, drawW, drawH);

    // BƯỚC 2: Phủ lớp Đen ĐẶC CHỈ lên khu vực hình ảnh PNG (#000000)
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  };

  useEffect(() => {
    renderCanvas();
  }, [targetOffsetY, images, targetIndex]);

  const resetGameRef = useRef(null);

  // Keyboard Event: Spacebar to Reset & ESC to exit 9:16 mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (resetGameRef.current) {
          resetGameRef.current();
        }
      }
      if (e.key === 'Escape' || e.code === 'Escape') {
        setIs916Mode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIs916Mode]);

  // Track Cursor Position
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  // Step 1: Click Pick Top Image
  const handlePickItem = (index, src) => {
    setPickedItem({ index, src });
  };

  // Kích thước chuẩn 100% khớp với bóng đen trên sân khấu
  const targetCardSize = Math.round(540 * 0.85 * (targetScale / 100) * (is916Mode ? 1.25 : 0.95));

  // Step 2 & 3: Click Place Image on Stage
  const handleStageClick = (e) => {
    if (pickedItem) {
      const rect = stageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newItem = {
        id: Date.now(),
        index: pickedItem.index,
        src: pickedItem.src,
        x: x - targetCardSize / 2,
        y: y - targetCardSize / 2,
        width: targetCardSize,
        height: targetCardSize
      };

      setPlacedItems([...placedItems, newItem]);
      setPickedItem(null);
    }
  };

  // Reset Game: Hiệu ứng ảnh từ bóng lướt bay mượt mà quay trở lại vị trí thẻ ban đầu
  const resetGame = () => {
    if (isResetting) return;
    setPickedItem(null);

    if (placedItems.length === 0) return;

    if (!stageRef.current) {
      setPlacedItems([]);
      return;
    }

    const stageRect = stageRef.current.getBoundingClientRect();

    // Tính tọa độ đích bay về thẻ bài tương ứng
    const returningItems = placedItems.map((item) => {
      const cardEl = cardRefs.current[item.index];
      if (cardEl) {
        const cardRect = cardEl.getBoundingClientRect();
        return {
          ...item,
          x: cardRect.left - stageRect.left,
          y: cardRect.top - stageRect.top,
          width: cardRect.width,
          height: cardRect.height,
          isReturning: true
        };
      }
      return item;
    });

    setIsResetting(true);
    setPlacedItems(returningItems);

    setTimeout(() => {
      setPlacedItems([]);
      setIsResetting(false);
    }, 550);
  };

  resetGameRef.current = resetGame;

  // Handle Image Upload
  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const updated = [...images];
      updated[index] = url;
      setImages(updated);
    }
  };

  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      {/* TRẠNG THÁI 2: GIỮ NGUYÊN SIDEBAR (Nút Khởi Chạy dùng để bật Trạng Thái 1: Ẩn Hết) */}
      {!is916Mode && (
        <div className="w-80 bg-slate-800 p-5 border-r border-slate-700 flex flex-col gap-5 overflow-y-auto">
          <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2">
            👻 CÀI ĐẶT GHÉP BÓNG
          </h2>

          {/* Upload 3 Images */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs text-slate-400 font-medium">Tải Lên 3 Hình Ảnh PNG:</label>
            <div className="flex gap-2">
              {images.map((src, i) => (
                <label
                  key={i}
                  className={`flex-1 h-15 bg-slate-700 rounded-lg cursor-pointer overflow-hidden relative border transition-all ${i === targetIndex ? 'border-purple-400 ring-2 ring-purple-400/50' : 'border-slate-600 hover:border-slate-400'
                    }`}
                >
                  <img src={src} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, i)} className="hidden" />
                </label>
              ))}
            </div>
          </div>

          {/* Select Target Silhouette */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Chọn Ảnh Làm Bóng Đen Mục Tiêu:</label>
            <select value={targetIndex} onChange={(e) => setTargetIndex(Number(e.target.value))} className="p-2.5 bg-slate-700 text-white rounded-lg border-none focus:ring-2 focus:ring-purple-400 outline-none cursor-pointer">
              <option value="0">Thẻ Ảnh Số 1 (Mặc định)</option>
              <option value="1">Thẻ Ảnh Số 2</option>
              <option value="2">Thẻ Ảnh Số 3</option>
            </select>
          </div>

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
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            <input type="range" min="24" max="500" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Target Scale */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Tỉ Lệ Bóng Đen:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="50"
                  max="200"
                  value={targetScale}
                  onChange={(e) => setTargetScale(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
            </div>
            <input type="range" min="50" max="200" value={targetScale} onChange={(e) => setTargetScale(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Target OffsetY */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Vị Trí Bóng Đen Lên/Xuống:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="-300"
                  max="300"
                  value={targetOffsetY}
                  onChange={(e) => setTargetOffsetY(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            <input type="range" min="-300" max="300" value={targetOffsetY} onChange={(e) => setTargetOffsetY(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          <hr className="border-slate-700 my-1" />
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">🖼️ CÀI ĐẶT KHAY ẢNH THU NHỎ</h3>

          {/* Tray Item Size */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Kích Thước Ảnh Khay:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={trayItemSize}
                  onChange={(e) => setTrayItemSize(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            <input type="range" min="30" max="300" value={trayItemSize} onChange={(e) => setTrayItemSize(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Tray Gap */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Dãn Cách Giữa Các Hình:</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={trayGap}
                  onChange={(e) => setTrayGap(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            <input type="range" min="0" max="200" value={trayGap} onChange={(e) => setTrayGap(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Tray OffsetX */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Vị Trí Khay (Sang Trái/Phải):</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="800"
                  value={trayOffsetX}
                  onChange={(e) => setTrayOffsetX(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            <input type="range" min="0" max="800" value={trayOffsetX} onChange={(e) => setTrayOffsetX(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Tray OffsetY */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400 font-medium">Vị Trí Khay (Lên/Xuống):</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="-400"
                  max="400"
                  value={trayOffsetY}
                  onChange={(e) => setTrayOffsetY(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            <input type="range" min="-300" max="400" value={trayOffsetY} onChange={(e) => setTrayOffsetY(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Reset Button */}
          <button
            onClick={resetGame}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm cursor-pointer"
          >
            <RefreshCw size={16} /> Reset Vị Trí (Spacebar)
          </button>

          {/* Nút Chuyển Sang Trạng Thái 1: Ẩn Hết Để Quay Video */}
          <button
            onClick={() => setIs916Mode(true)}
            className="mt-auto p-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Play size={18} /> Ẩn Giao Diện Quay Video (ESC Quay Lại)
          </button>
        </div>
      )}

      {/* KHUNG HIỂN THỊ KHU VỰC SÂN KHẤU (LUÔN LUÔN HIỂN THỊ GIỐNG KHI ĐANG CHẠY) */}
      <div className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
        }`}>
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onClick={handleStageClick}
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

          {/* BỘ 3 ẢNH THỦ NHỎ: CHỈ HIỂN THỊ ẢNH GỐC, KHÔNG CÓ KHUNG VIỀN */}
          <div
            className="absolute z-20 flex flex-col items-center"
            style={{
              left: `${trayOffsetX}px`,
              top: `calc(50% + ${trayOffsetY}px)`,
              transform: 'translateY(-50%)',
              gap: `${trayGap}px`
            }}
          >
            {images.map((src, i) => (
              <div
                key={i}
                ref={(el) => (cardRefs.current[i] = el)}
                onClick={(e) => { e.stopPropagation(); handlePickItem(i, src); }}
                className="cursor-none hover:scale-110 transition-transform flex items-center justify-center select-none"
                style={{
                  width: `${trayItemSize}px`,
                  height: `${trayItemSize}px`
                }}
              >
                <img src={src} alt={`Card ${i}`} className="w-full h-full object-contain -rotate-90 pointer-events-none select-none drop-shadow-md" />
              </div>
            ))}
          </div>

          {/* CANVAS SÂN KHẤU XOAY NẰM NGANG 90 ĐỘ: COPY CHÍNH XÁC 100% TỪ FLASHLIGHT REVEAL */}
          <div
            style={{
              transform: `rotate(-90deg) scale(${(targetScale / 100) * (is916Mode ? 1.25 : 0.95)})`,
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

          {/* PLACED CARDS ON STAGE (Hiệu ứng lướt bay mượt mà quay về vị trí ban đầu khi bấm phím cách) */}
          {placedItems.map((item) => (
            <div
              key={item.id}
              className={`absolute pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)] ${item.isReturning ? 'z-30' : 'z-10'
                }`}
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width}px`,
                height: `${item.height}px`
              }}
            >
              <img src={item.src} alt="Placed" className="w-full h-full object-contain -rotate-90" />
            </div>
          ))}

          {/* PICKED FOLLOWING ITEM (Kích thước khớp 100% với bóng đen) */}
          {pickedItem && (
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-90 z-20"
              style={{
                left: `${cursorPos.x}px`,
                top: `${cursorPos.y}px`,
                width: `${targetCardSize}px`,
                height: `${targetCardSize}px`
              }}
            >
              <img src={pickedItem.src} alt="Following" className="w-full h-full object-contain -rotate-90" />
            </div>
          )}

          {/* HAND CURSOR 👆 (Đầu ngón tay trỏ đúng vị trí con trỏ) */}
          <div
            className="absolute pointer-events-none select-none z-30"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
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
