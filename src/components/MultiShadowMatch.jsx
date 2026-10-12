import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Play, GripVertical, Move, Sparkles, Plus, Trash2, Eye, EyeOff, Layers, Palette, Wand2 } from 'lucide-react';

const POKEMON_IMAGES = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', // Pikachu PNG
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',  // Charmander PNG
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png'   // Squirtle PNG
];

const STORAGE_KEY = 'multi_shadow_game_settings_v1';

export default function MultiShadowMatch({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  const getSavedSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const initialSettings = getSavedSettings();

  // Danh sách ảnh khay phía trên (images gốc)
  const [images, setImages] = useState(initialSettings.images || POKEMON_IMAGES);
  // Chỉ số ảnh được chọn để tạo bóng đen ở phía dưới (chọn từ các ảnh phía trên)
  const [shadowIndex, setShadowIndex] = useState(initialSettings.shadowIndex ?? 0);
  
  // Danh sách các layer hiển thị ở khu vực phía dưới
  // Mỗi layer: { id, imageIndex, type: 'shadow' | 'color', x, y, scale, rotation, visible, name }
  const [stageLayers, setStageLayers] = useState(() => {
    if (initialSettings.stageLayers && initialSettings.stageLayers.length > 0) {
      return initialSettings.stageLayers;
    }
    const defaultShadowIdx = initialSettings.shadowIndex ?? 0;
    return [
      {
        id: 'layer-shadow-main',
        imageIndex: defaultShadowIdx,
        type: 'shadow',
        x: 0,
        y: 0,
        scale: 100,
        rotation: 0,
        visible: true,
        name: `Bóng Đen (Ảnh #${defaultShadowIdx + 1})`
      },
      {
        id: 'layer-color-extra',
        imageIndex: 1,
        type: 'color',
        x: 180,
        y: 40,
        scale: 65,
        rotation: 5,
        visible: true,
        name: 'Ảnh Màu Minh Họa #2'
      }
    ];
  });

  const [selectedLayerId, setSelectedLayerId] = useState(() => {
    return stageLayers[0]?.id || null;
  });

  const [handSize, setHandSize] = useState(initialSettings.handSize ?? 48);

  // Cài đặt khay ảnh phía trên (Top Tray)
  const [trayOffsetX, setTrayOffsetX] = useState(initialSettings.trayOffsetX ?? 112);
  const [trayOffsetY, setTrayOffsetY] = useState(initialSettings.trayOffsetY ?? 0);
  const [trayItemSize, setTrayItemSize] = useState(initialSettings.trayItemSize ?? 90);
  const [trayGap, setTrayGap] = useState(initialSettings.trayGap ?? 24);

  const THEATER_WIDTH = 1280;
  const THEATER_HEIGHT = 720;

  // States for Gameplay & Dragging
  const [pickedItem, setPickedItem] = useState(null); // { index, src, layerId? }
  const [placedItems, setPlacedItems] = useState([]); // [{ id, index, src, x, y, width, height, targetLayerId }]
  const [cursorPos, setCursorPos] = useState({ x: 640, y: 360 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  // Chế độ thao tác trên khung quay: 'gameplay' (Kéo ghép bóng thông thường) hoặc 'edit' (Kéo chỉnh vị trí các layer & khay trực tiếp)
  const [stageMode, setStageMode] = useState('gameplay');
  const [draggingTarget, setDraggingTarget] = useState(null); // 'tray' | { type: 'layer', layerId }
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, initValX: 0, initValY: 0 });

  // States for Drag and Drop Reordering in Images List
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState(null);

  // States for Drag and Drop Reordering in Stage Layers
  const [draggedLayerIdx, setDraggedLayerIdx] = useState(null);
  const [dragOverLayerIdx, setDragOverLayerIdx] = useState(null);

  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  const stageRef = useRef(null);
  const theaterRef = useRef(null);
  const [stageScale, setStageScale] = useState(1);
  const cardRefs = useRef([]);
  const [isResetting, setIsResetting] = useState(false);

  // Cache loaded HTMLImageElement objects for silhouette canvas rendering
  const loadedImgObjects = useRef({});
  const [, setCanvasTicket] = useState(0);

  // Tự động lưu cài đặt vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        images,
        shadowIndex,
        stageLayers,
        handSize,
        trayOffsetX,
        trayOffsetY,
        trayItemSize,
        trayGap
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt MultiShadowMatch:', e);
    }
  }, [images, shadowIndex, stageLayers, handSize, trayOffsetX, trayOffsetY, trayItemSize, trayGap]);

  // Load Image Objects for Silhouette / Canvas render
  useEffect(() => {
    images.forEach((url, i) => {
      if (!loadedImgObjects.current[url]) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
          loadedImgObjects.current[url] = img;
          setCanvasTicket(t => t + 1);
        };
      }
    });
  }, [images]);

  // Dynamic Scale calculation for Theater Container
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

  const resetGameRef = useRef(null);

  // Phím tắt: Spacebar để Reset và ESC để thoát 9:16 / Thoát chế độ Sắp xếp
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

    if (!draggingTarget) return;

    const rect = theaterRef.current.getBoundingClientRect();
    const currentScale = rect.width / THEATER_WIDTH || stageScale || 1;
    const deltaX = (e.clientX - dragStartRef.current.mouseX) / currentScale;
    const deltaY = (e.clientY - dragStartRef.current.mouseY) / currentScale;

    if (draggingTarget === 'tray') {
      setTrayOffsetX(Math.max(0, Math.min(THEATER_WIDTH - 120, Math.round(dragStartRef.current.initValX + deltaX))));
      setTrayOffsetY(Math.max(-350, Math.min(350, Math.round(dragStartRef.current.initValY + deltaY))));
    } else if (draggingTarget.type === 'layer') {
      const layerId = draggingTarget.layerId;
      setStageLayers(prev => prev.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            x: Math.round(dragStartRef.current.initValX + deltaX),
            y: Math.round(dragStartRef.current.initValY + deltaY)
          };
        }
        return layer;
      }));
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

  const handleStartDragLayer = (e, layer) => {
    if (stageMode !== 'edit' || is916Mode) return;
    e.stopPropagation();
    setSelectedLayerId(layer.id);
    setDraggingTarget({ type: 'layer', layerId: layer.id });
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initValX: layer.x,
      initValY: layer.y
    };
  };

  const handleMouseUpStage = () => {
    if (draggingTarget) {
      setDraggingTarget(null);
    }
  };

  // Pick Item from Top Tray
  const handlePickItem = (index, src) => {
    if (isResetting) return;
    setPickedItem({ index, src });
  };

  // Click on Stage to Place or Move
  const handleStageClick = (e) => {
    if (pickedItem) {
      const { x, y } = getTheaterCoords(e);
      // Tìm xem layer nào là shadow phù hợp (nếu có)
      const shadowLayer = stageLayers.find(l => l.imageIndex === pickedItem.index && l.type === 'shadow');
      const baseScale = shadowLayer ? (shadowLayer.scale / 100) : 1;
      const boxW = 960 * baseScale;
      const boxH = 540 * baseScale;

      const newItem = {
        id: Date.now(),
        index: pickedItem.index,
        src: pickedItem.src,
        x: x - boxW / 2,
        y: y - boxH / 2,
        width: boxW,
        height: boxH,
        targetScale: shadowLayer ? shadowLayer.scale : 100,
        rotation: shadowLayer ? shadowLayer.rotation : 0
      };

      setPlacedItems([...placedItems, newItem]);
      setPickedItem(null);
    }
  };

  // Nhấc lại ảnh đã đặt trên sân khấu lên để tiếp tục di chuyển
  const handlePlacedItemClick = (e, item) => {
    e.stopPropagation();
    if (isResetting) return;

    setPickedItem({ index: item.index, src: item.src });
    setPlacedItems(placedItems.filter((p) => p.id !== item.id));
  };

  // Reset Game: Hiệu ứng ảnh từ sân khấu lướt bay mượt mà quay trở lại khay thẻ ban đầu
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

  // Reset toàn bộ Layout về chuẩn
  const resetToDefaultLayout = () => {
    setTrayOffsetX(112);
    setTrayOffsetY(0);
    setTrayItemSize(90);
    setTrayGap(24);
    setHandSize(48);
    setPlacedItems([]);
    setPickedItem(null);
  };

  // Upload nhiều ảnh
  const handleMultipleImageUpload = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newUrls = files.map((file) => URL.createObjectURL(file));
    setImages(newUrls);
    setShadowIndex(0);

    // Tự động tạo lại danh sách layer:
    // - Ảnh được chọn (mặc định ảnh 0) làm Bóng Đen ở khu vực phía dưới
    // - Các ảnh còn lại có thể là ảnh màu minh họa
    const newLayers = [
      {
        id: `layer-shadow-main`,
        imageIndex: 0,
        type: 'shadow',
        x: 0,
        y: 0,
        scale: 100,
        rotation: 0,
        visible: true,
        name: `Bóng Đen (Ảnh #1)`
      }
    ];

    if (newUrls.length > 1) {
      newLayers.push({
        id: `layer-color-extra`,
        imageIndex: 1,
        type: 'color',
        x: 180,
        y: 40,
        scale: 65,
        rotation: 5,
        visible: true,
        name: `Ảnh Màu Minh Họa #2`
      });
    }

    setStageLayers(newLayers);
    setSelectedLayerId(newLayers[0]?.id || null);
    setPlacedItems([]);
    setPickedItem(null);
  };

  // Chọn 1 ảnh từ danh sách phía trên để làm Bóng Đen ở khu vực phía dưới
  const handleSelectShadowImageFromTop = (index) => {
    setShadowIndex(index);
    // Cập nhật hoặc tạo layer bóng đen chính gắn với ảnh vừa chọn
    setStageLayers(prev => {
      const hasShadow = prev.some(l => l.type === 'shadow');
      if (hasShadow) {
        return prev.map(l => l.type === 'shadow' ? { ...l, imageIndex: index, name: `Bóng Đen (Ảnh #${index + 1})` } : l);
      } else {
        return [
          {
            id: `layer-shadow-${Date.now()}`,
            imageIndex: index,
            type: 'shadow',
            x: 0,
            y: 0,
            scale: 100,
            rotation: 0,
            visible: true,
            name: `Bóng Đen (Ảnh #${index + 1})`
          },
          ...prev
        ];
      }
    });
    setPlacedItems([]);
    setPickedItem(null);
  };

  // Kéo thả sắp xếp danh sách ảnh gốc (Top Tray Images)
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

    // Cập nhật lại shadowIndex nếu vị trí thay đổi
    let newShadowIdx = shadowIndex;
    if (shadowIndex === draggedImageIndex) {
      newShadowIdx = targetIdx;
    } else if (draggedImageIndex < shadowIndex && targetIdx >= shadowIndex) {
      newShadowIdx = shadowIndex - 1;
    } else if (draggedImageIndex > shadowIndex && targetIdx <= shadowIndex) {
      newShadowIdx = shadowIndex + 1;
    }
    setShadowIndex(newShadowIdx);

    // Cập nhật lại mapping trong stageLayers
    setStageLayers(prev => prev.map(layer => {
      let newIdx = layer.imageIndex;
      if (layer.imageIndex === draggedImageIndex) {
        newIdx = targetIdx;
      } else if (draggedImageIndex < layer.imageIndex && targetIdx >= layer.imageIndex) {
        newIdx = layer.imageIndex - 1;
      } else if (draggedImageIndex > layer.imageIndex && targetIdx <= layer.imageIndex) {
        newIdx = layer.imageIndex + 1;
      }
      return {
        ...layer,
        imageIndex: newIdx,
        name: layer.type === 'shadow' ? `Bóng Đen (Ảnh #${newIdx + 1})` : layer.name
      };
    }));

    setImages(reordered);
    setPlacedItems([]);
    setPickedItem(null);
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  // Thêm Layer mới ở khu vực hiển thị (chọn từ danh sách ảnh phía trên)
  const handleAddLayer = (type = 'color') => {
    const newId = `layer-${Date.now()}`;
    const targetImgIdx = type === 'shadow' ? shadowIndex : Math.min(images.length - 1, stageLayers.length);
    const newLayer = {
      id: newId,
      imageIndex: targetImgIdx >= 0 ? targetImgIdx : 0,
      type,
      x: (stageLayers.length % 3) * 60,
      y: (stageLayers.length % 3) * 40,
      scale: type === 'shadow' ? 100 : 75,
      rotation: 0,
      visible: true,
      name: type === 'shadow' ? `Bóng Đen (Ảnh #${targetImgIdx + 1})` : `Ảnh Màu #${targetImgIdx + 1}`
    };
    setStageLayers([...stageLayers, newLayer]);
    setSelectedLayerId(newId);
  };

  // Xóa Layer
  const handleDeleteLayer = (id) => {
    const filtered = stageLayers.filter(l => l.id !== id);
    setStageLayers(filtered);
    if (selectedLayerId === id) {
      setSelectedLayerId(filtered[0]?.id || null);
    }
  };

  // Kéo thả đổi thứ tự Z-Index của Layer
  const handleLayerDragStart = (e, index) => {
    setDraggedLayerIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleLayerDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverLayerIdx !== index) {
      setDragOverLayerIdx(index);
    }
  };

  const handleLayerDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedLayerIdx === null || draggedLayerIdx === targetIdx) {
      setDraggedLayerIdx(null);
      setDragOverLayerIdx(null);
      return;
    }
    const updated = [...stageLayers];
    const [moved] = updated.splice(draggedLayerIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setStageLayers(updated);
    setDraggedLayerIdx(null);
    setDragOverLayerIdx(null);
  };

  const selectedLayer = stageLayers.find(l => l.id === selectedLayerId) || null;

  const updateSelectedLayer = (field, val) => {
    if (!selectedLayerId) return;
    setStageLayers(prev => prev.map(layer => {
      if (layer.id === selectedLayerId) {
        return { ...layer, [field]: val };
      }
      return layer;
    }));
  };

  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode || stageMode === 'edit' ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      {/* SIDEBAR CÀI ĐẶT (Ẩn khi ở chế độ quay video 9:16 hoặc Kéo Xếp Full) */}
      {!is916Mode && stageMode !== 'edit' && (
        <div className="w-84 bg-slate-800 p-4 border-r border-slate-700 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-purple-400 flex items-center gap-1.5">
              👻 GHÉP BÓNG MỞ RỘNG (PRO)
            </h2>
          </div>

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

          {/* PHẦN 1: ẢNH GỐC PHÍA TRÊN (2-3 ẢNH ĐỂ KÉO XUỐNG) */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                📥 1. Ảnh Khay Gốc (Để Kéo Xuống)
              </span>
              <span className="text-[10px] text-slate-400">({images.length} ảnh)</span>
            </div>

            <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer border border-dashed border-slate-500 text-xs font-semibold text-center transition-colors">
              <Upload size={14} /> Tải Nhiều Ảnh PNG (Nhân Vật)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleImageUpload}
                className="hidden"
              />
            </label>

            {/* Hướng dẫn và chọn nhanh */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Danh sách ({images.length} ảnh):</span>
              <span className="text-[10px] text-purple-300 font-semibold">Click ảnh để chọn làm bóng</span>
            </div>

            {/* Danh sách ảnh khay với drag-drop thứ tự và click chọn làm bóng đen */}
            <div className="grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, i)}
                  onClick={() => handleSelectShadowImageFromTop(i)}
                  className={`h-16 bg-slate-900/90 rounded-lg cursor-pointer overflow-hidden relative border transition-all flex items-center justify-center p-1 group select-none ${
                    i === shadowIndex
                      ? 'border-purple-400 ring-2 ring-purple-500/70 shadow-lg shadow-purple-500/20'
                      : 'border-slate-700 hover:border-slate-500'
                  } ${draggedImageIndex === i ? 'opacity-40 scale-95 border-dashed border-purple-500' : ''} ${
                    dragOverImageIndex === i && draggedImageIndex !== i ? 'ring-2 ring-sky-400 border-sky-400 scale-105' : ''
                  }`}
                  title={`Ảnh #${i + 1} - Click để chọn làm Bóng Đen ở phía dưới (Giữ & Kéo để đổi thứ tự)`}
                >
                  <img src={src} alt={`Top Image ${i}`} className="w-full h-full object-contain pointer-events-none select-none" />
                  
                  {/* Grip handle khi hover */}
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded p-0.5 pointer-events-none">
                    <GripVertical size={10} className="text-slate-300" />
                  </div>

                  {/* Số thứ tự */}
                  <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1 rounded pointer-events-none">
                    #{i + 1}
                  </span>

                  {/* Badge BÓNG ĐEN hiển thị trên ảnh đang được chọn */}
                  {i === shadowIndex && (
                    <span className="absolute top-1 right-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-tight shadow-md border border-purple-300/40 pointer-events-none">
                      🌑 Bóng
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Select Dropdown tường minh để chọn ảnh làm bóng đen */}
            <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-slate-700/60">
              <label className="text-[11px] text-purple-300 font-semibold flex items-center gap-1">
                <span>🌑 Chọn Ảnh Làm Bóng Đen Ở Phía Dưới:</span>
              </label>
              <select
                value={shadowIndex}
                onChange={(e) => handleSelectShadowImageFromTop(Number(e.target.value))}
                className="w-full p-2 bg-slate-800 text-white text-xs rounded-lg border border-purple-500/40 focus:ring-2 focus:ring-purple-400 outline-none cursor-pointer font-medium"
              >
                {images.map((_, i) => (
                  <option key={i} value={i}>
                    👉 Thẻ Ảnh #{i + 1} {i === shadowIndex ? '(Đang kích hoạt làm Bóng Đen)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PHẦN 2: CÁC LỚP HIỂN THỊ PHÍA DƯỚI (KHU VỰC SÂN KHẤU: BÓNG ĐEN & ẢNH MÀU ĐẦY ĐỦ) */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                <Layers size={13} /> 2. Khu Vực Hiển Thị Phía Dưới
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAddLayer('shadow')}
                  className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Thêm layer bóng đen mới"
                >
                  <Plus size={10} /> + Bóng Đen
                </button>
                <button
                  onClick={() => handleAddLayer('color')}
                  className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Thêm layer ảnh màu đầy đủ mới"
                >
                  <Plus size={10} /> + Ảnh Màu
                </button>
              </div>
            </div>

            {/* Danh sách các Layers */}
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {stageLayers.map((layer, index) => (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={(e) => handleLayerDragStart(e, index)}
                  onDragOver={(e) => handleLayerDragOver(e, index)}
                  onDrop={(e) => handleLayerDrop(e, index)}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    layer.id === selectedLayerId
                      ? 'bg-purple-950/70 border-purple-500 text-white shadow-sm'
                      : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:border-slate-500'
                  } ${draggedLayerIdx === index ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <GripVertical size={12} className="text-slate-500 cursor-grab" />
                    
                    {/* Badge kiểu hiển thị: Bóng Đen hoặc Đầy Màu */}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setStageLayers(prev => prev.map(l => l.id === layer.id ? { ...l, type: l.type === 'shadow' ? 'color' : 'shadow' } : l));
                      }}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                        layer.type === 'shadow'
                          ? 'bg-black text-purple-300 border border-purple-500/40'
                          : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
                      }`}
                      title="Click để chuyển đổi giữa Bóng Đen và Ảnh Màu"
                    >
                      {layer.type === 'shadow' ? '🌑 Bóng Đen' : '🎨 Đầy Màu'}
                    </span>

                    {/* Thumbnail ảnh */}
                    {images[layer.imageIndex] && (
                      <img
                        src={images[layer.imageIndex]}
                        alt="thumb"
                        className="w-5 h-5 object-contain rounded"
                      />
                    )}

                    <span className="truncate text-[11px] font-medium">{layer.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setStageLayers(prev => prev.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l));
                      }}
                      className="p-1 text-slate-400 hover:text-white"
                      title={layer.visible ? 'Ẩn' : 'Hiện'}
                    >
                      {layer.visible ? <Eye size={12} /> : <EyeOff size={12} className="text-rose-400" />}
                    </button>
                    {stageLayers.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLayer(layer.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400"
                        title="Xóa layer"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tùy chỉnh chi tiết Layer đang chọn */}
            {selectedLayer && (
              <div className="flex flex-col gap-2.5 p-2.5 bg-slate-950/70 rounded-lg border border-purple-500/30 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300">
                    ⚙️ Tùy Chỉnh: {selectedLayer.name}
                  </span>
                  <select
                    value={selectedLayer.imageIndex}
                    onChange={(e) => updateSelectedLayer('imageIndex', Number(e.target.value))}
                    className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded border border-slate-700 outline-none"
                  >
                    {images.map((_, i) => (
                      <option key={i} value={i}>Gắn với Ảnh #{i + 1}</option>
                    ))}
                  </select>
                </div>

                {/* Chuyển kiểu hiển thị */}
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-slate-400 font-medium">Kiểu Hiển Thị:</label>
                  <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
                    <button
                      onClick={() => updateSelectedLayer('type', 'shadow')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        selectedLayer.type === 'shadow' ? 'bg-purple-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      🌑 Bóng Đen
                    </button>
                    <button
                      onClick={() => updateSelectedLayer('type', 'color')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        selectedLayer.type === 'color' ? 'bg-sky-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      🎨 Đầy Màu
                    </button>
                  </div>
                </div>

                {/* Scale */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tỉ Lệ Kích Thước (Scale):</span>
                    <span className="text-white font-bold">{selectedLayer.scale}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    value={selectedLayer.scale}
                    onChange={(e) => updateSelectedLayer('scale', Number(e.target.value))}
                    className="accent-purple-400 cursor-pointer h-1"
                  />
                </div>

                {/* Vị trí X (Ngang) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tọa Độ X (Sang Trái/Phải):</span>
                    <span className="text-white font-bold">{selectedLayer.x}px</span>
                  </div>
                  <input
                    type="range"
                    min="-500"
                    max="500"
                    value={selectedLayer.x}
                    onChange={(e) => updateSelectedLayer('x', Number(e.target.value))}
                    className="accent-purple-400 cursor-pointer h-1"
                  />
                </div>

                {/* Vị trí Y (Dọc) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Tọa Độ Y (Lên/Xuống):</span>
                    <span className="text-white font-bold">{selectedLayer.y}px</span>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    value={selectedLayer.y}
                    onChange={(e) => updateSelectedLayer('y', Number(e.target.value))}
                    className="accent-purple-400 cursor-pointer h-1"
                  />
                </div>

                {/* Góc Xoay Rotation */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Góc Xoay:</span>
                    <span className="text-white font-bold">{selectedLayer.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={selectedLayer.rotation}
                    onChange={(e) => updateSelectedLayer('rotation', Number(e.target.value))}
                    className="accent-purple-400 cursor-pointer h-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CÀI ĐẶT KHAY ẢNH GỐC */}
          <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-700/80">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              🖼️ Cài Đặt Khay Ảnh Phía Trên
            </span>

            {/* Tray Item Size */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Kích Thước Thẻ Khay:</span>
                <span className="text-white font-bold">{trayItemSize}px</span>
              </div>
              <input
                type="range"
                min="40"
                max="250"
                value={trayItemSize}
                onChange={(e) => setTrayItemSize(Number(e.target.value))}
                className="accent-purple-400 cursor-pointer h-1"
              />
            </div>

            {/* Tray Gap */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Dãn Cách Thẻ:</span>
                <span className="text-white font-bold">{trayGap}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={trayGap}
                onChange={(e) => setTrayGap(Number(e.target.value))}
                className="accent-purple-400 cursor-pointer h-1"
              />
            </div>

            {/* Tray OffsetX */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Vị Trí Khay (Trái/Phải):</span>
                <span className="text-white font-bold">{trayOffsetX}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="1150"
                value={trayOffsetX}
                onChange={(e) => setTrayOffsetX(Number(e.target.value))}
                className="accent-purple-400 cursor-pointer h-1"
              />
            </div>

            {/* Tray OffsetY */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Vị Trí Khay (Lên/Xuống):</span>
                <span className="text-white font-bold">{trayOffsetY}px</span>
              </div>
              <input
                type="range"
                min="-350"
                max="350"
                value={trayOffsetY}
                onChange={(e) => setTrayOffsetY(Number(e.target.value))}
                className="accent-purple-400 cursor-pointer h-1"
              />
            </div>
          </div>

          {/* Hand Size */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Kích Thước Bàn Tay 👆:</span>
              <span className="text-white font-bold">{handSize}px</span>
            </div>
            <input
              type="range"
              min="24"
              max="150"
              value={handSize}
              onChange={(e) => setHandSize(Number(e.target.value))}
              className="accent-purple-400 cursor-pointer h-1.5"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={resetGame}
              className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-xs cursor-pointer shadow"
            >
              <RefreshCw size={14} /> Reset Vị Trí Ghép (Spacebar)
            </button>
            <button
              onClick={resetToDefaultLayout}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 font-medium text-xs border border-slate-700 cursor-pointer"
            >
              ↺ Khôi Phục Căn Chỉnh Mặc Định
            </button>
            <button
              onClick={() => setIs916Mode(true)}
              className="p-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Play size={16} /> Ẩn Giao Diện Quay Video (ESC Quay Lại)
            </button>
          </div>
        </div>
      )}

      {/* KHU VỰC SÂN KHẤU (FULL MÀN HÌNH KHI Ở CHẾ ĐỘ 9:16 HOẶC KÉO XẾP FULL) */}
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
          {/* Nền Grid Kẻ Ô Mờ Chuẩn Nhất */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* THEATER CONTAINER CỐ ĐỊNH 1280x720: TOÀN BỘ KHAY ẢNH VÀ CÁC LAYER NẰM CHUNG 1 HỆ QUY CHIẾU */}
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
            {/* 1. KHAY ẢNH GỐC (PHẦN PHÍA TRÊN / KHAY CHỌN ĐỂ KÉO XUỐNG) */}
            <div
              onMouseDown={handleStartDragTray}
              className={`absolute z-30 flex flex-col items-center p-2 rounded-xl transition-all select-none ${
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
              {stageMode === 'edit' && !is916Mode && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow pointer-events-none whitespace-nowrap flex items-center gap-1">
                  <Move size={10} /> Khay Ảnh Gốc (Kéo di chuyển)
                </div>
              )}

              {images.map((src, i) => (
                <div
                  key={i}
                  ref={(el) => (cardRefs.current[i] = el)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (stageMode === 'gameplay') {
                      handlePickItem(i, src);
                    }
                  }}
                  className={`transition-all flex items-center justify-center select-none ${
                    stageMode === 'edit' && !is916Mode
                      ? 'cursor-grab'
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

            {/* 2. CÁC LỚP HIỂN THỊ PHÍA DƯỚI (STAGE LAYERS: BÓNG ĐEN VÀ ẢNH MÀU ĐẦY ĐỦ) */}
            {stageLayers.map((layer) => {
              if (!layer.visible) return null;
              const imgUrl = images[layer.imageIndex] || images[0];
              if (!imgUrl) return null;

              const isSelected = stageMode === 'edit' && selectedLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  onMouseDown={(e) => handleStartDragLayer(e, layer)}
                  className={`absolute transition-all ${
                    stageMode === 'edit' && !is916Mode
                      ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-purple-400 rounded-2xl'
                      : ''
                  } ${isSelected && !is916Mode ? 'ring-2 ring-purple-500 rounded-2xl' : ''}`}
                  style={{
                    left: `calc(50% + ${layer.x}px)`,
                    top: `calc(50% + ${layer.y}px)`,
                    transform: `translate(-50%, -50%) rotate(${layer.rotation - 90}deg) scale(${layer.scale / 100})`,
                    transformOrigin: 'center center'
                  }}
                  title={stageMode === 'edit' ? `Kéo để di chuyển: ${layer.name}` : ''}
                >
                  {/* Nhãn hiển thị khi ở chế độ edit */}
                  {isSelected && !is916Mode && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow pointer-events-none whitespace-nowrap z-30 flex items-center gap-1">
                      <Move size={10} /> {layer.name} ({layer.type === 'shadow' ? 'Bóng Đen' : 'Đầy Màu'})
                    </div>
                  )}

                  {/* KÍCH THƯỚC CHUẨN KHUÔN 9:16 (540x960) */}
                  <div
                    style={{
                      width: '540px',
                      height: '960px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {layer.type === 'shadow' ? (
                      /* HIỂN THỊ DẠNG BÓNG ĐEN SILHOUETTE CANVAS */
                      <SilhouetteCanvas
                        imgUrl={imgUrl}
                        loadedImg={loadedImgObjects.current[imgUrl]}
                      />
                    ) : (
                      /* HIỂN THỊ DẠNG ẢNH ĐẦY ĐỦ MÀU SẮC */
                      <img
                        src={imgUrl}
                        alt={layer.name}
                        style={{
                          maxWidth: '85%',
                          maxHeight: '85%',
                          objectFit: 'contain'
                        }}
                        className="pointer-events-none select-none drop-shadow-xl"
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {/* 3. CÁC ẢNH ĐÃ GHÉP THÀNH CÔNG LÊN SÂN KHẤU */}
            {placedItems.map((item) => (
              <div
                key={item.id}
                onClick={(e) => handlePlacedItemClick(e, item)}
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)] flex items-center justify-center select-none ${
                  item.isReturning ? 'z-30 pointer-events-none' : 'z-20 cursor-none'
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
                      transform: `rotate(${item.rotation - 90}deg) scale(${item.targetScale / 100})`,
                      transformOrigin: 'center center',
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
                      className="pointer-events-none select-none drop-shadow-2xl"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* 4. ẢNH ĐANG CẦM THEO CON TRỎ CHUỘT */}
            {pickedItem && (
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-100 z-40 flex items-center justify-center"
                style={{
                  left: `${cursorPos.x}px`,
                  top: `${cursorPos.y}px`,
                  width: '960px',
                  height: '540px'
                }}
              >
                <div
                  style={{
                    width: '540px',
                    height: '960px',
                    transform: 'rotate(-90deg) scale(1)',
                    transformOrigin: 'center center',
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
                    className="drop-shadow-2xl"
                  />
                </div>
              </div>
            )}

            {/* 5. HAND CURSOR 👆 */}
            {(stageMode === 'gameplay' || is916Mode) && (
              <div
                className="absolute pointer-events-none select-none z-50"
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

          {/* BANNER HƯỚNG DẪN KHI Ở CHẾ ĐỘ KÉO XẾP FULL MÀN HÌNH */}
          {stageMode === 'edit' && !is916Mode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl border border-purple-500/40 shadow-2xl backdrop-blur-md z-40 flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-purple-300">
                <Move size={15} className="animate-pulse" />
                <span>Kéo trực tiếp <b>Bóng đen</b>, <b>Ảnh màu</b> hoặc <b>Khay ảnh</b> để sắp xếp vị trí</span>
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

// Sub-component vẽ Silhouette Canvas bóng đen đặc #000000
function SilhouetteCanvas({ imgUrl, loadedImg }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImg || !loadedImg.width || !loadedImg.height) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const imgRatio = loadedImg.width / loadedImg.height;
    const canvasRatio = width / height;

    let drawW, drawH, drawX, drawY;
    if (imgRatio > canvasRatio) {
      drawW = width * 0.85;
      drawH = drawW / imgRatio;
      drawX = (width - drawW) / 2;
      drawY = (height - drawH) / 2;
    } else {
      drawH = height * 0.85;
      drawW = drawH * imgRatio;
      drawX = (width - drawW) / 2;
      drawY = (height - drawH) / 2;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);

    // Phủ đen đặc chỉ lên vùng hình ảnh
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  }, [imgUrl, loadedImg]);

  return (
    <canvas
      ref={canvasRef}
      width={540}
      height={960}
      className="pointer-events-none"
    />
  );
}
