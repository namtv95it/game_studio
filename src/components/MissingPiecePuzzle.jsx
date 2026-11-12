import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Upload, Play, RotateCcw, Shuffle, ChevronDown, ChevronUp, 
  Volume2, VolumeX, Sparkles, Image as ImageIcon, HelpCircle, 
  Sliders
} from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';
import NumberInput from './NumberInput';
import { saveLocalImage, loadLocalImage } from '../utils/localImageStorage';
import heroImg from '../assets/hero.png';

const DEFAULT_SETTINGS = {
  // Ảnh chính
  imgScale: 90,
  imgOffsetX: 0,
  imgOffsetY: 0,

  // Vùng khuyết (Hole)
  holeX: 200,      // tọa độ trên canvas 540x960
  holeY: 480,
  holeSize: 130,   // kích thước vuông

  // Chế độ tạo mảnh sai
  distractorMode: 'auto', // 'auto' | 'custom'
  autoSeed1: 0.25,
  autoSeed2: 0.75,

  soundEnabled: true,
};

export default function MissingPiecePuzzle({ is916Mode, setIs916Mode }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('missing_piece_settings_v1');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [mainImg, setMainImg] = useState(null);
  const [customDistractor1, setCustomDistractor1] = useState(null);
  const [customDistractor2, setCustomDistractor2] = useState(null);

  const [stageScale, setStageScale] = useState(1);
  const [openSections, setOpenSections] = useState({ main: true, hole: true, distractors: true });

  // 3 mảnh ghép: id: 'correct'|'d1'|'d2'
  const [pieces, setPieces] = useState([]);
  const [isSolved, setIsSolved] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const animRef = useRef(null);
  const activeDragIndexRef = useRef(-1);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
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

  // Tính scale hiển thị canvas (540x960 xoay -90deg hiển thị thành 960x540)
  useEffect(() => {
    function handleResize() {
      if (!stageWrapperRef.current) return;
      const rect = stageWrapperRef.current.getBoundingClientRect();
      const pad = is916Mode ? 0 : 32;
      const availW = Math.max(300, rect.width - pad);
      const availH = Math.max(200, rect.height - pad);
      const scale = Math.min(availW / 960, availH / 540, 1.35);
      setStageScale(Math.max(0.3, scale));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [is916Mode]);

  // Khởi tạo và xáo trộn 3 mảnh ghép ở khay trên (Y ≈ 140)
  const initPieces = useCallback((shuffle = true) => {
    const slotX = [105, 270, 435];
    const slotY = 145;

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
      isSnapped: false,
      shakeTimer: 0,
    }));

    setPieces(newPieces);
    setIsSolved(false);
  }, []);

  // Khởi tạo ban đầu
  useEffect(() => {
    initPieces(true);
  }, [initPieces]);

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

      if (type === 'correct') {
        // Âm thanh snap khít nhẹ nhàng
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'wrong') {
        // Âm thanh buzz nhẹ khi sai
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(75, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
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
    if (!canvas) return { canvasX: 0, canvasY: 0 };

    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width === 0 || canvasRect.height === 0) return { canvasX: 0, canvasY: 0 };

    const cRawX = e.clientX - canvasRect.left;
    const cRawY = e.clientY - canvasRect.top;

    const canvasY = (cRawX / canvasRect.width) * 960;
    const canvasX = (1 - (cRawY / canvasRect.height)) * 540;

    return { canvasX, canvasY };
  }, []);

  // Xử lý sự kiện kéo thả (Pointer Events)
  const handlePointerDown = (e) => {
    if (isSolved) return;
    const { canvasX, canvasY } = getCanvasCoords(e);
    const pieceSize = settings.holeSize * 0.85;

    const pList = piecesRef.current;
    for (let i = pList.length - 1; i >= 0; i--) {
      const p = pList[i];
      if (p.isSnapped) continue;

      const half = pieceSize / 2;
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

        setPieces(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], isDragging: true };
          return updated;
        });

        playSound('pickup');
        e.preventDefault();
        break;
      }
    }
  };

  const handlePointerMove = (e) => {
    const idx = activeDragIndexRef.current;
    if (idx < 0) return;

    const { canvasX, canvasY } = getCanvasCoords(e);
    const offset = dragOffsetRef.current;

    setPieces(prev => {
      const updated = [...prev];
      if (updated[idx]) {
        updated[idx] = {
          ...updated[idx],
          currentX: canvasX + offset.x,
          currentY: canvasY + offset.y,
        };
      }
      return updated;
    });
  };

  const handlePointerUp = () => {
    const idx = activeDragIndexRef.current;
    if (idx < 0) return;

    const piece = piecesRef.current[idx];
    activeDragIndexRef.current = -1;

    if (!piece) return;

    const holeCenterX = settings.holeX + settings.holeSize / 2;
    const holeCenterY = settings.holeY + settings.holeSize / 2;

    const dist = Math.hypot(piece.currentX - holeCenterX, piece.currentY - holeCenterY);
    const snapThreshold = settings.holeSize * 0.75;

    if (dist <= snapThreshold) {
      if (piece.isCorrect) {
        // KÉO ĐÚNG -> Snap khít chính xác vào vị trí ô bị cắt
        setPieces(prev => {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            currentX: holeCenterX,
            currentY: holeCenterY,
            isDragging: false,
            isSnapped: true,
          };
          return updated;
        });

        setIsSolved(true);
        playSound('correct');
      } else {
        // KÉO SAI -> Rung lắc nhẹ và trả về khay
        playSound('wrong');
        setPieces(prev => {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            isDragging: false,
            shakeTimer: 0.4,
            currentX: piece.homeX,
            currentY: piece.homeY,
          };
          return updated;
        });
      }
    } else {
      // Thả ngoài ô -> Trả về khay
      setPieces(prev => {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          isDragging: false,
          currentX: piece.homeX,
          currentY: piece.homeY,
        };
        return updated;
      });
    }
  };

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        initPieces(true);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        initPieces(false);
      } else if (e.code === 'Escape' && is916Mode) {
        setIs916Mode(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initPieces, is916Mode, setIs916Mode]);

  // Main Render Loop (Canvas 2D) - 100% SẠCH SẼ, KHÔNG CHỮ THÔNG BÁO HOẶC HƯỚNG DẪN
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 540;
    const H = 960;

    let lastTime = performance.now();

    function render(currentTime) {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // 1. Clear nền canvas
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#0a0d14');
      bgGrad.addColorStop(1, '#05070a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Vùng bức ảnh chính (Khung từ Y = 250 đến Y = 920)
      const photoArea = { x: 20, y: 250, w: 500, h: 670 };

      // Vẽ Ảnh Chính
      if (mainImg) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h, 16);
        ctx.clip();

        const baseFit = Math.min(photoArea.w / mainImg.naturalWidth, photoArea.h / mainImg.naturalHeight);
        const scale = baseFit * (settings.imgScale / 100);
        const dw = mainImg.naturalWidth * scale;
        const dh = mainImg.naturalHeight * scale;
        const dx = photoArea.x + (photoArea.w - dw) / 2 + settings.imgOffsetX;
        const dy = photoArea.y + (photoArea.h - dh) / 2 + settings.imgOffsetY;

        ctx.drawImage(mainImg, dx, dy, dw, dh);
        ctx.restore();
      }

      // 3. Vùng Khoét (Hole) trên bức ảnh
      const { holeX, holeY, holeSize } = settings;

      // Chỉ vẽ vùng che đen khi CHƯA xếp đúng
      if (!isSolved) {
        ctx.save();
        // Tô đen vùng khoét
        ctx.fillStyle = '#05070a';
        ctx.beginPath();
        ctx.roundRect(holeX, holeY, holeSize, holeSize, 8);
        ctx.fill();

        // Viền nét đứt thanh mảnh nhấp nháy định vị
        const dashOffset = (currentTime / 40) % 20;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -dashOffset;
        ctx.stroke();
        ctx.restore();
      }
      // KHI ĐÃ SOLVED: Không vẽ bất kỳ viền hay lớp che nào -> Ảnh tự nhiên hoàn chỉnh 100%!

      // 4. Vẽ 3 Khay Chứa phía trên
      const pieceSize = holeSize * 0.85;
      const slotX = [105, 270, 435];
      const slotY = 145;

      for (let i = 0; i < 3; i++) {
        ctx.save();
        // Khung nền khay trơn tinh tế
        ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
        ctx.beginPath();
        ctx.roundRect(slotX[i] - pieceSize / 2 - 4, slotY - pieceSize / 2 - 4, pieceSize + 8, pieceSize + 8, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      // 5. Vẽ 3 Mảnh Ghép (Trích xuất ảnh sạch sẽ, KHÔNG có chữ A B C)
      const currentPieces = piecesRef.current;

      const drawPieceContent = (piece, px, py, pSize) => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(px - pSize / 2, py - pSize / 2, pSize, pSize, 8);
        ctx.clip();

        if (piece.isCorrect) {
          // Cắt CHÍNH XÁC từ vùng Hole của ảnh chính
          if (mainImg) {
            const baseFit = Math.min(photoArea.w / mainImg.naturalWidth, photoArea.h / mainImg.naturalHeight);
            const scale = baseFit * (settings.imgScale / 100);
            const dw = mainImg.naturalWidth * scale;
            const dh = mainImg.naturalHeight * scale;
            const dx = photoArea.x + (photoArea.w - dw) / 2 + settings.imgOffsetX;
            const dy = photoArea.y + (photoArea.h - dh) / 2 + settings.imgOffsetY;

            const srcX = (holeX - dx) / scale;
            const srcY = (holeY - dy) / scale;
            const srcSize = holeSize / scale;

            ctx.drawImage(
              mainImg,
              srcX, srcY, srcSize, srcSize,
              px - pSize / 2, py - pSize / 2, pSize, pSize
            );
          }
        } else if (piece.id === 'd1') {
          // Mảnh sai 1
          if (settings.distractorMode === 'custom' && customDistractor1) {
            ctx.drawImage(customDistractor1, px - pSize / 2, py - pSize / 2, pSize, pSize);
          } else if (mainImg) {
            const baseFit = Math.min(photoArea.w / mainImg.naturalWidth, photoArea.h / mainImg.naturalHeight);
            const scale = baseFit * (settings.imgScale / 100);
            const dw = mainImg.naturalWidth * scale;
            const dh = mainImg.naturalHeight * scale;
            const dx = photoArea.x + (photoArea.w - dw) / 2 + settings.imgOffsetX;
            const dy = photoArea.y + (photoArea.h - dh) / 2 + settings.imgOffsetY;

            const fakeHoleX = photoArea.x + photoArea.w * 0.2;
            const fakeHoleY = photoArea.y + photoArea.h * settings.autoSeed1;
            const srcX = Math.max(0, (fakeHoleX - dx) / scale);
            const srcY = Math.max(0, (fakeHoleY - dy) / scale);
            const srcSize = holeSize / scale;

            ctx.drawImage(
              mainImg,
              srcX, srcY, srcSize, srcSize,
              px - pSize / 2, py - pSize / 2, pSize, pSize
            );
          }
        } else if (piece.id === 'd2') {
          // Mảnh sai 2
          if (settings.distractorMode === 'custom' && customDistractor2) {
            ctx.drawImage(customDistractor2, px - pSize / 2, py - pSize / 2, pSize, pSize);
          } else if (mainImg) {
            const baseFit = Math.min(photoArea.w / mainImg.naturalWidth, photoArea.h / mainImg.naturalHeight);
            const scale = baseFit * (settings.imgScale / 100);
            const dw = mainImg.naturalWidth * scale;
            const dh = mainImg.naturalHeight * scale;
            const dx = photoArea.x + (photoArea.w - dw) / 2 + settings.imgOffsetX;
            const dy = photoArea.y + (photoArea.h - dh) / 2 + settings.imgOffsetY;

            const fakeHoleX = photoArea.x + photoArea.w * 0.65;
            const fakeHoleY = photoArea.y + photoArea.h * settings.autoSeed2;
            const srcX = Math.max(0, (fakeHoleX - dx) / scale);
            const srcY = Math.max(0, (fakeHoleY - dy) / scale);
            const srcSize = holeSize / scale;

            ctx.drawImage(
              mainImg,
              srcX, srcY, srcSize, srcSize,
              px - pSize / 2, py - pSize / 2, pSize, pSize
            );
          }
        }

        ctx.restore();
      };

      currentPieces.forEach((piece) => {
        // Nếu mảnh đúng đã snap vào vùng khuyết thì không cần vẽ lại viền nổi, để nó hòa vào ảnh chính
        if (piece.isSnapped) {
          drawPieceContent(piece, piece.currentX, piece.currentY, holeSize);
          return;
        }

        let drawX = piece.currentX;
        let drawY = piece.currentY;

        if (piece.shakeTimer > 0) {
          piece.shakeTimer -= dt;
          drawX += Math.sin(currentTime / 20) * 10;
        }

        const isDragging = piece.isDragging;
        const currentPSize = isDragging ? pieceSize * 1.08 : pieceSize;

        ctx.save();
        if (isDragging) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 16;
          ctx.shadowOffsetY = 8;
        }

        drawPieceContent(piece, drawX, drawY, currentPSize);

        // Viền mảnh ghép
        ctx.strokeStyle = piece.shakeTimer > 0 ? '#ef4444' : isDragging ? '#38bdf8' : '#ffffff';
        ctx.lineWidth = piece.shakeTimer > 0 ? 3 : isDragging ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(drawX - currentPSize / 2, drawY - currentPSize / 2, currentPSize, currentPSize, 8);
        ctx.stroke();

        ctx.restore();
      });

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
      {/* SÂN KHẤU CANVA 9:16 ROTATED -90 DEG */}
      <div 
        ref={stageWrapperRef}
        className="flex-1 relative flex items-center justify-center p-2 bg-slate-900/60 overflow-hidden"
      >
        <StageBackgroundOverlay />

        {/* CONTAINER CHỨA CANVAS XOAY NGANG 9:16 (540x960 xoay -90deg) */}
        <div 
          ref={containerRef}
          className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-800/80 transition-transform duration-150 cursor-grab active:cursor-grabbing"
          style={{
            width: `${stageScale * 960}px`,
            height: `${stageScale * 540}px`,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            className="absolute top-1/2 left-1/2 origin-center"
            style={{
              width: '540px',
              height: '960px',
              transform: `translate(-50%, -50%) scale(${stageScale}) rotate(-90deg)`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={540}
              height={960}
              className="w-full h-full block bg-black rounded-lg"
            />
          </div>

          {/* OVERLAY NÚT ĐIỀU HƯỚNG NHANH (ẨN HOÀN TOÀN KHI Ở CHẾ ĐỘ QUAY VIDEO is916Mode) */}
          {!is916Mode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-30 pointer-events-auto bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/80 shadow-2xl">
              <button
                onClick={() => initPieces(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Xáo trộn lại 3 mảnh ghép (Space)"
              >
                <Shuffle size={14} /> Xáo Trộn (Space)
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

                  <NumberInput
                    label="Kích thước ảnh (%):"
                    value={settings.imgScale}
                    onChange={(val) => setSettings(p => ({ ...p, imgScale: val }))}
                    min={40}
                    max={200}
                    step={5}
                  />

                  <NumberInput
                    label="Dịch chuyển Y (px):"
                    value={settings.imgOffsetY}
                    onChange={(val) => setSettings(p => ({ ...p, imgOffsetY: val }))}
                    min={-300}
                    max={300}
                    step={10}
                  />
                </div>
              )}
            </div>

            {/* MỤC 2: VÙNG BỊ KHOÉT (HOLE) */}
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
                  <NumberInput
                    label="Vị trí X (px):"
                    value={settings.holeX}
                    onChange={(val) => setSettings(p => ({ ...p, holeX: val }))}
                    min={30}
                    max={380}
                    step={10}
                  />

                  <NumberInput
                    label="Vị trí Y (px):"
                    value={settings.holeY}
                    onChange={(val) => setSettings(p => ({ ...p, holeY: val }))}
                    min={260}
                    max={780}
                    step={10}
                  />

                  <NumberInput
                    label="Kích thước ô vuông (px):"
                    value={settings.holeSize}
                    onChange={(val) => setSettings(p => ({ ...p, holeSize: val }))}
                    min={70}
                    max={220}
                    step={5}
                  />
                </div>
              )}
            </div>

            {/* MỤC 3: CÀI ĐẶT 2 MẢNH GHÉP SAI */}
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
              <div>• Bấm nút <b>"Khởi Chạy"</b> ở header: Màn hình sẽ ẩn 100% tất cả các nút và chữ hướng dẫn.</div>
              <div>• Kéo thử mảnh sai vào chỗ khuyết để tạo kịch tính.</div>
              <div>• Khi kéo đúng mảnh vào chỗ bị cắt, mảnh sẽ snap khớp liền lạc vào tranh tự nhiên mà không hiện bất kỳ thông báo chữ nào!</div>
              <div>• Nhấn phím <b>Space</b> để xáo trộn chơi lại, nhấn <b>ESC</b> để thoát.</div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
