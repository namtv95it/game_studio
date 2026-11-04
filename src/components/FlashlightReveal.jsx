import React, { useRef, useEffect, useState } from 'react';
import { Upload, Play, ChevronDown, ChevronUp, HelpCircle, Trash2, Plus, RotateCcw } from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';
import PointerSettingsControl, { getPointerStyle } from './PointerSettingsControl';
import QuestionMarkSettingsControl from './QuestionMarkSettingsControl';
import ShadowStyleSettingsControl, { applyShadowBackgroundToCanvas } from './ShadowStyleSettingsControl';
import NumberInput from './NumberInput';

// Danh sách các hình dạng hỗ trợ cho Vệt Đèn và Lớp Phủ Màu
export const SPOTLIGHT_SHAPES = [
  { id: 'circle', name: 'Tròn', icon: '⚪' },
  { id: 'square', name: 'Vuông', icon: '⬛' },
  { id: 'heart', name: 'Trái Tim', icon: '💖' },
  { id: 'star', name: 'Ngôi Sao', icon: '⭐' },
  { id: 'cloud', name: 'Đám Mây', icon: '☁️' }
];

/**
 * Hàm vẽ đường dẫn hình dạng tùy biến (Tròn, Vuông/Chữ nhật, Trái tim, Ngôi sao, Đám mây)
 * Hỗ trợ cả bán kính đồng đều r hoặc kích thước chiều rộng/chiều cao độc lập (rx, ry)
 */
export function drawCustomShape(ctx, shape, cx, cy, rx, ry = rx) {
  const rX = Math.max(5, rx);
  const rY = Math.max(5, ry);
  ctx.beginPath();

  if (shape === 'square') {
    // Hình chữ nhật / vuông bo góc nhẹ
    const hw = rX * 0.95;
    const hh = rY * 0.95;
    const corner = Math.min(Math.min(hw, hh) * 0.2, 16);
    ctx.roundRect
      ? ctx.roundRect(cx - hw, cy - hh, hw * 2, hh * 2, corner)
      : ctx.rect(cx - hw, cy - hh, hw * 2, hh * 2);
  } else if (shape === 'heart') {
    // Trái tim co giãn theo rx, ry
    const sx = rX * 0.95;
    const sy = rY * 0.95;
    ctx.moveTo(cx, cy + sy * 0.65);
    ctx.bezierCurveTo(cx - sx * 1.1, cy - sy * 0.2, cx - sx * 0.9, cy - sy * 1.05, cx, cy - sy * 0.35);
    ctx.bezierCurveTo(cx + sx * 0.9, cy - sy * 1.05, cx + sx * 1.1, cy - sy * 0.2, cx, cy + sy * 0.65);
    ctx.closePath();
  } else if (shape === 'star') {
    // Ngôi sao 5 cánh rực rỡ co giãn theo rx, ry
    const points = 5;
    const outerRx = rX * 1.1;
    const outerRy = rY * 1.1;
    const innerRx = rX * 0.48;
    const innerRy = rY * 0.48;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / points;

    ctx.moveTo(cx, cy - outerRy);
    for (let i = 0; i < points; i++) {
      let x = cx + Math.cos(rot) * outerRx;
      let y = cy + Math.sin(rot) * outerRy;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRx;
      y = cy + Math.sin(rot) * innerRy;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRy);
    ctx.closePath();
  } else if (shape === 'cloud') {
    // Đám mây phồng bồng bềnh co giãn theo rx, ry
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rX / 80, rY / 80);
    const s = 60;
    ctx.arc(-s * 0.45, s * 0.15, s * 0.45, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(-s * 0.15, -s * 0.3, s * 0.55, Math.PI * 1.0, Math.PI * 1.85);
    ctx.arc(s * 0.45, -s * 0.15, s * 0.5, Math.PI * 1.4, Math.PI * 0.15);
    ctx.arc(s * 0.55, s * 0.25, s * 0.4, Math.PI * 1.8, Math.PI * 0.5);
    ctx.closePath();
    ctx.restore();
  } else {
    // Mặc định: Tròn hoặc Ellipse
    if (rX === rY) {
      ctx.arc(cx, cy, rX, 0, Math.PI * 2);
    } else {
      ctx.ellipse(cx, cy, rX, rY, 0, 0, Math.PI * 2);
    }
  }
}

/**
 * Hàm sinh chuỗi path data SVG cho hình dạng tùy biến (Tròn, Vuông, Tim, Ngôi sao, Đám mây)
 */
