import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Play, RotateCcw, Volume2, VolumeX, Sparkles, Sliders, 
  Eye, EyeOff, Hand, Layers, Maximize2, Minimize2, ChevronDown, ChevronUp,
  FileText, Check, Zap, Split, CornerDownLeft
} from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';
import NumberInput from './NumberInput';

/* --- WEB AUDIO API: SYNTHESIZER ÂM THANH GIẤY CHÂN THỰC --- */
const getAudioCtx = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!window._paperAudioCtx) {
    window._paperAudioCtx = new AudioCtx();
  }
  if (window._paperAudioCtx.state === 'suspended') {
    window._paperAudioCtx.resume();
  }
  return window._paperAudioCtx;
};

// 1. Tiếng giấy sột soạt hé mở (Paper Rustle)
const playRustleSfx = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.6));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(3400, now + dur);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {}
};

// 2. Tiếng mở toang giấy cực nhanh (Fast Whoosh / Swoosh)
const playWhooshSfx = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(4500, now + dur * 0.45);
    filter.frequency.exponentialRampToValueAtTime(500, now + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.4, now + dur * 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {}
};

// 3. Tiếng đóng sập giấy lại dứt khoát (Snap / Clap)
const playSnapSfx = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tiếng đập nén khí
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    // Tiếng giấy va vào nhau
    const bufferSize = Math.floor(ctx.sampleRate * 0.07);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.35, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {}
};

// ẢNH MẪU KHỞI ĐẦU CHẤT LƯỢNG CAO
const DEFAULT_COVER_IMAGE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'; // Pikachu tươi vui
const DEFAULT_SECRET_IMAGE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/26.png'; // Raichu mạnh mẽ

const STORAGE_KEY = 'folded_paper_settings_v2';

