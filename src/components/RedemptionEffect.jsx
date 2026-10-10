import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play } from 'lucide-react';
import demon1 from '../assets/redemption/character_demon.jpg';
import demon2 from '../assets/redemption/character_demon2.jpg';
import demon3 from '../assets/redemption/character_demon3.jpg';
import human1 from '../assets/redemption/character_human.jpg';
import human2 from '../assets/redemption/character_human2.jpg';
import jesusImg from '../assets/redemption/jesus_divine.jpg';

/* ──────────────── AUDIO ──────────────── */
const getAudio = () => {
  if (!window._rdAudio) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (C) window._rdAudio = new C();
  }
  const ctx = window._rdAudio;
  if (ctx?.state === 'suspended') ctx.resume();
  return ctx;
};

const playBeam = () => {
  try {
    const ctx = getAudio(); if (!ctx) return;
    const now = ctx.currentTime;
    // Dark rumble before
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    src.connect(lp); lp.connect(g); g.connect(ctx.destination); src.start(now);
  } catch (e) {}
};

const playTransform = () => {
  try {
    const ctx = getAudio(); if (!ctx) return;
    const now = ctx.currentTime;
    // Holy chimes
    [523, 784, 1047, 1319, 1568].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.001, now + i * 0.1);
      g.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.8);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.8);
    });
    // Blast
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(80, now + 0.2);
    o2.frequency.exponentialRampToValueAtTime(600, now + 0.6);
    g2.gain.setValueAtTime(0.4, now + 0.2); g2.gain.exponentialRampToValueAtTime(0.001, now + 1);
    o2.connect(g2); g2.connect(ctx.destination);
    o2.start(now + 0.2); o2.stop(now + 1);
  } catch (e) {}
};

/* ──────────────── CHARACTERS ──────────────── */
const CHARACTERS = [
  { id: 0, name: 'Malphas',    demonSrc: demon1, humanSrc: human1, humanFilter: 'none' },
  { id: 1, name: 'Seraphira',  demonSrc: demon2, humanSrc: human2, humanFilter: 'none' },
  { id: 2, name: 'Gorvath',    demonSrc: demon3, humanSrc: human1, humanFilter: 'hue-rotate(30deg) brightness(1.1)' },
  { id: 3, name: 'Malphas II', demonSrc: demon1, humanSrc: human2, humanFilter: 'hue-rotate(180deg)' },
  { id: 4, name: 'Umbra',      demonSrc: demon2, humanSrc: human1, humanFilter: 'hue-rotate(90deg)' },
  { id: 5, name: 'Gorvath II', demonSrc: demon3, humanSrc: human2, humanFilter: 'hue-rotate(270deg)' },
];

/* ──────────────── PHASE TIMINGS (ms) ──────────────── */
const T = {
  ENTER:     500,   // slide in
  BEAM_BUILD: 700,  // Jesus charges up beam
  TRANSFORM: 900,   // cross-fade demon → human
  CELEBRATE: 800,   // human glows briefly
  EXIT:      450,   // slide out
};

