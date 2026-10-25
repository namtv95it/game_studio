import React, { useRef, useEffect, useState } from 'react';
import { Upload, Play, Plus, Trash2, Move, RotateCw, ZoomIn, Eye, EyeOff, Layers, GripVertical, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';
import PointerSettingsControl, { getPointerStyle } from './PointerSettingsControl';
import QuestionMarkSettingsControl from './QuestionMarkSettingsControl';
import ShadowStyleSettingsControl, { applyShadowBackgroundToCanvas } from './ShadowStyleSettingsControl';

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
  const [coneSpread, setConeSpread] = useState(initialSettings.coneSpread !== undefined ? initialSettings.coneSpread : 6);
  const [beamStartWidth, setBeamStartWidth] = useState(initialSettings.beamStartWidth ?? 55);
  const [handSize, setHandSize] = useState(initialSettings.handSize ?? 48);
  const [pointerEmoji, setPointerEmoji] = useState(initialSettings.pointerEmoji || '👆');
  const [pointerRotation, setPointerRotation] = useState(initialSettings.pointerRotation ?? -90);
  const [pointerOffsetX, setPointerOffsetX] = useState(initialSettings.pointerOffsetX ?? 0);
  const [pointerOffsetY, setPointerOffsetY] = useState(initialSettings.pointerOffsetY ?? 0);
  const [pointerAnchor, setPointerAnchor] = useState(initialSettings.pointerAnchor || 'tip');
  const [enablePointer, setEnablePointer] = useState(initialSettings.enablePointer ?? true);
  const [globalScale, setGlobalScale] = useState(initialSettings.globalScale ?? 100);
  const [globalOffsetY, setGlobalOffsetY] = useState(initialSettings.globalOffsetY ?? 0);
  // Màu nền của quầng sáng đèn pin (phần không có nhân vật trong vùng chiếu)
  const [beamBgColor, setBeamBgColor] = useState(initialSettings.beamBgColor || '#fef08a');
  const [enableBeamBg, setEnableBeamBg] = useState(initialSettings.enableBeamBg ?? true);
  const [beamOpacity, setBeamOpacity] = useState(initialSettings.beamOpacity ?? 100);

  // Cài đặt Loại Nền Bóng (Shadow Background Style & Pattern)
  const [shadowStyle, setShadowStyle] = useState(initialSettings.shadowStyle || 'pure-black');
  const [shadowPattern, setShadowPattern] = useState(initialSettings.shadowPattern || 'none');
  const [customShadowColor, setCustomShadowColor] = useState(initialSettings.customShadowColor || '#000000');
  const [shadowOpacity, setShadowOpacity] = useState(initialSettings.shadowOpacity ?? 100);



  // Trạng thái Dấu Hỏi Chấm trên bóng đen (mặc định trống để người dùng tự bấm thêm)
  const [enableQuestionMarks, setEnableQuestionMarks] = useState(initialSettings.enableQuestionMarks ?? true);
  const [questionMarks, setQuestionMarks] = useState(initialSettings.questionMarks || []);
  const [qmColor, setQmColor] = useState(initialSettings.qmColor || '#ef4444');
  const [qmDefaultSize, setQmDefaultSize] = useState(initialSettings.qmDefaultSize ?? 48);
  const [qmRandomColor, setQmRandomColor] = useState(initialSettings.qmRandomColor ?? false);
  const [qmRandomSize, setQmRandomSize] = useState(initialSettings.qmRandomSize ?? false);
  const [qmMinSize, setQmMinSize] = useState(initialSettings.qmMinSize ?? 24);
  const [qmMaxSize, setQmMaxSize] = useState(initialSettings.qmMaxSize ?? 80);
  const [isPlacingQm, setIsPlacingQm] = useState(false);

  // Lịch sử Hoàn tác (Undo) và Tiến tới (Redo) cho Dấu Hỏi Chấm
  const [qmHistory, setQmHistory] = useState([initialSettings.questionMarks || []]);
  const [qmHistoryIndex, setQmHistoryIndex] = useState(0);

  const setQuestionMarksWithHistory = (newMarks) => {
    const updated = typeof newMarks === 'function' ? newMarks(questionMarks) : newMarks;
    setQuestionMarks(updated);
    setQmHistory((prev) => {
      const trimmed = prev.slice(0, qmHistoryIndex + 1);
      return [...trimmed, updated];
    });
    setQmHistoryIndex((prev) => prev + 1);
  };

  const handleUndoQm = () => {
    if (qmHistoryIndex > 0) {
      const prevIdx = qmHistoryIndex - 1;
      setQmHistoryIndex(prevIdx);
      setQuestionMarks(qmHistory[prevIdx]);
    }
  };

  const handleRedoQm = () => {
    if (qmHistoryIndex < qmHistory.length - 1) {
      const nextIdx = qmHistoryIndex + 1;
      setQmHistoryIndex(nextIdx);
      setQuestionMarks(qmHistory[nextIdx]);
    }
  };

  const handleClearAllQm = () => {
    setQuestionMarksWithHistory([]);
  };

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, rawX: -100, rawY: -100 });
  const [lockPointerToCenter, setLockPointerToCenter] = useState(false);
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  // Kéo thả trực tiếp trên sân khấu
  const [draggingItemId, setDraggingItemId] = useState(null);
  const dragStartRef = useRef({ canvasX: 0, canvasY: 0, itemInitX: 0, itemInitY: 0 });

  // Drag & drop để sắp xếp z-index trong sidebar
  const [draggedListIdx, setDraggedListIdx] = useState(null);
  const [dragOverListIdx, setDragOverListIdx] = useState(null);

  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  // Accordion state (mở cái này thì đóng cái kia)
  const [activeSection, setActiveSection] = useState('layers');

  const toggleSection = (key) => {
    setActiveSection((prev) => (prev === key ? null : key));
  };

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
        beamStartWidth,
        handSize,
        pointerEmoji,
        pointerRotation,
        pointerOffsetX,
        pointerOffsetY,
        pointerAnchor,
        enablePointer,
        globalScale,
        globalOffsetY,
        beamBgColor,
        enableBeamBg,
        beamOpacity,
        enableQuestionMarks,
        questionMarks,
        qmColor,
        qmDefaultSize,
        qmRandomColor,
        qmRandomSize,
        qmMinSize,
        qmMaxSize,
        shadowStyle,
        customShadowColor,
        shadowOpacity
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt MultiFlashlight:', e);
    }
  }, [items, radius, spotlightType, beamAngle, coneSpread, beamStartWidth, handSize, pointerEmoji, pointerRotation, pointerOffsetX, pointerOffsetY, pointerAnchor, enablePointer, globalScale, globalOffsetY, beamBgColor, enableBeamBg, beamOpacity, enableQuestionMarks, questionMarks, qmColor, qmDefaultSize, qmRandomColor, qmRandomSize, qmMinSize, qmMaxSize, shadowStyle, customShadowColor, shadowOpacity]);

  // Phím ESC để thoát 9:16 & sự kiện Khởi Chạy từ Header
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        setIs916Mode(false);
      }
    };
    const handleLaunch = () => {
      setStageMode('flashlight');
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('app:launch-916', handleLaunch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('app:launch-916', handleLaunch);
    };
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

  // Cố định con trỏ vào chính giữa sân khấu để người dùng dễ quan sát và kéo chỉnh
  const centerCursor = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const rawX = containerRect.width / 2;
    const rawY = containerRect.height / 2;

    let canvasX = 270;
    let canvasY = 480;
    if (canvasRef.current) {
      canvasX = canvasRef.current.width / 2;
      canvasY = canvasRef.current.height / 2;
    }
    setCursorPos({ x: canvasX, y: canvasY, rawX, rawY });
  };

  useEffect(() => {
    if (lockPointerToCenter) {
      centerCursor();
      const handleResize = () => centerCursor();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [lockPointerToCenter, is916Mode]);

  // Handle Mouse Move: Tính toán ma trận đồng bộ 100% khi nằm ngang 90deg
  const handleMouseMove = (e) => {
    const { canvasX, canvasY, rawX, rawY } = getCanvasCoords(e);
    if (!lockPointerToCenter) {
      setCursorPos({ x: canvasX, y: canvasY, rawX, rawY });
    }

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

  // Nhấp chuột vào sân khấu để thêm hoặc xóa dấu ? khi đang ở chế độ Đặt Dấu ?
  const handleStageClick = (e) => {
    if (is916Mode || !isPlacingQm) return;
    const { canvasX, canvasY } = getCanvasCoords(e);
    const roundX = Math.round(canvasX);
    const roundY = Math.round(canvasY);

    const existingIdx = questionMarks.findIndex(
      (qm) => Math.hypot(qm.x - roundX, qm.y - roundY) < Math.max(25, (qm.size || qmDefaultSize) / 2)
    );

    if (existingIdx !== -1) {
      setQuestionMarksWithHistory((prev) => prev.filter((_, idx) => idx !== existingIdx));
    } else {
      let calculatedSize = qmDefaultSize;
      if (qmRandomSize) {
        const vMin = Math.min(qmMinSize, qmMaxSize);
        const vMax = Math.max(qmMinSize, qmMaxSize);
        calculatedSize = Math.floor(Math.random() * (vMax - vMin + 1)) + vMin;
      }

      let calculatedColor = undefined;
      if (qmRandomColor) {
        const colorPalette = ['#ef4444', '#facc15', '#f97316', '#ffffff', '#06b6d4', '#22c55e', '#a855f7', '#f472b6', '#3b82f6'];
        calculatedColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      }

      const newQm = {
        id: `mqm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        x: roundX,
        y: roundY,
        size: calculatedSize,
        ...(calculatedColor ? { color: calculatedColor } : {})
      };
      setQuestionMarksWithHistory((prev) => [...prev, newQm]);
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

    // BƯỚC 2: Phủ lớp Nền Bóng (Màu trơn, Gradient, Pattern, Tùy chỉnh) CHỈ lên các khu vực có ảnh PNG
    ctx.globalCompositeOperation = 'source-in';
    applyShadowBackgroundToCanvas(ctx, width, height, shadowStyle, customShadowColor, shadowOpacity, shadowPattern);

    // BƯỚC 2.5: Vẽ các Dấu Hỏi Chấm '?' lên bóng đen (chỉ trên diện tích có bóng đen)
    if (enableQuestionMarks && questionMarks.length > 0) {
      ctx.globalCompositeOperation = 'source-over';
      questionMarks.forEach((qm) => {
        const qmSize = qm.size || qmDefaultSize;
        const markColor = qm.color || qmColor;
        ctx.save();
        ctx.font = `900 ${qmSize}px "Arial Black", "Arial", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Viền rực rỡ và đổ bóng nhẹ
        ctx.fillStyle = markColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;
        ctx.fillText('?', qm.x, qm.y);
        ctx.restore();
      });
    }

    // BƯỚC 3 & 4: Đục thủng vệt sáng Đèn Pin SẮC NÉT (chỉ khi ở chế độ Soi Đèn và KHÔNG ở chế độ đặt dấu hỏi ?, hoặc khi quay video 9:16)
    if (((stageMode === 'flashlight' && !isPlacingQm) || is916Mode)) {
      const createBeamPath = (c) => {
        c.beginPath();
        if (spotlightType === 'circle') {
          c.arc(cursorPos.x, cursorPos.y, radius, 0, Math.PI * 2);
        } else {
          const centerRad = (beamAngle * Math.PI) / 180;
          const halfSpreadRad = ((coneSpread / 2) * Math.PI) / 180;
          const length = Math.max(width, height) * 3;

          const canvasRect = canvasRef.current?.getBoundingClientRect();
          const scaleToCanvas = canvasRect && canvasRect.width > 0 ? (height / canvasRect.width) : 1;
          const hwCanvas = ((beamStartWidth || 55) / 2) * scaleToCanvas;

          const perpX = -Math.sin(centerRad);
          const perpY = Math.cos(centerRad);

          const p1x = cursorPos.x - hwCanvas * perpX;
          const p1y = cursorPos.y - hwCanvas * perpY;
          const p2x = cursorPos.x + hwCanvas * perpX;
          const p2y = cursorPos.y + hwCanvas * perpY;

          const angle1 = centerRad - halfSpreadRad;
          const angle2 = centerRad + halfSpreadRad;

          const q1x = p1x + Math.cos(angle1) * length;
          const q1y = p1y + Math.sin(angle1) * length;
          const q2x = p2x + Math.cos(angle2) * length;
          const q2y = p2y + Math.sin(angle2) * length;

          c.moveTo(p1x, p1y);
          c.lineTo(q1x, q1y);
          c.lineTo(q2x, q2y);
          c.lineTo(p2x, p2y);
          c.closePath();
        }
      };

      // Đục thủng lớp bóng tại vị trí đèn rọi
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000000';
      createBeamPath(ctx);
      ctx.fill();
      ctx.restore();

      // BƯỚC 4: Vẽ lại Ảnh của toàn bộ nhân vật CHỈ TRONG VÙNG ĐÈN RỌI
      ctx.save();
      ctx.globalCompositeOperation = 'destination-over';
      createBeamPath(ctx);
      ctx.clip();
      drawAllColorImages(ctx, width, height);
      ctx.restore();
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [cursorPos, radius, spotlightType, beamAngle, coneSpread, beamStartWidth, items, is916Mode, globalScale, globalOffsetY, stageMode, beamBgColor, enableBeamBg, beamOpacity, enableQuestionMarks, questionMarks, qmColor, qmDefaultSize, isPlacingQm, shadowStyle, shadowPattern, customShadowColor, shadowOpacity]);

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
    const nextItems = items.filter((item) => item.id !== id);
    setItems(nextItems);
    if (selectedItemId === id) {
      setSelectedItemId(nextItems[0]?.id || null);
    }
  };

  // Xóa tất cả ảnh
  const handleClearAllItems = () => {
    if (items.length === 0) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ ảnh trong danh sách?')) {
      setItems([]);
      setSelectedItemId(null);
      loadedImagesRef.current = {};
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
        <div className="w-88 bg-slate-800 p-4 pb-24 border-r border-slate-700 flex flex-col gap-3.5 overflow-y-auto custom-scrollbar">
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
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${stageMode === 'edit'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <Move size={14} /> Kéo Xếp Vị Trí
            </button>
            <button
              onClick={() => setStageMode('flashlight')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${stageMode === 'flashlight'
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

          {/* NHÓM 1: QUẢN LÝ LỚP ẢNH (LAYERS) */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => toggleSection('layers')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">📚</span>
                <span className="text-xs font-bold text-sky-300">Quản Lý Lớp Ảnh (Layers)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {items.length} lớp
                </span>
                {activeSection === 'layers' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'layers' && (
              <div className="p-3 flex flex-col gap-2.5 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-0.5">
                  <span className="flex items-center gap-1"><Layers size={13} /> Kéo để xếp thứ tự hiển thị:</span>
                  {items.length > 0 && (
                    <button
                      onClick={handleClearAllItems}
                      className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                      title="Xóa tất cả ảnh trong danh sách"
                    >
                      <Trash2 size={11} /> Xóa hết
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-dashed border-slate-700">
                      Chưa có ảnh nào. Bấm <b>"Thêm Nhiều Ảnh (.PNG)"</b> để tải ảnh lên.
                    </div>
                  ) : (
                    items.map((item, idx) => {
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
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${isSelected
                              ? 'bg-sky-900/40 border-sky-400 ring-1 ring-sky-400/50 shadow-md'
                              : 'bg-slate-950/60 border-slate-700 hover:border-slate-500'
                            } ${draggedListIdx === idx ? 'opacity-40 border-dashed' : ''} ${dragOverListIdx === idx ? 'ring-2 ring-sky-400 border-sky-400 scale-102' : ''
                            }`}
                        >
                          <GripVertical size={14} className="text-slate-500 hover:text-slate-300 cursor-grab" />

                          <div className="w-8 h-8 rounded bg-slate-950 p-0.5 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
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
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* NHÓM 2: TINH CHỈNH ẢNH ĐANG CHỌN */}
          {selectedItem && (
            <div className="bg-slate-900/50 rounded-xl border border-sky-500/30 overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleSection('selected')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between bg-sky-950/40 hover:bg-sky-900/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎯</span>
                  <span className="text-xs font-bold text-sky-300 truncate max-w-[150px]">{selectedItem.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-sky-400 font-mono">
                    {selectedItem.scale}% • {selectedItem.rotation}°
                  </span>
                  {activeSection === 'selected' ? <ChevronUp size={15} className="text-sky-400" /> : <ChevronDown size={15} className="text-sky-400" />}
                </div>
              </button>

              {activeSection === 'selected' && (
                <div className="p-3 flex flex-col gap-2.5 border-t border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Tọa độ vị trí:</span>
                    <span className="font-mono text-sky-300">X: {selectedItem.x}px | Y: {selectedItem.y}px</span>
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
            </div>
          )}

          {/* NHÓM 3: HIỆU ỨNG ĐÈN PIN & SÂN KHẤU */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => toggleSection('flashlight')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🔦</span>
                <span className="text-xs font-bold text-sky-300">Hiệu Ứng Đèn Pin</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {radius}px • {spotlightType === 'circle' ? 'Tròn' : 'Nón'}
                </span>
                {activeSection === 'flashlight' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'flashlight' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                {/* 📌 CHECKBOX CỐ ĐỊNH CON TRỎ / ĐÈN PIN VÀO TÂM */}
                <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                  lockPointerToCenter
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-500'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={lockPointerToCenter}
                      onChange={(e) => setLockPointerToCenter(e.target.checked)}
                      className="accent-amber-400 cursor-pointer w-4 h-4 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-amber-300">
                        <span>📌</span> Cố định đèn pin vào tâm
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Khóa đèn ở giữa sân khấu để dễ kéo thanh trượt căn chỉnh
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    lockPointerToCenter ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {lockPointerToCenter ? 'Khóa Tâm' : 'Tự do'}
                  </span>
                </label>

                {/* Spotlight Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-medium">Kiểu Chiếu Đèn:</label>
                  <select
                    value={spotlightType}
                    onChange={(e) => setSpotlightType(e.target.value)}
                    className="p-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-sky-400 text-xs outline-none cursor-pointer"
                  >
                    <option value="circle">🔵 Vệt Sáng Tròn</option>
                    <option value="cone">📐 Vệt Nón Chiếu Chéo</option>
                  </select>
                </div>

                {/* Radius */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Bán Kính Vệt Sáng:</span>
                    <span className="text-white font-mono">{radius}px</span>
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

                {/* Cone details */}
                {spotlightType === 'cone' && (
                  <div className="flex flex-col gap-2.5 p-2.5 bg-slate-950/40 rounded-xl border border-sky-500/20">
                    {/* Hướng Chiếu Beam Angle */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Hướng Chiếu:</span>
                        <div className="flex items-center gap-1 font-mono text-white text-xs">
                          <input
                            type="number"
                            min="-180"
                            max="180"
                            value={beamAngle}
                            onChange={(e) => setBeamAngle(Number(e.target.value))}
                            className="w-12 px-1 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400"
                          />
                          <span>°</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[-135, -90, -45, 0, 45, 90, 135].map((deg) => (
                          <button
                            key={deg}
                            type="button"
                            onClick={() => setBeamAngle(deg)}
                            className={`flex-1 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                              beamAngle === deg
                                ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {deg}°
                          </button>
                        ))}
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

                    {/* Độ Mở (Góc Loe) - Hỗ trợ song song tuyệt đối 0° */}
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-sky-300">Độ Mở (Góc Loe):</span>
                        <div className="flex items-center gap-1 font-mono text-white text-xs">
                          <input
                            type="number"
                            min="0"
                            max="120"
                            value={coneSpread}
                            onChange={(e) => setConeSpread(Number(e.target.value))}
                            className="w-12 px-1 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400"
                          />
                          <span>°</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[
                          { label: '0° Song song', val: 0 },
                          { label: '4° Gần song song', val: 4 },
                          { label: '15° Hẹp', val: 15 },
                          { label: '35° Vừa', val: 35 }
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setConeSpread(item.val)}
                            className={`flex-1 py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                              coneSpread === item.val
                                ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold shadow'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        value={coneSpread}
                        onChange={(e) => setConeSpread(Number(e.target.value))}
                        className="accent-sky-400 cursor-pointer h-1.5"
                      />
                    </div>

                    {/* Bề Rộng Gốc Đèn (Gốc To, Không Nhọn) */}
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-sky-300">Bề Rộng Gốc Đèn (Không Nhọn):</span>
                        <div className="flex items-center gap-1 font-mono text-white text-xs">
                          <input
                            type="number"
                            min="0"
                            max="300"
                            value={beamStartWidth}
                            onChange={(e) => setBeamStartWidth(Number(e.target.value))}
                            className="w-12 px-1 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400"
                          />
                          <span>px</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[
                          { label: '0px (Nhọn)', val: 0 },
                          { label: '35px (Vừa)', val: 35 },
                          { label: '55px (Chuẩn)', val: 55 },
                          { label: '85px (To)', val: 85 }
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setBeamStartWidth(item.val)}
                            className={`flex-1 py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                              beamStartWidth === item.val
                                ? 'bg-sky-500/30 border-sky-400 text-sky-200 font-bold shadow'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={beamStartWidth}
                        onChange={(e) => setBeamStartWidth(Number(e.target.value))}
                        className="accent-sky-400 cursor-pointer h-1.5"
                      />
                    </div>
                  </div>
                )}

                {/* Màu Quầng Sáng Đèn Pin */}
                <div className="flex flex-col gap-2 p-2.5 bg-slate-950/40 rounded-xl border border-sky-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                    <span>Màu Quầng Sáng Đèn:</span>
                    <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer font-normal">
                      <input
                        type="checkbox"
                        checked={enableBeamBg}
                        onChange={(e) => setEnableBeamBg(e.target.checked)}
                        className="accent-sky-400 cursor-pointer"
                      />
                      <span>Đổi màu quầng</span>
                    </label>
                  </div>

                  {enableBeamBg && (
                    <div className="flex flex-col gap-2 pt-1 border-t border-slate-800 mt-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Màu ánh đèn:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={beamBgColor}
                            onChange={(e) => setBeamBgColor(e.target.value)}
                            className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                          />
                          <span className="text-xs font-mono text-white uppercase">{beamBgColor}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Độ đậm:</span>
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
                            className={`w-4 h-4 rounded-full border transition-transform hover:scale-125 cursor-pointer shadow-sm ${
                              beamBgColor.toLowerCase() === preset.color.toLowerCase()
                                ? 'ring-1 ring-sky-400 scale-110 border-white'
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

                {/* Global Scale & Offset Y */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400">Toàn cảnh: {globalScale}%</span>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={globalScale}
                      onChange={(e) => setGlobalScale(Number(e.target.value))}
                      className="accent-sky-400 cursor-pointer h-1.5"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400">Dọc (Y): {globalOffsetY}px</span>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={globalOffsetY}
                      onChange={(e) => setGlobalOffsetY(Number(e.target.value))}
                      className="accent-sky-400 cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NHÓM MỚI: MÀU NỀN BÓNG NHÂN VẬT (SHADOW BACKGROUND STYLE) */}
          <div className="bg-slate-900/50 rounded-xl border border-sky-500/30 overflow-hidden shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => toggleSection('shadowStyle')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🎨</span>
                <span className="text-xs font-bold text-sky-300">Màu Nền Bóng Nhân Vật</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-slate-500 shadow-sm"
                  style={{
                    backgroundColor: shadowStyle === 'custom-color' ? customShadowColor : '#000000'
                  }}
                />
                {activeSection === 'shadowStyle' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'shadowStyle' && (
              <div className="p-3.5 border-t border-slate-800">
                <ShadowStyleSettingsControl
                  shadowStyle={shadowStyle}
                  setShadowStyle={setShadowStyle}
                  shadowPattern={shadowPattern}
                  setShadowPattern={setShadowPattern}
                  customShadowColor={customShadowColor}
                  setCustomShadowColor={setCustomShadowColor}
                  shadowOpacity={shadowOpacity}
                  setShadowOpacity={setShadowOpacity}
                  themeColor="sky"
                />
              </div>
            )}
          </div>

          {/* NHÓM: CON TRỎ & BÀN TAY CHỈ (ACCORDION MỚI) */}
          <PointerSettingsControl
            isOpen={activeSection === 'pointer'}
            onToggle={() => toggleSection('pointer')}
            isAccordion={true}
            pointerEmoji={pointerEmoji}
            setPointerEmoji={setPointerEmoji}
            pointerSize={handSize}
            setPointerSize={setHandSize}
            pointerRotation={pointerRotation}
            setPointerRotation={setPointerRotation}
            pointerOffsetX={pointerOffsetX}
            setPointerOffsetX={setPointerOffsetX}
            pointerOffsetY={pointerOffsetY}
            setPointerOffsetY={setPointerOffsetY}
            pointerAnchor={pointerAnchor}
            setPointerAnchor={setPointerAnchor}
            enablePointer={enablePointer}
            setEnablePointer={setEnablePointer}
            lockPointerToCenter={lockPointerToCenter}
            setLockPointerToCenter={setLockPointerToCenter}
            themeColor="sky"
          />

          {/* NHÓM: DẤU HỎI CHẤM TRÊN BÓNG ĐEN (?) */}
          <div className="bg-slate-900/50 rounded-xl border border-rose-500/30 overflow-hidden shadow-sm shrink-0">
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
              <QuestionMarkSettingsControl
                enableQuestionMarks={enableQuestionMarks}
                setEnableQuestionMarks={setEnableQuestionMarks}
                questionMarks={questionMarks}
                setQuestionMarksWithHistory={setQuestionMarksWithHistory}
                canUndo={qmHistoryIndex > 0}
                canRedo={qmHistoryIndex < qmHistory.length - 1}
                onUndo={handleUndoQm}
                onRedo={handleRedoQm}
                qmColor={qmColor}
                setQmColor={setQmColor}
                qmDefaultSize={qmDefaultSize}
                setQmDefaultSize={setQmDefaultSize}
                qmRandomColor={qmRandomColor}
                setQmRandomColor={setQmRandomColor}
                qmRandomSize={qmRandomSize}
                setQmRandomSize={setQmRandomSize}
                qmMinSize={qmMinSize}
                setQmMinSize={setQmMinSize}
                qmMaxSize={qmMaxSize}
                setQmMaxSize={setQmMaxSize}
                isPlacingQm={isPlacingQm}
                setIsPlacingQm={setIsPlacingQm}
                onClearAll={handleClearAllQm}
                themeColor="rose"
              />
            )}
          </div>



        </div>
      )}

      {/* SÂN KHẤU CANVAS TRÌNH CHIẾU */}
      <div
        className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
          }`}
        onMouseUp={handleMouseUpStage}
      >
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onClick={handleStageClick}
          className={`relative overflow-hidden transition-all duration-300 ${
            isPlacingQm && !is916Mode
              ? 'cursor-crosshair'
              : stageMode === 'flashlight' || is916Mode
                ? 'cursor-none'
                : 'cursor-default'
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

          {/* BANNER THÔNG BÁO KHI ĐANG CỐ ĐỊNH CON TRỎ Ở TÂM */}
          {lockPointerToCenter && !is916Mode && !isPlacingQm && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-950/90 text-amber-200 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-amber-500/50 shadow-2xl backdrop-blur-sm z-40 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Đang cố định con trỏ ở tâm</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLockPointerToCenter(false); }}
                className="ml-1 text-[10px] px-2 py-0.5 bg-amber-800 hover:bg-amber-700 text-white rounded cursor-pointer transition-colors"
                title="Bấm để mở khóa theo chuột"
              >
                Mở khóa
              </button>
            </div>
          )}
          {/* Lớp nền sân khấu linh hoạt (thay đổi theo cài đặt người dùng) */}
          <StageBackgroundOverlay />

          {/* QUẦNG SÁNG ĐÈN PIN NỀN TRÊN CONTAINER (Không bao giờ bị cắt viền do mép canvas) - Tắt khi đang đặt dấu ? */}
          {(stageMode === 'flashlight' || is916Mode || lockPointerToCenter) && (!isPlacingQm || is916Mode) && enableBeamBg && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
              style={{ opacity: Math.max(0, Math.min(1, beamOpacity / 100)) }}
            >
              {spotlightType === 'circle' ? (
                <circle
                  cx={cursorPos.rawX}
                  cy={cursorPos.rawY}
                  r={radius * ((globalScale / 100) * (is916Mode ? 1.25 : 0.95))}
                  fill={beamBgColor}
                />
              ) : (() => {
                const effectiveR = Math.max(1600, radius * 10);
                const containerAngle = ((beamAngle - 90) * Math.PI) / 180;
                const halfSpread = ((coneSpread / 2) * Math.PI) / 180;
                const hw = (beamStartWidth || 55) / 2;

                const perpX = -Math.sin(containerAngle);
                const perpY = Math.cos(containerAngle);

                const p1x = cursorPos.rawX - hw * perpX;
                const p1y = cursorPos.rawY - hw * perpY;
                const p2x = cursorPos.rawX + hw * perpX;
                const p2y = cursorPos.rawY + hw * perpY;

                const a1 = containerAngle - halfSpread;
                const a2 = containerAngle + halfSpread;

                const q1x = p1x + Math.cos(a1) * effectiveR;
                const q1y = p1y + Math.sin(a1) * effectiveR;
                const q2x = p2x + Math.cos(a2) * effectiveR;
                const q2y = p2y + Math.sin(a2) * effectiveR;

                return (
                  <path
                    d={`M ${p1x} ${p1y} L ${q1x} ${q1y} L ${q2x} ${q2y} L ${p2x} ${p2y} Z`}
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
              transform: `rotate(-90deg) scale(${(globalScale / 100) * (is916Mode ? 1.25 : 0.95)})`,
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
                    className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing flex items-center justify-center transition-shadow group ${isSelected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-black/50' : 'hover:ring-1 hover:ring-sky-300'
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

          {/* HAND / EMOJI CURSOR OVERLAY (Chỉ hiển thị khi bật và ở chế độ Soi Đèn và KHÔNG ở chế độ đặt dấu ?, hoặc khi quay video 9:16, hoặc khi đang cố định tâm để căn chỉnh) */}
          {enablePointer && (stageMode === 'flashlight' || is916Mode || lockPointerToCenter) && (!isPlacingQm || is916Mode) && (
            <div
              className="absolute pointer-events-none select-none z-30 transition-transform"
              style={getPointerStyle({
                x: cursorPos.rawX,
                y: cursorPos.rawY,
                size: handSize,
                rotation: pointerRotation,
                offsetX: pointerOffsetX,
                offsetY: pointerOffsetY,
                anchor: pointerAnchor
              })}
            >
              {pointerEmoji || '👆'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
