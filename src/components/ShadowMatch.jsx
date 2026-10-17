import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Play, GripVertical, Move, Sparkles, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';
import PointerSettingsControl, { getPointerStyle } from './PointerSettingsControl';
import QuestionMarkSettingsControl from './QuestionMarkSettingsControl';

const POKEMON_IMAGES = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', // Pikachu PNG
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',  // Charmander PNG
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png'   // Squirtle PNG
];

const STORAGE_KEY = 'shadow_game_settings_v3';

// Danh sách các loại nền bóng (Shadow Background Styles)
export const SHADOW_STYLE_PRESETS = [
  { id: 'pure-black', name: 'Đen Tuyệt Đối', type: 'color', color: '#000000', label: 'Bóng Đen Chuẩn' },
  { id: 'charcoal', name: 'Than Chì', type: 'color', color: '#1e293b', label: 'Xám Than Đậm' },
  { id: 'deep-navy', name: 'Xanh Đêm Sâu', type: 'color', color: '#0f172a', label: 'Navy Huyền Bí' },
  { id: 'crimson', name: 'Đỏ Thẫm', type: 'color', color: '#881337', label: 'Bóng Đỏ Ma Mị' },
  { id: 'deep-purple', name: 'Tím Đậm', type: 'color', color: '#4c1d95', label: 'Bóng Tím Ảo Ảnh' },
  { id: 'emerald', name: 'Xanh Rêu Đậm', type: 'color', color: '#064e3b', label: 'Bóng Rừng Đêm' },
  { id: 'grad-dark-violet', name: 'Gradient Đen Tím', type: 'gradient', colors: ['#0f051d', '#3b0764', '#0f051d'], label: 'Tím Huyền Bí' },
  { id: 'grad-fire', name: 'Gradient Hỏa Băng', type: 'gradient', colors: ['#450a0a', '#b91c1c', '#7f1d1d'], label: 'Lửa Đỏ Rực' },
  { id: 'grad-cyber', name: 'Gradient Cyber', type: 'gradient', colors: ['#030712', '#1e1b4b', '#083344'], label: 'Cyberpunk Đêm' },
  { id: 'grad-neon-gold', name: 'Gradient Hoàng Kim', type: 'gradient', colors: ['#1c1917', '#78350f', '#b45309'], label: 'Ánh Kim Vàng' },
  { id: 'grad-silver', name: 'Gradient Kim Loại', type: 'gradient', colors: ['#0f172a', '#475569', '#1e293b'], label: 'Bạc Kim Loại' },
  { id: 'pattern-dots', name: 'Chấm Bi Huyền Bí', type: 'pattern', pattern: 'dots', color: '#000000', dotColor: '#38bdf8', label: 'Chấm Bi Công Nghệ' },
  { id: 'pattern-stripes', name: 'Sọc Chéo Bí Ẩn', type: 'pattern', pattern: 'stripes', color: '#0f172a', stripeColor: '#a855f7', label: 'Sọc Chéo Bí Ẩn' },
  { id: 'custom-color', name: 'Tùy Chỉnh Màu', type: 'color', color: '#000000', label: 'Màu Tự Chọn' }
];

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
  const [pointerEmoji, setPointerEmoji] = useState(initialSettings.pointerEmoji || '👆');
  const [pointerRotation, setPointerRotation] = useState(initialSettings.pointerRotation ?? -90);
  const [pointerOffsetX, setPointerOffsetX] = useState(initialSettings.pointerOffsetX ?? 0);
  const [pointerOffsetY, setPointerOffsetY] = useState(initialSettings.pointerOffsetY ?? 0);
  const [pointerAnchor, setPointerAnchor] = useState(initialSettings.pointerAnchor || 'tip');
  const [enablePointer, setEnablePointer] = useState(initialSettings.enablePointer ?? true);
  const [targetScale, setTargetScale] = useState(initialSettings.targetScale ?? 100);
  const [targetOffsetY, setTargetOffsetY] = useState(initialSettings.targetOffsetY ?? 0);

  // Cài đặt Loại Nền Bóng (Shadow Background Style)
  const [shadowStyle, setShadowStyle] = useState(initialSettings.shadowStyle || 'pure-black');
  const [customShadowColor, setCustomShadowColor] = useState(initialSettings.customShadowColor || '#000000');
  const [shadowOpacity, setShadowOpacity] = useState(initialSettings.shadowOpacity ?? 100);

  const THEATER_WIDTH = 1280;
  const THEATER_HEIGHT = 720;

  // Cài đặt khay ảnh thu nhỏ
  const [trayOffsetX, setTrayOffsetX] = useState(initialSettings.trayOffsetX ?? 112);
  const [trayOffsetY, setTrayOffsetY] = useState(initialSettings.trayOffsetY ?? 0);
  const [trayItemSize, setTrayItemSize] = useState(initialSettings.trayItemSize ?? 80);
  const [trayGap, setTrayGap] = useState(initialSettings.trayGap ?? 24);

  // Trạng thái Dấu Hỏi Chấm trên bóng đen
  const [enableQuestionMarks, setEnableQuestionMarks] = useState(initialSettings.enableQuestionMarks ?? false);
  const [questionMarks, setQuestionMarks] = useState(initialSettings.questionMarks || []);
  const [qmColor, setQmColor] = useState(initialSettings.qmColor || '#ef4444');
  const [qmDefaultSize, setQmDefaultSize] = useState(initialSettings.qmDefaultSize ?? 48);
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

  // Trạng thái thu gọn Accordion của sidebar (mở mục 'images' mặc định)
  const [activeSection, setActiveSection] = useState('images');
  const toggleSection = (key) => {
    setActiveSection((prev) => (prev === key ? null : key));
  };

  // States for Interactivity
  const [pickedItem, setPickedItem] = useState(null); // { index, src }
  const [placedItems, setPlacedItems] = useState([]); // [{ index, src, x, y, width, height }]
  const [cursorPos, setCursorPos] = useState({ x: 640, y: 360 });
  const [lockPointerToCenter, setLockPointerToCenter] = useState(false);
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  useEffect(() => {
    if (lockPointerToCenter) {
      setCursorPos({ x: THEATER_WIDTH / 2, y: THEATER_HEIGHT / 2 });
    }
  }, [lockPointerToCenter]);

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
        pointerEmoji,
        pointerRotation,
        pointerOffsetX,
        pointerOffsetY,
        pointerAnchor,
        enablePointer,
        targetScale,
        targetOffsetY,
        trayOffsetX,
        trayOffsetY,
        trayItemSize,
        trayGap,
        images,
        enableQuestionMarks,
        questionMarks,
        qmColor,
        qmDefaultSize,
        shadowStyle,
        customShadowColor,
        shadowOpacity
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt ShadowMatch:', e);
    }
  }, [targetIndex, handSize, pointerEmoji, pointerRotation, pointerOffsetX, pointerOffsetY, pointerAnchor, enablePointer, targetScale, targetOffsetY, trayOffsetX, trayOffsetY, trayItemSize, trayGap, images, enableQuestionMarks, questionMarks, qmColor, qmDefaultSize, shadowStyle, customShadowColor, shadowOpacity]);

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
    setShadowStyle('pure-black');
    setCustomShadowColor('#000000');
    setShadowOpacity(100);
    setTrayOffsetX(112);
    setTrayOffsetY(0);
    setTrayItemSize(80);
    setTrayGap(24);
    setHandSize(48);
    setPointerEmoji('👆');
    setPointerRotation(-90);
    setPointerOffsetX(0);
    setPointerOffsetY(0);
    setPointerAnchor('tip');
    setEnablePointer(true);
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

    // BƯỚC 2: Phủ lớp Nền Bóng (Hỗ trợ nhiều loại nền: Màu trơn, Gradient, Pattern)
    ctx.globalCompositeOperation = 'source-in';
    const currentPreset = SHADOW_STYLE_PRESETS.find((p) => p.id === shadowStyle) || SHADOW_STYLE_PRESETS[0];
    const opacityAlpha = Math.max(0.05, Math.min(1, (shadowOpacity ?? 100) / 100));

    ctx.save();
    ctx.globalAlpha = opacityAlpha;

    if (shadowStyle === 'custom-color') {
      ctx.fillStyle = customShadowColor || '#000000';
      ctx.fillRect(0, 0, width, height);
    } else if (currentPreset.type === 'color') {
      ctx.fillStyle = currentPreset.color || '#000000';
      ctx.fillRect(0, 0, width, height);
    } else if (currentPreset.type === 'gradient') {
      // Linear Gradient từ trên xuống dưới
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      const cols = currentPreset.colors || ['#000000', '#1e293b'];
      cols.forEach((col, idx) => {
        grad.addColorStop(idx / (cols.length - 1), col);
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (currentPreset.type === 'pattern') {
      // Nền chính
      ctx.fillStyle = currentPreset.color || '#000000';
      ctx.fillRect(0, 0, width, height);

      // Tạo canvas con để làm Pattern lặp
      const patCanvas = document.createElement('canvas');
      const patCtx = patCanvas.getContext('2d');
      if (currentPreset.pattern === 'dots') {
        patCanvas.width = 24;
        patCanvas.height = 24;
        patCtx.fillStyle = currentPreset.dotColor || '#38bdf8';
        patCtx.beginPath();
        patCtx.arc(12, 12, 3.5, 0, Math.PI * 2);
        patCtx.fill();
      } else if (currentPreset.pattern === 'stripes') {
        patCanvas.width = 32;
        patCanvas.height = 32;
        patCtx.strokeStyle = currentPreset.stripeColor || '#a855f7';
        patCtx.lineWidth = 4;
        patCtx.beginPath();
        patCtx.moveTo(0, 32);
        patCtx.lineTo(32, 0);
        patCtx.stroke();
      }

      try {
        const pattern = ctx.createPattern(patCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, width, height);
        }
      } catch (err) {
        console.error('Pattern fill error:', err);
      }
    } else {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

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
  };

  useEffect(() => {
    renderCanvas();
  }, [targetOffsetY, images, targetIndex, enableQuestionMarks, questionMarks, qmColor, qmDefaultSize, shadowStyle, customShadowColor, shadowOpacity]);

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
    if (!lockPointerToCenter) {
      setCursorPos({ x, y });
    }

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

  // Tính toán tọa độ Canvas 540x960 từ tọa độ chuột thực tế
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { canvasX: 0, canvasY: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { canvasX: 0, canvasY: 0 };

    const cRawX = e.clientX - rect.left;
    const cRawY = e.clientY - rect.top;

    // Canvas được xoay rotate(-90deg)
    // Chiều rộng trên màn hình rect.width ứng với canvas.height (960)
    // Chiều cao trên màn hình rect.height ứng với canvas.width (540)
    const canvasY = (cRawX / rect.width) * canvas.height;
    const canvasX = (1 - (cRawY / rect.height)) * canvas.width;

    return { canvasX, canvasY };
  };

  // Xử lý click trực tiếp lên Canvas bóng đen để thêm/xóa Dấu Hỏi (?) khi đang bật chế độ đặt dấu ?
  const handleCanvasClick = (e) => {
    if (is916Mode || !isPlacingQm || stageMode === 'edit') return;
    e.stopPropagation();

    const { canvasX, canvasY } = getCanvasCoords(e);
    const roundX = Math.round(canvasX);
    const roundY = Math.round(canvasY);

    // Kiểm tra xem có nhấp trúng dấu ? đã có nào để xóa không (bán kính 25px)
    const existingIdx = questionMarks.findIndex(
      (qm) => Math.hypot(qm.x - roundX, qm.y - roundY) < Math.max(25, (qm.size || qmDefaultSize) / 2)
    );

    if (existingIdx !== -1) {
      // Xóa dấu ? vừa bấm trúng
      setQuestionMarksWithHistory((prev) => prev.filter((_, idx) => idx !== existingIdx));
    } else {
      // Thêm dấu ? mới tại vị trí nhấp
      const newQm = {
        id: `qm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        x: roundX,
        y: roundY,
        size: qmDefaultSize
      };
      setQuestionMarksWithHistory((prev) => [...prev, newQm]);
    }
  };

  // Step 1: Click Pick Top Image (Nếu đã có ảnh ở dưới sân khấu thì không cho phép chọn tiếp)
  const handlePickItem = (index, src) => {
    if (placedItems.length > 0 || isResetting || isPlacingQm) return;
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
    if (isPlacingQm) return;
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
        <div className="w-80 bg-slate-800 p-5 pb-24 border-r border-slate-700 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2">
            👻 CÀI ĐẶT GHÉP BÓNG
          </h2>

          {/* CHUYỂN ĐỔI CHẾ ĐỘ THAO TÁC SÂN KHẤU */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setStageMode('edit')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${stageMode === 'edit'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <Move size={14} /> Kéo Xếp Vị Trí (Full)
            </button>
            <button
              onClick={() => setStageMode('gameplay')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${stageMode === 'gameplay'
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <Sparkles size={14} /> Chơi Ghép Bóng
            </button>
          </div>

          {/* NHÓM 1: DANH SÁCH ẢNH & BÓNG MỤC TIÊU */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => toggleSection('images')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🖼️</span>
                <span className="text-xs font-bold text-purple-300">Nhân Vật & Ảnh Khay</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {images.length} ảnh • Bóng #{targetIndex + 1}
                </span>
                {activeSection === 'images' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'images' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                {/* Upload Multiple Images (1 ô chọn duy nhất) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-medium">Tải Lên Nhiều Ảnh Nhân Vật (PNG):</label>
                  <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer border border-dashed border-slate-500 text-xs font-semibold text-center transition-colors">
                    <Upload size={15} /> Chọn Nhiều Ảnh (.PNG)
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
                            className={`h-16 bg-slate-900/80 rounded-lg cursor-grab active:cursor-grabbing overflow-hidden relative border transition-all flex items-center justify-center p-1 group select-none ${i === targetIndex
                                ? 'border-purple-400 ring-2 ring-purple-400/60 shadow-lg shadow-purple-500/20'
                                : 'border-slate-700 hover:border-slate-500'
                              } ${draggedImageIndex === i ? 'opacity-40 scale-95 border-dashed border-purple-500' : ''} ${dragOverImageIndex === i && draggedImageIndex !== i
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
                <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
                  <label className="text-xs text-slate-400 font-medium">Chọn Ảnh Làm Bóng Đen Mục Tiêu:</label>
                  <select
                    value={targetIndex}
                    onChange={(e) => setTargetIndex(Number(e.target.value))}
                    className="p-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:ring-2 focus:ring-purple-400 outline-none cursor-pointer text-xs"
                  >
                    {images.map((_, i) => (
                      <option key={i} value={i}>
                        Thẻ Ảnh Số {i + 1} {i === targetIndex ? '(Đang kích hoạt)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* NHÓM 2: CĂN CHỈNH BÓNG ĐEN */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => toggleSection('shadow')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">👤</span>
                <span className="text-xs font-bold text-purple-300">Căn Chỉnh Bóng Đen</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {targetScale}% • Y:{targetOffsetY}px
                </span>
                {activeSection === 'shadow' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'shadow' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                {/* Target Scale */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Tỉ Lệ Bóng Đen:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="50"
                        max="200"
                        value={targetScale}
                        onChange={(e) => setTargetScale(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>
                  <input type="range" min="50" max="200" value={targetScale} onChange={(e) => setTargetScale(Number(e.target.value))} className="accent-purple-400 cursor-pointer h-1.5" />
                </div>

                {/* Target OffsetY */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Vị Trí Bóng Đen Lên/Xuống:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="-300"
                        max="300"
                        value={targetOffsetY}
                        onChange={(e) => setTargetOffsetY(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input type="range" min="-300" max="300" value={targetOffsetY} onChange={(e) => setTargetOffsetY(Number(e.target.value))} className="accent-purple-400 cursor-pointer h-1.5" />
                </div>

                {/* CÀI ĐẶT LOẠI NỀN BÓNG (SHADOW BACKGROUND PRESETS) */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
                      <span>🎨</span> Loại Nền Bóng:
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {SHADOW_STYLE_PRESETS.find((p) => p.id === shadowStyle)?.name || 'Mặc định'}
                    </span>
                  </div>

                  {/* Grid chọn nhanh các kiểu nền bóng */}
                  <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto custom-scrollbar p-1 bg-slate-950/40 rounded-lg border border-slate-800">
                    {SHADOW_STYLE_PRESETS.map((preset) => {
                      const isSelected = shadowStyle === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setShadowStyle(preset.id)}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-950/60 border-purple-400 text-white shadow-sm ring-1 ring-purple-400/50'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750 hover:text-white'
                          }`}
                        >
                          {/* Preview swatch */}
                          <div
                            className="w-5 h-5 rounded-md border border-slate-600 shrink-0 shadow-inner"
                            style={
                              preset.type === 'color'
                                ? { backgroundColor: preset.id === 'custom-color' ? customShadowColor : preset.color }
                                : preset.type === 'gradient'
                                ? { background: `linear-gradient(135deg, ${preset.colors.join(', ')})` }
                                : {
                                    backgroundColor: preset.color,
                                    backgroundImage:
                                      preset.pattern === 'dots'
                                        ? `radial-gradient(${preset.dotColor} 1.5px, transparent 1.5px)`
                                        : `repeating-linear-gradient(45deg, ${preset.stripeColor}, ${preset.stripeColor} 2px, transparent 2px, transparent 6px)`,
                                    backgroundSize: preset.pattern === 'dots' ? '8px 8px' : 'auto'
                                  }
                            }
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-semibold truncate leading-tight">{preset.name}</span>
                            <span className="text-[9px] text-slate-400 truncate leading-none">{preset.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Chọn màu tùy chỉnh nếu người dùng bấm chọn 'Tùy Chỉnh Màu' */}
                  {shadowStyle === 'custom-color' && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-xs text-slate-300 font-medium">Chọn Màu Nền Bóng:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customShadowColor}
                          onChange={(e) => setCustomShadowColor(e.target.value)}
                          className="w-7 h-7 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                        />
                        <span className="text-xs font-mono text-purple-300 uppercase">{customShadowColor}</span>
                      </div>
                    </div>
                  )}

                  {/* Độ mờ / Độ đậm của bóng (Shadow Opacity) */}
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Độ đậm bóng:</span>
                      <span className="text-white font-mono text-[11px]">{shadowOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={shadowOpacity}
                      onChange={(e) => setShadowOpacity(Number(e.target.value))}
                      className="accent-purple-400 cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NHÓM 3: KHAY ẢNH THU NHỎ */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => toggleSection('tray')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🗂️</span>
                <span className="text-xs font-bold text-purple-300">Cài Đặt Khay Ảnh</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {trayItemSize}px • Gap:{trayGap}
                </span>
                {activeSection === 'tray' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </div>
            </button>

            {activeSection === 'tray' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                {/* Tray Item Size */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Kích Thước Ảnh Khay:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="30"
                        max="300"
                        value={trayItemSize}
                        onChange={(e) => setTrayItemSize(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input type="range" min="30" max="300" value={trayItemSize} onChange={(e) => setTrayItemSize(Number(e.target.value))} className="accent-purple-400 cursor-pointer h-1.5" />
                </div>

                {/* Tray Gap */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Dãn Cách Giữa Các Hình:</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={trayGap}
                        onChange={(e) => setTrayGap(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input type="range" min="0" max="200" value={trayGap} onChange={(e) => setTrayGap(Number(e.target.value))} className="accent-purple-400 cursor-pointer h-1.5" />
                </div>

                {/* Tray OffsetX */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Vị Trí Khay (Trái/Phải):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="1150"
                        value={trayOffsetX}
                        onChange={(e) => setTrayOffsetX(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input type="range" min="0" max="1150" value={trayOffsetX} onChange={(e) => setTrayOffsetX(Number(e.target.value))} className="accent-purple-400 cursor-pointer h-1.5" />
                </div>

                {/* Tray OffsetY */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Vị Trí Khay (Lên/Xuống):</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="-400"
                        max="400"
                        value={trayOffsetY}
                        onChange={(e) => setTrayOffsetY(Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-purple-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input type="range" min="-350" max="350" value={trayOffsetY} onChange={(e) => setTrayOffsetY(Number(e.target.value))} className="accent-purple-400 cursor-pointer h-1.5" />
                </div>
              </div>
            )}
          </div>

          {/* NHÓM 4: DẤU HỎI CHẤM TRÊN BÓNG ĐEN (?) */}
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
                isPlacingQm={isPlacingQm}
                setIsPlacingQm={setIsPlacingQm}
                onClearAll={handleClearAllQm}
                themeColor="purple"
              />
            )}
          </div>

          {/* NHÓM 5: CON TRỎ & BÀN TAY CHỈ */}
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
            themeColor="purple"
          />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
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
            <Play size={18} /> Khởi Chạy
          </button>
        </div>
      )}

      {/* KHUNG HIỂN THỊ KHU VỰC SÂN KHẤU (FULL MÀN HÌNH KHI Ở CHẾ ĐỘ 9:16 HOẶC KHI Ở CHẾ ĐỘ KÉO XẾP VỊ TRÍ) */}
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

          {/* THEATER CONTAINER CỐ ĐỊNH 1280x720: TOÀN BỘ KHAY ẢNH, BÓNG ĐEN, THẺ ĐÃ GHÉP NẰM CHUNG 1 HỆ QUY CHIẾU */}
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
            {/* BỘ 3 ẢNH THỦ NHỎ TRONG KHAY: HỖ TRỢ KÉO THẢ TRỰC TIẾP KHAY KHI Ở CHẾ ĐỘ EDIT */}
            <div
              onMouseDown={handleStartDragTray}
              className={`absolute z-20 flex flex-col-reverse items-center p-2 rounded-xl transition-all select-none ${stageMode === 'edit' && !is916Mode
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
                  className={`transition-all flex items-center justify-center select-none ${stageMode === 'edit' && !is916Mode
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
              onClick={handleCanvasClick}
              className={`transition-all ${stageMode === 'edit' && !is916Mode
                  ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-purple-400 rounded-2xl'
                  : isPlacingQm && !is916Mode
                    ? 'cursor-crosshair ring-2 ring-rose-400/80 rounded-2xl'
                    : ''
                }`}
              style={{
                transform: `rotate(-90deg) scale(${targetScale / 100})`,
                transformOrigin: 'center center'
              }}
              title={stageMode === 'edit' ? 'Giữ chuột và kéo để di chuyển vị trí bóng đen' : isPlacingQm ? 'Nhấp vào đây để thêm hoặc xóa dấu ?' : ''}
            >
              <canvas
                ref={canvasRef}
                width={540}
                height={960}
                className={isPlacingQm && !is916Mode ? 'cursor-crosshair' : ''}
              />
            </div>

            {/* PLACED CARDS ON STAGE (Kích thước và tỉ lệ khớp 100% với bóng đen - Cho phép click nhấc lên để di chuyển tiếp) */}
            {placedItems.map((item) => (
              <div
                key={item.id}
                onClick={(e) => handlePlacedItemClick(e, item)}
                className={`absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.3,0.64,1)] flex items-center justify-center select-none ${item.isReturning ? 'z-30 pointer-events-none' : 'z-10 cursor-none'
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

            {/* BANNER THÔNG BÁO KHI ĐANG CỐ ĐỊNH CON TRỎ Ở TÂM */}
            {lockPointerToCenter && !is916Mode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-950/90 text-amber-200 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-amber-500/50 shadow-2xl backdrop-blur-sm z-50 flex items-center gap-2 pointer-events-auto">
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

            {/* HAND / EMOJI CURSOR (Hiển thị khi bật và khi chơi hoặc quay video hoặc khi cố định tâm) */}
            {enablePointer && (stageMode === 'gameplay' || is916Mode || lockPointerToCenter) && (
              <div
                className="absolute pointer-events-none select-none z-30"
                style={getPointerStyle({
                  x: cursorPos.x,
                  y: cursorPos.y,
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
