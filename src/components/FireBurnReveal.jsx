import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Upload, Play, RotateCcw, Flame, ChevronDown, ChevronUp, Volume2, VolumeX, Sparkles, Image as ImageIcon } from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';
import NumberInput from './NumberInput';
import { saveLocalImage, loadLocalImage } from '../utils/localImageStorage';
import heroImg from '../assets/hero.png';

const FIRE_PRESETS = {
  classic: {
    name: 'Cam Cổ Điển',
    bright: '#fff275',
    mid: '#ff5722',
    dark: '#b71c1c',
    glow: 'rgba(255, 100, 20, 0.45)',
    particleColors: ['#ffffff', '#fff275', '#ff9800', '#ff5722', '#b71c1c']
  },
  blue: {
    name: 'Lửa Plasma Xanh',
    bright: '#e0f7fa',
    mid: '#00e5ff',
    dark: '#002984',
    glow: 'rgba(0, 229, 255, 0.45)',
    particleColors: ['#ffffff', '#b2ebf2', '#00e5ff', '#2979ff', '#002984']
  },
  green: {
    name: 'Lửa Độc Xanh Lá',
    bright: '#f1f8e9',
    mid: '#76ff03',
    dark: '#1b5e20',
    glow: 'rgba(118, 255, 3, 0.45)',
    particleColors: ['#ffffff', '#ccff90', '#76ff03', '#00c853', '#1b5e20']
  },
  purple: {
    name: 'Ma Thuật Tím',
    bright: '#f3e5f5',
    mid: '#d500f9',
    dark: '#4a148c',
    glow: 'rgba(213, 0, 249, 0.45)',
    particleColors: ['#ffffff', '#ea80fc', '#d500f9', '#aa00ff', '#4a148c']
  },
  hellfire: {
    name: 'Hỏa Ngục Đỏ',
    bright: '#ff8a80',
    mid: '#ff1744',
    dark: '#4a0000',
    glow: 'rgba(255, 23, 68, 0.55)',
    particleColors: ['#ffffff', '#ff8a80', '#ff1744', '#d50000', '#4a0000']
  }
};

const DEFAULT_SETTINGS = {
  charScale: 85,
  charOffsetY: 0,
  charOffsetX: 0,
  fireSpeed: 100,      // pixel mỗi giây (960px / 100px/s ≈ 9.6s)
  fireVariance: 32,    // độ uốn lượn ngọn lửa
  fireColorPreset: 'classic',
  soundEnabled: true,
  bgScale: 100,
  bgOffsetY: 0,
  bgOffsetX: 0,
};

