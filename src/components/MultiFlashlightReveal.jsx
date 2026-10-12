import React, { useRef, useEffect, useState } from 'react';
import { Upload, Play, Plus, Trash2, Move, RotateCw, ZoomIn, Eye, EyeOff, Layers, GripVertical, Check, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'multi_flashlight_game_settings_v2';

const DEFAULT_ITEMS = [
  {
    id: 'poke-1',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', // Pikachu
    name: 'Pikachu',
    x: 0, // offset X từ tâm (px)
    y: 0, // offset Y từ tâm (px)
    scale: 100, // %
    rotation: 0, // deg
    visible: true,
  },
  {
    id: 'poke-2',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png', // Charmander
    name: 'Charmander',
    x: -120,
    y: 180,
    scale: 65,
    rotation: -10,
    visible: true,
  },
  {
    id: 'poke-3',
    src: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png', // Squirtle
    name: 'Squirtle',
    x: 120,
    y: 180,
    scale: 65,
    rotation: 10,
    visible: true,
  }
];

export default function MultiFlashlightReveal({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  const getSavedSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const initialSettings = getSavedSettings();

  const [items, setItems] = useState(initialSettings.items || DEFAULT_ITEMS);
  const [selectedItemId, setSelectedItemId] = useState(initialSettings.items?.[0]?.id || DEFAULT_ITEMS[0].id);

  // Chế độ thao tác trên sân khấu: 'flashlight' (Soi Đèn Pin) hoặc 'edit' (Chọn & Sắp Xếp Trực Tiếp)
  const [stageMode, setStageMode] = useState('flashlight');

  // Settings cho đèn pin & sân khấu
  const [radius, setRadius] = useState(initialSettings.radius ?? 90);
  const [spotlightType, setSpotlightType] = useState(initialSettings.spotlightType || 'circle');
  const [beamAngle, setBeamAngle] = useState(initialSettings.beamAngle ?? -135);
  const [coneSpread, setConeSpread] = useState(initialSettings.coneSpread ?? 45);
  const [handSize, setHandSize] = useState(initialSettings.handSize ?? 48);
  const [globalScale, setGlobalScale] = useState(initialSettings.globalScale ?? 100);
  const [globalOffsetY, setGlobalOffsetY] = useState(initialSettings.globalOffsetY ?? 0);

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, rawX: -100, rawY: -100 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  // Kéo thả trực tiếp trên sân khấu
  const [draggingItemId, setDraggingItemId] = useState(null);
  const dragStartRef = useRef({ canvasX: 0, canvasY: 0, itemInitX: 0, itemInitY: 0 });

  // Drag & drop để sắp xếp z-index trong sidebar
  const [draggedListIdx, setDraggedListIdx] = useState(null);
  const [dragOverListIdx, setDragOverListIdx] = useState(null);

  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const loadedImagesRef = useRef({}); // Cache Image objects: { [id]: HTMLImageElement }

  // Lưu cài đặt vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items,
        radius,
        spotlightType,
        beamAngle,
        coneSpread,
        handSize,
        globalScale,
        globalOffsetY
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt MultiFlashlight:', e);
    }
  }, [items, radius, spotlightType, beamAngle, coneSpread, handSize, globalScale, globalOffsetY]);

  // Phím ESC để thoát 9:16
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        setIs916Mode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIs916Mode]);

  // Load toàn bộ Image objects khi items thay đổi
  useEffect(() => {
    let isCancelled = false;
    items.forEach((item) => {
      if (!loadedImagesRef.current[item.id] || loadedImagesRef.current[item.id].src !== item.src) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = item.src;
        img.onload = () => {
          if (!isCancelled) {
            loadedImagesRef.current[item.id] = img;
            renderCanvas();
          }
        };
      }
    });
    renderCanvas();
    return () => {
      isCancelled = true;
    };
  }, [items]);

  // Tính tọa độ Canvas từ sự kiện chuột màn hình
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

    // Xoay -90deg coordinate transform:
    const canvasY = (cRawX / canvasRect.width) * canvas.height;
    const canvasX = (1 - (cRawY / canvasRect.height)) * canvas.width;

    return { canvasX, canvasY, rawX, rawY };
  };

  // Handle Mouse Move: Tính toán ma trận đồng bộ 100% khi nằm ngang 90deg
  const handleMouseMove = (e) => {
    const { canvasX, canvasY, rawX, rawY } = getCanvasCoords(e);
    setCursorPos({ x: canvasX, y: canvasY, rawX, rawY });

    // Kéo thả trực tiếp hình ảnh trên khung sân khấu
    if (draggingItemId) {
      const deltaX = canvasX - dragStartRef.current.canvasX;
      const deltaY = canvasY - dragStartRef.current.canvasY;

      setItems((prev) =>
        prev.map((item) =>
          item.id === draggingItemId
            ? {
                ...item,
                x: Math.round(dragStartRef.current.itemInitX + deltaX),
                y: Math.round(dragStartRef.current.itemInitY + deltaY)
              }
            : item
        )
      );
    }
  };

  // Bắt đầu kéo thả một layer trên khung quay
  const handleStartDragItem = (e, item) => {
    e.stopPropagation();
    if (is916Mode) return;

    setSelectedItemId(item.id);
    setDraggingItemId(item.id);

    const { canvasX, canvasY } = getCanvasCoords(e);
    dragStartRef.current = {
      canvasX,
      canvasY,
      itemInitX: item.x,
      itemInitY: item.y
    };
  };

  const handleMouseUpStage = () => {
    if (draggingItemId) {
      setDraggingItemId(null);
    }
  };

  // Render tất cả các ảnh màu lên một canvas
  const drawAllColorImages = (ctx, width, height) => {
    items.forEach((item) => {
      if (!item.visible) return;
      const img = loadedImagesRef.current[item.id];
      if (!img || !img.width || !img.height) return;

      const baseFitW = width * 0.75;
      const baseFitH = (baseFitW / (img.width / img.height));
      const finalW = baseFitW * (item.scale / 100);
      const finalH = baseFitH * (item.scale / 100);

      const centerX = width / 2 + item.x;
      const centerY = height / 2 + item.y + globalOffsetY;

      ctx.save();
      ctx.translate(centerX, centerY);
      if (item.rotation) {
        ctx.rotate((item.rotation * Math.PI) / 180);
      }
      ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH);
      ctx.restore();
    });
  };

  // Render Canvas Logic: Vẽ đa layer và che phủ đen, sau đó soi đèn
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // BƯỚC 1: Vẽ tất cả các ảnh màu gốc
    ctx.globalCompositeOperation = 'source-over';
    drawAllColorImages(ctx, width, height);

    // BƯỚC 2: Phủ lớp Đen ĐẶC CHỈ lên các khu vực có ảnh PNG (vùng Alpha > 0)
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // BƯỚC 3: Đục thủng vệt sáng Đèn Pin SẮC NÉT (chỉ khi ở chế độ Soi Đèn hoặc khi quay video 9:16)
    if (stageMode === 'flashlight' || is916Mode) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'black';

      if (spotlightType === 'circle') {
        ctx.beginPath();
        ctx.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
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
      drawAllColorImages(ctx, width, height);
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [cursorPos, radius, spotlightType, beamAngle, coneSpread, items, is916Mode, globalScale, globalOffsetY, stageMode]);

  // Upload thêm 1 hoặc nhiều ảnh mới
  const handleMultipleImageUpload = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newItems = files.map((file, i) => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, '');
      return {
        id: `img-${Date.now()}-${i}`,
        src: url,
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        x: (i - Math.floor(files.length / 2)) * 60,
        y: 0,
        scale: 85,
        rotation: 0,
        visible: true,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    if (newItems.length > 0) {
      setSelectedItemId(newItems[0].id);
      setStageMode('edit'); // Tự động bật chế độ xếp ảnh để người dùng kéo vị trí
    }
  };

  // Cập nhật thuộc tính của item được chọn
  const updateSelectedItem = (key, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === selectedItemId ? { ...item, [key]: value } : item))
    );
  };

  // Xóa item
  const handleDeleteItem = (id, e) => {
    e?.stopPropagation();
    if (items.length <= 1) {
      alert('Cần giữ lại ít nhất 1 ảnh!');
      return;
    }
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    if (selectedItemId === id) {
      setSelectedItemId(nextItems[0]?.id || null);
    }
  };

  // Đổi trạng thái ẩn/hiện
  const toggleVisibility = (id, e) => {
    e?.stopPropagation();
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item))
    );
  };

  // Drag drop sắp xếp thứ tự layer trong sidebar
  const handleDragStartList = (idx) => {
    setDraggedListIdx(idx);
  };

  const handleDragOverList = (e, idx) => {
    e.preventDefault();
    setDragOverListIdx(idx);
  };

  const handleDropList = (idx) => {
    if (draggedListIdx === null || draggedListIdx === idx) {
      setDraggedListIdx(null);
      setDragOverListIdx(null);
      return;
    }
    const nextItems = [...items];
    const [moved] = nextItems.splice(draggedListIdx, 1);
    nextItems.splice(idx, 0, moved);
    setItems(nextItems);
    setDraggedListIdx(null);
    setDragOverListIdx(null);
  };

  const selectedItem = items.find((item) => item.id === selectedItemId) || items[0];

  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      {/* SIDEBAR CÀI ĐẶT ĐA TẦNG */}
      {!is916Mode && (
        <div className="w-88 bg-slate-800 p-4 border-r border-slate-700 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-sky-400 flex items-center gap-1.5">
              🔦 SOI ĐÈN ĐA TẦNG (PRO)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded border border-sky-400/30">
              {items.length} Ảnh
            </span>
          </div>

          {/* CHUYỂN ĐỔI CHẾ ĐỘ THAO TÁC SÂN KHẤU */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setStageMode('edit')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                stageMode === 'edit'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Move size={14} /> Kéo Xếp Vị Trí
            </button>
            <button
              onClick={() => setStageMode('flashlight')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                stageMode === 'flashlight'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} /> Chế Độ Soi Đèn
            </button>
          </div>

          {/* Upload Button */}
          <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl cursor-pointer border border-dashed border-slate-500 text-xs font-semibold text-center transition-all hover:border-sky-400">
            <Plus size={16} /> Thêm Nhiều Ảnh (.PNG)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleImageUpload}
              className="hidden"
            />
          </label>

          {/* Danh sách các Layers ảnh */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
              <span className="flex items-center gap-1"><Layers size={13} /> Lớp Ảnh (Kéo đổi thứ tự):</span>
              <span className="text-[10px] text-slate-500">Dưới ➔ Trên</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const isSelected = item.id === selectedItemId;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStartList(idx)}
                    onDragOver={(e) => handleDragOverList(e, idx)}
                    onDragEnd={() => { setDraggedListIdx(null); setDragOverListIdx(null); }}
                    onDrop={() => handleDropList(idx)}
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setStageMode('edit');
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-sky-900/40 border-sky-400 ring-1 ring-sky-400/50 shadow-md'
                        : 'bg-slate-900/60 border-slate-700 hover:border-slate-500'
                    } ${draggedListIdx === idx ? 'opacity-40 border-dashed' : ''} ${
                      dragOverListIdx === idx ? 'ring-2 ring-sky-400 border-sky-400 scale-102' : ''
                    }`}
                  >
                    <GripVertical size={14} className="text-slate-500 hover:text-slate-300 cursor-grab" />
                    
                    <div className="w-9 h-9 rounded bg-slate-950/80 p-0.5 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={item.src} alt={item.name} className="w-full h-full object-contain" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400">
                        X: {item.x}px | Y: {item.y}px | {item.scale}%
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => toggleVisibility(item.id, e)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title={item.visible ? 'Ẩn ảnh' : 'Hiện ảnh'}
                      >
                        {item.visible ? <Eye size={14} /> : <EyeOff size={14} className="text-slate-600" />}
                      </button>

                      <button
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Xóa lớp này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tinh chỉnh nhanh kích thước & góc xoay cho ảnh được chọn */}
          {selectedItem && (
            <div className="flex flex-col gap-2 p-3 bg-slate-900/80 rounded-xl border border-sky-500/20">
              <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                <span className="truncate">🎯 {selectedItem.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">X:{selectedItem.x} Y:{selectedItem.y}</span>
              </div>

              {/* Tỉ lệ Scale & Góc Xoay Rotation */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Phóng to:</span>
                    <span className="text-white font-mono">{selectedItem.scale}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={selectedItem.scale}
                    onChange={(e) => updateSelectedItem('scale', Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Góc xoay:</span>
                    <span className="text-white font-mono">{selectedItem.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedItem.rotation}
                    onChange={(e) => updateSelectedItem('rotation', Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cài đặt Đèn Pin */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-slate-300">🔦 CÀI ĐẶT ĐÈN PIN</h3>

            {/* Radius */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Bán Kính Vệt Sáng:</span>
                <span className="text-white font-mono">{radius}px</span>
              </div>
              <input type="range" min="30" max="250" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />
            </div>

            {/* Spotlight Type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400">Kiểu Chiếu Đèn:</label>
              <select
                value={spotlightType}
                onChange={(e) => setSpotlightType(e.target.value)}
                className="p-2 bg-slate-700 text-white rounded-lg border-none text-xs outline-none cursor-pointer"
              >
                <option value="circle">🔵 Vệt Sáng Tròn</option>
                <option value="cone">📐 Vệt Nón Chiếu Chéo</option>
              </select>
            </div>

            {spotlightType === 'cone' && (
              <div className="grid grid-cols-2 gap-2 p-2 bg-slate-900/60 rounded-lg">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400">Hướng Chiếu: {beamAngle}°</span>
                  <input type="range" min="-180" max="180" value={beamAngle} onChange={(e) => setBeamAngle(Number(e.target.value))} className="accent-sky-400 cursor-pointer h-1" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400">Độ Mở: {coneSpread}°</span>
                  <input type="range" min="5" max="160" value={coneSpread} onChange={(e) => setConeSpread(Number(e.target.value))} className="accent-sky-400 cursor-pointer h-1" />
                </div>
              </div>
            )}

            {/* Hand Size */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Bàn Tay 👆:</span>
                <span className="text-white font-mono">{handSize}px</span>
              </div>
              <input type="range" min="24" max="200" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />
            </div>

            {/* Global Scale & Offset Y */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400">Toàn cảnh: {globalScale}%</span>
                <input type="range" min="50" max="150" value={globalScale} onChange={(e) => setGlobalScale(Number(e.target.value))} className="accent-sky-400 cursor-pointer h-1.5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-slate-400">Dọc (Y): {globalOffsetY}px</span>
                <input type="range" min="-300" max="300" value={globalOffsetY} onChange={(e) => setGlobalOffsetY(Number(e.target.value))} className="accent-sky-400 cursor-pointer h-1.5" />
              </div>
            </div>
          </div>

          {/* Nút Chuyển Sang Trạng Thái 1: Ẩn Hết Để Quay Video */}
          <button
            onClick={() => {
              setStageMode('flashlight');
              setIs916Mode(true);
            }}
            className="mt-auto p-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer text-xs"
          >
            <Play size={16} /> Ẩn Giao Diện Quay Video (ESC Quay Lại)
          </button>
        </div>
      )}

      {/* SÂN KHẤU CANVAS TRÌNH CHIẾU */}
      <div
        className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${
          is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
        }`}
        onMouseUp={handleMouseUpStage}
      >
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className={`relative overflow-hidden transition-all duration-300 ${
            stageMode === 'flashlight' || is916Mode ? 'cursor-none' : 'cursor-default'
          } ${
            is916Mode
              ? 'w-full h-full bg-white flex items-center justify-center'
              : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
          }`}
        >
          {/* Nền Grid Kẻ Ô Mờ */}
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
              transform: `rotate(-90deg) scale(${(globalScale / 100) * (is916Mode ? 1.25 : 0.95)})`,
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

          {/* CÁC ĐỐI TƯỢNG HÌNH ẢNH TRỰC QUAN ĐỂ CHỌN VÀ KÉO THẢ TRỰC TIẾP TRÊN KHUNG QUAY (CHẾ ĐỘ EDIT) */}
          {stageMode === 'edit' && !is916Mode && (
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              style={{
                transform: `rotate(-90deg) scale(${(globalScale / 100) * 0.95})`,
                transformOrigin: 'center center',
                width: '540px',
                height: '960px',
                left: 'calc(50% - 270px)',
                top: 'calc(50% - 480px)'
              }}
            >
              {items.map((item) => {
                if (!item.visible) return null;
                const isSelected = item.id === selectedItemId;
                const baseFitW = 540 * 0.75;
                const finalW = baseFitW * (item.scale / 100);
                const finalH = finalW;

                const posX = 540 / 2 + item.x;
                const posY = 960 / 2 + item.y + globalOffsetY;

                return (
                  <div
                    key={item.id}
                    onMouseDown={(e) => handleStartDragItem(e, item)}
                    className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing flex items-center justify-center transition-shadow group ${
                      isSelected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-black/50' : 'hover:ring-1 hover:ring-sky-300'
                    }`}
                    style={{
                      left: `${posX}px`,
                      top: `${posY}px`,
                      width: `${finalW}px`,
                      height: `${finalH}px`,
                      transform: `translate(-50%, -50%) rotate(${item.rotation || 0}deg)`,
                      borderRadius: '8px'
                    }}
                  >
                    <img
                      src={item.src}
                      alt={item.name}
                      className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
                    />

                    {/* Huy hiệu hiển thị khi chọn */}
                    {isSelected && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow pointer-events-none whitespace-nowrap flex items-center gap-1">
                        <Move size={10} /> {item.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* BANNER HƯỚNG DẪN KHI Ở CHẾ ĐỘ KÉO XẾP */}
          {stageMode === 'edit' && !is916Mode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full border border-sky-500/40 shadow-xl backdrop-blur-sm pointer-events-none flex items-center gap-2">
              <Move size={14} className="text-sky-400 animate-pulse" />
              <span>Nhấp chuột trực tiếp vào ảnh trên khung để chọn và kéo thả sắp xếp vị trí</span>
            </div>
          )}

          {/* HAND CURSOR OVERLAY 👆 (Chỉ hiển thị khi ở chế độ Soi Đèn hoặc khi quay video 9:16) */}
          {(stageMode === 'flashlight' || is916Mode) && (
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