/* ──────────────── MAIN COMPONENT ──────────────── */
export default function RedemptionEffect({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);
  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  // Animation state
  const [charIndex, setCharIndex]     = useState(0);       // which character is on stage
  const [phase, setPhase]             = useState('idle');   // idle|enter|beam|transform|celebrate|exit
  const [phaseProgress, setPhaseProgress] = useState(0);   // 0..1 within current phase
  const [savedCount, setSavedCount]   = useState(0);
  const [running, setRunning]         = useState(false);
  const [jesusFloat, setJesusFloat]   = useState(0);
  const [screenFlash, setScreenFlash] = useState(0);
  const [beamCharge, setBeamCharge]   = useState(0);       // 0..1 beam charging from Jesus
  const [particles, setParticles]     = useState([]);

  const containerRef  = useRef(null);
  const rafRef      = useRef(null);
  const timerRef    = useRef(null);
  const startRef    = useRef(0);
  const runningRef  = useRef(false);
  const charIdxRef  = useRef(0);
  const savedRef    = useRef(0);
  const particleIdRef = useRef(0);

  /* ESC key */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { stopAll(); setIs916Mode(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setIs916Mode]);

  /* Jesus float */
  useEffect(() => {
    let f = 0;
    const id = setInterval(() => { f += 0.025; setJesusFloat(Math.sin(f) * 6); }, 16);
    return () => clearInterval(id);
  }, []);

  /* Particle spawn */
  const spawnParticles = useCallback((type = 'light', count = 8) => {
    const newP = Array.from({ length: count }, () => ({
      id: particleIdRef.current++,
      x: 30 + Math.random() * 40,
      y: 10 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 3,
      vy: -(Math.random() * 2 + 0.5),
      size: type === 'light' ? Math.random() * 8 + 3 : Math.random() * 6 + 2,
      life: 1,
      decay: 0.025 + Math.random() * 0.02,
      type,
    }));
    setParticles(prev => [...prev.slice(-60), ...newP]);
  }, []);

  /* Particle tick */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setParticles(prev => prev
        .map(p => ({ ...p, life: p.life - p.decay, x: p.x + p.vx, y: p.y + p.vy }))
        .filter(p => p.life > 0)
      );
    }, 30);
    return () => clearInterval(id);
  }, [running]);

  /* ─── Phase runner ─── */
  const runPhase = useCallback((phaseName, duration, onStart, onComplete) => {
    if (onStart) onStart();
    startRef.current = Date.now();
    setPhase(phaseName);
    setPhaseProgress(0);

    const tick = () => {
      const t = Math.min((Date.now() - startRef.current) / duration, 1);
      setPhaseProgress(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPhaseProgress(1);
        if (onComplete) onComplete();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  /* ─── Full sequence for one character ─── */
  const runCharacter = useCallback((idx) => {
    if (!runningRef.current) return;
    charIdxRef.current = idx;
    setCharIndex(idx);
    setBeamCharge(0);
    setScreenFlash(0);
    setParticles([]);

    // 1. ENTER
    runPhase('enter', T.ENTER, () => {
      spawnParticles('dark', 5);
    }, () => {
      if (!runningRef.current) return;
      // 2. BEAM BUILD
      runPhase('beam', T.BEAM_BUILD, () => {
        playBeam();
        spawnParticles('dark', 8);
      }, () => {
        if (!runningRef.current) return;
        // 3. TRANSFORM
        runPhase('transform', T.TRANSFORM, () => {
          playTransform();
          setScreenFlash(0);
        }, () => {
          if (!runningRef.current) return;
          savedRef.current += 1;
          setSavedCount(savedRef.current);
          // 4. CELEBRATE
          runPhase('celebrate', T.CELEBRATE, () => {
            spawnParticles('light', 16);
          }, () => {
            if (!runningRef.current) return;
            // 5. EXIT
            runPhase('exit', T.EXIT, null, () => {
              if (!runningRef.current) return;
              // Next character
              timerRef.current = setTimeout(() => {
                if (!runningRef.current) return;
                const next = (idx + 1) % CHARACTERS.length;
                runCharacter(next);
              }, 200);
            });
          });
        });
      });
    });
  }, [runPhase, spawnParticles]);

  /* ─── Update beam charge during beam phase ─── */
  useEffect(() => {
    if (phase === 'beam') setBeamCharge(phaseProgress);
    else if (phase === 'transform') setBeamCharge(1 - phaseProgress * 0.5);
    else if (phase === 'celebrate' || phase === 'exit') setBeamCharge(0);
    // screen flash during transform peak
    if (phase === 'transform') {
      const peak = Math.sin(phaseProgress * Math.PI);
      setScreenFlash(peak * 0.7);
    } else {
      setScreenFlash(0);
    }
  }, [phase, phaseProgress]);

  const stopAll = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('idle');
    setPhaseProgress(0);
    setBeamCharge(0);
    setScreenFlash(0);
    setParticles([]);
    charIdxRef.current = 0;
    setCharIndex(0);
    savedRef.current = 0;
    setSavedCount(0);
  }, []);

  const handleStart = () => {
    setIs916Mode(true);
    setTimeout(() => {
      runningRef.current = true;
      setRunning(true);
      savedRef.current = 0;
      setSavedCount(0);
      runCharacter(0);
    }, 350);
  };

  const handleStop = () => {
    stopAll();
    setIs916Mode(false);
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  /* ─── Derived display values ─── */
  const char = CHARACTERS[charIndex % CHARACTERS.length];

  // Character X offset based on phase
  const charX = (() => {
    if (phase === 'enter')     return -260 + phaseProgress * 260;  // slide in from left
    if (phase === 'exit')      return phaseProgress * 300;          // slide out to right
    return 0;
  })();
  const charOpacity = (() => {
    if (phase === 'enter')     return phaseProgress;
    if (phase === 'exit')      return 1 - phaseProgress;
    return 1;
  })();

  // Cross-fade within transform phase
  const isHuman = phase === 'celebrate' || phase === 'exit';
  const demonOpacity = phase === 'transform' ? Math.max(0, 1 - phaseProgress * 1.8) : isHuman ? 0 : 1;
  const humanOpacity = phase === 'transform' ? Math.min(1, phaseProgress * 1.8) : isHuman ? 1 : 0;

  // Shake during beam
  const shakeX = phase === 'beam' ? Math.sin(Date.now() / 40) * beamCharge * 4 : 0;
  const shakeY = phase === 'beam' ? Math.cos(Date.now() / 55) * beamCharge * 2 : 0;

  // Celebrate glow
  const celebrateGlow = phase === 'celebrate' ? Math.sin(phaseProgress * Math.PI) : 0;

  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>

      {/* ─── SIDEBAR ─── */}
      {!is916Mode && (
        <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col gap-4 p-5 overflow-y-auto z-10">
          <div>
            <h2 className="text-lg font-bold text-amber-400 mb-1" style={{ fontFamily: "'Cinzel',serif" }}>
              ✝ Ánh Sáng Cứu Rỗi
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Từng nhân vật Demon bước vào, Chúa Jesus chiếu ánh sáng thánh
              và cảm hóa họ thành người lần lượt, liên tiếp không dừng.
            </p>
          </div>

          {/* Characters preview */}
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Danh sách nhân vật</p>
            <div className="grid grid-cols-3 gap-2">
              {CHARACTERS.map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1 p-2 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex gap-1">
                    <img src={c.demonSrc} alt={c.name} className="w-8 h-10 object-contain object-bottom" draggable={false} />
                    <img src={c.humanSrc} alt={c.name} className="w-8 h-10 object-contain object-bottom opacity-60" draggable={false}
                      style={{ filter: c.humanFilter !== 'none' ? c.humanFilter : undefined }} />
                  </div>
                  <span className="text-[9px] text-slate-400 text-center leading-tight">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timing info */}
          <div className="bg-slate-800 rounded-xl p-3 border border-slate-700 space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest">Chuỗi hiệu ứng</p>
            {[
              { label: '→ Demon bước vào', val: `${T.ENTER}ms` },
              { label: '⚡ Jesus tích điện', val: `${T.BEAM_BUILD}ms` },
              { label: '✨ Chuyển hoá', val: `${T.TRANSFORM}ms` },
              { label: '🌟 Người toả sáng', val: `${T.CELEBRATE}ms` },
              { label: '→ Bước ra', val: `${T.EXIT}ms` },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="text-amber-400 font-bold">{val}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleStart}
            id="btn-redemption-launch"
            className="mt-auto p-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer text-sm"
          >
            <Play size={16} /> Khởi Chạy (ESC Quay Lại)
          </button>
        </div>
      )}

      {/* KHUNG HIỂN THỊ KHU VỰC SÂN KHẤU (LUÔN LUÔN HIỂN THỊ GIỐNG KHI ĐANG CHẠY) */}
      <div className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
        }`}>
        {/* CONTAINER KHUNG NẰM NGANG NỀN GRID TRẮNG GIỐNG HỆT KHI ĐANG CHẠY */}
        <div
          ref={containerRef}
          className={`relative overflow-hidden transition-all duration-300 ${is916Mode
              ? 'w-full h-full bg-white flex items-center justify-center'
              : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl flex items-center justify-center'
            }`}
        >
          {/* Nền Grid Kẻ Ô Mờ Chuẩn Nhất Xuất Hiện Ở Cả 2 Trạng Thái */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* 9:16 rotated container */}
          <div style={{
            width: 540, height: 960,
            transform: `rotate(-90deg) scale(${is916Mode ? 1.25 : 0.95})`,
            transformOrigin: 'center center',
            position: 'relative',
            background: '#ffffff',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Grid background inside rotated container */}
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                backgroundImage: `linear-gradient(#e0e7ff 1px, transparent 1px), linear-gradient(90deg, #e0e7ff 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />

            {/* Screen flash */}
            {screenFlash > 0.01 && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at center, rgba(255,255,220,1) 0%, rgba(255,215,0,0.85) 40%, transparent 80%)',
                opacity: screenFlash,
              }} />
            )}

            {/* Background ambient glow */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: phase === 'celebrate' || phase === 'exit'
                ? `radial-gradient(ellipse at 35% 60%, rgba(255,215,0,${0.12 + celebrateGlow * 0.15}) 0%, transparent 60%)`
                : phase === 'beam' || phase === 'transform'
                ? `radial-gradient(ellipse at 35% 60%, rgba(255,${Math.round(140 * beamCharge)},0,${beamCharge * 0.12}) 0%, transparent 60%)`
                : 'radial-gradient(ellipse at 35% 60%, rgba(100,0,30,0.08) 0%, transparent 60%)',
              transition: 'background 0.3s',
            }} />

            {/* ── Particles ── */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
              {particles.map(p => (
                <div key={p.id} style={{
                  position: 'absolute',
                  left: `${p.x}%`, top: `${p.y}%`,
                  width: p.size, height: p.size,
                  borderRadius: p.type === 'light' ? '50%' : '2px',
                  background: p.type === 'light'
                    ? `rgba(255,${180 + Math.round(75 * p.life)},${Math.round(100 * p.life)},${p.opacity * p.life})`
                    : `rgba(${Math.round(120 * p.life)},0,${Math.round(40 * p.life)},${0.7 * p.life})`,
                  filter: p.type === 'light' ? `blur(${p.size * 0.3}px)` : 'none',
                  boxShadow: p.type === 'light' ? `0 0 ${p.size * 2}px rgba(255,200,80,0.6)` : 'none',
                  pointerEvents: 'none',
                  opacity: p.life,
                }} />
              ))}
            </div>

            {/* ── JESUS (right side, fixed) ── */}
            <div style={{
              position: 'absolute',
              right: -10,
              top: '50%',
              transform: `translateY(calc(-50% + ${jesusFloat}px))`,
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 200,
            }}>
              {/* Rotating rays */}
              <div style={{
                position: 'absolute',
                width: 220, height: 220,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: `conic-gradient(
                  rgba(255,215,0,0.15) 0deg, transparent 18deg,
                  rgba(255,215,0,0.1) 36deg, transparent 54deg,
                  rgba(255,215,0,0.15) 72deg, transparent 90deg,
                  rgba(255,215,0,0.1) 108deg, transparent 126deg,
                  rgba(255,215,0,0.15) 144deg, transparent 162deg,
                  rgba(255,215,0,0.1) 180deg, transparent 198deg,
                  rgba(255,215,0,0.15) 216deg, transparent 234deg,
                  rgba(255,215,0,0.1) 252deg, transparent 270deg,
                  rgba(255,215,0,0.15) 288deg, transparent 306deg,
                  rgba(255,215,0,0.1) 324deg, transparent 342deg
                )`,
                borderRadius: '50%',
                animation: 'rotate-rays 10s linear infinite',
                filter: 'blur(3px)',
                pointerEvents: 'none',
              }} />

              {/* Halo */}
              <div style={{
                position: 'absolute',
                width: 64, height: 64,
                top: '10%', left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '50%',
                border: '2px solid rgba(255,215,0,0.85)',
                boxShadow: '0 0 16px rgba(255,215,0,0.9), 0 0 32px rgba(255,215,0,0.4)',
                animation: 'pulse-halo 2s ease-in-out infinite',
              }} />

              <img src={jesusImg} alt="Jesus" draggable={false} style={{
                height: 300, width: 'auto',
                objectFit: 'contain',
                filter: `drop-shadow(0 0 20px rgba(255,215,0,${0.5 + beamCharge * 0.4})) brightness(${1 + beamCharge * 0.15})`,
                position: 'relative', zIndex: 1,
                transition: 'filter 0.2s',
              }} />

              {/* Beam emitter */}
              {(phase === 'beam' || phase === 'transform') && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  right: '90%',
                  transform: 'translateY(-50%)',
                  width: `${300 * beamCharge}px`,
                  height: `${6 + beamCharge * 12}px`,
                  background: 'linear-gradient(to left, rgba(255,215,0,0.9), rgba(255,255,255,0.7), transparent)',
                  filter: `blur(${3 + beamCharge * 5}px)`,
                  borderRadius: 6,
                  opacity: beamCharge,
                  animation: 'beam-pulse 0.3s ease-in-out infinite',
                  transformOrigin: 'right center',
                  pointerEvents: 'none',
                  zIndex: 10,
                }} />
              )}
            </div>

            {/* ── CHARACTER (center-left, one at a time) ── */}
            {phase !== 'idle' && (
              <div style={{
                position: 'absolute',
                left: '12%',
                top: '50%',
                transform: `translate(${charX}px, calc(-50% + ${phase === 'beam' ? shakeY : 0}px))`,
                opacity: charOpacity,
                transition: phase === 'enter' || phase === 'exit' ? 'none' : 'opacity 0.2s',
                zIndex: 4,
                width: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                {/* Aura */}
                <div style={{
                  position: 'absolute',
                  width: 200, height: 200,
                  top: '20%', left: '50%',
                  transform: 'translateX(-50%)',
                  borderRadius: '50%',
                  background: isHuman
                    ? `radial-gradient(ellipse, rgba(255,215,0,${0.5 + celebrateGlow * 0.3}) 0%, transparent 70%)`
                    : phase === 'beam'
                    ? `radial-gradient(ellipse, rgba(200,0,30,${0.3 + beamCharge * 0.3}) 0%, transparent 70%)`
                    : 'radial-gradient(ellipse, rgba(140,0,30,0.3) 0%, transparent 70%)',
                  filter: `blur(${12 + celebrateGlow * 10}px)`,
                  pointerEvents: 'none',
                  transition: 'background 0.3s',
                }} />

                {/* Stacked images */}
                <div style={{ position: 'relative', width: 200, height: 340 }}>
                  {/* Demon */}
                  <img src={char.demonSrc} alt="demon" draggable={false} style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'contain', objectPosition: 'bottom',
                    opacity: demonOpacity,
                    filter: phase === 'beam'
                      ? `brightness(${1 - beamCharge * 0.3}) saturate(${1 + beamCharge}) contrast(${1 + beamCharge * 0.3})`
                      : phase === 'transform'
                      ? `brightness(${1 - phaseProgress * 0.5}) saturate(${3 - phaseProgress * 2}) hue-rotate(${phaseProgress * 120}deg)`
                      : undefined,
                    transition: 'filter 0.15s, opacity 0.1s',
                  }} />
                  {/* Human */}
                  <img src={char.humanSrc} alt="human" draggable={false} style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'contain', objectPosition: 'bottom',
                    opacity: humanOpacity,
                    filter: char.humanFilter !== 'none'
                      ? `${char.humanFilter} brightness(${1 + celebrateGlow * 0.4}) drop-shadow(0 0 ${celebrateGlow * 20}px rgba(255,215,0,0.8))`
                      : celebrateGlow > 0
                      ? `brightness(${1 + celebrateGlow * 0.4}) drop-shadow(0 0 ${celebrateGlow * 20}px rgba(255,215,0,0.8))`
                      : undefined,
                    transition: 'filter 0.1s, opacity 0.1s',
                  }} />
                </div>
              </div>
            )}

            {/* Stop button */}
            {is916Mode && (
              <button onClick={handleStop} style={{
                position: 'absolute', top: 14, right: 14,
                background: 'rgba(255,50,50,0.18)',
                border: '1px solid rgba(255,80,80,0.35)',
                borderRadius: 8, padding: '4px 12px',
                color: '#ff8888', fontSize: 10, fontWeight: 700,
                cursor: 'pointer', zIndex: 20, letterSpacing: '0.05em',
              }}>■ ESC</button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Inter:wght@300;400;500&display=swap');
        @keyframes rotate-rays { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes pulse-halo { 0%,100%{opacity:0.7;transform:translateX(-50%) scale(1)} 50%{opacity:1;transform:translateX(-50%) scale(1.12)} }
        @keyframes beam-pulse { 0%,100%{opacity:0.8} 50%{opacity:1} }
        @keyframes saved-pop { 0%{opacity:0;transform:scale(0.5) translateY(-6px)} 60%{transform:scale(1.15)} 100%{opacity:1;transform:scale(1)} }
        #btn-redemption-launch:hover { transform:scale(1.02); }
      `}</style>
    </div>
  );
}
