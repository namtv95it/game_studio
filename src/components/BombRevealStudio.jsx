import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, RotateCcw, Upload, Trash2, Plus, Volume2, VolumeX, Sparkles, 
  Flame, Heart, Eye, ArrowDown, Settings, ChevronDown, ChevronUp, Layers, Check
} from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';

/* --- BOMB AUDIO SYNTHESIZER (Web Audio API - Không cần tải file ngoài) --- */
const getAudioCtx = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!window._bombAudioCtx) {
    window._bombAudioCtx = new AudioCtx();
  }
  if (window._bombAudioCtx.state === 'suspended') {
    window._bombAudioCtx.resume();
  }
  return window._bombAudioCtx;
};

// Tiếng tíc tắc đếm ngược kịch tính
const playTickSfx = (count) => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = count === 1 ? 950 : (count === 2 ? 800 : 650);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {}
};

// Tiếng xì ngòi bom
const playFuseSfx = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 2.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.Q.setValueAtTime(4, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 2.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {}
};

// Tiếng Nổ Siêu Uy Lực (Deep Explosion + Shockwave)
const playExplosionSfx = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Sub-bass thump
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.7);
    subGain.gain.setValueAtTime(0.8, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.2);

    // Boom blast noise
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 1.0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Tinh tế thêm tiếng chuông biến hình thiên thần / ma thuật
    setTimeout(() => {
      try {
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const t = ctx.currentTime + idx * 0.08;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t);
          g.gain.setValueAtTime(0.2, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.6);
        });
      } catch (e) {}
    }, 450);
  } catch (e) {}
};

// Cấu hình 3 quả bom mẫu khởi đầu
const DEFAULT_BOMBS = [
  {
    id: 'rainbow',
    name: 'Bom Cầu Vồng',
    subtitle: 'Rainbow Blast',
    icon: '🌈',
    color: '#38bdf8',
    gradient: 'from-pink-500 via-amber-400 to-sky-400',
    flashColor: 'rgba(255, 230, 255, 0.98)',
    afterImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', // Pikachu tươi vui
    afterName: 'Pikachu Thần Sấm Cầu Vồng'
  },
  {
    id: 'love',
    name: 'Bom Tình Yêu',
    subtitle: 'Love Bomb',
    icon: '💖',
    color: '#ec4899',
    gradient: 'from-rose-500 via-pink-400 to-red-400',
    flashColor: 'rgba(255, 190, 220, 0.98)',
    afterImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png', // Jigglypuff
    afterName: 'Jigglypuff Ngọt Ngào'
  },
  {
    id: 'devil',
    name: 'Bom Ác Quỷ',
    subtitle: 'Devil Bomb',
    icon: '🔥',
    color: '#ef4444',
    gradient: 'from-purple-700 via-red-600 to-amber-500',
    flashColor: 'rgba(255, 90, 50, 0.98)',
    afterImage: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png', // Charizard
    afterName: 'Charizard Rồng Lửa Hắc Ám'
  }
];

const STORAGE_KEY = 'bomb_reveal_settings_v1';