export default function FoldedPaperReveal({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  const getSaved = () => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  };
  const saved = getSaved();

  // State cấu hình ảnh
  const [coverImage, setCoverImage] = useState(saved.coverImage || DEFAULT_COVER_IMAGE);
  const [secretImage, setSecretImage] = useState(saved.secretImage || DEFAULT_SECRET_IMAGE);

  // State điều khiển độ mở giấy (0% -> 100%)
  const [openPercent, setOpenPercent] = useState(0);

  // Trạng thái hành động: 'idle' | 'peeking' | 'closing' | 'flash_open' | 'flash_hold' | 'flash_close'
  const [actionState, setActionState] = useState('idle');

  // Cài đặt kịch bản diễn
  const [peekPercent, setPeekPercent] = useState(saved.peekPercent ?? 22); // Độ hé mở % khi bấm Space (10% - 35%)
  const [flashHoldDuration, setFlashHoldDuration] = useState(saved.flashHoldDuration ?? 0.32); // Thời gian giữ mở toang khi bấm Enter (giây)
  const [enableSound, setEnableSound] = useState(saved.enableSound ?? true);
  const [showHands, setShowHands] = useState(saved.showHands ?? true);
  const [handScale, setHandScale] = useState(saved.handScale ?? 100);
  const [showCreases, setShowCreases] = useState(saved.showCreases ?? true);
  const [paperScale, setPaperScale] = useState(saved.paperScale ?? 95);
  const [paperOffsetX, setPaperOffsetX] = useState(saved.paperOffsetX ?? 0);
  const [paperOffsetY, setPaperOffsetY] = useState(saved.paperOffsetY ?? 0);

  // Accordion Sidebar UI state
  const [activeSection, setActiveSection] = useState('images'); // 'images' | 'sequence' | 'styling'

  // Chế độ 9:16
  const [internalIs916, setInternalIs916] = useState(false);
  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916;
  const setIs916Mode = propSetIs916Mode || setInternalIs916;

  // Timers Refs cho Space (Peek) và Enter (Flash)
  const peekTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const stageWrapperRef = useRef(null);

  // Tự động lưu cấu hình vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        coverImage,
        secretImage,
        peekPercent,
        flashHoldDuration,
        enableSound,
        showHands,
        handScale,
        showCreases,
        paperScale,
        paperOffsetX,
        paperOffsetY
      }));
    } catch (e) {}
  }, [coverImage, secretImage, peekPercent, flashHoldDuration, enableSound, showHands, handScale, showCreases, paperScale, paperOffsetX, paperOffsetY]);

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  /* --- HÀNH ĐỘNG 1: BẤM PHÍM CÁCH (SPACE) => MỞ HÉ 1 ÍT RỒI ĐÓNG LẠI (ẤN LIÊN TỤC CŨNG CHỈ HÉ 1 ÍT) --- */
  const triggerPeek = () => {
    // Nếu đang trong chuỗi Flash Reveal của Enter thì không ngắt
    if (actionState === 'flash_open' || actionState === 'flash_hold' || actionState === 'flash_close') {
      return;
    }

    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);

    if (enableSound) playRustleSfx();

    // Mở hé ra một khoảng nhỏ (giới hạn ở peekPercent, không bao giờ mở quá)
    setActionState('peeking');
    setOpenPercent(peekPercent);

    // Sau 200ms tự động đóng sập lại về 0%
    peekTimerRef.current = setTimeout(() => {
      setActionState('closing');
      setOpenPercent(0);

      peekTimerRef.current = setTimeout(() => {
        setActionState('idle');
      }, 160);
    }, 200);
  };

  /* --- HÀNH ĐỘNG 2: BẤM ENTER => MỞ TOANG 100% CỰC NHANH RỒI ĐÓNG SẬP LẠI --- */
  const triggerFlashReveal = () => {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

    if (enableSound) playWhooshSfx();

    // 1. Mở toang 100% cực nhanh
    setActionState('flash_open');
    setOpenPercent(100);

    // 2. Sau 160ms mở toang, giữ mở để nhìn rõ
    flashTimerRef.current = setTimeout(() => {
      setActionState('flash_hold');

      // 3. Sau thời gian giữ mở (flashHoldDuration), đóng sập lại cực nhanh
      flashTimerRef.current = setTimeout(() => {
        if (enableSound) playSnapSfx();
        setActionState('flash_close');
        setOpenPercent(0);

        // 4. Trở về trạng thái bình thường
        flashTimerRef.current = setTimeout(() => {
          setActionState('idle');
        }, 150);
      }, flashHoldDuration * 1000);
    }, 160);
  };

  // Bắt phím bấm Space, Enter và ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape' || e.code === 'Escape') {
        setIs916Mode(false);
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        triggerPeek();
      } else if (e.key === 'Enter' || e.code === 'Enter') {
        e.preventDefault();
        triggerFlashReveal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actionState, peekPercent, flashHoldDuration, enableSound]);

  // Upload ảnh 1 (Ảnh Ngoài khi Gập)
  const handleUploadCover = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(URL.createObjectURL(file));
      setOpenPercent(0);
      setActionState('idle');
    }
  };

  // Upload ảnh 2 (Ảnh Bí Mật Lộ Ra)
  const handleUploadSecret = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSecretImage(URL.createObjectURL(file));
      setOpenPercent(0);
      setActionState('idle');
    }
  };

  // Đặt lại mặc định
  const handleReset = () => {
    if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setActionState('idle');
    setOpenPercent(0);
    setPaperScale(95);
    setPaperOffsetX(0);
    setPaperOffsetY(0);
  };

  /* --- TÍNH TOÁN KÍCH THƯỚC & ĐỘ DỊCH CHUYỂN TỜ GIẤY --- */
  const basePaperW = 440;
  const basePaperH = 660;
  const wingW = basePaperW / 2; // 220px
  const maxShiftX = wingW * 0.95; // ~209px
  const currentShiftX = (openPercent / 100) * maxShiftX;
  const foldAngle = (1 - (openPercent / 100)) * 12;

  // Dynamic CSS Transitions để đạt độ mượt GPU 120Hz/60Hz tối đa
  const getTransitionStyle = () => {
    if (actionState === 'peeking') {
      return 'transform 0.16s cubic-bezier(0.18, 0.9, 0.3, 1)'; // Hé mở nhún nhẹ
    }
    if (actionState === 'closing') {
      return 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'; // Khép lại êm
    }
    if (actionState === 'flash_open') {
      return 'transform 0.15s cubic-bezier(0.08, 0.95, 0.2, 1)'; // Bung toang cực nhanh
    }
    if (actionState === 'flash_close') {
      return 'transform 0.14s cubic-bezier(0.7, 0, 0.85, 1)'; // Đóng sập dứt khoát
    }
    return 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
  };

  return (
    <div className={`flex w-full bg-slate-900 relative select-none ${is916Mode ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      
      {/* SIDEBAR ĐIỀU KHIỂN & CÀI ĐẶT (Ẩn khi ở chế độ Khởi chạy 9:16) */}
      {!is916Mode && (
        <div className="w-80 bg-slate-800 p-5 pb-24 border-r border-slate-700 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          {/* HEADER SIDEBAR */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <FileText size={18} /> TỜ GIẤY GẬP BÍ MẬT
            </h2>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
              Folding Reveal
            </span>
          </div>

          {/* 2 NÚT THAO TÁC CHÍNH THEO ĐÚNG PHÍM SPACE VÀ ENTER */}
          <div className="flex flex-col gap-2.5">
            {/* 1. NÚT SPACE: MỞ HÉ 1 ÍT RỒI ĐÓNG */}
            <button
              type="button"
              onClick={triggerPeek}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer ring-1 ring-amber-300/40"
            >
              <div className="flex items-center gap-2">
                <Play size={16} className="fill-white" />
                <span>Hé Mở 1 Ít Rồi Đóng</span>
              </div>
              <span className="px-2 py-0.5 bg-black/25 text-amber-100 rounded text-[10px] font-mono font-black">
                SPACE
              </span>
            </button>

            {/* 2. NÚT ENTER: MỞ TOANG NHANH RỒI ĐÓNG */}
            <button
              type="button"
              onClick={triggerFlashReveal}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-lg shadow-rose-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer ring-1 ring-rose-300/40"
            >
              <div className="flex items-center gap-2">
                <Zap size={16} className="fill-white" />
                <span>Mở Toang Nhanh Rồi Đóng</span>
              </div>
              <span className="px-2 py-0.5 bg-black/25 text-rose-100 rounded text-[10px] font-mono font-black flex items-center gap-1">
                ENTER <CornerDownLeft size={10} />
              </span>
            </button>
          </div>

          {/* THANH ĐIỀU CHỈNH ĐỘ MỞ THỦ CÔNG */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/80 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Split size={14} className="text-amber-400" /> Độ Mở Giấy:
              </span>
              <span className="font-mono text-amber-300 font-bold">{Math.round(openPercent)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(openPercent)}
              onChange={(e) => {
                setActionState('manual');
                setOpenPercent(Number(e.target.value));
              }}
              className="accent-amber-400 cursor-pointer h-2"
            />
            <div className="flex justify-between items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => { setActionState('idle'); setOpenPercent(0); }}
                className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                📕 Gập Kín (0%)
              </button>
              <button
                type="button"
                onClick={() => { setActionState('peeking'); setOpenPercent(peekPercent); }}
                className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                👀 Mở Hé ({peekPercent}%)
              </button>
              <button
                type="button"
                onClick={() => { setActionState('flash_hold'); setOpenPercent(100); }}
                className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                📖 Mở Hết (100%)
              </button>
            </div>
          </div>

          {/* ACCORDION 1: QUẢN LÝ 2 HÌNH ẢNH */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection(activeSection === 'images' ? null : 'images')}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  1. Tải 2 Hình Ảnh
                </span>
              </div>
              {activeSection === 'images' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </button>

            {activeSection === 'images' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                {/* Ảnh 1: Ảnh ngoài (Khi gấp lại) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Ảnh 1 (Ngoài - Khi Gập):
                    </label>
                  </div>
                  <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl cursor-pointer border border-dashed border-slate-600 hover:border-amber-400 text-xs font-semibold text-center transition-all">
                    <Upload size={14} className="text-amber-400" /> Đổi Ảnh Ngoài (.PNG/.JPG)
                    <input type="file" accept="image/*" onChange={handleUploadCover} className="hidden" />
                  </label>
                </div>

                {/* Ảnh 2: Ảnh bí mật (Khi mở ra) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Ảnh 2 (Bí Mật - Khi Mở):
                    </label>
                  </div>
                  <label className="flex items-center justify-center gap-2 p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl cursor-pointer border border-dashed border-slate-600 hover:border-emerald-400 text-xs font-semibold text-center transition-all">
                    <Upload size={14} className="text-emerald-400" /> Đổi Ảnh Bí Mật (.PNG/.JPG)
                    <input type="file" accept="image/*" onChange={handleUploadSecret} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: CÀI ĐẶT THỜI GIAN & ĐỘ HÉ MỞ */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection(activeSection === 'sequence' ? null : 'sequence')}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-orange-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  2. Độ Mở & Thời Gian
                </span>
              </div>
              {activeSection === 'sequence' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </button>

            {activeSection === 'sequence' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800 text-xs">
                {/* Độ hé mở phím Space */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Độ hé mở (Phím Space):</span>
                    <span className="font-mono text-amber-300 font-bold">{peekPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="35"
                    value={peekPercent}
                    onChange={(e) => setPeekPercent(Number(e.target.value))}
                    className="accent-amber-400 cursor-pointer h-1.5"
                  />
                  <span className="text-[10px] text-slate-500">Ấn liên tục Space sẽ chỉ hé mở trong khoảng này</span>
                </div>

                {/* Thời gian giữ mở toang phím Enter */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Thời gian giữ mở to (Phím Enter):</span>
                    <span className="font-mono text-white font-bold">{flashHoldDuration}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="0.8"
                    step="0.05"
                    value={flashHoldDuration}
                    onChange={(e) => setFlashHoldDuration(Number(e.target.value))}
                    className="accent-amber-400 cursor-pointer h-1.5"
                  />
                </div>

                {/* Âm thanh sột soạt & gập */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    {enableSound ? <Volume2 size={15} className="text-emerald-400" /> : <VolumeX size={15} className="text-slate-500" />}
                    Âm thanh giấy thật:
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnableSound(!enableSound)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      enableSound ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {enableSound ? 'BẬT' : 'TẮT'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 3: BÀN TAY & VỊ TRÍ GIẤY */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection(activeSection === 'styling' ? null : 'styling')}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Hand size={16} className="text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  3. Bàn Tay & Vị Trí Giấy
                </span>
              </div>
              {activeSection === 'styling' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </button>

            {activeSection === 'styling' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800 text-xs">
                {/* 2 Bàn tay giữ mép giấy */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Hand size={15} className="text-amber-400" /> 2 Bàn tay giữ mép giấy:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHands(!showHands)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      showHands ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {showHands ? 'HIỆN' : 'ẨN'}
                  </button>
                </div>

                {/* Kích thước bàn tay */}
                {showHands && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Cỡ bàn tay:</span>
                      <span className="font-mono text-white">{handScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="150"
                      value={handScale}
                      onChange={(e) => setHandScale(Number(e.target.value))}
                      className="accent-sky-400 cursor-pointer h-1.5"
                    />
                  </div>
                )}

                {/* Nếp nhăn & Bóng đổ 3D */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-300 font-medium">Bóng đổ nếp gấp 3D:</span>
                  <button
                    type="button"
                    onClick={() => setShowCreases(!showCreases)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      showCreases ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {showCreases ? 'BẬT' : 'TẮT'}
                  </button>
                </div>

                {/* Kích thước tờ giấy (Scale) */}
                <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Kích thước tờ giấy:</span>
                    <span className="font-mono text-white">{paperScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="140"
                    value={paperScale}
                    onChange={(e) => setPaperScale(Number(e.target.value))}
                    className="accent-amber-400 cursor-pointer h-1.5"
                  />
                </div>

                {/* Offset X & Y */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-[10px]">Trục Ngang (X):</span>
                    <NumberInput
                      min={-300}
                      max={300}
                      value={paperOffsetX}
                      onChange={(val) => setPaperOffsetX(val)}
                      className="w-full px-2 py-1 bg-slate-800 text-white rounded text-center font-mono border border-slate-700"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-400 text-[10px]">Trục Dọc (Y):</span>
                    <NumberInput
                      min={-300}
                      max={300}
                      value={paperOffsetY}
                      onChange={(val) => setPaperOffsetY(val)}
                      className="w-full px-2 py-1 bg-slate-800 text-white rounded text-center font-mono border border-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NÚT RESET CÀI ĐẶT */}
          <button
            type="button"
            onClick={handleReset}
            className="mt-auto py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw size={14} className="text-amber-400" /> Đặt Lại Vị Trí Chuẩn
          </button>

        </div>
      )}

      {/* SÂN KHẤU HIỂN THỊ CHÍNH (KHỞI CHẠY XOAY -90 ĐỘ 9:16) */}
      <div 
        ref={stageWrapperRef}
        className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${
          is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
        }`}
      >
        {/* BANNER HƯỚNG DẪN KHI Ở CHẾ ĐỘ 9:16 KHỞI CHẠY */}
        {is916Mode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/85 text-white text-xs font-semibold px-4 py-2 rounded-full border border-slate-700 shadow-2xl backdrop-blur-md z-50 pointer-events-none flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Bấm <b>SPACE</b>: Hé mở 1 ít rồi đóng</span>
            <span className="text-slate-500">•</span>
            <span>Bấm <b>ENTER</b>: Mở toang nhanh rồi đóng</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-[11px]">ESC: Thoát</span>
          </div>
        )}

        {/* CONTAINER KHUNG SÂN KHẤU NẰM NGANG NỀN GRID TRẮNG */}
        <div
          className={`relative overflow-hidden transition-all duration-300 flex items-center justify-center ${
            is916Mode
              ? 'w-full h-full bg-white flex items-center justify-center'
              : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
          }`}
        >
          {/* Lớp nền hoa văn sân khấu linh hoạt */}
          <StageBackgroundOverlay />

          {/* SÂN KHẤU CANVAS 540x960 XOAY -90 ĐỘ CHUẨN TIKTOK/SHORTS */}
          <div
            className="relative z-10 flex items-center justify-center select-none"
            style={{
              transform: `rotate(-90deg) scale(${is916Mode ? 1.25 : 0.95})`,
              transformOrigin: 'center center',
              width: '540px',
              height: '960px'
            }}
          >
            {/* CONTAINER TỜ GIẤY GẬP BÊN TRONG CANVAS */}
            <div
              className="relative flex items-center justify-center"
              style={{
                width: `${basePaperW}px`,
                height: `${basePaperH}px`,
                transform: `scale(${paperScale / 100}) translate(${paperOffsetX}px, ${paperOffsetY}px)`,
                transformOrigin: 'center center',
                perspective: '1200px'
              }}
            >
              {/* === LỚP 1: ẢNH BÍ MẬT NẰM Ở DƯỚI CÙNG (HIDDEN SECRET IMAGE) === */}
              <div 
                className="absolute inset-0 z-0 bg-white shadow-xl rounded-lg overflow-hidden flex items-center justify-center border border-slate-200"
                style={{
                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0, 0, 0, 0.1)'
                }}
              >
                {secretImage ? (
                  <img
                    src={secretImage}
                    alt="Secret Revealed Image"
                    className="w-full h-full object-contain p-2 select-none pointer-events-none"
                  />
                ) : (
                  <div className="text-slate-400 text-xs font-semibold">Chưa có Ảnh Bí Mật</div>
                )}

                {/* Vết bóng đổ nhẹ ở khe mở 2 bên đè lên ảnh dưới */}
                {showCreases && openPercent < 95 && (
                  <>
                    <div 
                      className="absolute inset-y-0 pointer-events-none"
                      style={{
                        left: `${wingW - currentShiftX}px`,
                        width: '35px',
                        background: 'linear-gradient(to right, rgba(0,0,0,0.35), transparent)',
                        opacity: Math.min(1, openPercent / 20),
                        transition: getTransitionStyle()
                      }}
                    />
                    <div 
                      className="absolute inset-y-0 pointer-events-none"
                      style={{
                        right: `${wingW - currentShiftX}px`,
                        width: '35px',
                        background: 'linear-gradient(to left, rgba(0,0,0,0.35), transparent)',
                        opacity: Math.min(1, openPercent / 20),
                        transition: getTransitionStyle()
                      }}
                    />
                  </>
                )}
              </div>

              {/* === LỚP 2: CÁNH GIẤY TRÁI (LEFT FOLD WING) === */}
              <div
                className="absolute top-0 bottom-0 left-0 z-10 overflow-hidden bg-white rounded-l-lg"
                style={{
                  width: `${wingW}px`,
                  transform: `translateX(-${currentShiftX}px) rotateY(${foldAngle}deg)`,
                  transformOrigin: 'left center',
                  transition: getTransitionStyle(),
                  willChange: 'transform',
                  boxShadow: openPercent > 0 
                    ? '8px 0 20px -3px rgba(0, 0, 0, 0.35), 2px 0 6px rgba(0,0,0,0.15)' 
                    : '1px 0 3px rgba(0, 0, 0, 0.2)',
                  borderRight: openPercent === 0 ? '1px solid rgba(0,0,0,0.12)' : 'none'
                }}
              >
                {/* Ảnh Bìa Ngoài (cắt nửa bên trái) */}
                <div 
                  className="absolute top-0 bottom-0 left-0 flex items-center justify-start pointer-events-none select-none"
                  style={{
                    width: `${basePaperW}px`,
                    height: `${basePaperH}px`
                  }}
                >
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt="Cover Left Part"
                      className="w-full h-full object-contain p-2 select-none pointer-events-none"
                    />
                  )}
                </div>

                {/* Dải bóng nếp gấp bên trong mép gập */}
                {showCreases && (
                  <div 
                    className="absolute inset-y-0 right-0 w-8 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to left, rgba(0,0,0,0.18), transparent)'
                    }}
                  />
                )}
              </div>

              {/* === LỚP 3: CÁNH GIẤY PHẢI (RIGHT FOLD WING) === */}
              <div
                className="absolute top-0 bottom-0 right-0 z-10 overflow-hidden bg-white rounded-r-lg"
                style={{
                  width: `${wingW}px`,
                  transform: `translateX(${currentShiftX}px) rotateY(-${foldAngle}deg)`,
                  transformOrigin: 'right center',
                  transition: getTransitionStyle(),
                  willChange: 'transform',
                  boxShadow: openPercent > 0 
                    ? '-8px 0 20px -3px rgba(0, 0, 0, 0.35), -2px 0 6px rgba(0,0,0,0.15)' 
                    : '-1px 0 3px rgba(0, 0, 0, 0.2)',
                  borderLeft: openPercent === 0 ? '1px solid rgba(0,0,0,0.12)' : 'none'
                }}
              >
                {/* Ảnh Bìa Ngoài (cắt nửa bên phải) */}
                <div 
                  className="absolute top-0 bottom-0 right-0 flex items-center justify-end pointer-events-none select-none"
                  style={{
                    width: `${basePaperW}px`,
                    height: `${basePaperH}px`
                  }}
                >
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt="Cover Right Part"
                      className="w-full h-full object-contain p-2 select-none pointer-events-none"
                    />
                  )}
                </div>

                {/* Dải bóng nếp gấp bên trong mép gập */}
                {showCreases && (
                  <div 
                    className="absolute inset-y-0 left-0 w-8 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to right, rgba(0,0,0,0.18), transparent)'
                    }}
                  />
                )}
              </div>

              {/* === LỚP 4: 2 BÀN TAY CẦM 2 MÉP GIẤY KÉO MỞ (REALISTIC HOLDING HANDS) === */}
              {showHands && (
                <>
                  {/* Bàn tay trái (bám vào mép ngoài cánh trái) */}
                  <div
                    className="absolute z-20 pointer-events-none select-none"
                    style={{
                      left: `${-28 - currentShiftX}px`,
                      top: '52%',
                      transform: `translateY(-50%) scale(${handScale / 100})`,
                      transformOrigin: 'center center',
                      transition: getTransitionStyle(),
                      willChange: 'transform, left',
                      filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.35))'
                    }}
                  >
                    <svg width="76" height="88" viewBox="0 0 76 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 0 30 Q 18 26, 38 28 Q 50 30, 56 38 Q 62 46, 56 56 Q 48 68, 30 68 L 0 65 Z" fill="#f8b68a" stroke="#4a2511" strokeWidth="3" />
                      <path d="M 36 28 C 48 20, 68 28, 72 40 C 75 50, 64 62, 50 60 C 44 59, 40 50, 42 42 Z" fill="#ffd1b3" stroke="#4a2511" strokeWidth="3.5" />
                      <ellipse cx="64" cy="38" rx="5" ry="7" fill="#fff0e6" stroke="#c48a6a" strokeWidth="1.5" transform="rotate(15 64 38)" />
                      <path d="M 48 36 Q 52 40, 50 46" stroke="#c48a6a" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Bàn tay phải (bám vào mép ngoài cánh phải) */}
                  <div
                    className="absolute z-20 pointer-events-none select-none"
                    style={{
                      right: `${-28 - currentShiftX}px`,
                      top: '52%',
                      transform: `translateY(-50%) scaleX(-1) scale(${handScale / 100})`,
                      transformOrigin: 'center center',
                      transition: getTransitionStyle(),
                      willChange: 'transform, right',
                      filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.35))'
                    }}
                  >
                    <svg width="76" height="88" viewBox="0 0 76 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 0 30 Q 18 26, 38 28 Q 50 30, 56 38 Q 62 46, 56 56 Q 48 68, 30 68 L 0 65 Z" fill="#f8b68a" stroke="#4a2511" strokeWidth="3" />
                      <path d="M 36 28 C 48 20, 68 28, 72 40 C 75 50, 64 62, 50 60 C 44 59, 40 50, 42 42 Z" fill="#ffd1b3" stroke="#4a2511" strokeWidth="3.5" />
                      <ellipse cx="64" cy="38" rx="5" ry="7" fill="#fff0e6" stroke="#c48a6a" strokeWidth="1.5" transform="rotate(15 64 38)" />
                      <path d="M 48 36 Q 52 40, 50 46" stroke="#c48a6a" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
