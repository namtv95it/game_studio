import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Play, GripVertical, Move, Sparkles, Plus, Trash2, Eye, EyeOff, Layers, Palette, Wand2, ArrowUp, ArrowDown, X } from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';

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

  // Danh sách ảnh khay phía trên (Top Tray images)
  const [images, setImages] = useState(initialSettings.images || POKEMON_IMAGES);
  // Danh sách ảnh riêng dành cho Lớp Sân Khấu (Stage images)
  const [stageImages, setStageImages] = useState(initialSettings.stageImages || initialSettings.images || POKEMON_IMAGES);
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
  // Bật/tắt tính năng chọn ảnh khay trên để kéo xuống dưới
  const [trayPickEnabled, setTrayPickEnabled] = useState(initialSettings.trayPickEnabled ?? true);

  // Cài đặt ảnh phía dưới (Bottom Image) - có thể di chuyển tự do kể cả khi gameplay
  const [bottomImageVisible, setBottomImageVisible] = useState(initialSettings.bottomImageVisible ?? true);
  const [bottomImageIndex, setBottomImageIndex] = useState(initialSettings.bottomImageIndex ?? 0);
  const [bottomImageX, setBottomImageX] = useState(initialSettings.bottomImageX ?? 640);
  const [bottomImageY, setBottomImageY] = useState(initialSettings.bottomImageY ?? 620);
  const [bottomImageSize, setBottomImageSize] = useState(initialSettings.bottomImageSize ?? 160);
  const [bottomImageOpacity, setBottomImageOpacity] = useState(initialSettings.bottomImageOpacity ?? 90);
  const [bottomImageRotation, setBottomImageRotation] = useState(initialSettings.bottomImageRotation ?? 0);
  const [bottomImageCustomUrl, setBottomImageCustomUrl] = useState(initialSettings.bottomImageCustomUrl || null);
  const bottomImageInputRef = useRef(null);

  const THEATER_WIDTH = 1280;
  const THEATER_HEIGHT = 720;

  // States for Gameplay & Dragging
  const [pickedItem, setPickedItem] = useState(null); // { index, src, layerId? }
  const [placedItems, setPlacedItems] = useState([]); // [{ id, index, src, x, y, width, height, targetLayerId }]
  const [cursorPos, setCursorPos] = useState({ x: 640, y: 360 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  // Chế độ thao tác trên khung quay: 'gameplay' (Kéo ghép bóng thông thường) hoặc 'edit' (Kéo chỉnh vị trí các layer & khay trực tiếp)
  const [stageMode, setStageMode] = useState('gameplay');
  const [draggingTarget, setDraggingTarget] = useState(null); // 'tray' | 'bottom' | { type: 'layer', layerId }
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
        stageImages,
        shadowIndex,
        stageLayers,
        handSize,
        trayOffsetX,
        trayOffsetY,
        trayItemSize,
        trayGap,
        trayPickEnabled,
        bottomImageVisible,
        bottomImageIndex,
        bottomImageX,
        bottomImageY,
        bottomImageSize,
        bottomImageOpacity,
        bottomImageRotation,
        bottomImageCustomUrl
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt MultiShadowMatch:', e);
    }
  }, [images, stageImages, shadowIndex, stageLayers, handSize, trayOffsetX, trayOffsetY, trayItemSize, trayGap, trayPickEnabled, bottomImageVisible, bottomImageIndex, bottomImageX, bottomImageY, bottomImageSize, bottomImageOpacity, bottomImageRotation, bottomImageCustomUrl]);

  // Load Image Objects for Silhouette / Canvas render (Cả ảnh khay trên và ảnh sân khấu)
  useEffect(() => {
    const allUniqueUrls = Array.from(new Set([...images, ...stageImages]));
    allUniqueUrls.forEach((url) => {
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
  }, [images, stageImages]);

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
    } else if (draggingTarget === 'bottom') {
      setBottomImageX(Math.max(0, Math.min(THEATER_WIDTH, Math.round(dragStartRef.current.initValX + deltaX))));
      setBottomImageY(Math.max(0, Math.min(THEATER_HEIGHT, Math.round(dragStartRef.current.initValY + deltaY))));
    } else if (draggingTarget && draggingTarget.type === 'layer') {
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

  // Window-level event listener khi đang kéo thả (giúp di chuyển siêu mượt, không bị mất tiêu điểm ra ngoài canvas)
  useEffect(() => {
    if (!draggingTarget) return;

    const handleWindowMouseMove = (e) => {
      if (!theaterRef.current) return;
      const { x, y } = getTheaterCoords(e);
      setCursorPos({ x, y });

      const rect = theaterRef.current.getBoundingClientRect();
      const currentScale = rect.width / THEATER_WIDTH || stageScale || 1;
      const deltaX = (e.clientX - dragStartRef.current.mouseX) / currentScale;
      const deltaY = (e.clientY - dragStartRef.current.mouseY) / currentScale;

      if (draggingTarget === 'tray') {
        setTrayOffsetX(Math.max(0, Math.min(THEATER_WIDTH - 120, Math.round(dragStartRef.current.initValX + deltaX))));
        setTrayOffsetY(Math.max(-350, Math.min(350, Math.round(dragStartRef.current.initValY + deltaY))));
      } else if (draggingTarget === 'bottom') {
        setBottomImageX(Math.max(0, Math.min(THEATER_WIDTH, Math.round(dragStartRef.current.initValX + deltaX))));
        setBottomImageY(Math.max(0, Math.min(THEATER_HEIGHT, Math.round(dragStartRef.current.initValY + deltaY))));
      } else if (draggingTarget && draggingTarget.type === 'layer') {
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

    const handleWindowMouseUp = () => {
      setDraggingTarget(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggingTarget, stageScale]);

  const handleStartDragTray = (e) => {
    if (stageMode !== 'edit' || is916Mode) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingTarget('tray');
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initValX: trayOffsetX,
      initValY: trayOffsetY
    };
  };

  // Kéo ảnh phía dưới - hoạt động cả trong gameplay mode và 9:16 mode
  const handleStartDragBottom = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingTarget('bottom');
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initValX: bottomImageX,
      initValY: bottomImageY
    };
  };

  const handleStartDragLayer = (e, layer) => {
    // Nếu ở chế độ 9:16 hoặc gameplay, chỉ cho phép kéo nếu layer có kiểu 'movable'
    const isMovable = layer.type === 'movable';
    if (!isMovable && (stageMode !== 'edit' || is916Mode)) return;

    e.stopPropagation();
    e.preventDefault();
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
      // Tìm shadow layer phù hợp: ưu tiên layer có cùng imageIndex, nếu không lấy shadow layer có cùng src, hoặc shadow layer đầu tiên đang hiển thị
      const shadowLayer = 
        stageLayers.find(l => l.imageIndex === pickedItem.index && l.type === 'shadow') ||
        stageLayers.find(l => (stageImages[l.imageIndex] === pickedItem.src || images[l.imageIndex] === pickedItem.src) && l.type === 'shadow') ||
        stageLayers.find(l => l.type === 'shadow' && l.visible) ||
        stageLayers.find(l => l.type === 'shadow');

      const targetScale = shadowLayer ? shadowLayer.scale : 100;
      const targetRotation = shadowLayer ? shadowLayer.rotation : 0;
      const boxW = 960;
      const boxH = 540;

      const newItem = {
        id: Date.now(),
        index: pickedItem.index,
        src: pickedItem.src,
        x: x - boxW / 2,
        y: y - boxH / 2,
        width: boxW,
        height: boxH,
        targetScale: targetScale,
        rotation: targetRotation
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
    setBottomImageX(640);
    setBottomImageY(620);
    setBottomImageSize(160);
    setBottomImageOpacity(90);
    setBottomImageRotation(0);
    setPlacedItems([]);
    setPickedItem(null);
  };

  // Thay thế toàn bộ ảnh khay phía trên (Top Tray) bằng danh sách ảnh mới
  const handleTrayImagesReplace = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newUrls = files.map((file) => URL.createObjectURL(file));
    setImages(newUrls);
    setPlacedItems([]);
    setPickedItem(null);
    e.target.value = '';
  };

  // Upload ảnh dành riêng cho khay phía trên (Top Tray) - Tải THÊM ảnh vào danh sách
  const handleMultipleImageUpload = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newUrls = files.map((file) => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newUrls]);
    e.target.value = '';
  };

  // Xóa ảnh khỏi khay phía trên (cho phép xóa dù chỉ còn 1 cái)
  const handleDeleteTrayImage = (e, index) => {
    e.stopPropagation();
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  // Thay thế toàn bộ ảnh sân khấu bằng ảnh mới tải lên (tránh bị nhân trùng lặp các lớp cũ)
  const handleStageImageReplace = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newUrls = files.map((file) => URL.createObjectURL(file));
    setStageImages(newUrls);

    // Tạo đúng 1 bóng đen chính và (nếu tải nhiều hơn 1 ảnh) các layer màu tiếp theo
    const newLayers = newUrls.map((_, idx) => ({
      id: `layer-stage-${Date.now()}-${idx}`,
      imageIndex: idx,
      type: idx === 0 ? 'shadow' : 'color',
      x: idx === 0 ? 0 : ((idx * 60) % 240) - 60,
      y: idx === 0 ? 0 : ((idx * 40) % 160) - 40,
      scale: idx === 0 ? 100 : 75,
      rotation: 0,
      visible: true,
      name: idx === 0 ? 'Bóng Đen (#1)' : `Ảnh Màu #${idx + 1}`
    }));

    setStageLayers(newLayers);
    setSelectedImageIndex(0);
    setSelectedLayerId(newLayers[0]?.id || null);
    e.target.value = '';
  };

  // Upload ảnh dành riêng cho Lớp Sân Khấu (Stage Layers) - Tải THÊM ảnh vào danh sách
  const handleStageImageUpload = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const newUrls = files.map((file) => URL.createObjectURL(file));
    const startIdx = stageImages.length;
    setStageImages(prev => [...prev, ...newUrls]);

    // Tự động tạo thêm layer tương ứng cho các ảnh mới tải lên (mỗi ảnh tải lên chỉ tạo 1 layer duy nhất)
    const addedLayers = newUrls.map((_, i) => {
      const idx = startIdx + i;
      return {
        id: `layer-stage-${Date.now()}-${i}`,
        imageIndex: idx,
        type: 'color',
        x: ((idx * 50) % 300) - 100,
        y: ((idx * 30) % 200) - 50,
        scale: 75,
        rotation: 0,
        visible: true,
        name: `Ảnh sân khấu #${idx + 1}`
      };
    });

    setStageLayers(prev => [...prev, ...addedLayers]);
    setSelectedImageIndex(startIdx);
    e.target.value = '';
  };

  // Xóa ảnh khỏi danh sách sân khấu (cho phép xóa dù chỉ còn 1 cái)
  const handleDeleteStageImage = (e, index) => {
    e.stopPropagation();
    const updated = stageImages.filter((_, i) => i !== index);
    setStageImages(updated);

    // Cập nhật lại các layer: xóa layer dùng ảnh này hoặc remap imageIndex
    setStageLayers(prev => {
      return prev
        .filter(l => l.imageIndex !== index)
        .map(l => ({
          ...l,
          imageIndex: l.imageIndex > index ? l.imageIndex - 1 : l.imageIndex
        }));
    });

    // Chọn lại ảnh hiển thị phù hợp
    setSelectedImageIndex(prev => {
      if (updated.length === 0) return null;
      if (prev >= updated.length) return updated.length - 1;
      return prev;
    });
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

  // Di chuyển lớp lên trên (hiển thị đè lên các lớp khác) hoặc xuống dưới
  const handleMoveLayerOrder = (layerId, direction) => {
    const idx = stageLayers.findIndex(l => l.id === layerId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= stageLayers.length) return;

    const updated = [...stageLayers];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    setStageLayers(updated);
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

  // Tab điều khiển trong sidebar: 'tray' (Ảnh phía trên) | 'stage' (Lớp sân khấu)
  const [sidebarTab, setSidebarTab] = useState('stage');

  // Chế độ xem trong tab Sân Khấu: 'settings' (Cài đặt ảnh & layer) | 'order' (Thứ tự lớp phủ)
  const [stageSubView, setStageSubView] = useState('settings');

  // Ảnh đang được chọn trong sidebar (dùng để hiển cài đặt của ảnh đó)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Nguồn ảnh di chuyển phía dưới: ưu tiên ảnh riêng tải lên (bottomImageCustomUrl), nếu không lấy từ images[bottomImageIndex]
  const activeBottomSrc = bottomImageCustomUrl || images[bottomImageIndex] || images[0];

  const handleUploadBottomImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBottomImageCustomUrl(url);
    setBottomImageVisible(true);
    e.target.value = '';
  };

  // Tìm layer trên sân khấu gắn với ảnh đang chọn (lấy cái đầu tiên nếu có nhiều)
  const selectedImageLayer = stageLayers.find(l => l.imageIndex === selectedImageIndex) || null;

  // Thêm layer mới gắn với ảnh đang chọn
  const handleAddLayerForImage = (imageIndex, type) => {
    const newId = `layer-${Date.now()}`;
    const nameMap = {
      shadow: `Bóng Đen (Ảnh #${imageIndex + 1})`,
      color: `Ảnh Màu #${imageIndex + 1}`,
      movable: `Di Chuyển #${imageIndex + 1}`
    };
    const newLayer = {
      id: newId,
      imageIndex,
      type,
      x: 0,
      y: 0,
      scale: type === 'shadow' ? 100 : 75,
      rotation: 0,
      visible: true,
      name: nameMap[type] || `Layer #${imageIndex + 1}`
    };
    setStageLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newId);
    if (type === 'shadow') setShadowIndex(imageIndex);
  };

  // Update layer theo id cụ thể (không phụ thuộc selectedLayerId)
  const updateLayerById = (id, field, val) => {
    setStageLayers(prev => prev.map(layer =>
      layer.id === id ? { ...layer, [field]: val } : layer
    ));
  };

  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode || stageMode === 'edit' ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      {/* SIDEBAR CÀI ĐẶT (Ẩn khi ở chế độ quay video 9:16 hoặc Kéo Xếp Full) */}
      {!is916Mode && stageMode !== 'edit' && (
        <div className="w-96 bg-slate-800 p-4 border-r border-slate-700 flex flex-col gap-4 overflow-y-auto">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-purple-400 flex items-center gap-1.5">
              👻 GHÉP BÓNG MỞ RỘNG (PRO)
            </h2>
          </div>

          {/* NÚT BẬT CHẾ ĐỘ SẮP XẾP VỊ TRÍ */}
          <button
            onClick={() => setStageMode('edit')}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-950/40 border border-purple-400/30"
          >
            <Move size={15} /> Sắp Xếp Vị Trí (Kéo Thả Trực Tiếp)
          </button>

          {/* 2 TAB: ẢNH PHÍA TRÊN & LỚP SÂN KHẤU */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-700 gap-1">
            <button
              onClick={() => setSidebarTab('tray')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${sidebarTab === 'tray'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              🖼️ Ảnh Phía Trên
            </button>
            <button
              onClick={() => setSidebarTab('stage')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${sidebarTab === 'stage'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              🎭 Lớp Sân Khấu
            </button>
          </div>

          {/* NỘI DUNG TAB 1: ẢNH PHÍA TRÊN */}
          {sidebarTab === 'tray' && (
            <div className="flex flex-col gap-3">
              {/* NÚT BẬT/TẮT TÍNH NĂNG CHỌN PHÍA TRÊN RỒI KÉO XUỐNG DƯỚI */}
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-700 flex items-center justify-between shadow-lg">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    👆 Cho Phép Chọn Kéo Thả
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {trayPickEnabled ? 'Đang bật: Nhấp ảnh khay trên để nhấc ảnh kéo ghép' : 'Đang tắt: Khóa chọn ảnh, không nhấc ảnh khi bấm'}
                  </span>
                </div>
                <button
                  onClick={() => setTrayPickEnabled(!trayPickEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${trayPickEnabled ? 'bg-sky-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  title={trayPickEnabled ? 'Bấm để tắt tính năng nhấc ảnh' : 'Bấm để bật tính năng nhấc ảnh'}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>

              {/* CÁC NÚT UPLOAD ẢNH KHAY TRÊN */}
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center p-2.5 bg-sky-700/80 hover:bg-sky-600 text-white rounded-xl cursor-pointer border border-sky-400/50 text-xs font-bold transition-all shadow-md text-center gap-1 active:scale-98">
                  <div className="flex items-center gap-1.5">
                    <Upload size={14} /> <span>Thay Toàn Bộ Ảnh</span>
                  </div>
                  <span className="text-[10px] text-sky-200 font-normal">Xóa khay cũ, nạp ảnh mới</span>
                  <input type="file" accept="image/*" multiple onChange={handleTrayImagesReplace} className="hidden" />
                </label>

                <label className="flex flex-col items-center justify-center p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl cursor-pointer border border-dashed border-sky-500/60 text-xs font-semibold transition-all shadow-sm text-center gap-1 active:scale-98">
                  <div className="flex items-center gap-1.5 text-sky-300">
                    <Plus size={14} /> <span>Tải Thêm Ảnh</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Thêm vào khay hiện tại</span>
                  <input type="file" accept="image/*" multiple onChange={handleMultipleImageUpload} className="hidden" />
                </label>
              </div>

              {/* Grid sắp xếp thứ tự ảnh khay trên */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Danh sách ảnh trong khay:</span>
                  <span className="text-[10px] text-slate-400">({images.length} ảnh)</span>
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
                      className={`relative h-[72px] rounded-xl overflow-hidden border-2 transition-all group select-none flex items-center justify-center bg-slate-900/80 border-slate-700 hover:border-slate-500 ${draggedImageIndex === i ? 'opacity-40 scale-95' : ''
                        } ${dragOverImageIndex === i && draggedImageIndex !== i ? 'ring-2 ring-sky-400 border-sky-400 scale-105' : ''}`}
                      title={`Kéo thả để đổi thứ tự ảnh #${i + 1}`}
                    >
                      <img src={src} alt={`Ảnh ${i + 1}`} className="w-full h-full object-contain p-1 pointer-events-none select-none" />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded pointer-events-none">
                        #{i + 1}
                      </span>
                      <button
                        onClick={(e) => handleDeleteTrayImage(e, i)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-600/90 hover:bg-rose-500 text-white rounded p-0.5 cursor-pointer shadow-md z-10"
                        title={`Xóa ảnh #${i + 1} khỏi khay`}
                      >
                        <Trash2 size={11} />
                      </button>
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded p-0.5 pointer-events-none">
                        <GripVertical size={10} className="text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <GripVertical size={10} /> Kéo thả thẻ để đổi thứ tự xuất hiện trên khay
                </p>
              </div>

              {/* Cài đặt kích thước, khoảng cách khay */}
              <div className="flex flex-col gap-3 p-4 bg-slate-900/90 rounded-2xl border border-slate-700 shadow-xl">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wide">
                  ⚙️ Căn Chỉnh Khay Ảnh
                </span>
                {[
                  { label: 'Kích thước thẻ', val: trayItemSize, set: setTrayItemSize, min: 40, max: 250, unit: 'px', step: 5 },
                  { label: 'Dãn cách giữa các thẻ', val: trayGap, set: setTrayGap, min: 0, max: 100, unit: 'px', step: 2 },
                  { label: 'Vị trí ngang (X)', val: trayOffsetX, set: setTrayOffsetX, min: 0, max: 1150, unit: 'px', step: 10 },
                  { label: 'Vị trí dọc (Y)', val: trayOffsetY, set: setTrayOffsetY, min: -350, max: 350, unit: 'px', step: 5 },
                ].map(({ label, val, set, min, max, unit, step }) => (
                  <div key={label} className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-semibold">{label}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => set(Math.max(min, val - step))}
                          className="w-7 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center cursor-pointer"
                        >-</button>
                        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md px-2 py-0.5">
                          <input
                            type="number"
                            min={min}
                            max={max}
                            value={val}
                            onChange={(e) => set(Number(e.target.value))}
                            className="w-12 bg-transparent text-sky-300 font-bold text-xs text-center focus:outline-none"
                          />
                          <span className="text-slate-400 text-xs font-bold">{unit}</span>
                        </div>
                        <button
                          onClick={() => set(Math.min(max, val + step))}
                          className="w-7 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center cursor-pointer"
                        >+</button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={val}
                      onChange={(e) => set(Number(e.target.value))}
                      className="accent-sky-400 cursor-pointer h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NỘI DUNG TAB 2: LỚP SÂN KHẤU (ẢNH SÂN KHẤU RIÊNG BIỆT) */}
          {sidebarTab === 'stage' && (
            <div className="flex flex-col gap-3">
              {/* NÚT 1 CHẠM 2 TRẠNG THÁI: SẮP XẾP LỚP PHỦ / THOÁT LỚP PHỦ */}
              <button
                type="button"
                onClick={() => setStageSubView(stageSubView === 'order' ? 'settings' : 'order')}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md border ${stageSubView === 'order'
                    ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white border-amber-400/50 shadow-amber-900/30'
                    : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white border-purple-500/50 shadow-purple-900/30'
                  }`}
              >
                {stageSubView === 'order' ? (
                  <>
                    <X size={15} />
                    <span>Thoát lớp phủ</span>
                  </>
                ) : (
                  <>
                    <Layers size={15} />
                    <span>Sắp xếp lớp phủ ({stageLayers.length})</span>
                  </>
                )}
              </button>

              {/* CHẾ ĐỘ 1: BÌNH THƯỜNG - CÀI ĐẶT ẢNH & THÔNG SỐ LAYER */}
              {stageSubView === 'settings' && (
                <>
                  {/* CÁC NÚT UPLOAD ẢNH SÂN KHẤU */}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col items-center justify-center p-2.5 bg-purple-700/80 hover:bg-purple-600 text-white rounded-xl cursor-pointer border border-purple-400/50 text-xs font-bold transition-all shadow-md text-center gap-1 active:scale-98">
                      <div className="flex items-center gap-1.5">
                        <Upload size={14} /> <span>Thay Mới 1 Ảnh</span>
                      </div>
                      <span className="text-[10px] text-purple-200 font-normal">Xóa lớp cũ, chỉ lấy ảnh này</span>
                      <input type="file" accept="image/*" onChange={handleStageImageReplace} className="hidden" />
                    </label>

                    <label className="flex flex-col items-center justify-center p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl cursor-pointer border border-dashed border-purple-500/60 text-xs font-semibold transition-all shadow-sm text-center gap-1 active:scale-98">
                      <div className="flex items-center gap-1.5 text-purple-300">
                        <Plus size={14} /> <span>Tải Thêm Ảnh</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">Giữ các ảnh hiện tại</span>
                      <input type="file" accept="image/*" multiple onChange={handleStageImageUpload} className="hidden" />
                    </label>
                  </div>

                  {/* DANH SÁCH ẢNH SÂN KHẤU - CLICK ĐỂ CHỌN & CÀI ĐẶT */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300">Chọn ảnh sân khấu để cài đặt:</span>
                      <span className="text-[10px] text-slate-400">({stageImages.length} ảnh)</span>
                    </div>

                    {/* Grid ảnh sân khấu - click để chọn */}
                    <div className="grid grid-cols-3 gap-2">
                      {stageImages.map((src, i) => {
                        const hasShadow = stageLayers.some(l => l.imageIndex === i && l.type === 'shadow');
                        const hasColor = stageLayers.some(l => l.imageIndex === i && l.type === 'color');
                        const hasMovable = stageLayers.some(l => l.imageIndex === i && l.type === 'movable');
                        return (
                          <div
                            key={i}
                            onClick={() => setSelectedImageIndex(i)}
                            className={`relative h-[72px] rounded-xl cursor-pointer overflow-hidden border-2 transition-all group select-none flex items-center justify-center bg-slate-900/80 ${selectedImageIndex === i
                                ? 'border-purple-400 ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/20'
                                : 'border-slate-700 hover:border-slate-500'
                              }`}
                            title={`Ảnh sân khấu #${i + 1} — Click để chọn & cài đặt`}
                          >
                            <img src={src} alt={`Ảnh sân khấu ${i + 1}`} className="w-full h-full object-contain p-1 pointer-events-none select-none" />

                            {/* Số thứ tự */}
                            <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded pointer-events-none">
                              #{i + 1}
                            </span>

                            {/* Nút xóa ảnh sân khấu khi hover */}
                            <button
                              onClick={(e) => handleDeleteStageImage(e, i)}
                              className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-rose-600/90 hover:bg-rose-500 text-white rounded p-0.5 cursor-pointer shadow-md z-10"
                              title={`Xóa ảnh #${i + 1} khỏi danh sách sân khấu`}
                            >
                              <Trash2 size={11} />
                            </button>

                            {/* Badges trạng thái */}
                            <div className="absolute top-1 right-1 flex flex-col gap-0.5 pointer-events-none">
                              {hasShadow && (
                                <span className="bg-purple-600 text-white text-[8px] font-bold px-1 py-px rounded leading-tight" title="Bóng đen">🌑</span>
                              )}
                              {hasColor && (
                                <span className="bg-sky-600 text-white text-[8px] font-bold px-1 py-px rounded leading-tight" title="Ảnh màu">🎨</span>
                              )}
                              {hasMovable && (
                                <span className="bg-emerald-600 text-white text-[8px] font-bold px-1 py-px rounded leading-tight" title="Di chuyển">🚀</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CÀI ĐẶT CHO ẢNH ĐANG CHỌN TRONG SÂN KHẤU */}
                  {typeof selectedImageIndex === 'number' && (stageImages[selectedImageIndex] || images[selectedImageIndex]) && (
                    <div className="flex flex-col gap-3.5 p-4 bg-slate-900/90 rounded-2xl border border-slate-700 shadow-xl">
                      {/* Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                        <img
                          src={stageImages[selectedImageIndex] || images[selectedImageIndex]}
                          alt=""
                          className="w-12 h-12 object-contain bg-slate-800 rounded-xl border border-slate-700 p-1 shadow-inner"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">Ảnh sân khấu #{selectedImageIndex + 1}</span>
                            <div className="flex items-center gap-1.5">
                              {selectedImageLayer && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${selectedImageLayer.type === 'shadow'
                                    ? 'bg-purple-900/60 text-purple-300 border border-purple-700/60'
                                    : selectedImageLayer.type === 'movable'
                                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                                      : 'bg-sky-900/60 text-sky-300 border border-sky-700/60'
                                  }`}>
                                  {selectedImageLayer.type === 'shadow' ? '🌑 Bóng Đen' : selectedImageLayer.type === 'movable' ? '🚀 Di Chuyển' : '🎨 Ảnh Màu'}
                                </span>
                              )}
                              <button
                                onClick={(e) => handleDeleteStageImage(e, selectedImageIndex)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                                title={`Xóa ảnh sân khấu #${selectedImageIndex + 1}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Tùy chỉnh thông số trên sân khấu</p>
                        </div>
                      </div>

                      {/* ── LỚP SÂN KHẤU ── */}
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wide">
                            <Layers size={14} /> Kiểu hiển thị
                          </span>
                          {selectedImageLayer ? (
                            <div className="flex items-center gap-1.5">
                              {/* Nút di chuyển lớp lên trên (nổi lên trên) */}
                              <button
                                onClick={() => handleMoveLayerOrder(selectedImageLayer.id, 'up')}
                                disabled={stageLayers.findIndex(l => l.id === selectedImageLayer.id) === stageLayers.length - 1}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-purple-300 border border-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
                                title="Đưa lớp này lên trên (hiển thị đè lên)"
                              >
                                <ArrowUp size={14} />
                              </button>
                              {/* Nút di chuyển lớp xuống dưới (nằm dưới cùng) */}
                              <button
                                onClick={() => handleMoveLayerOrder(selectedImageLayer.id, 'down')}
                                disabled={stageLayers.findIndex(l => l.id === selectedImageLayer.id) === 0}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-purple-300 border border-slate-700 transition-all cursor-pointer disabled:cursor-not-allowed"
                                title="Đưa lớp này xuống dưới (bị các lớp khác đè lên)"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <div className="w-px h-4 bg-slate-700 mx-0.5" />
                              <button
                                onClick={() => {
                                  const newVisible = !selectedImageLayer.visible;
                                  updateLayerById(selectedImageLayer.id, 'visible', newVisible);
                                }}
                                className={`p-1.5 rounded-lg border transition-all ${selectedImageLayer.visible
                                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                                    : 'bg-rose-950/60 text-rose-400 border-rose-800/80 hover:text-rose-300'
                                  }`}
                                title={selectedImageLayer.visible ? 'Đang hiện — click để ẩn' : 'Đang ẩn — click để hiện'}
                              >
                                {selectedImageLayer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                              <button
                                onClick={() => handleDeleteLayer(selectedImageLayer.id)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-800/60 transition-all cursor-pointer"
                                title="Xóa lớp này khỏi sân khấu"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {selectedImageLayer ? (
                          <div className="flex flex-col gap-3.5">
                            {/* Kiểu hiển thị: Bóng Đen / Ảnh Màu / Di Chuyển */}
                            <div className="grid grid-cols-3 gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
                              <button
                                onClick={() => updateLayerById(selectedImageLayer.id, 'type', 'shadow')}
                                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${selectedImageLayer.type === 'shadow'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50 ring-1 ring-purple-400'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  }`}
                              >
                                🌑 Bóng
                              </button>
                              <button
                                onClick={() => updateLayerById(selectedImageLayer.id, 'type', 'color')}
                                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${selectedImageLayer.type === 'color'
                                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/50 ring-1 ring-sky-400'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  }`}
                              >
                                🎨 Màu
                              </button>
                              <button
                                onClick={() => updateLayerById(selectedImageLayer.id, 'type', 'movable')}
                                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${selectedImageLayer.type === 'movable'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50 ring-1 ring-emerald-400'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  }`}
                              >
                                🚀 Di Chuyển
                              </button>
                            </div>

                            {selectedImageLayer.type === 'movable' && (
                              <div className="text-xs text-emerald-300 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-800/60 flex items-center gap-2">
                                <Move size={14} className="text-emerald-400 shrink-0" />
                                <span>Có thể dùng chuột giữ & kéo di chuyển tự do trên sân khấu.</span>
                              </div>
                            )}

                            {/* Tỉ lệ (Scale) */}
                            <div className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-300 font-semibold">Tỉ lệ kích thước</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => updateLayerById(selectedImageLayer.id, 'scale', Math.max(30, selectedImageLayer.scale - 5))}
                                    className="w-7 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center"
                                  >-</button>
                                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md px-1.5 py-0.5">
                                    <input
                                      type="number"
                                      min="30"
                                      max="200"
                                      value={selectedImageLayer.scale}
                                      onChange={(e) => updateLayerById(selectedImageLayer.id, 'scale', Number(e.target.value))}
                                      className="w-10 bg-transparent text-white font-bold text-xs text-center focus:outline-none"
                                    />
                                    <span className="text-slate-400 text-xs font-bold">%</span>
                                  </div>
                                  <button
                                    onClick={() => updateLayerById(selectedImageLayer.id, 'scale', Math.min(200, selectedImageLayer.scale + 5))}
                                    className="w-7 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center"
                                  >+</button>
                                </div>
                              </div>
                              <input
                                type="range"
                                min="30"
                                max="200"
                                value={selectedImageLayer.scale}
                                onChange={(e) => updateLayerById(selectedImageLayer.id, 'scale', Number(e.target.value))}
                                className="accent-purple-400 cursor-pointer h-2"
                              />
                            </div>

                            {/* Tọa độ X, Y */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-300 font-semibold">Tọa độ X</span>
                                  <input
                                    type="number"
                                    value={selectedImageLayer.x}
                                    onChange={(e) => updateLayerById(selectedImageLayer.id, 'x', Number(e.target.value))}
                                    className="w-14 bg-slate-800 text-white font-bold text-xs text-center rounded-md border border-slate-700 py-1 focus:border-purple-400 focus:outline-none"
                                  />
                                </div>
                                <input
                                  type="range"
                                  min="-500"
                                  max="500"
                                  value={selectedImageLayer.x}
                                  onChange={(e) => updateLayerById(selectedImageLayer.id, 'x', Number(e.target.value))}
                                  className="accent-purple-400 cursor-pointer h-1.5"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-300 font-semibold">Tọa độ Y</span>
                                  <input
                                    type="number"
                                    value={selectedImageLayer.y}
                                    onChange={(e) => updateLayerById(selectedImageLayer.id, 'y', Number(e.target.value))}
                                    className="w-14 bg-slate-800 text-white font-bold text-xs text-center rounded-md border border-slate-700 py-1 focus:border-purple-400 focus:outline-none"
                                  />
                                </div>
                                <input
                                  type="range"
                                  min="-400"
                                  max="400"
                                  value={selectedImageLayer.y}
                                  onChange={(e) => updateLayerById(selectedImageLayer.id, 'y', Number(e.target.value))}
                                  className="accent-purple-400 cursor-pointer h-1.5"
                                />
                              </div>
                            </div>

                            {/* Góc Xoay (Rotation) */}
                            <div className="flex flex-col gap-2.5 p-3 bg-slate-950/60 rounded-xl border border-purple-500/30">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                                  🔄 Góc xoay
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => updateLayerById(selectedImageLayer.id, 'rotation', ((selectedImageLayer.rotation - 5 + 180) % 360) - 180)}
                                    className="w-8 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-bold border border-slate-700 transition-colors"
                                    title="Giảm 5 độ"
                                  >-5°</button>
                                  <div className="flex items-center bg-slate-800 border border-purple-500/60 rounded-md px-2 py-1">
                                    <input
                                      type="number"
                                      min="-180"
                                      max="180"
                                      value={selectedImageLayer.rotation}
                                      onChange={(e) => updateLayerById(selectedImageLayer.id, 'rotation', Number(e.target.value))}
                                      className="w-12 bg-transparent text-purple-300 font-bold text-xs text-center focus:outline-none"
                                    />
                                    <span className="text-purple-400 text-xs font-bold">°</span>
                                  </div>
                                  <button
                                    onClick={() => updateLayerById(selectedImageLayer.id, 'rotation', ((selectedImageLayer.rotation + 5 + 180) % 360) - 180)}
                                    className="w-8 h-7 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-bold border border-slate-700 transition-colors"
                                    title="Tăng 5 độ"
                                  >+5°</button>
                                  <button
                                    onClick={() => updateLayerById(selectedImageLayer.id, 'rotation', 0)}
                                    className="px-2.5 h-7 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md border border-slate-700 transition-colors"
                                    title="Đặt lại góc thẳng 0°"
                                  >
                                    0°
                                  </button>
                                </div>
                              </div>

                              <input
                                type="range"
                                min="-180"
                                max="180"
                                value={selectedImageLayer.rotation}
                                onChange={(e) => updateLayerById(selectedImageLayer.id, 'rotation', Number(e.target.value))}
                                className="accent-purple-400 cursor-pointer h-2"
                              />

                              {/* Các nút góc cố định chuẩn nhanh */}
                              <div className="grid grid-cols-5 gap-1.5 pt-1">
                                {[
                                  { label: '-90°', val: -90 },
                                  { label: '-45°', val: -45 },
                                  { label: '0°', val: 0 },
                                  { label: '45°', val: 45 },
                                  { label: '90°', val: 90 },
                                ].map(({ label, val }) => (
                                  <button
                                    key={label}
                                    onClick={() => updateLayerById(selectedImageLayer.id, 'rotation', val)}
                                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${selectedImageLayer.rotation === val
                                        ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-300'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                                      }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleAddLayerForImage(selectedImageIndex, 'shadow')}
                              className="py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-md"
                            >
                              <Plus size={13} /> Bóng
                            </button>
                            <button
                              onClick={() => handleAddLayerForImage(selectedImageIndex, 'color')}
                              className="py-2.5 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-md"
                            >
                              <Plus size={13} /> Màu
                            </button>
                            <button
                              onClick={() => handleAddLayerForImage(selectedImageIndex, 'movable')}
                              className="py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-md"
                            >
                              <Plus size={13} /> Di chuyển
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* CHẾ ĐỘ 2: THỨ TỰ LỚP PHỦ SÂN KHẤU (Z-INDEX STACK) */}
              {stageSubView === 'order' && (
                <div className="flex flex-col gap-3 p-4 bg-slate-900/90 rounded-2xl border border-slate-700 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <Layers size={14} /> Thứ tự lớp phủ trên sân khấu
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">Lớp ở trên cùng sẽ hiển thị đè lên các lớp phía dưới</p>
                    </div>
                    <span className="text-xs font-bold bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800/80">
                      {stageLayers.length} lớp
                    </span>
                  </div>

                  {stageLayers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Chưa có lớp nào trên sân khấu. Hãy tải ảnh và thêm lớp ở mục Cài Đặt.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {/* Hiển thị từ trên xuống dưới (đảo ngược mảng để lớp hiển thị trên cùng nằm ở đầu danh sách) */}
                      {[...stageLayers].reverse().map((layer, reverseIdx) => {
                        const actualIdx = stageLayers.length - 1 - reverseIdx;
                        const isTop = actualIdx === stageLayers.length - 1;
                        const isBottom = actualIdx === 0;
                        const isThisSelected = selectedImageIndex === layer.imageIndex;
                        const layerImg = stageImages[layer.imageIndex] || images[layer.imageIndex] || images[0];

                        return (
                          <div
                            key={layer.id}
                            onClick={() => {
                              setSelectedImageIndex(layer.imageIndex);
                              setSelectedLayerId(layer.id);
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isThisSelected
                                ? 'bg-purple-900/40 border-purple-500/80 shadow-md ring-1 ring-purple-400/50'
                                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xs font-bold text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/60">
                                #{stageLayers.length - actualIdx}
                              </span>
                              <img
                                src={layerImg}
                                alt=""
                                className="w-9 h-9 object-contain bg-slate-800 rounded-lg border border-slate-700 p-1 shrink-0"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white truncate max-w-[140px]">
                                  {layer.name}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${layer.type === 'shadow'
                                      ? 'bg-purple-900/60 text-purple-300'
                                      : layer.type === 'movable'
                                        ? 'bg-emerald-900/60 text-emerald-300'
                                        : 'bg-sky-900/60 text-sky-300'
                                    }`}>
                                    {layer.type === 'shadow' ? '🌑 Bóng' : layer.type === 'movable' ? '🚀 Di chuyển' : '🎨 Màu'}
                                  </span>
                                  {isTop && (
                                    <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1 rounded border border-amber-800/60">
                                      ★ Trên cùng
                                    </span>
                                  )}
                                  {isBottom && (
                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-900 px-1 rounded">
                                      Dưới cùng
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Nút Đưa lên trên (nổi lên) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveLayerOrder(layer.id, 'up');
                                }}
                                disabled={isTop}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-800 text-purple-300 border border-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Đưa lên trên (hiển thị đè lên các lớp khác)"
                              >
                                <ArrowUp size={14} />
                              </button>
                              {/* Nút Đưa xuống dưới */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveLayerOrder(layer.id, 'down');
                                }}
                                disabled={isBottom}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-slate-800 text-purple-300 border border-slate-700 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Đưa xuống dưới (bị các lớp khác đè lên)"
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setStageSubView('settings')}
                    className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <X size={14} /> Thoát lớp phủ
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Kích thước bàn tay */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Kích Thước Bàn Tay 👆</span>
              <span className="text-white font-bold">{handSize}px</span>
            </div>
            <input type="range" min="24" max="150" value={handSize}
              onChange={(e) => setHandSize(Number(e.target.value))}
              className="accent-purple-400 cursor-pointer h-1.5" />
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
              <Play size={16} /> Khởi Chạy
            </button>
          </div>
        </div>
      )}

      {/* KHU VỰC SÂN KHẤU (FULL MÀN HÌNH KHI Ở CHẾ ĐỘ 9:16 HOẶC KÉO XẾP FULL) */}
      <div
        className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${is916Mode || stageMode === 'edit' ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
          }`}
        onMouseUp={handleMouseUpStage}
      >
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onClick={handleStageClick}
          className={`relative overflow-hidden transition-all duration-300 ${stageMode === 'gameplay' || is916Mode ? 'cursor-none' : 'cursor-default'
            } ${is916Mode || stageMode === 'edit'
              ? 'w-full h-full bg-white flex items-center justify-center'
              : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
            }`}
        >
          {/* Lớp nền sân khấu linh hoạt (thay đổi theo cài đặt người dùng) */}
          <StageBackgroundOverlay />

          {/* THEATER CONTAINER CỐ ĐỊNH 1280x720: TOÀN BỘ KHAY ẢNH VÀ CÁC LAYER NẰM CHUNG 1 HỆ QUY CHIẾU */}
          <div
            ref={theaterRef}
            style={{
              width: `${THEATER_WIDTH}px`,
              height: `${THEATER_HEIGHT}px`,
              transform: `scale(${stageScale})`,
              transformOrigin: 'center center'
            }}
            className={`relative shrink-0 flex items-center justify-center select-none ${stageMode === 'edit' && !is916Mode ? 'ring-2 ring-purple-400/40 rounded-2xl' : ''
              }`}
          >
            {/* 1. KHAY ẢNH GỐC (PHẦN PHÍA TRÊN / KHAY CHỌN ĐỂ KÉO XUỐNG) */}
            <div
              onMouseDown={handleStartDragTray}
              className={`absolute z-30 flex flex-col items-center p-2 rounded-xl transition-all select-none ${stageMode === 'edit' && !is916Mode
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
                    if (stageMode === 'gameplay' && trayPickEnabled) {
                      handlePickItem(i, src);
                    }
                  }}
                  className={`transition-all flex items-center justify-center select-none ${stageMode === 'edit' && !is916Mode
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

            {/* 2. CÁC LỚP HIỂN THỊ PHÍA DƯỚI (STAGE LAYERS: BÓNG ĐEN, ẢNH MÀU, DI CHUYỂN) */}
            {stageLayers.map((layer, idx) => {
              if (!layer.visible) return null;
              const imgUrl = stageImages[layer.imageIndex] || stageImages[0] || images[layer.imageIndex] || images[0];
              if (!imgUrl) return null;

              const isSelected = stageMode === 'edit' && selectedLayerId === layer.id;
              const isMovable = layer.type === 'movable';
              const isDraggingThis = draggingTarget && draggingTarget.type === 'layer' && draggingTarget.layerId === layer.id;
              // z-index cơ bản theo thứ tự mảng stageLayers (idx càng lớn thì càng ở trên), nếu đang kéo thì ưu tiên nổi lên trên cùng (z-35)
              const layerZIndex = isDraggingThis ? 35 : (10 + idx);

              return (
                <div
                  key={layer.id}
                  onMouseDown={(e) => handleStartDragLayer(e, layer)}
                  className={`absolute ${isDraggingThis ? 'transition-none select-none' : isMovable ? 'transition-all duration-75' : 'transition-all duration-300'
                    } ${stageMode === 'edit' || isMovable
                      ? isDraggingThis
                        ? 'cursor-grabbing'
                        : is916Mode
                          ? 'cursor-none'
                          : 'cursor-grab hover:ring-2 hover:ring-purple-400 rounded-2xl'
                      : ''
                    } ${isSelected && !is916Mode ? 'ring-2 ring-purple-500 rounded-2xl' : ''}`}
                  style={{
                    left: `calc(50% + ${layer.x}px)`,
                    top: `calc(50% + ${layer.y}px)`,
                    zIndex: layerZIndex,
                    transform: `translate(-50%, -50%) rotate(${layer.rotation - 90}deg) scale(${layer.scale / 100})`,
                    transformOrigin: 'center center',
                    touchAction: isMovable ? 'none' : 'auto',
                    userSelect: 'none'
                  }}
                  title={
                    stageMode === 'edit'
                      ? `Kéo để di chuyển: ${layer.name}`
                      : isMovable
                        ? `Giữ chuột để di chuyển ảnh tự do: ${layer.name}`
                        : ''
                  }
                >
                  {/* Nhãn hiển thị khi ở chế độ edit */}
                  {isSelected && !is916Mode && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow pointer-events-none whitespace-nowrap z-30 flex items-center gap-1">
                      <Move size={10} /> {layer.name} ({layer.type === 'shadow' ? 'Bóng Đen' : layer.type === 'movable' ? 'Di Chuyển' : 'Đầy Màu'})
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
                      /* HIỂN THỊ DẠNG ẢNH ĐẦY ĐỦ MÀU SẮC (ẢNH MÀU HOẶC DI CHUYỂN) */
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
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)] flex items-center justify-center select-none ${item.isReturning ? 'z-30 pointer-events-none' : 'z-20 cursor-none'
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
            {pickedItem && (() => {
              const matchedShadow = 
                stageLayers.find(l => l.imageIndex === pickedItem.index && l.type === 'shadow') ||
                stageLayers.find(l => (stageImages[l.imageIndex] === pickedItem.src || images[l.imageIndex] === pickedItem.src) && l.type === 'shadow') ||
                stageLayers.find(l => l.type === 'shadow' && l.visible) ||
                stageLayers.find(l => l.type === 'shadow');
              const previewScale = matchedShadow ? (matchedShadow.scale / 100) : 1;
              const previewRotation = matchedShadow ? matchedShadow.rotation : 0;

              return (
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-95 z-40 flex items-center justify-center transition-transform duration-75"
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
                      transform: `rotate(${previewRotation - 90}deg) scale(${previewScale})`,
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
              );
            })()}

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