export default function BombRevealStudio({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  // Lấy dữ liệu đã lưu
  const getSaved = () => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  };

  const saved = getSaved();

  // Quản lý 3 quả bom
  const [bombs, setBombs] = useState(saved.bombs || DEFAULT_BOMBS);
  const [selectedBombId, setSelectedBombId] = useState(bombs[0].id);

  // Ảnh trước khi nổ (Bóng đen Silhouette)
  const [beforeImage, setBeforeImage] = useState(saved.beforeImage || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png');
  const [characterScale, setCharacterScale] = useState(saved.characterScale ?? 90);
  const [characterOffsetY, setCharacterOffsetY] = useState(saved.characterOffsetY ?? 30);

  // Trạng thái đố / hiệu ứng
  const [enableSound, setEnableSound] = useState(saved.enableSound ?? true);
  const [countdownDuration, setCountdownDuration] = useState(saved.countdownDuration ?? 3); // 3 giây
  const [shakeIntensity, setShakeIntensity] = useState(saved.shakeIntensity ?? 15);
  const [showQuestionMarks, setShowQuestionMarks] = useState(saved.showQuestionMarks ?? true);

  // Watermark (Đồng bộ chuẩn 100% giống Soi Đèn Pin)
  const [enableWatermark, setEnableWatermark] = useState(saved.enableWatermark ?? true);
  const [watermarkText, setWatermarkText] = useState(saved.watermarkText !== undefined ? saved.watermarkText : '@Soonix');
  const [watermarkFontSize, setWatermarkFontSize] = useState(saved.watermarkFontSize ?? 14);
  const [watermarkColor, setWatermarkColor] = useState(saved.watermarkColor || '#94a3b8');
  const [watermarkOpacity, setWatermarkOpacity] = useState(saved.watermarkOpacity ?? 50);
  const [watermarkDistance, setWatermarkDistance] = useState(saved.watermarkDistance ?? 16);
  const [enableWatermarkBg, setEnableWatermarkBg] = useState(saved.enableWatermarkBg ?? true);
  const [watermarkBgColor, setWatermarkBgColor] = useState(saved.watermarkBgColor || '#ffcc00');
  const [watermarkBgOpacity, setWatermarkBgOpacity] = useState(saved.watermarkBgOpacity ?? 100);

  // State sân khấu tương tác
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);
  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  // Active accordion section: 'bombs', 'character', 'effects', 'watermark'
  const [activeSection, setActiveSection] = useState('bombs');
  const toggleSection = (key) => setActiveSection(prev => prev === key ? null : key);

  // Animation Stage States: 'idle' | 'dropped' | 'counting' | 'exploding' | 'revealed'
  const [stageState, setStageState] = useState('idle');
  const [activeBomb, setActiveBomb] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [screenShake, setScreenShake] = useState(false);
  const [revealedImage, setRevealedImage] = useState(null);

  // Dragging state
  const [draggedBomb, setDraggedBomb] = useState(null);
  const [isOverDropzone, setIsOverDropzone] = useState(false);

  // Canvas ref cho việc render silhouette
  const canvasRef = useRef(null);
  const beforeImgRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // Bắt phím ESC để thoát chế độ Toàn màn hình 9:16
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        setIs916Mode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIs916Mode]);

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bombs,
      beforeImage,
      characterScale,
      characterOffsetY,
      enableSound,
      countdownDuration,
      shakeIntensity,
      showQuestionMarks,
      enableWatermark,
      watermarkText,
      watermarkFontSize,
      watermarkColor,
      watermarkOpacity,
      watermarkDistance,
      enableWatermarkBg,
      watermarkBgColor,
      watermarkBgOpacity
    }));
  }, [bombs, beforeImage, characterScale, characterOffsetY, enableSound, countdownDuration, shakeIntensity, showQuestionMarks, enableWatermark, watermarkText, watermarkFontSize, watermarkColor, watermarkOpacity, watermarkDistance, enableWatermarkBg, watermarkBgColor, watermarkBgOpacity]);

  // Load before image for silhouette canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = beforeImage;
    img.onload = () => {
      beforeImgRef.current = img;
      renderSilhouette();
    };
  }, [beforeImage]);

  // Khi thay đổi thuộc tính hoặc trạng thái sân khấu / ảnh hé lộ thì render lại canvas
  useEffect(() => {
    renderSilhouette();
  }, [characterScale, characterOffsetY, stageState, revealedImage, showQuestionMarks]);

  // Render bóng đen lên canvas 540x960
  const renderSilhouette = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = beforeImgRef.current;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (stageState === 'revealed' && revealedImage) {
      // Khi đã nổ, vẽ ảnh nhân vật đầy màu sắc của quả bom vừa nổ
      const revImg = new Image();
      revImg.crossOrigin = 'anonymous';
      revImg.src = revealedImage;
      revImg.onload = () => {
        const aspect = revImg.width / revImg.height;
        let drawW = width * 0.75 * (characterScale / 100);
        let drawH = drawW / aspect;
        let drawX = (width - drawW) / 2;
        let drawY = (height - drawH) / 2 + characterOffsetY;
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(revImg, drawX, drawY, drawW, drawH);
      };
      if (revImg.complete && revImg.width) {
        const aspect = revImg.width / revImg.height;
        let drawW = width * 0.75 * (characterScale / 100);
        let drawH = drawW / aspect;
        let drawX = (width - drawW) / 2;
        let drawY = (height - drawH) / 2 + characterOffsetY;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(revImg, drawX, drawY, drawW, drawH);
      }
      return;
    }

    if (!img || !img.width) return;

    // Tính toán kích thước fit 540x960
    const aspect = img.width / img.height;
    let drawW = width * 0.75 * (characterScale / 100);
    let drawH = drawW / aspect;
    let drawX = (width - drawW) / 2;
    let drawY = (height - drawH) / 2 + characterOffsetY;

    // Bước 1: Vẽ ảnh gốc
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Bước 2: Phủ đen đặc lên phần alpha
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Bước 3: Vẽ dấu hỏi chấm lớn ở giữa bóng đen nếu bật
    if (showQuestionMarks && stageState !== 'revealed') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '900 70px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText('?', width / 2, height / 2 + characterOffsetY);
    }
  };

  // Kích hoạt chuỗi nổ bom khi quả bom được thả vào sân khấu
  const triggerBombSequence = (bomb) => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    setActiveBomb(bomb);
    setRevealedImage(null);
    setFlashOpacity(0);
    setScreenShake(false);
    setStageState('counting');
    setCountdown(countdownDuration);

    if (enableSound) {
      playFuseSfx();
      playTickSfx(countdownDuration);
    }

    // Đếm ngược từng giây
    let currentSec = countdownDuration;
    countdownTimerRef.current = setInterval(() => {
      currentSec -= 1;
      if (currentSec > 0) {
        setCountdown(currentSec);
        if (enableSound) playTickSfx(currentSec);
        // Bắt đầu rung mạnh ở 1s cuối
        if (currentSec === 1) setScreenShake(true);
      } else {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        executeExplosion(bomb);
      }
    }, 1000);
  };

  // Thực hiện khoảnh khắc BÙNG NỔ
  const executeExplosion = (bomb) => {
    setStageState('exploding');
    setScreenShake(true);

    if (enableSound) playExplosionSfx();

    // Chớp trắng toàn màn hình 100% tinh khiết
    setFlashOpacity(1);

    // Thay đổi ảnh sang nhân vật mới ở giữa khoảnh khắc chớp sáng
    setTimeout(() => {
      setRevealedImage(bomb.afterImage);
      setStageState('revealed');
    }, 250);

    // Ánh sáng mờ dần từ từ để hé lộ nhân vật
    setTimeout(() => {
      setFlashOpacity(0);
      setScreenShake(false);
    }, 450);
  };

  // Reset lại sân khấu về ban đầu
  const handleReset = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setStageState('idle');
    setActiveBomb(null);
    setFlashOpacity(0);
    setScreenShake(false);
    setRevealedImage(null);
  };

  // Kéo thả quả bom (HTML5 Drag & Drop)
  const handleDragStart = (e, bomb) => {
    if (stageState === 'counting' || stageState === 'exploding') return;
    setDraggedBomb(bomb);
    e.dataTransfer.setData('text/plain', bomb.id);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOverDropzone(false);
    if (!draggedBomb || stageState === 'counting' || stageState === 'exploding') return;
    triggerBombSequence(draggedBomb);
  };

  // Click trực tiếp quả bom để kích hoạt (hỗ trợ kích nổ bất kỳ quả nào, kể cả sau khi đã có quả nổ trước đó)
  const handleDirectClickBomb = (bomb) => {
    if (stageState === 'counting' || stageState === 'exploding') return;
    triggerBombSequence(bomb);
  };

  // Upload ảnh cho Before
  const handleBeforeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBeforeImage(url);
    }
  };

  // Cập nhật thông tin cho 1 quả bom
  const updateBomb = (id, field, value) => {
    setBombs(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  // Upload ảnh Reveal After cho 1 quả bom
  const handleAfterUpload = (id, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateBomb(id, 'afterImage', url);
    }
  };

  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      {/* SIDEBAR CÀI ĐẶT (Ẩn hoàn toàn khi ở Chế độ Khởi chạy 9:16) */}
      {!is916Mode && (
        <div className="w-80 bg-slate-800 p-5 border-r border-slate-700 flex flex-col gap-4 overflow-y-auto z-20">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              💣 BOMB REVEAL STUDIO
            </h2>
            <button
              onClick={() => setEnableSound(!enableSound)}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                enableSound ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-700 text-slate-400 border-slate-600'
              }`}
              title="Bật/Tắt âm thanh nổ"
            >
              {enableSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 -mt-2 leading-relaxed">
            Thả bom xuống bóng đen ➔ Đếm ngược 3s rung chuyển ➔ Nổ chớp sáng hé lộ nhân vật đầy kịch tính!
          </p>

          {/* NHÓM 1: CẤU HÌNH 3 QUẢ BOM & NHÂN VẬT HÉ LỘ */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('bombs')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">💣</span>
                <span className="text-xs font-bold text-amber-300">Cấu Hình 3 Quả Bom</span>
              </div>
              {activeSection === 'bombs' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </button>

            {activeSection === 'bombs' && (
              <div className="p-3 flex flex-col gap-3.5 border-t border-slate-800">
                {/* Chọn quả bom để chỉnh sửa chi tiết */}
                <div className="grid grid-cols-3 gap-1.5">
                  {bombs.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBombId(b.id)}
                      className={`p-2 rounded-lg flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        selectedBombId === b.id
                          ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="text-xl">{b.icon}</span>
                      <span className="text-[10px] truncate w-full text-center">{b.name}</span>
                    </button>
                  ))}
                </div>

                {/* Form chi tiết của quả bom đang chọn */}
                {(() => {
                  const currentBomb = bombs.find(b => b.id === selectedBombId) || bombs[0];
                  return (
                    <div className="flex flex-col gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <span className="text-base">{currentBomb.icon}</span>
                          Chỉnh sửa: {currentBomb.name}
                        </span>
                      </div>

                      {/* Tên & Icon */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400">Tên quả bom:</label>
                          <input
                            type="text"
                            value={currentBomb.name}
                            onChange={(e) => updateBomb(currentBomb.id, 'name', e.target.value)}
                            className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-400">Icon Emoji:</label>
                          <input
                            type="text"
                            value={currentBomb.icon}
                            onChange={(e) => updateBomb(currentBomb.id, 'icon', e.target.value)}
                            className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-center text-white"
                          />
                        </div>
                      </div>

                      {/* Tên nhân vật khi hé lộ */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-400">Tên nhân vật khi biến hình:</label>
                        <input
                          type="text"
                          value={currentBomb.afterName}
                          onChange={(e) => updateBomb(currentBomb.id, 'afterName', e.target.value)}
                          placeholder="Ví dụ: Pikachu Thần Sấm"
                          className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-white"
                        />
                      </div>

                      {/* Ảnh nhân vật hé lộ sau khi nổ quả bom này */}
                      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
                        <label className="text-[10px] text-slate-300 font-medium">Ảnh nhân vật mới sau khi nổ:</label>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={currentBomb.afterImage} alt="After" className="w-full h-full object-contain" />
                          </div>
                          <label className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sky-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
                            <Upload size={14} /> Thay Ảnh Biến Hình
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleAfterUpload(currentBomb.id, e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* NHÓM 2: NHÂN VẬT GỐC (BÓNG ĐEN SILHOUETTE) */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('character')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">👤</span>
                <span className="text-xs font-bold text-sky-300">Bóng Đen Nhân Vật (Trước Nổ)</span>
              </div>
              {activeSection === 'character' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </button>

            {activeSection === 'character' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                {/* Upload ảnh gốc */}
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={beforeImage} alt="Before" className="w-full h-full object-contain filter invert contrast-200" />
                  </div>
                  <label className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sky-400 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
                    <Upload size={14} /> Tải Ảnh Bóng Đen (PNG)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBeforeUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Tỉ lệ scale */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Kích thước ảnh:</span>
                    <span className="font-mono text-white text-xs">{characterScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={characterScale}
                    onChange={(e) => setCharacterScale(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>

                {/* Offset Y */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Vị trí cao/thấp (Y):</span>
                    <span className="font-mono text-white text-xs">{characterOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    value={characterOffsetY}
                    onChange={(e) => setCharacterOffsetY(Number(e.target.value))}
                    className="accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>

                {/* Toggle dấu hỏi chấm */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-xs text-slate-300">Dấu hỏi ❓ trên bóng:</span>
                  <label className="flex items-center gap-1 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQuestionMarks}
                      onChange={(e) => setShowQuestionMarks(e.target.checked)}
                      className="accent-amber-400 cursor-pointer"
                    />
                    <span className={showQuestionMarks ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {showQuestionMarks ? 'Bật' : 'Tắt'}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* NHÓM 3: HIỆU ỨNG ĐẾM NGƯỢC & RUNG LẮC */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('effects')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span className="text-xs font-bold text-rose-300">Hiệu Ứng Nổ & Đếm Ngược</span>
              </div>
              {activeSection === 'effects' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </button>

            {activeSection === 'effects' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                {/* Thời gian đếm ngược */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Thời gian đếm ngược:</span>
                    <span className="font-mono text-white text-xs">{countdownDuration} giây</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={countdownDuration}
                    onChange={(e) => setCountdownDuration(Number(e.target.value))}
                    className="accent-rose-500 cursor-pointer h-1.5"
                  />
                </div>

                {/* Độ rung lắc màn hình */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Độ rung chấn màn hình:</span>
                    <span className="font-mono text-white text-xs">{shakeIntensity}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={shakeIntensity}
                    onChange={(e) => setShakeIntensity(Number(e.target.value))}
                    className="accent-rose-500 cursor-pointer h-1.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* NHÓM 4: WATERMARK / LOGO KÊNH */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/80 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('watermark')}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🏷️</span>
                <span className="text-xs font-bold text-emerald-300">Watermark / Logo Kênh</span>
              </div>
              {activeSection === 'watermark' ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </button>

            {activeSection === 'watermark' && (
              <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Bật Watermark:</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={(e) => setEnableWatermark(e.target.checked)}
                      className="accent-emerald-400 cursor-pointer"
                    />
                    <span className={enableWatermark ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {enableWatermark ? 'Đang Bật' : 'Đang Tắt'}
                    </span>
                  </label>
                </div>

                {enableWatermark && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-400">Nội dung watermark:</label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        placeholder="Nhập watermark (ví dụ: @Soonix)"
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                      />
                    </div>

                    {/* Kích thước phông chữ & Màu sắc */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Cỡ chữ:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="8"
                              max="120"
                              value={watermarkFontSize}
                              onChange={(e) => setWatermarkFontSize(Math.max(1, Number(e.target.value)))}
                              className="w-12 px-1 py-0.5 bg-slate-700 text-white rounded text-[11px] text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                            />
                            <span className="text-[10px] text-slate-400">px</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="100"
                          value={watermarkFontSize}
                          onChange={(e) => setWatermarkFontSize(Number(e.target.value))}
                          className="accent-emerald-400 cursor-pointer h-1.5"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Màu chữ:</span>
                          <input
                            type="color"
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                          />
                        </div>
                        <div className="flex items-center gap-1 justify-end pt-1">
                          {['#94a3b8', '#ffffff', '#000000', '#facc15', '#38bdf8'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setWatermarkColor(c)}
                              className={`w-3.5 h-3.5 rounded-full border ${watermarkColor === c ? 'border-emerald-400 scale-110' : 'border-slate-600'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Khoảng cách cách mép & Độ mờ */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Cách mép:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={watermarkDistance}
                              onChange={(e) => setWatermarkDistance(Number(e.target.value))}
                              className="w-12 px-1 py-0.5 bg-slate-700 text-white rounded text-[11px] text-right border border-slate-600 focus:outline-none focus:border-sky-400 font-mono"
                            />
                            <span className="text-[10px] text-slate-400">px</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="-120"
                          max="200"
                          value={watermarkDistance}
                          onChange={(e) => setWatermarkDistance(Number(e.target.value))}
                          className="accent-emerald-400 cursor-pointer h-1.5"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Độ mờ:</span>
                          <span className="text-white font-mono text-[11px]">{watermarkOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                          className="accent-emerald-400 cursor-pointer h-1.5"
                        />
                      </div>
                    </div>

                    {/* Nền Thẻ Watermark (Badge bo góc) */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                          <span>🎨 Màu nền Thẻ Watermark:</span>
                        </span>
                        <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enableWatermarkBg}
                            onChange={(e) => setEnableWatermarkBg(e.target.checked)}
                            className="accent-amber-400 cursor-pointer"
                          />
                          <span className="text-amber-300 font-medium">{enableWatermarkBg ? 'Bật' : 'Tắt'}</span>
                        </label>
                      </div>

                      {enableWatermarkBg && (
                        <div className="flex flex-col gap-2 pl-2 border-l-2 border-amber-500/30">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Màu nền & Độ đậm:</span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={watermarkBgColor}
                                onChange={(e) => setWatermarkBgColor(e.target.value)}
                                className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                              />
                              <span className="text-[11px] font-mono text-white">{watermarkBgOpacity}%</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 justify-end">
                            {[
                              { name: 'Vàng rực', color: '#ffcc00' },
                              { name: 'Vàng chanh', color: '#facc15' },
                              { name: 'Cam', color: '#fb923c' },
                              { name: 'Đen mờ', color: '#000000' },
                            ].map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => setWatermarkBgColor(preset.color)}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${watermarkBgColor === preset.color ? 'border-amber-400 text-amber-300 font-bold' : 'border-slate-700 text-slate-400 hover:text-slate-300'}`}
                              >
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CÁC NÚT ĐIỀU KHIỂN HÀNH ĐỘNG */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleReset}
              className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-600 shadow"
            >
              <RotateCcw size={15} /> Diễn Lại Từ Đầu (Reset)
            </button>

            <button
              onClick={() => setIs916Mode(true)}
              className="p-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer transition-all active:scale-98"
            >
              <Play size={18} /> Khởi Chạy (Quay Video 9:16)
            </button>
          </div>
        </div>
      )}

      {/* KHU VỰC SÂN KHẤU (VERTICAL 9:16 TRÊN NỀN NGANG 90 DEG HOẶC 9:16 CHUẨN) */}
      <div className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${
        is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
      }`}>
        {/* CONTAINER KHUNG NẰM NGANG NỀN GRID TRẮNG GIỐNG HỆT CÁC CHỨC NĂNG KHÁC */}
        <div 
          className={`relative overflow-hidden transition-all duration-300 flex items-center justify-center ${
            screenShake ? 'animate-shake' : ''
          } ${
            is916Mode
              ? 'w-full h-full bg-white flex items-center justify-center'
              : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
          }`}
          style={{
            transform: screenShake ? `translate(${Math.random() * shakeIntensity - shakeIntensity / 2}px, ${Math.random() * shakeIntensity - shakeIntensity / 2}px)` : 'none'
          }}
        >
          {/* Lớp nền sân khấu linh hoạt (thay đổi theo cài đặt người dùng) */}
          <StageBackgroundOverlay />

          {/* VÙNG SÂN KHẤU CANVAS 540x960 XOAY -90 ĐỘ ĐỒNG BỘ 100% VỚI CÁC TÍNH NĂNG KHÁC */}
          <div
            className="relative z-10 flex flex-col items-center justify-between select-none"
            style={{
              transform: `rotate(-90deg) scale(${is916Mode ? 1.25 : 0.95})`,
              transformOrigin: 'center center',
              width: '540px',
              height: '960px'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsOverDropzone(true);
            }}
            onDragLeave={() => setIsOverDropzone(false)}
            onDrop={handleDrop}
          >
            {/* 1. KHAY 3 QUẢ BOM PHÍA TRÊN CÙNG (LOẠI BỎ TOÀN BỘ VĂN BẢN KHÔNG CẦN THIẾT) */}
            <div className="w-full pt-8 px-8 z-30 flex flex-col items-center">
              <div className="grid grid-cols-3 gap-6 w-full">
                {bombs.map((bomb) => {
                  const isActive = activeBomb?.id === bomb.id;
                  return (
                    <div
                      key={bomb.id}
                      draggable={stageState !== 'counting' && stageState !== 'exploding'}
                      onDragStart={(e) => handleDragStart(e, bomb)}
                      onClick={() => handleDirectClickBomb(bomb)}
                      className={`relative flex items-center justify-center p-3 rounded-2xl cursor-grab active:cursor-grabbing transition-all transform hover:scale-110 select-none ${
                        isActive
                          ? 'ring-4 ring-amber-400 scale-110 shadow-2xl shadow-amber-500/50 bg-amber-500/20'
                          : 'bg-white/80 hover:bg-white shadow-lg border border-slate-200 backdrop-blur-sm'
                      }`}
                    >
                      <span className="text-5xl filter drop-shadow-md transition-transform duration-200">
                        {bomb.icon}
                      </span>
                      {/* Biểu tượng ngòi bom cháy nổ */}
                      {isActive && stageState === 'counting' && (
                        <span className="absolute -top-3 -right-3 text-2xl animate-bounce">
                          💥
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. KHU VỰC THẢ BOM & BÓNG ĐEN NHÂN VẬT */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
              {/* CANVAS BÓNG ĐEN SILHOUETTE */}
              <canvas
                ref={canvasRef}
                width={540}
                height={960}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* QUẢ BOM ĐANG RƠI XUỐNG VÀ ĐẾM NGƯỢC (CHỈ HIỂN THỊ ICON BOM VÀ SỐ ĐẾM NGƯỢC, KHÔNG CÓ CHỮ DƯ THỪA) */}
              {activeBomb && stageState === 'counting' && (
                <div className="absolute z-30 flex flex-col items-center justify-center animate-bounce">
                  <div className="relative flex items-center justify-center">
                    <span className="text-8xl filter drop-shadow-2xl">
                      {activeBomb.icon}
                    </span>
                    <span className="absolute -top-4 -right-3 text-4xl animate-ping">
                      🔥
                    </span>
                  </div>

                  {/* SỐ ĐẾM NGƯỢC 3... 2... 1... */}
                  <div className="mt-3 w-20 h-20 rounded-full bg-rose-600/95 text-white font-black text-4xl flex items-center justify-center border-4 border-amber-300 shadow-2xl shadow-rose-600/80 animate-pulse font-mono">
                    {countdown}
                  </div>
                </div>
              )}
            </div>

            {/* 3. WATERMARK PHÍA DƯỚI NỘI DUNG (ĐỒNG BỘ 100% GIỐNG SOI ĐÈN PIN) */}
            {enableWatermark && watermarkText && (
              <div
                className="absolute pointer-events-none select-none flex items-center justify-center whitespace-nowrap transition-all duration-150"
                style={{
                  left: '270px',
                  bottom: `${watermarkDistance}px`,
                  transform: 'translateX(-50%)',
                  transformOrigin: 'center center',
                  zIndex: 25,
                  ...(enableWatermarkBg
                    ? {
                      backgroundColor: watermarkBgColor,
                      opacity: Math.max(0.1, Math.min(1, watermarkBgOpacity / 100)),
                      padding: `${Math.max(4, Math.round(watermarkFontSize * 0.35))}px ${Math.max(12, Math.round(watermarkFontSize * 0.9))}px`,
                      borderRadius: `${Math.max(8, Math.round(watermarkFontSize * 0.65))}px`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }
                    : {})
                }}
              >
                <span
                  className="font-bold tracking-normal font-sans select-none transition-all duration-150"
                  style={{
                    fontSize: `${watermarkFontSize}px`,
                    color: watermarkColor,
                    opacity: enableWatermarkBg ? 1 : (watermarkOpacity / 100),
                    textShadow: enableWatermarkBg ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  {watermarkText}
                </span>
              </div>
            )}
          </div>

          {/* 4. HIỆU ỨNG SÁNG TRẮNG TOÀN BỘ MÀN HÌNH (PURE SOLID WHITE FLASH) */}
          <div
            className="absolute inset-0 pointer-events-none z-50 transition-opacity duration-300 ease-out"
            style={{
              backgroundColor: '#ffffff',
              opacity: flashOpacity
            }}
          />
        </div>
      </div>
    </div>
  );
}
