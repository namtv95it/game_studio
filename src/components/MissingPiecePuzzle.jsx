import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Upload, Play, RotateCcw, Shuffle, ChevronDown, ChevronUp, 
  Volume2, VolumeX, Sparkles, Image as ImageIcon, HelpCircle, 
  Sliders, LayoutGrid, Layers
} from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';
import NumberInput from './NumberInput';
import PointerSettingsControl, { getPointerStyle } from './PointerSettingsControl';
import { saveLocalImage, loadLocalImage } from '../utils/localImageStorage';
import heroImg from '../assets/hero.png';

const DEFAULT_SETTINGS = {
  // Ảnh chính
  imgScale: 100,
  imgOffsetX: 0,
  imgOffsetY: 60,

  // Vùng khuyết (Hole)
  holeX: 195,      // tọa độ trên canvas 540x960
  holeY: 520,
  holeSize: 150,   // kích thước vuông

  // 3 Ảnh / Khay phía trên
  topTrayY: 115,     // vị trí dọc Y của 3 ảnh
  topPieceSize: 115, // kích thước của 3 ảnh
  topSpacing: 155,   // khoảng cách giữa các ảnh
  topOffsetX: 0,     // dịch chuyển ngang X của cả hàng 3 ảnh
  pieceGrayscale: true,      // Mặc định đen trắng cho ảnh phía trên và khi kéo xuống
  revealColorOnHole: true,   // Khi khớp đúng ô khuyết thì hiển thị màu gốc sắc nét

  // Chế độ tạo mảnh sai
  distractorMode: 'auto', // 'auto' | 'custom'
  autoSeed1: 0.35,
  autoSeed2: 0.7,

  soundEnabled: true,

  // Con trỏ & Bàn tay chỉ (giống Soi Đèn Pin)
  enablePointer: false,
  pointerEmoji: '👆',
  handSize: 48,
  pointerRotation: -90,
  pointerOffsetX: 0,
  pointerOffsetY: 0,
  pointerAnchor: 'tip',
  lockPointerToCenter: false,
};

// Hàm tính tọa độ khay chứa của 3 mảnh ghép phía trên
function getSlotPositions(settings) {
  const topTrayY = settings.topTrayY !== undefined ? settings.topTrayY : 115;
  const topSpacing = settings.topSpacing !== undefined ? settings.topSpacing : 155;
  const topOffsetX = settings.topOffsetX !== undefined ? settings.topOffsetX : 0;
  const centerX = 270 + topOffsetX;

  return {
    slotX: [centerX - topSpacing, centerX, centerX + topSpacing],
    slotY: topTrayY,
    pieceSize: settings.topPieceSize !== undefined ? settings.topPieceSize : 115,
  };
}