export function getCustomShapeSvgPath(shape, cx, cy, rx, ry = rx) {
  const rX = Math.max(5, rx);
  const rY = Math.max(5, ry);

  if (shape === 'square') {
    const hw = rX * 0.95;
    const hh = rY * 0.95;
    const corner = Math.min(Math.min(hw, hh) * 0.2, 16);
    return `M ${cx - hw + corner} ${cy - hh} ` +
      `h ${hw * 2 - corner * 2} ` +
      `a ${corner} ${corner} 0 0 1 ${corner} ${corner} ` +
      `v ${hh * 2 - corner * 2} ` +
      `a ${corner} ${corner} 0 0 1 -${corner} ${corner} ` +
      `h -${hw * 2 - corner * 2} ` +
      `a ${corner} ${corner} 0 0 1 -${corner} -${corner} ` +
      `v -${hh * 2 - corner * 2} ` +
      `a ${corner} ${corner} 0 0 1 ${corner} -${corner} Z`;
  }

  if (shape === 'heart') {
    const sx = rX * 0.95;
    const sy = rY * 0.95;
    return `M ${cx} ${cy + sy * 0.65} ` +
      `C ${cx - sx * 1.1} ${cy - sy * 0.2}, ${cx - sx * 0.9} ${cy - sy * 1.05}, ${cx} ${cy - sy * 0.35} ` +
      `C ${cx + sx * 0.9} ${cy - sy * 1.05}, ${cx + sx * 1.1} ${cy - sy * 0.2}, ${cx} ${cy + sy * 0.65} Z`;
  }

  if (shape === 'star') {
    const points = 5;
    const outerRx = rX * 1.1;
    const outerRy = rY * 1.1;
    const innerRx = rX * 0.48;
    const innerRy = rY * 0.48;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / points;

    let d = `M ${cx + Math.cos(rot) * outerRx} ${cy + Math.sin(rot) * outerRy} `;
    for (let i = 0; i < points; i++) {
      let x = cx + Math.cos(rot) * outerRx;
      let y = cy + Math.sin(rot) * outerRy;
      d += `L ${x} ${y} `;
      rot += step;

      x = cx + Math.cos(rot) * innerRx;
      y = cy + Math.sin(rot) * innerRy;
      d += `L ${x} ${y} `;
      rot += step;
    }
    d += 'Z';
    return d;
  }

  if (shape === 'cloud') {
    // Tỉ lệ scale đám mây chuẩn (gốc 80)
    const scaleX = rX / 80;
    const scaleY = rY / 80;
    const s = 60;
    // Điểm tính toán theo scale
    const p = (relX, relY) => `${cx + relX * scaleX} ${cy + relY * scaleY}`;
    // SVG Path cho đám mây
    const r1 = s * 0.45;
    const r2 = s * 0.55;
    const r3 = s * 0.5;
    const r4 = s * 0.4;
    return `M ${p(-s * 0.45, s * 0.6)} ` +
      `A ${r1 * scaleX} ${r1 * scaleY} 0 0 1 ${p(-s * 0.45, -s * 0.3)} ` +
      `A ${r2 * scaleX} ${r2 * scaleY} 0 0 1 ${p(s * 0.25, -s * 0.5)} ` +
      `A ${r3 * scaleX} ${r3 * scaleY} 0 0 1 ${p(s * 0.75, 0)} ` +
      `A ${r4 * scaleX} ${r4 * scaleY} 0 0 1 ${p(-s * 0.45, s * 0.6)} Z`;
  }

  // Mặc định hình tròn
  return `M ${cx - rX} ${cy} a ${rX} ${rY} 0 1 0 ${rX * 2} 0 a ${rX} ${rY} 0 1 0 -${rX * 2} 0 Z`;
}

const STORAGE_KEY = 'flashlight_game_settings';