export default function FireBurnReveal({ is916Mode, setIs916Mode }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('fire_burn_settings_v1');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [charImg, setCharImg] = useState(null);
  const [bgImg, setBgImg] = useState(null);
  const [burnState, setBurnState] = useState('idle'); // 'idle' | 'burning' | 'complete'
  const [stageScale, setStageScale] = useState(1);
  const [openSections, setOpenSections] = useState({ char: true, fire: true, bg: false });

  const canvasRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const burnProgressRef = useRef(0); // 0.0 -> 1.0
  const burnStateRef = useRef('idle');
  const particlesRef = useRef([]);
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);
  const timeRef = useRef(0);
  const audioCtxRef = useRef(null);
  const audioNodesRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    burnStateRef.current = burnState;
  }, [burnState]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('fire_burn_settings_v1', JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save fire burn settings', e);
    }
  }, [settings]);

  // Sound generator using Web Audio API (white noise crackle)
  const stopAudio = useCallback(() => {
    if (audioNodesRef.current) {
      try {
        const { source, gain } = audioNodesRef.current;
        gain.gain.linearRampToValueAtTime(0.0001, (audioCtxRef.current?.currentTime || 0) + 0.3);
        setTimeout(() => {
          try { source.stop(); } catch {}
        }, 350);
      } catch {}
      audioNodesRef.current = null;
    }
  }, []);

  const startAudio = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Generate 2 seconds of pink/fire crackle noise in buffer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown/pink filter
        lastOut = (lastOut + 0.02 * white) / 1.02;
        // occasional crackle pop
        const crackle = Math.random() < 0.003 ? (Math.random() - 0.5) * 4 : 0;
        data[i] = (lastOut * 2.5 + crackle) * 0.18;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Bandpass filter for campfire frequency
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.4);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      audioNodesRef.current = { source, gain };
    } catch (e) {
      console.warn('Audio crackle init error:', e);
    }
  }, [settings.soundEnabled]);

  // Load character and background images on mount
  useEffect(() => {
    loadLocalImage('fire_burn_character').then(dataUrl => {
      if (dataUrl) {
        const img = new Image();
        img.onload = () => setCharImg(img);
        img.src = dataUrl;
      } else {
        // Fallback default hero
        const img = new Image();
        img.onload = () => setCharImg(img);
        img.src = heroImg;
      }
    });

    loadLocalImage('fire_burn_background').then(dataUrl => {
      if (dataUrl) {
        const img = new Image();
        img.onload = () => setBgImg(img);
        img.src = dataUrl;
      }
    });
  }, []);

  // Calculate container scale to fit screen (540x960 rotated -90deg displays as 960x540)
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

  // Keyboard controls
  const handleStartBurn = useCallback(() => {
    if (burnStateRef.current === 'idle') {
      burnStateRef.current = 'burning';
      setBurnState('burning');
      startAudio();
    } else if (burnStateRef.current === 'complete') {
      // Reset
      burnProgressRef.current = 0;
      burnStateRef.current = 'idle';
      setBurnState('idle');
      particlesRef.current = [];
      stopAudio();
    }
  }, [startAudio, stopAudio]);

  const handleReset = useCallback(() => {
    burnProgressRef.current = 0;
    burnStateRef.current = 'idle';
    setBurnState('idle');
    particlesRef.current = [];
    stopAudio();
  }, [stopAudio]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleStartBurn();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'Escape' && is916Mode) {
        setIs916Mode(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStartBurn, handleReset, is916Mode, setIs916Mode]);

  // Noise function for wavy organic flame edge
  const noise1D = (x, t) => {
    return (
      Math.sin(x * 0.024 + t * 4.2) * 0.45 +
      Math.sin(x * 0.058 - t * 6.5) * 0.35 +
      Math.sin(x * 0.12 + t * 9.8) * 0.2
    );
  };

  const getLineY = (x, burnFrontY, t, variance) => {
    return burnFrontY + noise1D(x, t) * variance;
  };

  // Main animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 540;
    const H = 960;

    function render(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.06);
      lastTimeRef.current = timestamp;
      timeRef.current += dt;
      const t = timeRef.current;

      const currentPreset = FIRE_PRESETS[settings.fireColorPreset] || FIRE_PRESETS.classic;

      // Update burning progress
      if (burnStateRef.current === 'burning') {
        burnProgressRef.current = Math.min(1, burnProgressRef.current + (settings.fireSpeed / H) * dt);
        if (burnProgressRef.current >= 1) {
          burnStateRef.current = 'complete';
          setBurnState('complete');
          stopAudio();
        }
      }

      const progress = burnProgressRef.current;
      // Burning from bottom (H) to top (0)
      const burnFrontY = H * (1 - progress);

      // 1. Clear background
      ctx.clearRect(0, 0, W, H);

      // 2. Draw Stage Background Image (nếu có)
      if (bgImg) {
        ctx.save();
        const bgScaleFactor = settings.bgScale / 100;
        const bw = bgImg.naturalWidth * bgScaleFactor;
        const bh = bgImg.naturalHeight * bgScaleFactor;
        const bx = (W - bw) / 2 + settings.bgOffsetX;
        const by = (H - bh) / 2 + settings.bgOffsetY;
        ctx.drawImage(bgImg, bx, by, bw, bh);
        ctx.restore();
      } else {
        // Mặc định nền tối tinh tế
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#10141e');
        bgGrad.addColorStop(1, '#080b11');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // 3. Draw Character Image
      if (charImg) {
        ctx.save();
        const baseFit = Math.min(W / charImg.naturalWidth, H / charImg.naturalHeight);
        const scale = baseFit * (settings.charScale / 100);
        const cw = charImg.naturalWidth * scale;
        const ch = charImg.naturalHeight * scale;
        const cx = (W - cw) / 2 + settings.charOffsetX;
        const cy = (H - ch) / 2 + settings.charOffsetY;
        ctx.drawImage(charImg, cx, cy, cw, ch);
        ctx.restore();
      }

      // 4. Update and spawn particles
      const particles = particlesRef.current;
      const isBurning = burnStateRef.current === 'burning';
      const isIdle = burnStateRef.current === 'idle';

      if (isBurning || isIdle) {
        const spawnCount = isBurning ? 12 : 3;
        for (let i = 0; i < spawnCount; i++) {
          if (particles.length > 320) break;
          const px = Math.random() * W;
          const baseLineY = isIdle ? H - 15 : getLineY(px, burnFrontY, t, settings.fireVariance);
          const pColor = currentPreset.particleColors[Math.floor(Math.random() * currentPreset.particleColors.length)];
          particles.push({
            x: px,
            y: baseLineY + (Math.random() * 25 - 10),
            vx: (Math.random() - 0.5) * 55,
            vy: -(Math.random() * 110 + 60), // float up quickly
            life: 1.0,
            decay: Math.random() * 1.5 + 1.2,
            size: Math.random() * 4.5 + 2.0,
            color: pColor
          });
        }
      }

      // 5. Draw Black Mask (Màn đen che phủ phần chưa bị thiêu cháy ở phía trên)
      if (progress < 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(W, 0);

        // Uốn lượn mép lửa từ phải sang trái
        const step = 4;
        for (let x = W; x >= 0; x -= step) {
          const ly = isIdle ? H - 15 : getLineY(x, burnFrontY, t, settings.fireVariance);
          ctx.lineTo(x, ly);
        }
        ctx.closePath();
        ctx.fillStyle = '#05070a'; // màu đen kịt bí ẩn
        ctx.fill();

        // Viền cháy than đen (Charred ember edge) sát mép
        ctx.beginPath();
        for (let x = 0; x <= W; x += step) {
          const ly = isIdle ? H - 15 : getLineY(x, burnFrontY, t, settings.fireVariance);
          if (x === 0) ctx.moveTo(x, ly);
          else ctx.lineTo(x, ly);
        }
        ctx.strokeStyle = '#2d0f02';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();
      }

      // 6. Draw Fire Glow & Flames (Vệt lửa rực rỡ bốc cháy dọc mép)
      if (progress < 1 || isIdle) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        const glowHeight = isIdle ? 40 : 85;
        const step = 6;
        for (let x = 0; x < W; x += step) {
          const lineY = isIdle ? H - 15 : getLineY(x, burnFrontY, t, settings.fireVariance);
          const grad = ctx.createLinearGradient(x, lineY - 12, x, lineY + glowHeight);
          grad.addColorStop(0, 'rgba(255,255,255,0.95)');
          grad.addColorStop(0.15, currentPreset.bright);
          grad.addColorStop(0.45, currentPreset.mid);
          grad.addColorStop(0.8, currentPreset.dark);
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.fillRect(x - 2, lineY - 15, step + 4, glowHeight + 15);
        }

        // Tỏa sáng diện rộng (Radial bloom effect)
        const bloomGrad = ctx.createLinearGradient(0, burnFrontY - 30, 0, burnFrontY + 120);
        bloomGrad.addColorStop(0, 'transparent');
        bloomGrad.addColorStop(0.4, currentPreset.glow);
        bloomGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bloomGrad;
        ctx.fillRect(0, Math.max(0, burnFrontY - 30), W, 150);

        ctx.restore();
      }

      // 7. Update & Draw Particles (Tàn lửa bay lơ lửng)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 18 * dt; // Tăng tốc độ bay lên

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.9;
        ctx.fill();
      }
      ctx.restore();

      // 8. Idle Text Hint
      if (isIdle) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText('🔥 NHẤN SPACE ĐỂ BẮT ĐẦU CHÁY 🔥', W / 2, H / 2);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [charImg, bgImg, settings, stopAudio]);

  // Upload handler for character
  const handleCharUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await saveLocalImage('fire_burn_character', file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => setCharImg(img);
      img.src = url;
    } catch (err) {
      console.error('Lỗi khi lưu ảnh nhân vật:', err);
    }
  };

  // Upload handler for background
  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await saveLocalImage('fire_burn_background', file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => setBgImg(img);
      img.src = url;
    } catch (err) {
      console.error('Lỗi khi lưu ảnh nền:', err);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden relative select-none">
      {/* KHÔNG GIAN SÂN KHẤU (CANVAS STAGE) */}
      <div 
        ref={stageWrapperRef}
        className="flex-1 relative flex items-center justify-center p-2 bg-slate-900/60 overflow-hidden"
      >
        <StageBackgroundOverlay />

        {/* CONTAINER CHỨA CANVAS XOAY NGANG 9:16 (540x960 xoay -90deg) */}
        <div 
          className="relative shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-800/80 transition-transform duration-150"
          style={{
            width: `${stageScale * 960}px`,
            height: `${stageScale * 540}px`,
          }}
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

          {/* FLOATING ACTION OVERLAY KHI QUAY HOẶC SẴN SÀNG */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 pointer-events-auto">
            {burnState === 'idle' && (
              <button
                onClick={handleStartBurn}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold text-sm shadow-xl shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-2 ring-orange-400/50"
              >
                <Flame size={18} className="fill-white" /> Bắt Đầu Cháy (Space)
              </button>
            )}

            {burnState === 'complete' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white font-bold text-sm border border-slate-600 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <RotateCcw size={16} /> Chơi Lại (R / Space)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CỘT CÀI ĐẶT BÊN PHẢI (Ẩn hoàn toàn khi is916Mode) */}
      {!is916Mode && (
        <aside className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full overflow-hidden z-20">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-base">
              <Flame size={20} />
              <span>Thiêu Cháy Bí Mật</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
              Shorts 9:16
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* MỤC 1: ẢNH NHÂN VẬT */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, char: !p.char }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Upload size={14} className="text-orange-400" /> Ảnh Nhân Vật Ẩn
                </span>
                {openSections.char ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.char && (
                <div className="p-3 pt-0 space-y-3">
                  <label className="flex items-center justify-center gap-2 w-full py-2 px-3 border border-dashed border-slate-700 hover:border-orange-500/60 bg-slate-900/60 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-all text-slate-300 text-xs font-medium">
                    <Upload size={14} className="text-orange-400" />
                    <span>Tải ảnh mới từ máy...</span>
                    <input type="file" accept="image/*" onChange={handleCharUpload} className="hidden" />
                  </label>

                  <div className="space-y-2">
                    <NumberInput
                      label="Kích thước (%):"
                      value={settings.charScale}
                      onChange={(val) => setSettings(p => ({ ...p, charScale: val }))}
                      min={20}
                      max={300}
                      step={5}
                    />
                    <NumberInput
                      label="Vị trí X (px):"
                      value={settings.charOffsetX}
                      onChange={(val) => setSettings(p => ({ ...p, charOffsetX: val }))}
                      min={-400}
                      max={400}
                      step={10}
                    />
                    <NumberInput
                      label="Vị trí Y (px):"
                      value={settings.charOffsetY}
                      onChange={(val) => setSettings(p => ({ ...p, charOffsetY: val }))}
                      min={-600}
                      max={600}
                      step={10}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MỤC 2: HIỆU ỨNG NGỌN LỬA */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, fire: !p.fire }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" /> Hiệu Ứng Ngọn Lửa
                </span>
                {openSections.fire ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.fire && (
                <div className="p-3 pt-0 space-y-3">
                  <NumberInput
                    label="Tốc độ cháy (px/s):"
                    value={settings.fireSpeed}
                    onChange={(val) => setSettings(p => ({ ...p, fireSpeed: val }))}
                    min={30}
                    max={350}
                    step={10}
                  />

                  <NumberInput
                    label="Biên độ uốn lượn:"
                    value={settings.fireVariance}
                    onChange={(val) => setSettings(p => ({ ...p, fireVariance: val }))}
                    min={10}
                    max={80}
                    step={5}
                  />

                  <div>
                    <label className="block text-slate-400 mb-1.5 font-medium">Màu sắc ngọn lửa:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(FIRE_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          onClick={() => setSettings(p => ({ ...p, fireColorPreset: key }))}
                          className={`flex items-center gap-1.5 p-2 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                            settings.fireColorPreset === key
                              ? 'border-orange-500 bg-orange-500/15 text-orange-200'
                              : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: preset.mid }}
                          />
                          <span className="truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

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
                        Âm thanh tiếng lửa nổ
                      </span>
                      <span>{settings.soundEnabled ? 'BẬT' : 'TẮT'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MỤC 3: ẢNH NỀN TÙY CHỌN */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, bg: !p.bg }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ImageIcon size={14} className="text-sky-400" /> Ảnh Nền Đằng Sau (Tùy chọn)
                </span>
                {openSections.bg ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.bg && (
                <div className="p-3 pt-0 space-y-3">
                  <label className="flex items-center justify-center gap-2 w-full py-2 px-3 border border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-900/60 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-all text-slate-300 text-xs font-medium">
                    <Upload size={14} className="text-sky-400" />
                    <span>Tải ảnh nền mới...</span>
                    <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                  </label>

                  <NumberInput
                    label="Kích thước nền (%):"
                    value={settings.bgScale}
                    onChange={(val) => setSettings(p => ({ ...p, bgScale: val }))}
                    min={20}
                    max={300}
                    step={10}
                  />
                </div>
              )}
            </div>

            {/* HƯỚNG DẪN QUAY VIDEO */}
            <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl text-slate-400 space-y-1.5 text-[11px] leading-relaxed">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                🎬 Mẹo quay YouTube Shorts:
              </div>
              <div>• Bấm nút <b>"Khởi Chạy"</b> ở góc trên để ẩn toàn bộ thanh công cụ.</div>
              <div>• Nhấn phím <b>Space</b> để kích hoạt ngọn lửa thiêu cháy tự động.</div>
              <div>• Sau khi cháy xong, nhấn <b>Space</b> hoặc <b>R</b> để làm lại.</div>
              <div>• Nhấn phím <b>ESC</b> để thoát chế độ quay.</div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
