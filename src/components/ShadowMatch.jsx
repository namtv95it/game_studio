import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Play, GripVertical, Move, Sparkles } from 'lucide-react';

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

  const THEATER_WIDTH = 1280;
  const THEATER_HEIGHT = 720;

  // Cài đặt khay ảnh thu nhỏ
  const [trayOffsetX, setTrayOffsetX] = useState(initialSettings.trayOffsetX ?? 112);
  const [trayOffsetY, setTrayOffsetY] = useState(initialSettings.trayOffsetY ?? 0);
  const [trayItemSize, setTrayItemSize] = useState(initialSettings.trayItemSize ?? 80);
  const [trayGap, setTrayGap] = useState(initialSettings.trayGap ?? 24);

  // States for Interactivity
  const [pickedItem, setPickedItem] = useState(null); // { index, src }
  const [placedItems, setPlacedItems] = useState([]); // [{ index, src, x, y, width, height }]
  const [cursorPos, setCursorPos] = useState({ x: 640, y: 360 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  // Chế độ thao tác trên khung quay: 'gameplay' (Kéo ghép bóng thông thường) hoặc 'edit' (Kéo chỉnh vị trí bóng & khay trực tiếp)
  const [stageMode, setStageMode] = useState('gameplay');
  const [draggingTarget, setDraggingTarget] = useState(null); // 'shadow' hoặc 'tray'
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, initValX: 0, initValY: 0 });

  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  const stageRef = useRef(null);
  const theaterRef = useRef(null);
  const [stageScale, setStageScale] = useState(1);
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

  // Tự động tính toán scale đồng nhất cho Theater Container (Khớp hoàn hảo cả chế độ thường và full màn hình 9:16)
  useEffect(() => {
    const updateScale = () => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const containerW = rect.width || window.innerWidth;
      const containerH = rect.height || window.innerHeight;
      if (!containerW || !containerH) return;

      const scaleW = containerW / THEATER_WIDTH;
      const scaleH = containerH / THEATER_HEIGHT;
      const margin = is916Mode || stageMode === 'edit' ? 0.99 : 0.96;
      setStageScale(Math.min(scaleW, scaleH) * margin);
    };

    updateScale();
    const timer = setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [is916Mode, stageMode]);

  // Khôi phục cài đặt vị trí và kích thước về chuẩn ban đầu
  const resetToDefaultLayout = () => {
    setTargetScale(100);
    setTargetOffsetY(0);
    setTrayOffsetX(112);
    setTrayOffsetY(0);
    setTrayItemSize(100);
    setTrayGap(24);
    setHandSize(48);
    setPlacedItems([]);
    setPickedItem(null);
  };

  // Load Image for Canvas Silhouette (Copy chính xác từ FlashlightReveal)
  useEffect(() => {
    const activeSrc = images[targetIndex] || images[0];
    if (!activeSrc) return;

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = activeSrc;
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

  // Keyboard Event: Spacebar to Reset & ESC to exit 9:16 mode & exit Edit mode
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
        setStageMode('gameplay');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIs916Mode]);

  // Chuyển đổi tọa độ chuột từ màn hình vào hệ quy chiếu cố định Theater Container (1280x720)
  const getTheaterCoords = (e) => {
    if (!theaterRef.current) return { x: 640, y: 360 };
    const rect = theaterRef.current.getBoundingClientRect();
    const currentScale = rect.width / THEATER_WIDTH || stageScale || 1;
    const x = (e.clientX - rect.left) / currentScale;
    const y = (e.clientY - rect.top) / currentScale;
    return { x, y };
  };

  // Track Cursor Position & Handle Direct Dragging on Stage
  const handleMouseMove = (e) => {
    if (!theaterRef.current) return;
    const { x, y } = getTheaterCoords(e);
    setCursorPos({ x, y });

    // Kéo thả trực tiếp trên sân khấu khi ở chế độ edit
    if (draggingTarget === 'tray') {
      const rect = theaterRef.current.getBoundingClientRect();
      const currentScale = rect.width / THEATER_WIDTH || stageScale || 1;
      const deltaX = (e.clientX - dragStartRef.current.mouseX) / currentScale;
      const deltaY = (e.clientY - dragStartRef.current.mouseY) / currentScale;
      setTrayOffsetX(Math.max(0, Math.min(THEATER_WIDTH - 120, Math.round(dragStartRef.current.initValX + deltaX))));
      setTrayOffsetY(Math.max(-350, Math.min(350, Math.round(dragStartRef.current.initValY + deltaY))));
    } else if (draggingTarget === 'shadow') {
      const rect = theaterRef.current.getBoundingClientRect();
      const currentScale = rect.width / THEATER_WIDTH || stageScale || 1;
      // Khi canvas xoay -90deg, dịch chuyển trục ngang màn hình tương ứng với biến targetOffsetY của canvas
      const deltaScreenX = (e.clientX - dragStartRef.current.mouseX) / currentScale;
      setTargetOffsetY(Math.max(-350, Math.min(350, Math.round(dragStartRef.current.initValY + deltaScreenX))));
    }
  };

  const handleStartDragTray = (e) => {
    if (stageMode !== 'edit' || is916Mode) return;
    e.stopPropagation();
    setDraggingTarget('tray');
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initValX: trayOffsetX,
      initValY: trayOffsetY
    };
  };

  const handleStartDragShadow = (e) => {
    if (stageMode !== 'edit' || is916Mode) return;
    e.stopPropagation();
    setDraggingTarget('shadow');
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initValX: 0,
      initValY: targetOffsetY
    };
  };

  const handleMouseUpStage = () => {
    if (draggingTarget) {
      setDraggingTarget(null);
    }
  };

  // Step 1: Click Pick Top Image (Nếu đã có ảnh ở dưới sân khấu thì không cho phép chọn tiếp)
  const handlePickItem = (index, src) => {
    if (placedItems.length > 0 || isResetting) return;
    setPickedItem({ index, src });
  };

  // Tính toán kích thước hiển thị của bóng trên sân khấu dựa theo tỉ lệ canvas (540x960), xoay -90deg và targetScale
  // Đồng nhất 100% tỷ lệ ở cả chế độ xem trước và chế độ quay video (không bị lệch tỉ lệ)
  const getScaledCanvasSize = () => {
    const scaleFactor = targetScale / 100;
    // Khi xoay -90deg:
    // Chiều rộng sân khấu theo trục ngang màn hình = canvas.height * scaleFactor = 960 * scaleFactor
    // Chiều cao sân khấu theo trục dọc màn hình = canvas.width * scaleFactor = 540 * scaleFactor
    return {
      boxWidth: 960 * scaleFactor,
      boxHeight: 540 * scaleFactor,
      scaleFactor
    };
  };

  const { boxWidth: targetBoxW, boxHeight: targetBoxH } = getScaledCanvasSize();

  // Step 2 & 3: Click Place or Pick Image on Stage (Lưu tọa độ chuẩn theo hệ Theater Container)
  const handleStageClick = (e) => {
    if (pickedItem) {
      const { x, y } = getTheaterCoords(e);

      const newItem = {
        id: Date.now(),
        index: pickedItem.index,
        src: pickedItem.src,
        x: x - targetBoxW / 2,
        y: y - targetBoxH / 2,
        width: targetBoxW,
        height: targetBoxH
      };

      setPlacedItems([...placedItems, newItem]);
      setPickedItem(null);
    }
  };

  // Nhấc lại ảnh đã đặt trên sân khấu lên để tiếp tục di chuyển
  const handlePlacedItemClick = (e, item) => {
    e.stopPropagation();
    if (isResetting) return;

    // Nhấc ảnh lên theo con trỏ chuột
    setPickedItem({ index: item.index, src: item.src });
    // Loại bỏ ảnh đó khỏi danh sách placedItems
    setPlacedItems(placedItems.filter((p) => p.id !== item.id));
  };

  // Reset Game: Hiệu ứng ảnh từ bóng lướt bay mượt mà quay trở lại vị trí thẻ ban đầu
  const resetGame = () => {
    if (isResetting) return;
    setPickedItem(null);

    if (placedItems.length === 0) return;

    if (!theaterRef.current) {
      setPlacedItems([]);
      return;
    }

    const theaterRect = theaterRef.current.getBoundingClientRect();
    const currentScale = theaterRect.width / THEATER_WIDTH || stageScale || 1;

    // Tính tọa độ đích bay về thẻ bài tương ứng trong hệ quy chiếu Theater
    const returningItems = placedItems.map((item) => {
      const cardEl = cardRefs.current[item.index];
      if (cardEl) {
        const cardRect = cardEl.getBoundingClientRect();
        return {
          ...item,
          x: (cardRect.left - theaterRect.left) / currentScale,
          y: (cardRect.top - theaterRect.top) / currentScale,
          width: cardRect.width / currentScale,
          height: cardRect.height / currentScale,
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

  // Handle Multiple Image Upload (1 ô chọn duy nhất, tải nhiều ảnh 2-3 ảnh)
  const handleMultipleImageUpload = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newUrls = files.map((file) => URL.createObjectURL(file));
    setImages(newUrls);
    setTargetIndex(0); // Đặt bóng mục tiêu về ảnh đầu tiên tải lên
    setPlacedItems([]);
    setPickedItem(null);
  };

  // States for Drag and Drop Reordering in Image List
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverImageIndex !== index) {
      setDragOverImageIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === targetIdx) {
      setDraggedImageIndex(null);
      setDragOverImageIndex(null);
      return;
    }

    const reordered = [...images];
    const [movedItem] = reordered.splice(draggedImageIndex, 1);
    reordered.splice(targetIdx, 0, movedItem);

    // Cập nhật lại targetIndex theo ảnh đang được chọn làm bóng đen
    let newTargetIdx = targetIndex;
    if (targetIndex === draggedImageIndex) {
      newTargetIdx = targetIdx;
    } else if (draggedImageIndex < targetIndex && targetIdx >= targetIndex) {
      newTargetIdx = targetIndex - 1;
    } else if (draggedImageIndex > targetIndex && targetIdx <= targetIndex) {
      newTargetIdx = targetIndex + 1;
    }

    setImages(reordered);
    setTargetIndex(newTargetIdx);
    setPlacedItems([]);
    setPickedItem(null);

    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  // Handle Single Image Upload fallback
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
    <div className={`flex w-full bg-slate-900 relative ${is916Mode || stageMode === 'edit' ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      {/* TRẠNG THÁI 2: GIỮ NGUYÊN SIDEBAR (Ẩn khi ở chế độ 9:16 hoặc khi vào chế độ Kéo Xếp Vị Trí full màn hình) */}
      {!is916Mode && stageMode !== 'edit' && (
        <div className="w-80 bg-slate-800 p-5 border-r border-slate-700 flex flex-col gap-5 overflow-y-auto">
          <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2">
            👻 CÀI ĐẶT GHÉP BÓNG
          </h2>

          {/* CHUYỂN ĐỔI CHẾ ĐỘ THAO TÁC SÂN KHẤU */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setStageMode('edit')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                stageMode === 'edit'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Move size={14} /> Kéo Xếp Vị Trí (Full)
            </button>
            <button
              onClick={() => setStageMode('gameplay')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                stageMode === 'gameplay'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} /> Chơi Ghép Bóng
            </button>
          </div>

          {/* Upload Multiple Images (1 ô chọn duy nhất) */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs text-slate-400 font-medium">Tải Lên Nhiều Ảnh Nhân Vật (PNG):</label>
            <label className="flex items-center justify-center gap-2 p-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer border border-dashed border-slate-500 text-xs font-semibold text-center transition-colors">
              <Upload size={16} /> Chọn Nhiều Ảnh (.PNG)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleImageUpload}
                className="hidden"
              />
            </label>

            {/* Hiển thị danh sách ảnh đã tải lên phía dưới ô chọn */}
            {images.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Danh sách ({images.length} ảnh):</span>
                  <span className="text-[10px] text-purple-300">Kéo thả để đổi thứ tự</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((src, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, i)}
                      onClick={() => setTargetIndex(i)}
                      className={`h-16 bg-slate-900/80 rounded-lg cursor-grab active:cursor-grabbing overflow-hidden relative border transition-all flex items-center justify-center p-1 group select-none ${
                        i === targetIndex
                          ? 'border-purple-400 ring-2 ring-purple-400/60 shadow-lg shadow-purple-500/20'
                          : 'border-slate-700 hover:border-slate-500'
                      } ${draggedImageIndex === i ? 'opacity-40 scale-95 border-dashed border-purple-500' : ''} ${
                        dragOverImageIndex === i && draggedImageIndex !== i
                          ? 'ring-2 ring-sky-400 border-sky-400 scale-105'
                          : ''
                      }`}
                      title={`Ảnh ${i + 1} - Giữ & Kéo để đổi thứ tự (Click chọn làm bóng)`}
                    >
                      <img src={src} alt={`Uploaded ${i}`} className="w-full h-full object-contain pointer-events-none select-none" />
                      
                      {/* Grip Handle Icon on Hover */}
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded p-0.5 pointer-events-none">
                        <GripVertical size={10} className="text-slate-300" />
                      </div>

                      <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.2 rounded pointer-events-none">
                        #{i + 1}
                      </span>
                      {i === targetIndex && (
                        <span className="absolute top-1 right-1 bg-purple-500 text-white text-[9px] font-bold px-1 py-0.2 rounded-full leading-tight pointer-events-none">
                          Bóng
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Select Target Silhouette */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Chọn Ảnh Làm Bóng Đen Mục Tiêu:</label>
            <select
              value={targetIndex}
              onChange={(e) => setTargetIndex(Number(e.target.value))}
              className="p-2.5 bg-slate-700 text-white rounded-lg border-none focus:ring-2 focus:ring-purple-400 outline-none cursor-pointer"
            >
              {images.map((_, i) => (
                <option key={i} value={i}>
                  Thẻ Ảnh Số {i + 1} {i === targetIndex ? '(Đang kích hoạt)' : ''}
                </option>
              ))}
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
                  max="1150"
                  value={trayOffsetX}
                  onChange={(e) => setTrayOffsetX(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>
            <input type="range" min="0" max="1150" value={trayOffsetX} onChange={(e) => setTrayOffsetX(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
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
            <input type="range" min="-350" max="350" value={trayOffsetY} onChange={(e) => setTrayOffsetY(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={resetGame}
              className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-xs cursor-pointer shadow"
            >
              <RefreshCw size={14} /> Reset Vị Trí Ghép (Spacebar)
            </button>
            <button
              onClick={resetToDefaultLayout}
              className="p-2 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 font-medium text-xs border border-slate-700 cursor-pointer"
            >
              ↺ Khôi Phục Căn Chỉnh Mặc Định
            </button>
          </div>

          {/* Nút Chuyển Sang Trạng Thái 1: Ẩn Hết Để Quay Video */}
          <button
            onClick={() => setIs916Mode(true)}
            className="mt-auto p-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Play size={18} /> Ẩn Giao Diện Quay Video (ESC Quay Lại)
          </button>
        </div>
      )}

      {/* KHUNG HIỂN THỊ KHU VỰC SÂN KHẤU (FULL MÀN HÌNH KHI Ở CHẾ ĐỘ 9:16 HOẶC KHI Ở CHẾ ĐỘ KÉO XẾP VỊ TRÍ) */}
      <div
        className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${
          is916Mode || stageMode === 'edit' ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
        }`}
        onMouseUp={handleMouseUpStage}
      >
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onClick={handleStageClick}
          className={`relative overflow-hidden transition-all duration-300 ${
            stageMode === 'gameplay' || is916Mode ? 'cursor-none' : 'cursor-default'
          } ${
            is916Mode || stageMode === 'edit'
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

          {/* THEATER CONTAINER CỐ ĐỊNH 1280x720: TOÀN BỘ KHAY ẢNH, BÓNG ĐEN, THẺ ĐÃ GHÉP NẰM CHUNG 1 HỆ QUY CHIẾU */}
          <div
            ref={theaterRef}
            style={{
              width: `${THEATER_WIDTH}px`,
              height: `${THEATER_HEIGHT}px`,
              transform: `scale(${stageScale})`,
              transformOrigin: 'center center'
            }}
            className={`relative shrink-0 flex items-center justify-center select-none ${
              stageMode === 'edit' && !is916Mode ? 'ring-2 ring-purple-400/40 rounded-2xl' : ''
            }`}
          >
            {/* BỘ 3 ẢNH THỦ NHỎ TRONG KHAY: HỖ TRỢ KÉO THẢ TRỰC TIẾP KHAY KHI Ở CHẾ ĐỘ EDIT */}
            <div
              onMouseDown={handleStartDragTray}
              className={`absolute z-20 flex flex-col items-center p-2 rounded-xl transition-all select-none ${
                stageMode === 'edit' && !is916Mode
                  ? 'cursor-grab active:cursor-grabbing border-2 border-dashed border-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                  : ''
              }`}
              style={{
                left: `${trayOffsetX}px`,
                top: `calc(50% + ${trayOffsetY}px)`,
                transform: 'translateY(-50%)',
                gap: `${trayGap}px`
              }}
              title={stageMode === 'edit' ? 'Giữ chuột và kéo để di chuyển vị trí khay ảnh' : ''}
            >
              {/* Nhãn khay ảnh khi ở chế độ edit */}
              {stageMode === 'edit' && !is916Mode && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow pointer-events-none whitespace-nowrap flex items-center gap-1">
                  <Move size={10} /> Khay Ảnh (Kéo di chuyển)
                </div>
              )}

              {images.map((src, i) => (
                <div
                  key={i}
                  ref={(el) => (cardRefs.current[i] = el)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (stageMode === 'gameplay' && placedItems.length === 0) {
                      handlePickItem(i, src);
                    }
                  }}
                  className={`transition-all flex items-center justify-center select-none ${
                    stageMode === 'edit' && !is916Mode
                      ? 'cursor-grab'
                      : placedItems.length > 0
                      ? 'pointer-events-none'
                      : 'hover:scale-110 cursor-none'
                  }`}
                  style={{
                    width: `${trayItemSize}px`,
                    height: `${trayItemSize}px`
                  }}
                >
                  <img src={src} alt={`Card ${i}`} className="w-full h-full object-contain -rotate-90 pointer-events-none select-none drop-shadow-md" />
                </div>
              ))}
            </div>

            {/* CANVAS SÂN KHẤU XOAY NẰM NGANG 90 ĐỘ: TỈ LỆ VÀ KÍCH THƯỚC ĐỒNG NHẤT 100% CẢ PREVIEW VÀ 9:16 */}
            <div
              onMouseDown={handleStartDragShadow}
              className={`transition-all ${
                stageMode === 'edit' && !is916Mode
                  ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-purple-400 rounded-2xl'
                  : ''
              }`}
              style={{
                transform: `rotate(-90deg) scale(${targetScale / 100})`,
                transformOrigin: 'center center'
              }}
              title={stageMode === 'edit' ? 'Giữ chuột và kéo để di chuyển vị trí bóng đen' : ''}
            >
              <canvas
                ref={canvasRef}
                width={540}
                height={960}
                className=""
              />
            </div>

            {/* PLACED CARDS ON STAGE (Kích thước và tỉ lệ khớp 100% với bóng đen - Cho phép click nhấc lên để di chuyển tiếp) */}
            {placedItems.map((item) => (
              <div
                key={item.id}
                onClick={(e) => handlePlacedItemClick(e, item)}
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)] flex items-center justify-center select-none ${
                  item.isReturning ? 'z-30 pointer-events-none' : 'z-10 cursor-none'
                }`}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width}px`,
                  height: `${item.height}px`
                }}
              >
                {item.isReturning ? (
                  <img src={item.src} alt="Placed Returning" className="w-full h-full object-contain -rotate-90" />
                ) : (
                  <div
                    style={{
                      width: '540px',
                      height: '960px',
                      transform: `rotate(-90deg) scale(${targetScale / 100})`,
                      transformOrigin: 'center center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        transform: `translateY(${targetOffsetY}px)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img
                        src={item.src}
                        alt="Placed"
                        style={{
                          maxWidth: '85%',
                          maxHeight: '85%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* PICKED FOLLOWING ITEM (Kích thước và tỉ lệ khớp 100% với bóng đen theo setting targetScale - Không giảm opacity) */}
            {pickedItem && (
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-100 z-20 flex items-center justify-center"
                style={{
                  left: `${cursorPos.x}px`,
                  top: `${cursorPos.y}px`,
                  width: `${targetBoxW}px`,
                  height: `${targetBoxH}px`
                }}
              >
                <div
                  style={{
                    width: '540px',
                    height: '960px',
                    transform: `rotate(-90deg) scale(${targetScale / 100})`,
                    transformOrigin: 'center center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: `translateY(${targetOffsetY}px)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={pickedItem.src}
                      alt="Following"
                      style={{
                        maxWidth: '85%',
                        maxHeight: '85%',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* HAND CURSOR 👆 (Đầu ngón tay trỏ đúng vị trí con trỏ - hiển thị khi chơi hoặc quay video) */}
            {(stageMode === 'gameplay' || is916Mode) && (
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
            )}
          </div>

          {/* BANNER HƯỚNG DẪN & NÚT XONG KHI Ở CHẾ ĐỘ KÉO XẾP FULL MÀN HÌNH */}
          {stageMode === 'edit' && !is916Mode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl border border-purple-500/40 shadow-2xl backdrop-blur-md z-40 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-purple-300">
                <Move size={15} className="animate-pulse" />
                <span>Kéo trực tiếp <b>Bóng đen</b> hoặc <b>Khay ảnh</b> để sắp xếp vị trí</span>
              </div>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStageMode('gameplay');
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all shadow cursor-pointer text-xs"
              >
                ✓ Hoàn Tất (ESC)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