// Component điều khiển thanh trượt kết hợp ô nhập số
function SliderControl({ label, value, onChange, min, max, step = 1, unit = '', color = 'rose' }) {
  const accentColor = 
    color === 'rose' ? 'accent-rose-500' : 
    color === 'amber' ? 'accent-amber-500' : 
    color === 'purple' ? 'accent-purple-500' : 
    'accent-sky-500';

  const borderColor = 
    color === 'rose' ? 'focus:border-rose-400' : 
    color === 'amber' ? 'focus:border-amber-400' : 
    color === 'purple' ? 'focus:border-purple-400' : 
    'focus:border-sky-400';

  return (
    <div className="flex flex-col gap-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-slate-300 font-semibold">{label}</label>
        <div className="flex items-center gap-1">
          <NumberInput
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className={`w-14 px-1.5 py-0.5 bg-slate-800 text-white rounded text-xs text-right border border-slate-700 focus:outline-none ${borderColor} font-mono`}
          />
          {unit && <span className="text-[10px] text-slate-400 font-medium">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-1.5 bg-slate-700 rounded-lg cursor-pointer ${accentColor}`}
      />
    </div>
  );
}

export default function MissingPiecePuzzle({ is916Mode, setIs916Mode }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('missing_piece_settings_v1');
      const parsed = saved ? JSON.parse(saved) : {};
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed,
        pieceGrayscale: parsed.pieceGrayscale !== undefined ? parsed.pieceGrayscale : true,
        revealColorOnHole: parsed.revealColorOnHole !== undefined ? parsed.revealColorOnHole : true
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [mainImg, setMainImg] = useState(null);
  const [customDistractor1, setCustomDistractor1] = useState(null);
  const [customDistractor2, setCustomDistractor2] = useState(null);

  const [stageScale, setStageScale] = useState(1);
  const [openSections, setOpenSections] = useState({ 
    main: true, 
    topPieces: true, 
    hole: true, 
    distractors: false, 
    pointer: false 
  });

  // 3 mảnh ghép: id: 'correct'|'d1'|'d2'
  const [pieces, setPieces] = useState([]);
  const [isSolved, setIsSolved] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, rawX: -100, rawY: -100 });
  const [isHoveringPiece, setIsHoveringPiece] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const pointerOverlayRef = useRef(null);
  const animRef = useRef(null);
  const activeDragIndexRef = useRef(-1);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hoveredIndexRef = useRef(-1);
  const hoverScalesRef = useRef([1, 1, 1]);
  const piecesRef = useRef([]);
  const audioCtxRef = useRef(null);

  // Đồng bộ piecesRef với state pieces
  useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  // Lưu cài đặt vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('missing_piece_settings_v1', JSON.stringify(settings));
    } catch (e) {
      console.warn('Lỗi lưu cài đặt:', e);
    }
  }, [settings]);

  // Đồng bộ vị trí khay chứa khi người dùng kéo thanh trượt Y, khoảng cách hoặc offset X
  useEffect(() => {
    const { slotX, slotY } = getSlotPositions(settings);
    setPieces(prev =>
      prev.map((p, idx) => {
        const targetSlot = p.slotIndex !== undefined ? p.slotIndex : idx;
        const hX = slotX[targetSlot];
        const hY = slotY;
        if (!p.isPlacedInHole && !p.isDragging) {
          return { ...p, homeX: hX, homeY: hY, currentX: hX, currentY: hY };
        }
        return { ...p, homeX: hX, homeY: hY };
      })
    );
  }, [settings.topTrayY, settings.topSpacing, settings.topOffsetX]);

  // Load ảnh chính & ảnh custom từ IndexedDB
  useEffect(() => {
    loadLocalImage('missing_piece_main').then(url => {
      const img = new Image();
      img.onload = () => setMainImg(img);
      img.src = url || heroImg;
    });

    loadLocalImage('missing_piece_distractor_1').then(url => {
      if (url) {
        const img = new Image();
        img.onload = () => setCustomDistractor1(img);
        img.src = url;
      }
    });

    loadLocalImage('missing_piece_distractor_2').then(url => {
      if (url) {
        const img = new Image();
        img.onload = () => setCustomDistractor2(img);
        img.src = url;
      }
    });
  }, []);

  // Tính toán stageScale pixel-perfect giống hệt FlashlightReveal
  useEffect(() => {
    const updateScale = () => {
      if (!stageWrapperRef.current) return;
      const rect = stageWrapperRef.current.getBoundingClientRect();
      const pad = is916Mode ? 0 : 32;
      const availW = Math.max(100, rect.width - pad);
      const availH = Math.max(100, rect.height - pad);

      // Tỷ lệ 16:9 khi xoay ngang (ngang 960, dọc 540)
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

  // Cố định con trỏ ở giữa nếu bật lockPointerToCenter
  useEffect(() => {
    if (settings.lockPointerToCenter && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({
        x: 270,
        y: 480,
        rawX: rect.width / 2,
        rawY: rect.height / 2
      });
    }
  }, [settings.lockPointerToCenter]);

  // Khởi tạo và xáo trộn 3 mảnh ghép ở khay trên
  const initPieces = useCallback((shuffle = true) => {
    const { slotX, slotY } = getSlotPositions(settings);

    const pieceTypes = [
      { id: 'correct', isCorrect: true },
      { id: 'd1', isCorrect: false },
      { id: 'd2', isCorrect: false },
    ];

    if (shuffle) {
      pieceTypes.sort(() => Math.random() - 0.5);
    }

    const newPieces = pieceTypes.map((pt, idx) => ({
      ...pt,
      slotIndex: idx,
      homeX: slotX[idx],
      homeY: slotY,
      currentX: slotX[idx],
      currentY: slotY,
      isDragging: false,
      isPlacedInHole: false,
      isSnapped: false,
    }));

    setPieces(newPieces);
    setIsSolved(false);
  }, [settings]);

  // Khởi tạo ban đầu
  useEffect(() => {
    initPieces(true);
  }, []);

  // Hiệu ứng âm thanh (Web Audio API)
  const playSound = useCallback((type) => {
    if (!settings.soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'snap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'return') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {}
  }, [settings.soundEnabled]);

  // Chuyển đổi tọa độ chuột thực tế sang tọa độ Canvas 540x960 (khi xoay -90deg)
  const getCanvasCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return { canvasX: 0, canvasY: 0, rawX: 0, rawY: 0 };

    const containerRect = container.getBoundingClientRect();
    const rawX = e.clientX - containerRect.left;
    const rawY = e.clientY - containerRect.top;

    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width === 0 || canvasRect.height === 0) return { canvasX: 0, canvasY: 0, rawX, rawY };

    const cRawX = e.clientX - canvasRect.left;
    const cRawY = e.clientY - canvasRect.top;

    const canvasY = (cRawX / canvasRect.width) * 960;
    const canvasX = (1 - (cRawY / canvasRect.height)) * 540;

    return { canvasX, canvasY, rawX, rawY };
  }, []);

  // Xử lý sự kiện kéo thả (Pointer Events)
  const handlePointerDown = (e) => {
    const { canvasX, canvasY, rawX, rawY } = getCanvasCoords(e);
    if (!settings.lockPointerToCenter) {
      setCursorPos({ x: canvasX, y: canvasY, rawX, rawY });
      if (pointerOverlayRef.current) {
        pointerOverlayRef.current.style.left = `${rawX + (settings.pointerOffsetX || 0)}px`;
        pointerOverlayRef.current.style.top = `${rawY + (settings.pointerOffsetY || 0)}px`;
      }
    }

    const { pieceSize } = getSlotPositions(settings);
    const pList = piecesRef.current;
    for (let i = pList.length - 1; i >= 0; i--) {
      const p = pList[i];
      const currentSize = p.isPlacedInHole ? settings.holeSize : pieceSize;
      const half = currentSize / 2;

      if (
        canvasX >= p.currentX - half &&
        canvasX <= p.currentX + half &&
        canvasY >= p.currentY - half &&
        canvasY <= p.currentY + half
      ) {
        activeDragIndexRef.current = i;
        dragOffsetRef.current = {
          x: p.currentX - canvasX,
          y: p.currentY - canvasY,
        };

        if (piecesRef.current[i]) {
          piecesRef.current[i].isDragging = true;
          piecesRef.current[i].isPlacedInHole = false;
          piecesRef.current[i].isSnapped = false;
        }

        setPieces(prev => {
          const updated = [...prev];
          updated[i] = { 
            ...updated[i], 
            isDragging: true,
            isPlacedInHole: false,
            isSnapped: false
          };
          return updated;
        });

        setIsSolved(false);
        playSound('pickup');
        e.preventDefault();
        break;
      }
    }
  };

  const handlePointerMove = (e) => {
    const { canvasX, canvasY, rawX, rawY } = getCanvasCoords(e);

    // Cập nhật vị trí con trỏ chuột DOM ngay tức thì (0ms delay, không phụ thuộc render của React)
    if (pointerOverlayRef.current && !settings.lockPointerToCenter) {
      pointerOverlayRef.current.style.left = `${rawX + (settings.pointerOffsetX || 0)}px`;
      pointerOverlayRef.current.style.top = `${rawY + (settings.pointerOffsetY || 0)}px`;
    }

    const idx = activeDragIndexRef.current;
    if (idx >= 0) {
      hoveredIndexRef.current = idx;
      const offset = dragOffsetRef.current;
      // Cập nhật trực tiếp vào piecesRef để Canvas vẽ siêu mượt ở 60fps không bị nghẽn
      if (piecesRef.current[idx]) {
        piecesRef.current[idx].currentX = canvasX + offset.x;
        piecesRef.current[idx].currentY = canvasY + offset.y;
      }
      return;
    }

    // Kiểm tra hover trên các mảnh phía trên khay
    const { pieceSize } = getSlotPositions(settings);
    const pList = piecesRef.current;
    let foundHover = -1;
    for (let i = pList.length - 1; i >= 0; i--) {
      const p = pList[i];
      if (p.isPlacedInHole) continue;
      const currentScale = hoverScalesRef.current[i] || 1;
      const half = (pieceSize * currentScale) / 2;
      if (
        canvasX >= p.currentX - half &&
        canvasX <= p.currentX + half &&
        canvasY >= p.currentY - half &&
        canvasY <= p.currentY + half
      ) {
        foundHover = i;
        break;
      }
    }

    if (hoveredIndexRef.current !== foundHover) {
      hoveredIndexRef.current = foundHover;
      setIsHoveringPiece(foundHover !== -1);
    }
  };

  const handlePointerUp = () => {
    const idx = activeDragIndexRef.current;
    if (idx < 0) return;

    const piece = piecesRef.current[idx];
    activeDragIndexRef.current = -1;
    setIsHoveringPiece(false);

    if (!piece) return;

    const holeCenterX = settings.holeX + settings.holeSize / 2;
    const holeCenterY = settings.holeY + settings.holeSize / 2;

    const dist = Math.hypot(piece.currentX - holeCenterX, piece.currentY - holeCenterY);
    const snapThreshold = settings.holeSize * 0.8;

    if (dist <= snapThreshold) {
      setPieces(prev => {
        return prev.map((p, i) => {
          if (i === idx) {
            return {
              ...p,
              currentX: holeCenterX,
              currentY: holeCenterY,
              isDragging: false,
              isPlacedInHole: true,
              isSnapped: p.isCorrect,
            };
          } else if (p.isPlacedInHole) {
            return {
              ...p,
              currentX: p.homeX,
              currentY: p.homeY,
              isDragging: false,
              isPlacedInHole: false,
              isSnapped: false,
            };
          }
          return p;
        });
      });

      if (piece.isCorrect) {
        setIsSolved(true);
      } else {
        setIsSolved(false);
      }

      playSound('snap');
    } else {
      setPieces(prev => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          isDragging: false,
          isPlacedInHole: false,
          isSnapped: false,
          currentX: piece.homeX,
          currentY: piece.homeY,
        };
        return updated;
      });
      setIsSolved(false);
    }
  };

  const handlePointerLeave = () => {
    handlePointerUp();
    hoveredIndexRef.current = -1;
    setIsHoveringPiece(false);
  };

  // Nhấn Space: Trả mảnh đang ở chỗ khuyết về vị trí phía trên
  const handleSpaceAction = useCallback(() => {
    const currentPieces = piecesRef.current;
    const hasPlacedPiece = currentPieces.some(p => p.isPlacedInHole);

    if (hasPlacedPiece) {
      setPieces(prev =>
        prev.map(p =>
          p.isPlacedInHole
            ? { ...p, currentX: p.homeX, currentY: p.homeY, isPlacedInHole: false, isSnapped: false }
            : p
        )
      );
      setIsSolved(false);
      playSound('return');
    } else {
      initPieces(true);
    }
  }, [initPieces, playSound]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleSpaceAction();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        initPieces(false);
      } else if (e.code === 'Escape' && is916Mode) {
        setIs916Mode(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpaceAction, initPieces, is916Mode, setIs916Mode]);

  // Main Render Loop (Canvas 2D) - HOÀN TOÀN TRONG SUỐT KHÔNG NỀN ĐEN
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 540;
    const H = 960;

    function render() {
      // 1. Clear toàn bộ canvas để TRONG SUỐT 100%
      ctx.clearRect(0, 0, W, H);

      const { holeX, holeY, holeSize } = settings;
      const currentPieces = piecesRef.current;
      const pieceInHole = currentPieces.find(p => p.isPlacedInHole);

      let drawW = W;
      let drawH = H;
      let drawX = 0;
      let drawY = 0;
      let scale = 1;

      // 2. VẼ ẢNH CHÍNH (TỰ DO, PHÓNG TO THU NHỎ THEO Ý NGƯỜI DÙNG GIỐNG FLASHLIGHT REVEAL)
      if (mainImg) {
        ctx.save();
        const baseFit = Math.min(W / mainImg.naturalWidth, H / mainImg.naturalHeight);
        scale = baseFit * (settings.imgScale / 100);
        drawW = mainImg.naturalWidth * scale;
        drawH = mainImg.naturalHeight * scale;
        drawX = (W - drawW) / 2 + settings.imgOffsetX;
        drawY = (H - drawH) / 2 + settings.imgOffsetY;

        ctx.drawImage(mainImg, drawX, drawY, drawW, drawH);
        ctx.restore();
      }

      // 3. VÙNG KHOÉT (HOLE) TRÊN BỨC ẢNH:
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.fillRect(holeX, holeY, holeSize, holeSize);
      ctx.restore();

      // 4. KHU VỰC KHAY CHỨA PHÍA TRÊN
      const { slotX, slotY, pieceSize } = getSlotPositions(settings);

      for (let i = 0; i < 3; i++) {
        const isSlotHovered = hoveredIndexRef.current === i && !currentPieces[i]?.isPlacedInHole;
        ctx.save();
        ctx.fillStyle = isSlotHovered ? 'rgba(56, 189, 248, 0.22)' : 'rgba(15, 23, 42, 0.45)';
        ctx.beginPath();
        ctx.roundRect(slotX[i] - pieceSize / 2 - 4, slotY - pieceSize / 2 - 4, pieceSize + 8, pieceSize + 8, 12);
        ctx.fill();
        ctx.strokeStyle = isSlotHovered ? '#38bdf8' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = isSlotHovered ? 2 : 1.5;
        if (isSlotHovered) {
          ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
          ctx.shadowBlur = 12;
        }
        ctx.stroke();
        ctx.restore();
      }

      // 5. Hàm vẽ nội dung mảnh ghép
      const drawPieceContent = (piece, px, py, pSize) => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(px - pSize / 2, py - pSize / 2, pSize, pSize, piece.isPlacedInHole ? 0 : 8);
        ctx.clip();

        // Nền đen đệm cho từng mảnh
        ctx.fillStyle = '#000000';
        ctx.fillRect(px - pSize / 2, py - pSize / 2, pSize, pSize);

        if (!mainImg) {
          ctx.restore();
          return;
        }

        // Áp dụng bộ lọc đen trắng cho ảnh phía trên và khi kéo xuống
        const isGrayscale = settings.pieceGrayscale && (
          !piece.isPlacedInHole || 
          !piece.isCorrect || 
          (piece.isCorrect && !settings.revealColorOnHole)
        );

        if (isGrayscale) {
          ctx.filter = 'grayscale(100%) contrast(105%)';
        }

        const srcSize = holeSize / scale;
        const maxSrcX = Math.max(0, mainImg.naturalWidth - srcSize);
        const maxSrcY = Math.max(0, mainImg.naturalHeight - srcSize);

        const correctSrcX = Math.max(0, Math.min(maxSrcX, (holeX - drawX) / scale));
        const correctSrcY = Math.max(0, Math.min(maxSrcY, (holeY - drawY) / scale));

        if (piece.isCorrect) {
          ctx.drawImage(
            mainImg,
            correctSrcX, correctSrcY, srcSize, srcSize,
            px - pSize / 2, py - pSize / 2, pSize, pSize
          );
        } else if (piece.id === 'd1') {
          if (settings.distractorMode === 'custom' && customDistractor1) {
            ctx.drawImage(customDistractor1, px - pSize / 2, py - pSize / 2, pSize, pSize);
          } else {
            const fakeSrcX1 = (correctSrcX + maxSrcX * 0.38 + 50) % (maxSrcX || 1);
            const fakeSrcY1 = (correctSrcY + maxSrcY * 0.42 + 40) % (maxSrcY || 1);

            ctx.drawImage(
              mainImg,
              fakeSrcX1, fakeSrcY1, srcSize, srcSize,
              px - pSize / 2, py - pSize / 2, pSize, pSize
            );
          }
        } else if (piece.id === 'd2') {
          if (settings.distractorMode === 'custom' && customDistractor2) {
            ctx.drawImage(customDistractor2, px - pSize / 2, py - pSize / 2, pSize, pSize);
          } else {
            const fakeSrcX2 = (correctSrcX + maxSrcX * 0.72 + 90) % (maxSrcX || 1);
            const fakeSrcY2 = (correctSrcY + maxSrcY * 0.68 + 70) % (maxSrcY || 1);

            ctx.drawImage(
              mainImg,
              fakeSrcX2, fakeSrcY2, srcSize, srcSize,
              px - pSize / 2, py - pSize / 2, pSize, pSize
            );
          }
        }

        ctx.restore();
      };

      // Vẽ các mảnh ghép
      currentPieces.forEach((piece, idx) => {
        if (piece.isPlacedInHole) {
          drawPieceContent(piece, piece.currentX, piece.currentY, holeSize);

          if (!piece.isCorrect) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(holeX, holeY, holeSize, holeSize);
            ctx.restore();
          }
          return;
        }

        const isDragging = piece.isDragging;
        const isHovered = hoveredIndexRef.current === idx && !isDragging;

        // Smooth scale interpolation: 1.0 (bình thường), 1.08 (hover), 1.10 (kéo thả)
        const targetScale = isDragging ? 1.10 : (isHovered ? 1.08 : 1.0);
        if (!hoverScalesRef.current[idx]) hoverScalesRef.current[idx] = 1;
        hoverScalesRef.current[idx] += (targetScale - hoverScalesRef.current[idx]) * 0.25;

        const currentPSize = pieceSize * hoverScalesRef.current[idx];

        ctx.save();
        if (isDragging) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          ctx.shadowBlur = 24;
          ctx.shadowOffsetY = 10;
        } else if (isHovered) {
          ctx.shadowColor = 'rgba(56, 189, 248, 0.75)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetY = 6;
        }

        drawPieceContent(piece, piece.currentX, piece.currentY, currentPSize);

        // Viền nổi bật và hiệu ứng ánh sáng
        if (isDragging) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
        } else if (isHovered) {
          ctx.strokeStyle = '#67e8f9';
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.5;
        }

        ctx.beginPath();
        ctx.roundRect(
          piece.currentX - currentPSize / 2, 
          piece.currentY - currentPSize / 2, 
          currentPSize, 
          currentPSize, 
          10
        );
        ctx.stroke();

        // Viền neon phụ mềm mại bao quanh khi hover
        if (isHovered) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(
            piece.currentX - currentPSize / 2 - 2, 
            piece.currentY - currentPSize / 2 - 2, 
            currentPSize + 4, 
            currentPSize + 4, 
            12
          );
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      });

      // 6. VIỀN NÉT ĐỨT CỦA VÙNG KHUYẾT: LUÔN LUÔN HIỂN THỊ KỂ CẢ KHI ĐÃ KÉO THẢ MẢNH VÀO
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(holeX, holeY, holeSize, holeSize);
      ctx.restore();

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [mainImg, customDistractor1, customDistractor2, settings, isSolved]);

  // Upload handler cho ảnh chính
  const handleMainUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await saveLocalImage('missing_piece_main', file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setMainImg(img);
        initPieces(true);
      };
      img.src = url;
    } catch (err) {
      console.error('Lỗi khi tải ảnh chính:', err);
    }
  };

  // Upload handler cho ảnh sai 1
  const handleDistractor1Upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await saveLocalImage('missing_piece_distractor_1', file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => setCustomDistractor1(img);
      img.src = url;
    } catch (err) {
      console.error('Lỗi lưu ảnh sai 1:', err);
    }
  };

  // Upload handler cho ảnh sai 2
  const handleDistractor2Upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await saveLocalImage('missing_piece_distractor_2', file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => setCustomDistractor2(img);
      img.src = url;
    } catch (err) {
      console.error('Lỗi lưu ảnh sai 2:', err);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden relative select-none">
      {/* SÂN KHẤU TRUNG TÂM (Cấu trúc pixel-perfect chuẩn 100% giống FlashlightReveal) */}
      <div 
        ref={stageWrapperRef}
        className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
          is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
        }`}
      >
        {/* Lớp nền toàn màn hình khi ở chế độ Khởi Chạy 9:16 */}
        {is916Mode && <StageBackgroundOverlay />}

        {/* CONTAINER CHÍNH CHỨA SÂN KHẤU */}
        <div 
          ref={containerRef}
          className={`relative overflow-hidden select-none transition-all duration-300 flex items-center justify-center ${
            settings.enablePointer 
              ? 'cursor-none' 
              : isHoveringPiece 
                ? 'cursor-grab active:cursor-grabbing' 
                : 'cursor-default'
          } ${
            is916Mode
              ? 'bg-white flex items-center justify-center'
              : 'bg-white rounded-2xl border border-slate-700/80 shadow-2xl flex items-center justify-center'
          }`}
          style={{
            width: `${Math.round(960 * stageScale)}px`,
            height: `${Math.round(540 * stageScale)}px`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        >
          {/* Lớp nền sân khấu linh hoạt */}
          <StageBackgroundOverlay />

          {/* CANVAS XOAY NẰM NGANG 90 ĐỘ (BẰNG 100% VỚI PHẦN NỀN) */}
          <div
            className="relative z-10"
            style={{
              transform: `rotate(-90deg) scale(${stageScale})`,
              transformOrigin: 'center center',
              width: '540px',
              height: '960px',
            }}
          >
            <canvas
              ref={canvasRef}
              width={540}
              height={960}
              className="block"
            />
          </div>

          {/* HAND / EMOJI CURSOR OVERLAY (0ms DELAY BẰNG CÁCH KHÔNG DÙNG TRANSITION TRÊN KHUNG TỌA ĐỘ) */}
          {settings.enablePointer && (
            <div
              ref={pointerOverlayRef}
              className="absolute pointer-events-none select-none z-30"
              style={getPointerStyle({
                x: cursorPos.rawX,
                y: cursorPos.rawY,
                size: settings.handSize,
                rotation: settings.pointerRotation,
                offsetX: settings.pointerOffsetX,
                offsetY: settings.pointerOffsetY,
                anchor: settings.pointerAnchor
              })}
            >
              <div
                className={`transition-transform duration-100 ${
                  isHoveringPiece ? 'scale-115 drop-shadow-[0_4px_14px_rgba(56,189,248,0.6)]' : 'scale-100'
                }`}
              >
                {settings.pointerEmoji || '👆'}
              </div>
            </div>
          )}

          {/* OVERLAY NÚT ĐIỀU HƯỚNG NHANH (ẨN HOÀN TOÀN KHI Ở CHẾ ĐỘ QUAY VIDEO is916Mode) */}
          {!is916Mode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-30 pointer-events-auto bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/80 shadow-2xl">
              <button
                onClick={handleSpaceAction}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Trả mảnh về khay hoặc Xáo trộn (Space)"
              >
                <Shuffle size={14} /> Trả về / Xáo Trộn (Space)
              </button>

              <button
                onClick={() => initPieces(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-600 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Đặt lại vị trí (R)"
              >
                <RotateCcw size={14} /> Làm Lại (R)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CỘT CÀI ĐẶT BÊN PHẢI (Ẩn hoàn toàn khi is916Mode) */}
      {!is916Mode && (
        <aside className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full overflow-hidden z-20">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Sparkles size={20} />
              <span>Mảnh Ghép Bí Mật</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Shorts 9:16
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* MỤC 1: ẢNH CHÍNH */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, main: !p.main }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Upload size={14} className="text-rose-400" /> Bức Ảnh Chính
                </span>
                {openSections.main ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.main && (
                <div className="p-3 pt-0 space-y-3">
                  <label className="flex items-center justify-center gap-2 w-full py-2 px-3 border border-dashed border-slate-700 hover:border-rose-500/60 bg-slate-900/60 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-all text-slate-300 text-xs font-medium">
                    <Upload size={14} className="text-rose-400" />
                    <span>Tải ảnh mới từ máy...</span>
                    <input type="file" accept="image/*" onChange={handleMainUpload} className="hidden" />
                  </label>

                  <SliderControl
                    label="Phóng to / Thu nhỏ ảnh:"
                    value={settings.imgScale}
                    onChange={(val) => setSettings(p => ({ ...p, imgScale: val }))}
                    min={40}
                    max={350}
                    step={5}
                    unit="%"
                    color="rose"
                  />

                  <SliderControl
                    label="Vị trí ngang X (Ảnh):"
                    value={settings.imgOffsetX}
                    onChange={(val) => setSettings(p => ({ ...p, imgOffsetX: val }))}
                    min={-500}
                    max={500}
                    step={5}
                    unit="px"
                    color="rose"
                  />

                  <SliderControl
                    label="Vị trí dọc Y (Ảnh):"
                    value={settings.imgOffsetY}
                    onChange={(val) => setSettings(p => ({ ...p, imgOffsetY: val }))}
                    min={-500}
                    max={500}
                    step={5}
                    unit="px"
                    color="rose"
                  />
                </div>
              )}
            </div>

            {/* MỤC 2: 3 ẢNH PHÍA TRÊN (KHAY CHỨA MẢNH GHÉP) */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, topPieces: !p.topPieces }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid size={14} className="text-purple-400" /> 3 Ảnh Phía Trên (Khay Chọn)
                </span>
                {openSections.topPieces ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.topPieces && (
                <div className="p-3 pt-0 space-y-3">
                  <SliderControl
                    label="Kích thước 3 ảnh phía trên:"
                    value={settings.topPieceSize}
                    onChange={(val) => setSettings(p => ({ ...p, topPieceSize: val }))}
                    min={60}
                    max={220}
                    step={5}
                    unit="px"
                    color="purple"
                  />

                  <SliderControl
                    label="Khoảng cách giữa các ảnh:"
                    value={settings.topSpacing}
                    onChange={(val) => setSettings(p => ({ ...p, topSpacing: val }))}
                    min={70}
                    max={220}
                    step={5}
                    unit="px"
                    color="purple"
                  />

                  <SliderControl
                    label="Vị trí dọc Y (Độ cao):"
                    value={settings.topTrayY}
                    onChange={(val) => setSettings(p => ({ ...p, topTrayY: val }))}
                    min={40}
                    max={320}
                    step={5}
                    unit="px"
                    color="purple"
                  />

                  <SliderControl
                    label="Dịch chuyển ngang X (Cả hàng):"
                    value={settings.topOffsetX}
                    onChange={(val) => setSettings(p => ({ ...p, topOffsetX: val }))}
                    min={-150}
                    max={150}
                    step={5}
                    unit="px"
                    color="purple"
                  />

                  {/* TÙY CHỌN MÀU SẮC ĐEN TRẮNG */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">Màu sắc 3 mảnh ghép:</span>
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setSettings(p => ({ ...p, pieceGrayscale: true }))}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                            settings.pieceGrayscale
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Đen trắng
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings(p => ({ ...p, pieceGrayscale: false }))}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                            !settings.pieceGrayscale
                              ? 'bg-purple-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Màu gốc
                        </button>
                      </div>
                    </div>

                    {settings.pieceGrayscale && (
                      <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer pt-1 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={settings.revealColorOnHole}
                          onChange={(e) => setSettings(p => ({ ...p, revealColorOnHole: e.target.checked }))}
                          className="accent-purple-500 rounded cursor-pointer"
                        />
                        <span>Khớp đúng ô khuyết: Đổi sang màu thật</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MỤC 3: VÙNG BỊ KHOÉT (HOLE) */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, hole: !p.hole }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sliders size={14} className="text-amber-400" /> Vị Trí Vùng Bị Che
                </span>
                {openSections.hole ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.hole && (
                <div className="p-3 pt-0 space-y-3">
                  <SliderControl
                    label="Vị trí ngang X (Vùng che):"
                    value={settings.holeX}
                    onChange={(val) => setSettings(p => ({ ...p, holeX: val }))}
                    min={10}
                    max={420}
                    step={5}
                    unit="px"
                    color="amber"
                  />

                  <SliderControl
                    label="Vị trí dọc Y (Vùng che):"
                    value={settings.holeY}
                    onChange={(val) => setSettings(p => ({ ...p, holeY: val }))}
                    min={150}
                    max={820}
                    step={5}
                    unit="px"
                    color="amber"
                  />

                  <SliderControl
                    label="Kích thước ô vuông bị che:"
                    value={settings.holeSize}
                    onChange={(val) => setSettings(p => ({ ...p, holeSize: val }))}
                    min={70}
                    max={280}
                    step={5}
                    unit="px"
                    color="amber"
                  />
                </div>
              )}
            </div>

            {/* MỤC 4: CÀI ĐẶT CON TRỎ & BÀN TAY CHỈ (GIỐNG SOI ĐÈN PIN) */}
            <PointerSettingsControl
              isOpen={openSections.pointer}
              onToggle={() => setOpenSections(p => ({ ...p, pointer: !p.pointer }))}
              isAccordion={true}
              pointerEmoji={settings.pointerEmoji}
              setPointerEmoji={(val) => setSettings(p => ({ ...p, pointerEmoji: val }))}
              pointerSize={settings.handSize}
              setPointerSize={(val) => setSettings(p => ({ ...p, handSize: val }))}
              pointerRotation={settings.pointerRotation}
              setPointerRotation={(val) => setSettings(p => ({ ...p, pointerRotation: val }))}
              pointerOffsetX={settings.pointerOffsetX}
              setPointerOffsetX={(val) => setSettings(p => ({ ...p, pointerOffsetX: val }))}
              pointerOffsetY={settings.pointerOffsetY}
              setPointerOffsetY={(val) => setSettings(p => ({ ...p, pointerOffsetY: val }))}
              pointerAnchor={settings.pointerAnchor}
              setPointerAnchor={(val) => setSettings(p => ({ ...p, pointerAnchor: val }))}
              enablePointer={settings.enablePointer}
              setEnablePointer={(val) => setSettings(p => ({ ...p, enablePointer: val }))}
              lockPointerToCenter={settings.lockPointerToCenter}
              setLockPointerToCenter={(val) => setSettings(p => ({ ...p, lockPointerToCenter: val }))}
              themeColor="rose"
            />

            {/* MỤC 5: CÀI ĐẶT 2 MẢNH GHÉP SAI */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, distractors: !p.distractors }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-sky-400" /> 2 Mảnh Gây Nhiễu (Sai)
                </span>
                {openSections.distractors ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.distractors && (
                <div className="p-3 pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setSettings(p => ({ ...p, distractorMode: 'auto' }))}
                      className={`py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        settings.distractorMode === 'auto'
                          ? 'bg-sky-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tự động cắt
                    </button>
                    <button
                      onClick={() => setSettings(p => ({ ...p, distractorMode: 'custom' }))}
                      className={`py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        settings.distractorMode === 'custom'
                          ? 'bg-sky-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Tự tải ảnh lên
                    </button>
                  </div>

                  {settings.distractorMode === 'auto' ? (
                    <button
                      onClick={() => {
                        setSettings(p => ({
                          ...p,
                          autoSeed1: 0.15 + Math.random() * 0.7,
                          autoSeed2: 0.15 + Math.random() * 0.7,
                        }));
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Shuffle size={13} /> Cắt lại ngẫu nhiên từ ảnh
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400 block mb-1">Mảnh sai 1:</span>
                        <label className="flex items-center justify-center gap-2 py-1.5 px-3 border border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-900/60 rounded-lg cursor-pointer text-slate-300 text-xs">
                          <Upload size={13} className="text-sky-400" />
                          <span>{customDistractor1 ? 'Đổi ảnh mảnh 1...' : 'Tải ảnh mảnh 1...'}</span>
                          <input type="file" accept="image/*" onChange={handleDistractor1Upload} className="hidden" />
                        </label>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-1">Mảnh sai 2:</span>
                        <label className="flex items-center justify-center gap-2 py-1.5 px-3 border border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-900/60 rounded-lg cursor-pointer text-slate-300 text-xs">
                          <Upload size={13} className="text-sky-400" />
                          <span>{customDistractor2 ? 'Đổi ảnh mảnh 2...' : 'Tải ảnh mảnh 2...'}</span>
                          <input type="file" accept="image/*" onChange={handleDistractor2Upload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => setSettings(p => ({ ...p, soundEnabled: !p.soundEnabled }))}
                      className={`flex items-center justify-between w-full p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        settings.soundEnabled
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {settings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        Âm thanh kéo thả
                      </span>
                      <span>{settings.soundEnabled ? 'BẬT' : 'TẮT'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MẸO QUAY VIDEO */}
            <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl text-slate-400 space-y-1.5 text-[11px] leading-relaxed">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                🎬 Mẹo quay YouTube Shorts:
              </div>
              <div>• Tự do chỉnh kích thước, khoảng cách và độ cao của 3 mảnh ghép phía trên.</div>
              <div>• Kéo thử mảnh sai vào chỗ khuyết, nhấn <b>Space</b> để mảnh bay về khay!</div>
              <div>• Nhấn <b>ESC</b> để thoát chế độ Khởi Chạy.</div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