const DEFAULT_SETTINGS = {
  imageSrc: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
  radius: 80,
  spotlightType: 'circle',
  beamAngle: -135,
  coneSpread: 45,
  handSize: 48,
  pointerEmoji: '👆',
  pointerRotation: -90,
  pointerOffsetX: 0,
  pointerOffsetY: 0,
  pointerAnchor: 'tip',
  enablePointer: true,
  scale: 95,
  offsetX: 0,
  offsetY: 0,
  beamBgColor: '#fef08a',
  enableBeamBg: true,
  beamOpacity: 100,
  enableQuestionMarks: true,
  questionMarks: [],
  qmColor: '#ef4444',
  qmDefaultSize: 48,
  qmRandomColor: false,
  qmRandomSize: false,
  qmMinSize: 24,
  qmMaxSize: 80,
  beamStartWidth: 55,
  gameMode: 'reveal', // 'reveal' (Soi Đèn Chiếu Sáng) | 'cover' (Phủ Màu Che Ảnh)
  coverColor: '#000000',
  coverOpacity: 100,
  coverShape: 'circle', // 'circle' | 'square' | 'heart' | 'star' | 'cloud'
  beamShape: 'circle', // 'circle' | 'square' | 'heart' | 'star' | 'cloud'
  useCoverDimensions: false, // Tùy chọn nhập chiều cao & chiều rộng riêng
  coverWidth: 160,
  coverHeight: 160,
  coverBlendMode: 'color' // 'color' (Nhuộm màu ảnh - Color Tinting) | 'tint-multiply' (Phủ đậm nét) | 'solid' (Che đè phẳng)
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

  // Chế độ chơi: 'reveal' (Soi đèn sáng) hoặc 'cover' (Phủ màu che ảnh)
  const [gameMode, setGameMode] = useState(initialSettings.gameMode || 'reveal');
  const [coverColor, setCoverColor] = useState(initialSettings.coverColor || '#000000');
  const [coverOpacity, setCoverOpacity] = useState(initialSettings.coverOpacity ?? 100);
  const [coverShape, setCoverShape] = useState(initialSettings.coverShape || 'circle');
  const [useCoverDimensions, setUseCoverDimensions] = useState(initialSettings.useCoverDimensions ?? false);
  const [coverWidth, setCoverWidth] = useState(initialSettings.coverWidth ?? (initialSettings.radius ? initialSettings.radius * 2 : 160));
  const [coverHeight, setCoverHeight] = useState(initialSettings.coverHeight ?? (initialSettings.radius ? initialSettings.radius * 2 : 160));
  const [coverBlendMode, setCoverBlendMode] = useState(initialSettings.coverBlendMode || 'color');

  const [imageSrc, setImageSrc] = useState(initialSettings.imageSrc || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png');
  const [radius, setRadius] = useState(initialSettings.radius ?? 80);
  const [spotlightType, setSpotlightType] = useState(initialSettings.spotlightType || 'circle');
  const [beamShape, setBeamShape] = useState(initialSettings.beamShape || 'circle');
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
  const [scale, setScale] = useState(initialSettings.scale ?? 95);
  const [offsetX, setOffsetX] = useState(initialSettings.offsetX ?? 0);
  const [offsetY, setOffsetY] = useState(initialSettings.offsetY ?? 0);
  // Màu nền của quầng sáng đèn pin (phần không có nhân vật trong vùng chiếu)
  const [beamBgColor, setBeamBgColor] = useState(initialSettings.beamBgColor || '#fef08a'); // Mặc định vàng nhạt rực rỡ
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
  const [qmColor, setQmColor] = useState(initialSettings.qmColor || '#ef4444'); // Đỏ tươi như trong ảnh
  const [qmDefaultSize, setQmDefaultSize] = useState(initialSettings.qmDefaultSize ?? 48);
  const [qmRandomColor, setQmRandomColor] = useState(initialSettings.qmRandomColor ?? false);
  const [qmRandomSize, setQmRandomSize] = useState(initialSettings.qmRandomSize ?? false);
  const [qmMinSize, setQmMinSize] = useState(initialSettings.qmMinSize ?? 24);
  const [qmMaxSize, setQmMaxSize] = useState(initialSettings.qmMaxSize ?? 80);
  const [isPlacingQm, setIsPlacingQm] = useState(false); // Bật chế độ bấm để thêm dấu ?
  const [lockPointerToCenter, setLockPointerToCenter] = useState(false); // Cố định con trỏ vào tâm để điều chỉnh

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
    setScale(95);
    setOffsetX(0);
    setOffsetY(0);
  };

  const stageWrapperRef = useRef(null);
  const [stageScale, setStageScale] = useState(0.95);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

    // Tự động tính toán scale để Phần Canvas và Phần Nền bằng nhau 100% (Khớp pixel-perfect)
  useEffect(() => {
    const updateScale = () => {
      if (!stageWrapperRef.current) return;
      const rect = stageWrapperRef.current.getBoundingClientRect();
      const pad = is916Mode ? 0 : 32;
      const availW = Math.max(100, rect.width - pad);
      const availH = Math.max(100, rect.height - pad);

      // Sân khấu xoay ngang 16:9 (ngang 960, dọc 540)
      const scaleW = availW / 960;
      const scaleH = availH / 540;
      const s = Math.min(scaleW, scaleH);
      setStageScale(s);
    };

    updateScale();
    const timer = setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [is916Mode]);

// Tự động lưu cài đặt vào localStorage khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
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
        scale,
        offsetX,
        offsetY,
        imageSrc,
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
        shadowPattern,
        customShadowColor,
        shadowOpacity,
        gameMode,
        coverColor,
        coverOpacity,
        coverShape,
        beamShape,
        useCoverDimensions,
        coverWidth,
        coverHeight,
        coverBlendMode
      }));
    } catch (e) {
      console.error('Không thể lưu cài đặt:', e);
    }
  }, [radius, spotlightType, beamShape, beamAngle, coneSpread, beamStartWidth, handSize, pointerEmoji, pointerRotation, pointerOffsetX, pointerOffsetY, pointerAnchor, enablePointer, scale, offsetX, offsetY, imageSrc, beamBgColor, enableBeamBg, beamOpacity, enableQuestionMarks, questionMarks, qmColor, qmDefaultSize, qmRandomColor, qmRandomSize, qmMinSize, qmMaxSize, shadowStyle, shadowPattern, customShadowColor, shadowOpacity, gameMode, coverColor, coverOpacity, coverShape, useCoverDimensions, coverWidth, coverHeight, coverBlendMode]);

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

  // Handle Mouse Move: Tính toán ma trận đồng bộ 100% khi nằm ngang 90deg ở cả 2 trạng thái
  const handleMouseMove = (e) => {
    if (lockPointerToCenter) return;
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
      setQuestionMarksWithHistory((prev) => prev.filter((_, idx) => idx !== existingIdx));
    } else {
      // Thêm dấu ? mới tại vị trí nhấp (hỗ trợ tính năng random cỡ chữ và màu sắc)
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
        id: `qm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        x: roundX,
        y: roundY,
        size: calculatedSize,
        ...(calculatedColor ? { color: calculatedColor } : {})
      };
      setQuestionMarksWithHistory((prev) => [...prev, newQm]);
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

    // Tỉ lệ cơ sở (Fit chuẩn 100% không cắt bất kỳ mép nào):
    // Khống chế an toàn ban đầu để cả chiều cao (đầu/chân) lẫn chiều rộng (đuôi/lưng) nằm trọn vẹn trong khung
    const maxBoxW = width * 0.82;   // 540 * 0.82 = 442px
    const maxBoxH = height * 0.78;  // 960 * 0.78 = 748px

    const scaleW = maxBoxW / activeImg.width;
    const scaleH = maxBoxH / activeImg.height;
    const fitScale = Math.min(scaleW, scaleH);

    const baseW = activeImg.width * fitScale;
    const baseH = activeImg.height * fitScale;

    // PHÓNG TO / THU NHỎ TỰ DO HOÀN TOÀN THEO Ý NGƯỜI DÙNG (KHÔNG HỀ BỊ GIỚI HẠN)
    const charScale = Math.max(0.1, (scale || 100) / 100);
    const drawW = baseW * charScale;
    const drawH = baseH * charScale;

    // Căn giữa từ tâm và dịch chuyển theo Offset người dùng chỉnh
    const drawX = (width - drawW) / 2 + (offsetX || 0);
    const drawY = (height - drawH) / 2 + (offsetY || 0);

    // Clear background
    ctx.clearRect(0, 0, width, height);

    if (gameMode === 'cover') {
      // ===== CHẾ ĐỘ 2: PHỦ MÀU CHE ẢNH (NHUỘM MÀU / TINTING) =====
      // Bước 1: Vẽ Ảnh nhân vật màu gốc sắc nét
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(activeImg, drawX, drawY, drawW, drawH);

      // Bước 2: Nhuộm màu nhân vật và hiển thị lớp phủ màu theo hình dáng đã cài đặt
      if (!isPlacingQm || is916Mode) {
        const effectiveRx = useCoverDimensions ? (coverWidth || 160) / 2 : radius;
        const effectiveRy = useCoverDimensions ? (coverHeight || 160) / 2 : radius;
        const opacity = Math.max(0.05, Math.min(1, (coverOpacity ?? 100) / 100));

        if (coverBlendMode === 'solid') {
          // Kiểu che đặc phẳng (Flat solid cover)
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = opacity;
          ctx.fillStyle = coverColor || '#000000';
          drawCustomShape(ctx, coverShape || 'circle', cursorPos.x, cursorPos.y, effectiveRx, effectiveRy);
          ctx.fill();
          ctx.restore();
        } else {
          // Kiểu NHUỘM MÀU ẢNH (Color Tinting / Blend Mode):
          // 2.1: Nhuộm trực tiếp vào pixel của ảnh nhân vật bên dưới (Color / Multiply) nhưng chỉ trong vùng shape
          ctx.save();
          drawCustomShape(ctx, coverShape || 'circle', cursorPos.x, cursorPos.y, effectiveRx, effectiveRy);
          ctx.clip(); // Giới hạn hiệu ứng nhuộm màu CHỈ nằm trong hình dạng lớp phủ

          // Áp dụng lớp nhuộm màu lên nhân vật
          ctx.globalCompositeOperation = 'source-atop'; // Chỉ bám vào pixel của nhân vật
          ctx.fillStyle = coverColor || '#000000';

          if (coverBlendMode === 'tint-multiply') {
            // Nhuộm đậm nét (Multiply)
            ctx.globalAlpha = opacity;
            ctx.fillRect(0, 0, width, height);
          } else {
            // Nhuộm màu chuẩn sắc (Color Tinting: chuyển toàn bộ nhân vật sang tông màu coverColor)
            ctx.globalCompositeOperation = 'color';
            ctx.globalAlpha = 1;
            ctx.fillRect(0, 0, width, height);

            // Tăng cường độ đậm nếu opacity cao
            if (opacity > 0.5) {
              ctx.globalCompositeOperation = 'multiply';
              ctx.globalAlpha = (opacity - 0.5) * 0.7;
              ctx.fillRect(0, 0, width, height);
            }
          }
          ctx.restore();

          // 2.2: Luôn hiển thị hình dáng lớp phủ màu trên toàn bộ vùng (cả nền ngoài và nhân vật)
          ctx.save();
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = opacity * 0.45; // Lớp kính màu mờ bao quanh để luôn thấy rõ hình dáng
          ctx.fillStyle = coverColor || '#000000';
          drawCustomShape(ctx, coverShape || 'circle', cursorPos.x, cursorPos.y, effectiveRx, effectiveRy);
          ctx.fill();

          // Viền mảnh tinh tế quanh hình dáng lớp phủ để định hình rõ nét
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = coverColor || '#000000';
          ctx.globalAlpha = Math.min(1, opacity * 0.85);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Dấu hỏi chấm (nếu có bật)
      if (enableQuestionMarks && questionMarks.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        questionMarks.forEach((qm) => {
          const qmSize = qm.size || qmDefaultSize;
          const markColor = qm.color || qmColor;
          ctx.font = `900 ${qmSize}px "Arial Black", "Arial", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = markColor;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 2;
          ctx.fillText('?', qm.x, qm.y);
        });
        ctx.restore();
      }

    } else {
      // ===== CHẾ ĐỘ 1: SOI ĐÈN CHIẾU SÁNG (BÓNG ĐEN -> SOI TỚI ĐÂU SÁNG TỚI ĐÓ) =====
      // BƯỚC 1: Vẽ Ảnh màu gốc ở dưới cùng (dịch chuyển theo offsetY & tỉ lệ chuẩn)
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(activeImg, drawX, drawY, drawW, drawH);

      // BƯỚC 2: Phủ lớp Nền Bóng (Màu trơn, Gradient, Pattern, Tùy chỉnh) CHỈ lên khu vực hình ảnh PNG
      ctx.globalCompositeOperation = 'source-in';
      applyShadowBackgroundToCanvas(ctx, width, height, shadowStyle, customShadowColor, shadowOpacity, shadowPattern);

      // BƯỚC 2.5: Vẽ các Dấu Hỏi Chấm '?' lên lớp bóng đen (chỉ hiển thị trên phần bóng đen)
      if (enableQuestionMarks && questionMarks.length > 0) {
        ctx.globalCompositeOperation = 'source-over';
        questionMarks.forEach((qm) => {
          const qmSize = qm.size || qmDefaultSize;
          const markColor = qm.color || qmColor;
          ctx.save();
          ctx.font = `900 ${qmSize}px "Arial Black", "Arial", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Viền đổ bóng nhẹ và màu dấu hỏi (hỗ trợ màu riêng biệt theo từng dấu)
          ctx.fillStyle = markColor;
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
        // BƯỚC 3: Tạo đường dẫn hình dạng của vệt sáng Đèn Pin
        const createBeamPath = (c) => {
          if (spotlightType === 'circle') {
            drawCustomShape(c, beamShape || 'circle', cursorPos.x, cursorPos.y, radius);
          } else {
            c.beginPath();
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

        // BƯỚC 4: Vẽ lại ảnh màu gốc CHỈ TRONG VÙNG ĐÈN RỌI (sử dụng clip để không bao giờ bị lộ ảnh ở bên ngoài)
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        createBeamPath(ctx);
        ctx.clip();
        ctx.drawImage(activeImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      }
    }
  };

  useEffect(() => {
    renderCanvas();
  }, [cursorPos, radius, spotlightType, beamShape, beamAngle, coneSpread, beamStartWidth, imageSrc, is916Mode, scale, offsetX, offsetY, beamBgColor, enableBeamBg, beamOpacity, enableQuestionMarks, questionMarks, qmColor, qmDefaultSize, isPlacingQm, shadowStyle, shadowPattern, customShadowColor, shadowOpacity, gameMode, coverColor, coverOpacity, coverShape, useCoverDimensions, coverWidth, coverHeight, coverBlendMode]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageSrc(URL.createObjectURL(file));
      setQuestionMarksWithHistory([]);
      setIsPlacingQm(false);
      setScale(100);
      setOffsetX(0);
      setOffsetY(0);
    }
  };



  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      {/* TRẠNG THÁI 2: GIỮ NGUYÊN SIDEBAR (Nút Khởi Chạy dùng để bật Trạng Thái 1: Ẩn Hết) */}
      {!is916Mode && (
        <div className="w-80 bg-slate-800 p-5 pb-24 border-r border-slate-700 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2">
            🔦 CÀI ĐẶT SOI ĐÈN PIN (PNG)
          </h2>

          {/* CHỌN CHẾ ĐỘ HOẠT ĐỘNG: SOI ĐÈN SÁNG vs PHỦ MÀU CHE ẢNH */}
          <div className="flex flex-col gap-2 p-2.5 bg-slate-900/90 rounded-2xl border-2 border-sky-500/30 shadow-lg shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                CHẾ ĐỘ TRÒ CHƠI:
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                gameMode === 'cover' 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50' 
                  : 'bg-sky-500/20 text-sky-300 border border-sky-400/50'
              }`}>
                {gameMode === 'cover' ? 'Phủ Màu' : 'Soi Đèn'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setGameMode('reveal');
                  setActiveSection('flashlight');
                }}
                className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer shadow-sm ${
                  gameMode === 'reveal'
                    ? 'bg-gradient-to-b from-sky-500/30 to-sky-600/20 border-sky-400 text-sky-200 ring-2 ring-sky-400/40 shadow-sky-500/20'
                    : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 hover:bg-slate-750'
                }`}
              >
                <span className="text-lg">🔦</span>
                <span className="leading-tight font-extrabold text-[12px]">Soi Đèn Sáng</span>
                <span className="text-[9px] font-normal opacity-80">Bóng đen → Soi sáng</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGameMode('cover');
                  setActiveSection('coverSettings');
                }}
                className={`py-2.5 px-2 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer shadow-sm ${
                  gameMode === 'cover'
                    ? 'bg-gradient-to-b from-purple-500/30 to-purple-600/20 border-purple-400 text-purple-200 ring-2 ring-purple-400/40 shadow-purple-500/20'
                    : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 hover:bg-slate-750'
                }`}
              >
                <span className="text-lg">🎨</span>
                <span className="leading-tight font-extrabold text-[12px]">Phủ Màu Che Ảnh</span>
                <span className="text-[9px] font-normal opacity-80">Ảnh rõ → Rọi để che</span>
              </button>
            </div>
          </div>

          {/* NHÓM 1: NHÂN VẬT & KHUNG HÌNH */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
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
                  {scale}% • X:{offsetX} • Y:{offsetY}
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

                {/* Nút Khôi Phục Vị Trí Vừa Vặn 100% */}
                <button
                  type="button"
                  onClick={() => {
                    setScale(100);
                    setOffsetX(0);
                    setOffsetY(0);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  title="Tự động thu phóng vừa khít 100% toàn bộ nhân vật (đầu, chân, đuôi) không bị cắt"
                >
                  🎯 Căn Vừa Khít Toàn Bộ (100% Chuẩn)
                </button>

                {/* Scale (Phóng to / Thu nhỏ không giới hạn) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">Phóng To / Thu Nhỏ (Tự Do):</label>
                    <div className="flex items-center gap-1">
                      <NumberInput
                        min={10}
                        max={500}
                        value={scale}
                        onChange={(val) => setScale(val)}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="250"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>30% (Thu nhỏ)</span>
                    <span className="text-emerald-400 font-semibold">100% (Vừa vặn)</span>
                    <span>250% (Phóng cực đại)</span>
                  </div>
                </div>

                {/* Offset Y: Dịch chuyển Đầu ◄► Chân */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">
                      Dịch Chuyển [Đầu ◄► Chân]:
                    </label>
                    <div className="flex items-center gap-1">
                      <NumberInput
                        min={-500}
                        max={500}
                        value={offsetY}
                        onChange={(val) => setOffsetY(val)}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-400"
                    max="400"
                    value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>◄ Về phía Đầu</span>
                    <span>0 (Giữa)</span>
                    <span>Về phía Chân ►</span>
                  </div>
                </div>

                {/* Offset X: Dịch chuyển Lên ▲▼ Xuống */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">
                      Dịch Chuyển [Lên ▲▼ Xuống]:
                    </label>
                    <div className="flex items-center gap-1">
                      <NumberInput
                        min={-400}
                        max={400}
                        value={offsetX}
                        onChange={(val) => setOffsetX(val)}
                        className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                      />
                      <span className="text-xs text-slate-400">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-300"
                    max="300"
                    value={offsetX}
                    onChange={(e) => setOffsetX(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>▲ Dịch Lên</span>
                    <span>0 (Giữa)</span>
                    <span>Dịch Xuống ▼</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NHÓM 2: CÀI ĐẶT VỆT SÁNG (REVEAL) HOẶC CÀI ĐẶT LỚP PHỦ CHE MÀU (COVER) */}
          {gameMode === 'reveal' ? (
            <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
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
                    {radius}px • {spotlightType === 'circle' ? (SPOTLIGHT_SHAPES.find(s => s.id === beamShape)?.name || 'Tròn') : 'Nón'}
                  </span>
                  {activeSection === 'flashlight' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
              </button>

              {activeSection === 'flashlight' && (
                <div className="p-3.5 flex flex-col gap-4 border-t border-slate-800">
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
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-medium">Kiểu Chiếu Đèn Pin:</label>
                    <select
                      value={spotlightType}
                      onChange={(e) => setSpotlightType(e.target.value)}
                      className="p-2 bg-slate-700/90 text-white rounded-lg border border-slate-600 focus:border-sky-400 text-xs outline-none cursor-pointer"
                    >
                      <option value="circle">🔵 Vệt Sáng Chiếu Rọi (Sắc Nét)</option>
                      <option value="cone">📐 Vệt Nón Chiếu Chéo (Sắc Nét)</option>
                    </select>
                  </div>

                  {/* Chọn Hình Dạng Vệt Sáng khi chọn Kiểu Chiếu Rọi */}
                  {spotlightType === 'circle' && (
                    <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/40 rounded-xl border border-sky-500/20">
                      <label className="text-xs text-sky-300 font-medium">Hình Dạng Vệt Sáng Đèn Pin:</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {SPOTLIGHT_SHAPES.map((shape) => (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => setBeamShape(shape.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                              beamShape === shape.id
                                ? 'bg-sky-500/25 border-sky-400 text-sky-200 shadow-sm ring-1 ring-sky-400'
                                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                            }`}
                            title={shape.name}
                          >
                            <span className="text-base">{shape.icon}</span>
                            <span className="text-[10px] mt-0.5 font-medium">{shape.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Radius */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400 font-medium">Kích Thước Vệt Sáng:</label>
                      <div className="flex items-center gap-1">
                        <NumberInput
                          min={20}
                          max={400}
                          value={radius}
                          onChange={(val) => setRadius(val)}
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
                    <div className="flex flex-col gap-2.5 p-2.5 bg-slate-950/40 rounded-xl border border-sky-500/20">
                      {/* Hướng Chiếu Beam Angle */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Hướng Chiếu:</span>
                          <div className="flex items-center gap-1 font-mono text-white text-xs">
                            <NumberInput
                              min={-180}
                              max={180}
                              value={beamAngle}
                              onChange={(val) => setBeamAngle(val)}
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

                      {/* Độ Mở (Góc Loe) */}
                      <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-medium text-sky-300">Độ Mở (Góc Loe):</span>
                          <div className="flex items-center gap-1 font-mono text-white text-xs">
                            <NumberInput
                              min={0}
                              max={120}
                              value={coneSpread}
                              onChange={(val) => setConeSpread(val)}
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

                      {/* Bề Rộng Gốc Đèn */}
                      <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-medium text-sky-300">Bề Rộng Gốc Đèn (Không Nhọn):</span>
                          <div className="flex items-center gap-1 font-mono text-white text-xs">
                            <NumberInput
                              min={0}
                              max={300}
                              value={beamStartWidth}
                              onChange={(val) => setBeamStartWidth(val)}
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
                </div>
              )}
            </div>
          ) : (
            /* KHI Ở CHẾ ĐỘ PHỦ MÀU: THAY THÀNH CÀI ĐẶT LỚP PHỦ CHE MÀU */
            <div className="bg-slate-900/50 rounded-xl border border-purple-500/40 overflow-hidden shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => toggleSection('coverSettings')}
                className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🎨</span>
                  <span className="text-xs font-bold text-purple-300">Cài Đặt Lớp Phủ Che Màu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-slate-500 shadow-sm"
                    style={{ backgroundColor: coverColor }}
                  />
                  <span className="text-[10px] text-slate-400 font-mono">
                    {radius}px • {SPOTLIGHT_SHAPES.find(s => s.id === coverShape)?.name || 'Tròn'}
                  </span>
                  {activeSection === 'coverSettings' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
                </div>
              </button>

              {activeSection === 'coverSettings' && (
                <div className="p-3.5 flex flex-col gap-4 border-t border-slate-800">
                  {/* 📌 CHECKBOX CỐ ĐỊNH VỊ TRÍ LỚP PHỦ VÀO TÂM */}
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
                          <span>📌</span> Cố định lớp phủ vào tâm
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Khóa lớp phủ ở giữa để dễ xem và tinh chỉnh
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      lockPointerToCenter ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {lockPointerToCenter ? 'Khóa Tâm' : 'Tự do'}
                    </span>
                  </label>

                  {/* CHỌN HÌNH DÁNG LỚP PHỦ */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-purple-300 font-semibold">Hình Dáng Lớp Phủ:</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {SPOTLIGHT_SHAPES.map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => setCoverShape(shape.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                            coverShape === shape.id
                              ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-sm ring-1 ring-purple-400'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                          }`}
                          title={shape.name}
                        >
                          <span className="text-base">{shape.icon}</span>
                          <span className="text-[10px] mt-0.5 font-medium">{shape.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* KÍCH THƯỚC LỚP PHỦ (BÁN KÍNH HOẶC RỘNG x CAO) */}
                  <div className="flex flex-col gap-2.5 p-2.5 bg-slate-950/40 rounded-xl border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                        <span>📏 Kích Thước Lớp Phủ:</span>
                      </label>
                      {/* Checkbox chuyển đổi: Kích thước đều / Rộng & Cao riêng */}
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={useCoverDimensions}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            setUseCoverDimensions(enabled);
                            if (enabled && (!coverWidth || !coverHeight)) {
                              setCoverWidth(radius * 2);
                              setCoverHeight(radius * 2);
                            }
                          }}
                          className="accent-purple-400 cursor-pointer w-3.5 h-3.5 rounded"
                        />
                        <span className={useCoverDimensions ? 'text-purple-300 font-bold' : 'text-slate-400'}>
                          Rộng & Cao riêng
                        </span>
                      </label>
                    </div>

                    {!useCoverDimensions ? (
                      /* CHẾ ĐỘ 1: KÍCH THƯỚC ĐỒNG ĐỀU (BÁN KÍNH) VỚI Ô NHẬP & NÚT TĂNG GIẢM NHANH */
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-medium">Bán kính (R):</span>
                          
                          {/* Bộ điều khiển: Nút giảm (-) | Ô nhập số | Nút tăng (+) */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setRadius((prev) => Math.max(10, prev - 10))}
                              className="w-6 h-6 flex items-center justify-center bg-slate-750 hover:bg-slate-700 active:bg-slate-650 text-slate-200 hover:text-white rounded border border-slate-600 font-bold text-xs transition-colors cursor-pointer"
                              title="Giảm 10px"
                            >
                              -
                            </button>
                            <NumberInput
                              min={10}
                              max={600}
                              value={radius}
                              onChange={(val) => setRadius(val)}
                              className="w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-center border border-slate-600 focus:outline-none focus:border-purple-400 font-mono font-bold"
                            />
                            <button
                              type="button"
                              onClick={() => setRadius((prev) => Math.min(500, prev + 10))}
                              className="w-6 h-6 flex items-center justify-center bg-slate-750 hover:bg-slate-700 active:bg-slate-650 text-slate-200 hover:text-white rounded border border-slate-600 font-bold text-xs transition-colors cursor-pointer"
                              title="Tăng 10px"
                            >
                              +
                            </button>
                            <span className="text-[11px] text-slate-400 ml-0.5 font-mono">px</span>
                          </div>
                        </div>

                        {/* Thanh trượt kéo thả */}
                        <input
                          type="range"
                          min="10"
                          max="300"
                          value={radius}
                          onChange={(e) => setRadius(Number(e.target.value))}
                          className="accent-purple-400 cursor-pointer h-1.5"
                        />

                        {/* Nút bấm nhanh các mức kích thước phổ biến */}
                        <div className="flex items-center gap-1 pt-0.5">
                          {[
                            { label: 'Nhỏ (50)', val: 50 },
                            { label: 'Vừa (80)', val: 80 },
                            { label: 'Lớn (120)', val: 120 },
                            { label: 'Cực đại (180)', val: 180 }
                          ].map((preset) => (
                            <button
                              key={preset.val}
                              type="button"
                              onClick={() => setRadius(preset.val)}
                              className={`flex-1 py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                                radius === preset.val
                                  ? 'bg-purple-500/30 border-purple-400 text-purple-200 font-bold shadow'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* CHẾ ĐỘ 2: TÙY CHỌN NHẬP CHIỀU CAO & CHIỀU RỘNG ĐỘC LẬP */
                      <div className="flex flex-col gap-2.5 pt-1">
                        {/* Chiều rộng (Width) */}
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span className="text-[11px] text-slate-400">Chiều Rộng (W):</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setCoverWidth((prev) => Math.max(20, prev - 20))}
                                className="w-5 h-5 flex items-center justify-center bg-slate-750 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 font-bold text-xs cursor-pointer"
                                title="Giảm 20px"
                              >
                                -
                              </button>
                              <NumberInput
                                min={20}
                                max={800}
                                value={coverWidth}
                                onChange={(val) => setCoverWidth(val)}
                                className="w-14 px-1 py-0.5 bg-slate-700 text-white rounded text-xs text-center border border-slate-600 focus:outline-none focus:border-purple-400 font-mono font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => setCoverWidth((prev) => Math.min(800, prev + 20))}
                                className="w-5 h-5 flex items-center justify-center bg-slate-750 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 font-bold text-xs cursor-pointer"
                                title="Tăng 20px"
                              >
                                +
                              </button>
                              <span className="text-[10px] text-slate-400 font-mono">px</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="600"
                            value={coverWidth}
                            onChange={(e) => setCoverWidth(Number(e.target.value))}
                            className="accent-purple-400 cursor-pointer h-1.5"
                          />
                        </div>

                        {/* Chiều cao (Height) */}
                        <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800">
                          <div className="flex items-center justify-between text-xs text-slate-300">
                            <span className="text-[11px] text-slate-400">Chiều Cao (H):</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setCoverHeight((prev) => Math.max(20, prev - 20))}
                                className="w-5 h-5 flex items-center justify-center bg-slate-750 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 font-bold text-xs cursor-pointer"
                                title="Giảm 20px"
                              >
                                -
                              </button>
                              <NumberInput
                                min={20}
                                max={800}
                                value={coverHeight}
                                onChange={(val) => setCoverHeight(val)}
                                className="w-14 px-1 py-0.5 bg-slate-700 text-white rounded text-xs text-center border border-slate-600 focus:outline-none focus:border-purple-400 font-mono font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => setCoverHeight((prev) => Math.min(800, prev + 20))}
                                className="w-5 h-5 flex items-center justify-center bg-slate-750 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 font-bold text-xs cursor-pointer"
                                title="Tăng 20px"
                              >
                                +
                              </button>
                              <span className="text-[10px] text-slate-400 font-mono">px</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="600"
                            value={coverHeight}
                            onChange={(e) => setCoverHeight(Number(e.target.value))}
                            className="accent-purple-400 cursor-pointer h-1.5"
                          />
                        </div>

                        {/* Tỉ lệ nhanh cho Rộng x Cao */}
                        <div className="flex items-center gap-1 pt-0.5">
                          {[
                            { label: 'Vuông (160x160)', w: 160, h: 160 },
                            { label: 'Ngang (240x140)', w: 240, h: 140 },
                            { label: 'Dọc (140x240)', w: 140, h: 240 },
                            { label: 'To (300x300)', w: 300, h: 300 }
                          ].map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                setCoverWidth(item.w);
                                setCoverHeight(item.h);
                              }}
                              className={`flex-1 py-1 text-[9px] rounded border transition-colors cursor-pointer ${
                                coverWidth === item.w && coverHeight === item.h
                                  ? 'bg-purple-500/30 border-purple-400 text-purple-200 font-bold shadow'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CHỌN MÀU LỚP PHỦ */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-300">Màu Sắc Lớp Phủ Che:</span>
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-700">
                        <input
                          type="color"
                          value={coverColor}
                          onChange={(e) => setCoverColor(e.target.value)}
                          className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                        />
                        <span className="text-xs font-mono text-purple-300 uppercase font-bold">{coverColor}</span>
                      </div>
                    </div>

                    {/* Preset màu gợi ý */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[
                        { label: 'Đen Tuyệt Đối', color: '#000000' },
                        { label: 'Than Chì', color: '#1e293b' },
                        { label: 'Xanh Đêm', color: '#0f172a' },
                        { label: 'Đỏ Thẫm', color: '#881337' },
                        { label: 'Tím Đậm', color: '#4c1d95' },
                        { label: 'Xanh Rêu', color: '#064e3b' },
                        { label: 'Vàng Nghệ', color: '#d97706' },
                        { label: 'Trắng Sáng', color: '#ffffff' }
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setCoverColor(item.color)}
                          className={`flex items-center gap-1.5 p-1 rounded-md border text-left transition-all cursor-pointer ${
                            coverColor.toLowerCase() === item.color.toLowerCase()
                              ? 'bg-purple-950/80 border-purple-400 text-white ring-1 ring-purple-400'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                          }`}
                        >
                          <div
                            className="w-3.5 h-3.5 rounded border border-slate-600 shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[10px] font-medium truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* KIỂU PHỦ / NHUỘM MÀU ẢNH */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                    <label className="text-xs font-semibold text-purple-300 flex items-center justify-between">
                      <span>Hiệu Ứng Lớp Phủ Lên Ảnh:</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {coverBlendMode === 'color' ? 'Nhuộm màu' : coverBlendMode === 'tint-multiply' ? 'Nhuộm đậm' : 'Che đặc'}
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'color', label: '🎨 Nhuộm Màu', desc: 'Đổi màu ảnh giữ nét' },
                        { id: 'tint-multiply', label: '🌘 Nhuộm Đậm', desc: 'Đậm nét chi tiết' },
                        { id: 'solid', label: '⬛ Che Đặc', desc: 'Phủ kín 100%' }
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setCoverBlendMode(mode.id)}
                          className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                            coverBlendMode === mode.id
                              ? 'bg-purple-500/25 border-purple-400 text-purple-200 ring-1 ring-purple-400 font-bold shadow-sm'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-750'
                          }`}
                        >
                          <span className="text-[11px] leading-tight">{mode.label}</span>
                          <span className="text-[8px] opacity-70 mt-0.5">{mode.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ĐỘ ĐẬM LỚP PHỦ */}
                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Độ Đậm Hiệu Ứng (Opacity):</span>
                      <span className="text-white font-mono font-bold">{coverOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={coverOpacity}
                      onChange={(e) => setCoverOpacity(Number(e.target.value))}
                      className="accent-purple-400 cursor-pointer h-1.5"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>Mờ (10%)</span>
                      <span>Kín 100% (Che chuẩn)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NHÓM MÀU NỀN BÓNG NHÂN VẬT (CHỈ HIỂN THỊ KHI Ở CHẾ ĐỘ SOI ĐÈN CHIẾU SÁNG) */}
          {gameMode === 'reveal' && (
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
          )}

          {/* NHÓM 3: CON TRỎ & BÀN TAY CHỈ (ACCORDION MỚI) */}
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

          {/* NHÓM MỚI: DẤU HỎI CHẤM TRÊN BÓNG ĐEN (?) */}
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

          {/* Nút Reset: Xóa Hết Hình Ảnh & Dấu ? */}
          <button
            type="button"
            onClick={handleResetSettings}
            className="mt-2 p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98 shrink-0"
            title="Xóa hết hình ảnh và dấu ? trên sân khấu, giữ nguyên toàn bộ thông số đèn pin"
          >
            <RotateCcw size={15} className="text-amber-400" /> Reset (Xóa Ảnh & Dấu ?)
          </button>

        </div>
      )}

      {/* KHUNG HIỂN THỊ KHU VỰC SÂN KHẤU (LUÔN LUÔN HIỂN THỊ GIỐNG KHI ĐANG CHẠY) */}
      <div 
        ref={stageWrapperRef}
        className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
        }`}
      >
        {/* CONTAINER KHUNG NỀN SÂN KHẤU (KÍCH THƯỚC BẰNG 100% VỚI PHẦN CANVAS) */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onClick={handleStageClick}
          className={`relative overflow-hidden transition-all duration-300 ${
            isPlacingQm && !is916Mode ? 'cursor-crosshair' : 'cursor-none'
          } ${is916Mode
            ? 'bg-white flex items-center justify-center'
            : 'bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
            }`}
          style={{
            width: `${Math.round(960 * stageScale)}px`,
            height: `${Math.round(540 * stageScale)}px`
          }}
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

          {/* CANVAS XOAY NẰM NGANG 90 ĐỘ (BẰNG 100% VỚI PHẦN NỀN) */}
          <div
            className="relative z-10"
            style={{
              transform: `rotate(-90deg) scale(${stageScale})`,
              transformOrigin: 'center center',
              width: '540px',
              height: '960px'
            }}
          >
            {/* QUẦNG SÁNG ĐÈN PIN NỀN (Nằm cùng hệ quy chiếu Canvas - Khớp pixel-perfect 100% mọi hình dạng, tỷ lệ & góc xoay) */}
            {gameMode === 'reveal' && enableBeamBg && (!isPlacingQm || is916Mode) && (
              <svg
                viewBox="0 0 540 960"
                className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-visible"
                style={{ opacity: Math.max(0, Math.min(1, beamOpacity / 100)) }}
              >
                {spotlightType === 'circle' ? (
                  <path
                    d={getCustomShapeSvgPath(
                      beamShape || 'circle',
                      cursorPos.x,
                      cursorPos.y,
                      radius
                    )}
                    fill={beamBgColor}
                  />
                ) : (() => {
                  const effectiveR = Math.max(1600, radius * 10);
                  const centerRad = (beamAngle * Math.PI) / 180;
                  const halfSpread = ((coneSpread / 2) * Math.PI) / 180;
                  const hw = (beamStartWidth || 55) / 2;

                  const perpX = -Math.sin(centerRad);
                  const perpY = Math.cos(centerRad);

                  const p1x = cursorPos.x - hw * perpX;
                  const p1y = cursorPos.y - hw * perpY;
                  const p2x = cursorPos.x + hw * perpX;
                  const p2y = cursorPos.y + hw * perpY;

                  const a1 = centerRad - halfSpread;
                  const a2 = centerRad + halfSpread;

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

            <canvas
              ref={canvasRef}
              width={540}
              height={960}
              className="block"
            />

          </div>

          {/* HAND / EMOJI CURSOR OVERLAY (Chỉ hiển thị khi bật và KHÔNG ở chế độ đặt dấu hỏi ? để tiện quan sát vị trí đặt) */}
          {enablePointer && (!isPlacingQm || is916Mode) && (
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
