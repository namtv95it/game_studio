import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Layers, Play, Square, RefreshCw, Upload, Trash2, Plus, 
  Settings, Image as ImageIcon, Volume2, Wand2, Grid, ArrowLeft, Maximize2, Minimize2, FolderPlus, GripVertical,
  Bell, RotateCcw, MessageCircle, Heart, Share2
} from 'lucide-react';

/* --- SOUND EFFECTS SYNTHESIZER (Web Audio API) --- */
const getAudioCtx = () => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!window._blendAudioCtx) {
    window._blendAudioCtx = new AudioCtx();
  }
  if (window._blendAudioCtx.state === 'suspended') {
    window._blendAudioCtx.resume();
  }
  return window._blendAudioCtx;
};

const playSfxSwoosh = (pitchUp = true) => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitchUp ? 220 : 600, now);
    osc.frequency.exponentialRampToValueAtTime(pitchUp ? 880 : 150, now + 0.35);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'bandpass';
    nFilter.frequency.setValueAtTime(2400, now);
    nFilter.Q.setValueAtTime(3, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.2, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
  } catch (e) {}
};

const playSfxReveal = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.07);
      gain.gain.setValueAtTime(0.01, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.6);
    });
  } catch (e) {}
};

const playSfxBadgePop = (idx = 0) => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseFreq = 440 + idx * 110;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.12);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch (e) {}
};

/* BADGE ICONS FOR EMOJI HEADER BAR */
const BADGE_ICONS = [
  <Bell size={18} className="text-white" />,
  <RotateCcw size={18} className="text-white" />,
  <MessageCircle size={18} className="text-white" />,
  <Heart size={18} className="text-white" />
];

/* --- HELPER PIXEL MATH & CANVAS --- */
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const lerp = (a, b, t) => a + (b - a) * t;

const drawToOff = (img, W, H) => {
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const c = off.getContext('2d');
  if (!img) return c;
  const ar = img.width / img.height;
  let sw, sh, sx, sy;
  if (ar > W / H) { sw = W; sh = W / ar; sx = 0; sy = (H - sh) / 2; }
  else { sh = H; sw = H * ar; sx = (W - sw) / 2; sy = 0; }
  c.drawImage(img, sx, sy, sw, sh);
  return c;
};

/* fxFusion: Core pixel vortex algorithm from blend.js with full alpha transparency support */
const fxFusion = (a, b, out, W, H, t, progress, swirl) => {
  const cx = W / 2, cy = H / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const angle = Math.atan2(dy, dx);

      const energy = Math.sin(progress * Math.PI); // 0 -> 1 -> 0

      const spiralFreq = 4;
      const spiralPhase = angle * spiralFreq + t * 2.2 + dist * 7;
      const spiralAmt = Math.sin(spiralPhase) * swirl * energy;
      const radialAmt = Math.cos(t * 2.8 - dist * 5) * swirl * energy * 0.5;

      const offX = (Math.cos(angle + Math.PI / 2) * cx * 0.18 * spiralAmt + dx * 0.14 * radialAmt) * energy;
      const offY = (Math.sin(angle + Math.PI / 2) * cy * 0.18 * spiralAmt + dy * 0.14 * radialAmt) * energy;

      const sx = clamp(Math.round(x + offX), 0, W - 1);
      const sy = clamp(Math.round(y + offY), 0, H - 1);
      const si = (sy * W + sx) * 4;

      const nx = (x / W) * 2 - 1, ny = (y / H) * 2 - 1;
      const waveNoise = Math.sin(nx * 12 + t * 1.6) * Math.cos(ny * 12 - t * 1.3) * 0.22;
      const spiralNoise = Math.sin(angle * 6 + dist * 10 - t * 2.4) * 0.18;

      const rawBlend = clamp(progress + waveNoise + spiralNoise, 0, 1);
      const blend = rawBlend * rawBlend * (3 - 2 * rawBlend);

      const edgeProximity = Math.max(0, 0.28 - Math.abs(rawBlend - 0.5)) / 0.28;
      const glow = edgeProximity * energy * 55;

      out[i] = clamp(lerp(a[si], b[si], blend) + glow * 1.15, 0, 255) | 0;
      out[i + 1] = clamp(lerp(a[si + 1], b[si + 1], blend) + glow * 0.80, 0, 255) | 0;
      out[i + 2] = clamp(lerp(a[si + 2], b[si + 2], blend) + glow * 1.35, 0, 255) | 0;
      out[i + 3] = clamp(lerp(a[si + 3], b[si + 3], blend), 0, 255) | 0;
    }
  }
};

export default function ImageBlend({ is916Mode, setIs916Mode }) {
  // Mode selection: 'blend' (Single / Step Chain) vs 'blendplus' (Multi-Stream Pairs)
  const [activeTab, setActiveTab] = useState('blend');

  // Single Blend state
  const [charImg, setCharImg] = useState(null); // Image object
  const [charImgSrc, setCharImgSrc] = useState('');
  const [blendSteps, setBlendSteps] = useState([
    { emojiImg: null, emojiSrc: '', resultImg: null, resultSrc: '', revealStyle: 'eraser-stroke-up' }
  ]);

  // Blend+ state (Streams table)
  const [bpStreams, setBpStreams] = useState([
    { id: 1, charImg: null, charSrc: '', emojiImg: null, emojiSrc: '', resultImg: null, resultSrc: '' }
  ]);
  const [bpCharWaitSec, setBpCharWaitSec] = useState(2.0);
  const [bpPauseSec, setBpPauseSec] = useState(2.5);
  const [bpActiveRowIdx, setBpActiveRowIdx] = useState(-1);

  // General settings
  const [swirlSpeed, setSwirlSpeed] = useState(7);
  const [swirlIntensity, setSwirlIntensity] = useState(100);
  const [finalQuestion, setFinalQuestion] = useState('VOTE FOR YOUR FAVORITE VERSION!');

  // Layout & Dimension Customizations
  const [headerTop, setHeaderTop] = useState(40); // px offset from top edge of stage
  const [headerEmojiSize, setHeaderEmojiSize] = useState(192); // px (192 = w-48 h-48)
  const [imageScale, setImageScale] = useState(100); // % scale shared for character & result images
  const [imgOffsetX, setImgOffsetX] = useState(0); // px horizontal offset shared for character & result
  const [imgOffsetY, setImgOffsetY] = useState(0); // px vertical offset shared for character & result

  // Drag and Drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Dynamic Scale state
  const [stageScale, setStageScale] = useState(0.85);

  // Runtime animation states
  const [isRunning, setIsRunning] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [bgCharSrc, setBgCharSrc] = useState('');
  const [showBgChar, setShowBgChar] = useState(false);

  // Flying Emoji layer
  const [flyEmojiSrc, setFlyEmojiSrc] = useState('');
  const [flyEmojiStyle, setFlyEmojiStyle] = useState({ opacity: 0 });
  const [flyEmojiAnimClass, setFlyEmojiAnimClass] = useState('');

  // Result Reveal layer
  const [showResult, setShowResult] = useState(false);
  const [resultImgSrc, setResultImgSrc] = useState('');

  // Collision Flash layer
  const [showFlash, setShowFlash] = useState(false);

  // 4-Grid Summary screen
  const [showFinalGrid, setShowFinalGrid] = useState(false);
  const [finalGridItems, setFinalGridItems] = useState([]);

  // DOM Refs
  const stageRef = useRef(null);
  const theaterRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const isRunningRef = useRef(false);

  // ESC Key exit handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        setIs916Mode(false);
        resetAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIs916Mode]);

  // Sync isRunning ref
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Dynamic Scale calculation for 1080x1920 rotated stage (Always matches container perfectly)
  useEffect(() => {
    const updateScale = () => {
      if (!stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const containerW = rect.width || window.innerWidth;
      const containerH = rect.height || window.innerHeight;

      if (is916Mode) {
        // Rotated -90deg full screen: stage width 1080px -> container height, stage height 1920px -> container width
        const scaleH = containerH / 1080;
        const scaleW = containerW / 1920;
        setStageScale(Math.min(scaleH, scaleW) * 0.98);
      } else {
        // Rotated -90deg preview mode inside right panel: calculate exact fitting scale
        const scaleH = (containerH - 32) / 1080;
        const scaleW = (containerW - 32) / 1920;
        setStageScale(Math.min(scaleH, scaleW));
      }
    };

    updateScale();
    const timer = setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [is916Mode, activeTab]);

  // Sync canvas size helper (Full HD 1080x1920)
  const syncCanvasSize = () => {
    if (!canvasRef.current) return;
    canvasRef.current.width = 1080;
    canvasRef.current.height = 1920;
  };

  useEffect(() => {
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, []);

  // Single Char Upload
  const handleCharUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setCharImg(img);
        setCharImgSrc(ev.target.result);
        setBgCharSrc(ev.target.result);
        setShowBgChar(true);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Single Step Upload (One file)
  const handleStepUpload = (index, type, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setBlendSteps((prev) => {
          const next = [...prev];
          if (!next[index]) return prev;
          if (type === 'emoji') {
            next[index].emojiImg = img;
            next[index].emojiSrc = ev.target.result;
          } else {
            next[index].resultImg = img;
            next[index].resultSrc = ev.target.result;
          }
          return next;
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // MULTIPLE FILES BATCH UPLOAD FOR SINGLE BLEND MODE
  const handleBatchEmojiUpload = (files) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 4);
    if (fileList.length === 0) return;

    fileList.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setBlendSteps((prev) => {
            const next = [...prev];
            while (next.length <= idx && next.length < 4) {
              next.push({ emojiImg: null, emojiSrc: '', resultImg: null, resultSrc: '', revealStyle: 'eraser-stroke-up' });
            }
            if (next[idx]) {
              next[idx].emojiImg = img;
              next[idx].emojiSrc = ev.target.result;
            }
            return next;
          });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBatchResultUpload = (files) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 4);
    if (fileList.length === 0) return;

    fileList.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setBlendSteps((prev) => {
            const next = [...prev];
            while (next.length <= idx && next.length < 4) {
              next.push({ emojiImg: null, emojiSrc: '', resultImg: null, resultSrc: '', revealStyle: 'eraser-stroke-up' });
            }
            if (next[idx]) {
              next[idx].resultImg = img;
              next[idx].resultSrc = ev.target.result;
            }
            return next;
          });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const addBlendStep = () => {
    if (blendSteps.length >= 4) return;
    setBlendSteps((prev) => [
      ...prev,
      { emojiImg: null, emojiSrc: '', resultImg: null, resultSrc: '', revealStyle: 'eraser-stroke-up' }
    ]);
  };

  const removeBlendStep = (index) => {
    if (blendSteps.length <= 1) return;
    setBlendSteps((prev) => prev.filter((_, i) => i !== index));
  };

  /* --- DRAG & DROP REORDERING HANDLERS --- */
  const handleDragStart = (type, index) => {
    setDraggedItem({ type, index });
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, targetIndex, type) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (type === 'step' && draggedItem.type === 'step') {
      const from = draggedItem.index;
      if (from !== targetIndex) {
        setBlendSteps((prev) => {
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(targetIndex, 0, moved);
          return next;
        });
      }
    } else if (type === 'emoji' && draggedItem.type === 'emoji') {
      const from = draggedItem.index;
      if (from !== targetIndex) {
        setBlendSteps((prev) => {
          const next = [...prev];
          const tempImg = next[from].emojiImg;
          const tempSrc = next[from].emojiSrc;
          next[from].emojiImg = next[targetIndex].emojiImg;
          next[from].emojiSrc = next[targetIndex].emojiSrc;
          next[targetIndex].emojiImg = tempImg;
          next[targetIndex].emojiSrc = tempSrc;
          return next;
        });
      }
    } else if (type === 'result' && draggedItem.type === 'result') {
      const from = draggedItem.index;
      if (from !== targetIndex) {
        setBlendSteps((prev) => {
          const next = [...prev];
          const tempImg = next[from].resultImg;
          const tempSrc = next[from].resultSrc;
          next[from].resultImg = next[targetIndex].resultImg;
          next[from].resultSrc = next[targetIndex].resultSrc;
          next[targetIndex].resultImg = tempImg;
          next[targetIndex].resultSrc = tempSrc;
          return next;
        });
      }
    } else if (type === 'stream' && draggedItem.type === 'stream') {
      const from = draggedItem.index;
      if (from !== targetIndex) {
        setBpStreams((prev) => {
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(targetIndex, 0, moved);
          return next;
        });
      }
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // MULTIPLE FILES BATCH UPLOAD FOR BLEND+ MODE
  const handleBpUpload = (index, type, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setBpStreams((prev) => {
          const next = [...prev];
          if (!next[index]) return prev;
          if (type === 'char') {
            next[index].charImg = img;
            next[index].charSrc = ev.target.result;
          } else if (type === 'emoji') {
            next[index].emojiImg = img;
            next[index].emojiSrc = ev.target.result;
          } else {
            next[index].resultImg = img;
            next[index].resultSrc = ev.target.result;
          }
          return next;
        });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleBpBatchEmojiUpload = (files) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    fileList.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setBpStreams((prev) => {
            const next = [...prev];
            while (next.length <= idx) {
              next.push({ id: Date.now() + idx, charImg: null, charSrc: '', emojiImg: null, emojiSrc: '', resultImg: null, resultSrc: '' });
            }
            next[idx].emojiImg = img;
            next[idx].emojiSrc = ev.target.result;
            return next;
          });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBpBatchResultUpload = (files) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    fileList.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setBpStreams((prev) => {
            const next = [...prev];
            while (next.length <= idx) {
              next.push({ id: Date.now() + idx, charImg: null, charSrc: '', emojiImg: null, emojiSrc: '', resultImg: null, resultSrc: '' });
            }
            next[idx].resultImg = img;
            next[idx].resultSrc = ev.target.result;
            return next;
          });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const addBpStream = () => {
    setBpStreams((prev) => [
      ...prev,
      { id: Date.now(), charImg: null, charSrc: '', emojiImg: null, emojiSrc: '', resultImg: null, resultSrc: '' }
    ]);
  };

  const removeBpStream = (index) => {
    if (bpStreams.length <= 1) return;
    setBpStreams((prev) => prev.filter((_, i) => i !== index));
  };

  /* --- RESET ANIMATIONS --- */
  const resetAll = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveStepIdx(-1);
    setBpActiveRowIdx(-1);
    setShowResult(false);
    setShowFlash(false);
    setShowFinalGrid(false);
    setFlyEmojiStyle({ opacity: 0 });
    setFlyEmojiAnimClass('');

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.classList.remove('opacity-100');
      canvas.classList.add('opacity-0');
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (charImgSrc) {
      setBgCharSrc(charImgSrc);
      setShowBgChar(true);
    }
  };

  /* --- RUN SINGLE BLEND MODE --- */
  const runBlendSingle = () => {
    if (isRunning) {
      resetAll();
      return;
    }

    if (!charImg) {
      alert('Vui lòng chọn ảnh nhân vật gốc trước!');
      return;
    }

    const validSteps = blendSteps.filter((s) => s.emojiImg && s.resultImg);
    if (validSteps.length === 0) {
      alert('Cần ít nhất 1 bước có đầy đủ ảnh Emoji + Kết quả!');
      return;
    }

    // Tự động xoay ngang 9:16 khi bắt đầu chạy!
    setIs916Mode(true);
    setIsRunning(true);
    setShowFinalGrid(false);

    setTimeout(() => {
      syncCanvasSize();
      executeChainStep(validSteps, 0, charImg);
    }, 150);
  };

  const executeChainStep = (steps, stepIdx, prevCharImg) => {
    if (!isRunningRef.current) return;
    if (stepIdx >= steps.length) {
      finishSingleBlend(steps);
      return;
    }

    const step = steps[stepIdx];
    setActiveStepIdx(stepIdx);
    setShowResult(false);

    setBgCharSrc(prevCharImg.src);
    setShowBgChar(true);
    setFlyEmojiSrc(step.emojiSrc);
    setFlyEmojiStyle({ opacity: 0, bottom: '-60%', left: '50%', transform: 'translateX(-50%)' });

    timerRef.current = setTimeout(() => {
      if (!isRunningRef.current) return;
      playSfxSwoosh(true);
      setFlyEmojiStyle({ opacity: 1, bottom: '38%', left: '50%', transform: 'translateX(-50%)', transition: 'all 0.75s ease-out' });

      timerRef.current = setTimeout(() => {
        if (!isRunningRef.current) return;
        triggerCollisionAndFusion(prevCharImg, step.resultImg, step.revealStyle, () => {
          executeChainStep(steps, stepIdx + 1, step.resultImg);
        });
      }, 850);
    }, 300);
  };

  const triggerCollisionAndFusion = (curCharImg, curResultImg, revealStyle, onCompleteStep) => {
    setShowFlash(true);
    timerRef.current = setTimeout(() => setShowFlash(false), 550);

    const canvas = canvasRef.current;
    if (!canvas) return;
    syncCanvasSize();
    canvas.classList.remove('opacity-0');
    canvas.classList.add('opacity-100');

    setShowBgChar(false);

    setFlyEmojiAnimClass('animate-spin-absorb');
    timerRef.current = setTimeout(() => {
      setFlyEmojiStyle({ opacity: 0 });
      setFlyEmojiAnimClass('');
    }, 700);

    let time = 0;
    let elapsed = 0;
    const totalMs = 1800;
    const speed = swirlSpeed;
    const swirlVal = swirlIntensity / 100;
    const ctx = canvas.getContext('2d');
    const W = 1080, H = 1920;

    const offA = drawToOff(curCharImg, W, H);
    const offB = drawToOff(curResultImg, W, H);
    const pxA = offA.getImageData(0, 0, W, H).data;
    const pxB = offB.getImageData(0, 0, W, H).data;

    const loop = () => {
      if (!isRunningRef.current) return;
      const progress = Math.min(1, elapsed / totalMs);
      const out = ctx.createImageData(W, H);

      fxFusion(pxA, pxB, out.data, W, H, time, progress, swirlVal);
      ctx.putImageData(out, 0, 0);

      time += speed * 0.14;
      elapsed += 16 * (speed / 3.5);

      if (elapsed < totalMs) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        setResultImgSrc(curResultImg.src);
        setShowResult(true);
        playSfxReveal();

        canvas.classList.remove('opacity-100');
        canvas.classList.add('opacity-0');

        timerRef.current = setTimeout(() => {
          if (onCompleteStep) onCompleteStep();
        }, 2200);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const finishSingleBlend = (completedSteps) => {
    setIsRunning(false);
    setActiveStepIdx(-1);

    const gridData = completedSteps.map((s) => ({
      emojiSrc: s.emojiSrc,
      resultSrc: s.resultSrc
    }));
    setFinalGridItems(gridData);

    timerRef.current = setTimeout(() => {
      setShowFinalGrid(true);
      gridData.forEach((_, idx) => {
        setTimeout(() => playSfxBadgePop(idx), 300 + idx * 300);
      });
    }, 1000);
  };

  /* --- RUN BLEND+ (MULTI-STREAM) MODE --- */
  const runBlendPlus = () => {
    if (isRunning) {
      resetAll();
      return;
    }

    const validStreams = bpStreams.filter((s) => s.charImg && s.emojiImg && s.resultImg);
    if (validStreams.length === 0) {
      alert('Cần ít nhất 1 dòng có đầy đủ: Ảnh nhân vật + Emoji + Kết quả!');
      return;
    }

    // Tự động xoay ngang 9:16 khi bắt đầu chạy!
    setIs916Mode(true);
    setIsRunning(true);
    setShowFinalGrid(false);

    setTimeout(() => {
      syncCanvasSize();
      executeBpStreamSequence(validStreams, 0);
    }, 150);
  };

  const executeBpStreamSequence = (validStreams, sIdx) => {
    if (!isRunningRef.current) return;
    if (sIdx >= validStreams.length) {
      setIsRunning(false);
      setBpActiveRowIdx(-1);
      return;
    }

    const stream = validStreams[sIdx];
    setBpActiveRowIdx(sIdx);
    setShowResult(false);

    setBgCharSrc(stream.charSrc);
    setShowBgChar(true);

    setFlyEmojiSrc(stream.emojiSrc);
    setFlyEmojiStyle({ opacity: 0, bottom: '-60%', left: '50%', transform: 'translateX(-50%)' });

    const waitMs = Math.max(300, bpCharWaitSec * 1000);
    timerRef.current = setTimeout(() => {
      if (!isRunningRef.current) return;
      playSfxSwoosh(true);
      setFlyEmojiStyle({ opacity: 1, bottom: '38%', left: '50%', transform: 'translateX(-50%)', transition: 'all 0.75s ease-out' });

      timerRef.current = setTimeout(() => {
        if (!isRunningRef.current) return;
        triggerCollisionAndFusion(stream.charImg, stream.resultImg, 'none', () => {
          const pauseMs = Math.max(500, bpPauseSec * 1000);
          timerRef.current = setTimeout(() => {
            executeBpStreamSequence(validStreams, sIdx + 1);
          }, pauseMs);
        });
      }, 850);
    }, waitMs);
  };

  // Get list of header emoji items for display
  const headerEmojiItems = activeTab === 'blendplus'
    ? bpStreams.filter(s => s.emojiSrc)
    : blendSteps.filter(s => s.emojiSrc);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-slate-950 text-white overflow-hidden relative">
      {/* LEFT SIDEBAR: CONTROL PANEL */}
      <div className={`w-full lg:w-96 bg-slate-900/90 border-r border-slate-800 flex flex-col z-30 transition-all ${is916Mode ? 'hidden' : 'flex'}`}>
        {/* HEADER & TAB SWITCHER */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 shadow-lg shadow-pink-500/20">
                <Wand2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-base bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  BLEND & BLEND+
                </h1>
                <p className="text-[11px] text-slate-400">Trộn ảnh & hiệu ứng Vortex Swirl</p>
              </div>
            </div>

            <button
              onClick={() => setIs916Mode(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Maximize2 size={13} /> Khởi chạy 9:16
            </button>
          </div>

          {/* TAB BUTTONS */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => { setActiveTab('blend'); resetAll(); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'blend'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} /> Blend (Đơn)
            </button>

            <button
              onClick={() => { setActiveTab('blendplus'); resetAll(); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'blendplus'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={14} /> Blend+ (Chuỗi Lượt)
            </button>
          </div>
        </div>

        {/* TAB 1: SINGLE BLEND FORM */}
        {activeTab === 'blend' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* STEP 1: BASE CHARACTER IMAGE */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-center leading-5 text-[11px] font-black">1</span>
                Ảnh Nhân Vật Gốc:
              </label>

              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCharUpload}
                  className="hidden"
                  id="blend-char-input"
                />
                <label
                  htmlFor="blend-char-input"
                  className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-700 hover:border-pink-500/50 rounded-2xl cursor-pointer bg-slate-950/50 transition-all overflow-hidden relative"
                >
                  {charImgSrc ? (
                    <img src={charImgSrc} alt="Character" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-500 group-hover:text-pink-400">
                      <Upload size={22} />
                      <span className="text-xs font-semibold">Tải ảnh Nhân vật</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* STEP 2: BLEND PAIRS (EMOJI + RESULT) WITH DRAG & DROP REORDER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-center leading-5 text-[11px] font-black">2</span>
                  Các Bước Blend (Tối đa 4):
                </label>
                {blendSteps.length < 4 && (
                  <button
                    onClick={addBlendStep}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Thêm bước
                  </button>
                )}
              </div>

              {/* BATCH UPLOAD BUTTONS FOR SINGLE BLEND */}
              <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  id="batch-emoji-input"
                  className="hidden"
                  onChange={(e) => handleBatchEmojiUpload(e.target.files)}
                />
                <label
                  htmlFor="batch-emoji-input"
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/50 rounded-lg text-[10px] font-bold text-purple-300 cursor-pointer transition-all text-center"
                >
                  <FolderPlus size={14} /> Tải nhiều Emoji
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  id="batch-result-input"
                  className="hidden"
                  onChange={(e) => handleBatchResultUpload(e.target.files)}
                />
                <label
                  htmlFor="batch-result-input"
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-pink-900/40 hover:bg-pink-900/70 border border-pink-700/50 rounded-lg text-[10px] font-bold text-pink-300 cursor-pointer transition-all text-center"
                >
                  <FolderPlus size={14} /> Tải nhiều Kết quả
                </label>
              </div>

              {blendSteps.map((step, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => handleDragStart('step', idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx, 'step')}
                  className={`p-3 border rounded-2xl bg-slate-950/60 space-y-2 transition-all cursor-move ${
                    activeStepIdx === idx ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-slate-800'
                  } ${dragOverIndex === idx ? 'border-purple-400 border-dashed scale-[1.01]' : ''}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <GripVertical size={14} className="text-slate-500 hover:text-white" />
                      <span className="text-xs font-extrabold text-pink-400">Bước {idx + 1}</span>
                    </div>
                    {blendSteps.length > 1 && (
                      <button
                        onClick={() => removeBlendStep(idx)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* EMOJI UPLOAD & DRAG */}
                    <div
                      draggable={!!step.emojiSrc}
                      onDragStart={() => handleDragStart('emoji', idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx, 'emoji')}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">Ảnh Emoji (Kéo thả):</span>
                      <input
                        type="file"
                        accept="image/*"
                        id={`emoji-input-${idx}`}
                        className="hidden"
                        onChange={(e) => handleStepUpload(idx, 'emoji', e.target.files[0])}
                      />
                      <label
                        htmlFor={`emoji-input-${idx}`}
                        className="flex flex-col items-center justify-center h-20 border border-dashed border-slate-700 hover:border-purple-500/50 rounded-xl cursor-pointer bg-slate-900 transition-all overflow-hidden relative"
                      >
                        {step.emojiSrc ? (
                          <img src={step.emojiSrc} alt="Emoji" className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-500 text-[10px]">
                            <ImageIcon size={16} />
                            <span>Tải Emoji</span>
                          </div>
                        )}
                      </label>
                    </div>

                    {/* RESULT UPLOAD & DRAG */}
                    <div
                      draggable={!!step.resultSrc}
                      onDragStart={() => handleDragStart('result', idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx, 'result')}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">Ảnh Kết Quả (Kéo thả):</span>
                      <input
                        type="file"
                        accept="image/*"
                        id={`result-input-${idx}`}
                        className="hidden"
                        onChange={(e) => handleStepUpload(idx, 'result', e.target.files[0])}
                      />
                      <label
                        htmlFor={`result-input-${idx}`}
                        className="flex flex-col items-center justify-center h-20 border border-dashed border-slate-700 hover:border-pink-500/50 rounded-xl cursor-pointer bg-slate-900 transition-all overflow-hidden relative"
                      >
                        {step.resultSrc ? (
                          <img src={step.resultSrc} alt="Result" className="w-full h-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-500 text-[10px]">
                            <ImageIcon size={16} />
                            <span>Tải Kết quả</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CONTROL SLIDERS & SETTINGS */}
            <div className="p-3 border border-slate-800 rounded-2xl bg-slate-950/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 border-b border-slate-800/80 pb-2">
                <Settings size={14} className="text-pink-400" /> Cài đặt Kích thước & Vị trí
              </div>

              {/* Vị trí Header Emoji (Top) */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Vị trí Header Emoji (Vào từ mép trên):</span>
                  <span className="text-pink-400 font-bold">{headerTop}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={headerTop}
                  onChange={(e) => setHeaderTop(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Kích thước Khung Emoji */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Kích thước Thẻ Emoji:</span>
                  <span className="text-pink-400 font-bold">{headerEmojiSize}px</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="300"
                  step="8"
                  value={headerEmojiSize}
                  onChange={(e) => setHeaderEmojiSize(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Kích thước Ảnh (Dùng chung) */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Kích thước Ảnh (Nhân vật & Kết quả):</span>
                  <span className="text-pink-400 font-bold">{imageScale}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={imageScale}
                  onChange={(e) => setImageScale(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Vị trí Dọc Ảnh (Nhân vật & Kết quả) */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Vị trí Dọc Ảnh (Nhân vật & Kết quả):</span>
                  <span className="text-pink-400 font-bold">{imgOffsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  step="10"
                  value={imgOffsetY}
                  onChange={(e) => setImgOffsetY(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Vị trí Ngang Ảnh (Nhân vật & Kết quả) */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Vị trí Ngang Ảnh (Nhân vật & Kết quả):</span>
                  <span className="text-pink-400 font-bold">{imgOffsetX}px</span>
                </div>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  step="10"
                  value={imgOffsetX}
                  onChange={(e) => setImgOffsetX(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Tốc độ Vortex */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Tốc độ xoáy Vortex:</span>
                  <span className="text-pink-400 font-bold">{swirlSpeed}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={swirlSpeed}
                  onChange={(e) => setSwirlSpeed(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Câu hỏi bảng tổng kết 4 ô:</span>
                </div>
                <input
                  type="text"
                  value={finalQuestion}
                  onChange={(e) => setFinalQuestion(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={runBlendSingle}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-purple-600/30 hover:scale-[1.02]'
              }`}
            >
              {isRunning ? <Square size={16} /> : <Play size={16} />}
              {isRunning ? 'Dừng Blend' : 'Bắt đầu Blend (Xoay 9:16)'}
            </button>
          </div>
        )}

        {/* TAB 2: BLEND+ (MULTI-STREAM TABLE) WITH DRAG & DROP REORDER */}
        {activeTab === 'blendplus' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-400" /> Danh sách Luồng Blend+ :
              </label>
              <button
                onClick={addBpStream}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Thêm luồng
              </button>
            </div>

            {/* BATCH UPLOAD BUTTONS FOR BLEND+ */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
              <input
                type="file"
                accept="image/*"
                multiple
                id="bp-batch-emoji-input"
                className="hidden"
                onChange={(e) => handleBpBatchEmojiUpload(e.target.files)}
              />
              <label
                htmlFor="bp-batch-emoji-input"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-indigo-900/40 hover:bg-indigo-900/70 border border-indigo-700/50 rounded-lg text-[10px] font-bold text-indigo-300 cursor-pointer transition-all text-center"
              >
                <FolderPlus size={14} /> Tải hàng loạt Emoji
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                id="bp-batch-result-input"
                className="hidden"
                onChange={(e) => handleBpBatchResultUpload(e.target.files)}
              />
              <label
                htmlFor="bp-batch-result-input"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-pink-900/40 hover:bg-pink-900/70 border border-pink-700/50 rounded-lg text-[10px] font-bold text-pink-300 cursor-pointer transition-all text-center"
              >
                <FolderPlus size={14} /> Tải hàng loạt Kết quả
              </label>
            </div>

            {/* STREAMS LIST */}
            <div className="space-y-3">
              {bpStreams.map((st, idx) => (
                <div
                  key={st.id}
                  draggable
                  onDragStart={() => handleDragStart('stream', idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx, 'stream')}
                  className={`p-3 border rounded-2xl bg-slate-950/60 space-y-2 transition-all cursor-move ${
                    bpActiveRowIdx === idx ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-950/20' : 'border-slate-800'
                  } ${dragOverIndex === idx ? 'border-indigo-400 border-dashed scale-[1.01]' : ''}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <GripVertical size={14} className="text-slate-500 hover:text-white" />
                      <span className="text-xs font-extrabold text-indigo-400">Luồng #{idx + 1}</span>
                    </div>
                    {bpStreams.length > 1 && (
                      <button
                        onClick={() => removeBpStream(idx)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* CHAR */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">Nhân vật:</span>
                      <input
                        type="file"
                        accept="image/*"
                        id={`bp-char-${idx}`}
                        className="hidden"
                        onChange={(e) => handleBpUpload(idx, 'char', e.target.files[0])}
                      />
                      <label
                        htmlFor={`bp-char-${idx}`}
                        className="flex flex-col items-center justify-center h-16 border border-dashed border-slate-700 hover:border-indigo-500/50 rounded-xl cursor-pointer bg-slate-900 overflow-hidden"
                      >
                        {st.charSrc ? (
                          <img src={st.charSrc} alt="Char" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-slate-500">+ Tải</span>
                        )}
                      </label>
                    </div>

                    {/* EMOJI */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">Emoji:</span>
                      <input
                        type="file"
                        accept="image/*"
                        id={`bp-emoji-${idx}`}
                        className="hidden"
                        onChange={(e) => handleBpUpload(idx, 'emoji', e.target.files[0])}
                      />
                      <label
                        htmlFor={`bp-emoji-${idx}`}
                        className="flex flex-col items-center justify-center h-16 border border-dashed border-slate-700 hover:border-purple-500/50 rounded-xl cursor-pointer bg-slate-900 overflow-hidden"
                      >
                        {st.emojiSrc ? (
                          <img src={st.emojiSrc} alt="Emoji" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-slate-500">+ Tải</span>
                        )}
                      </label>
                    </div>

                    {/* RESULT */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">Kết quả:</span>
                      <input
                        type="file"
                        accept="image/*"
                        id={`bp-res-${idx}`}
                        className="hidden"
                        onChange={(e) => handleBpUpload(idx, 'result', e.target.files[0])}
                      />
                      <label
                        htmlFor={`bp-res-${idx}`}
                        className="flex flex-col items-center justify-center h-16 border border-dashed border-slate-700 hover:border-pink-500/50 rounded-xl cursor-pointer bg-slate-900 overflow-hidden"
                      >
                        {st.resultSrc ? (
                          <img src={st.resultSrc} alt="Result" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-slate-500">+ Tải</span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TIMING CONTROLS & LAYOUT CUSTOMIZATION */}
            <div className="p-3 border border-slate-800 rounded-2xl bg-slate-950/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 border-b border-slate-800/80 pb-2">
                <Settings size={14} className="text-indigo-400" /> Cài đặt Kích thước & Vị trí
              </div>

              {/* Vị trí Header Emoji (Top) */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Vị trí Header Emoji (Vào từ mép trên):</span>
                  <span className="text-indigo-400 font-bold">{headerTop}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="5"
                  value={headerTop}
                  onChange={(e) => setHeaderTop(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Kích thước Khung Emoji */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Kích thước Thẻ Emoji:</span>
                  <span className="text-indigo-400 font-bold">{headerEmojiSize}px</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="300"
                  step="8"
                  value={headerEmojiSize}
                  onChange={(e) => setHeaderEmojiSize(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Kích thước Ảnh (Dùng chung) */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Kích thước Ảnh (Nhân vật & Kết quả):</span>
                  <span className="text-indigo-400 font-bold">{imageScale}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={imageScale}
                  onChange={(e) => setImageScale(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Vị trí Dọc Ảnh (Nhân vật & Kết quả) */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Vị trí Dọc Ảnh (Nhân vật & Kết quả):</span>
                  <span className="text-indigo-400 font-bold">{imgOffsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  step="10"
                  value={imgOffsetY}
                  onChange={(e) => setImgOffsetY(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Vị trí Ngang Ảnh (Nhân vật & Kết quả) */}
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Vị trí Ngang Ảnh (Nhân vật & Kết quả):</span>
                  <span className="text-indigo-400 font-bold">{imgOffsetX}px</span>
                </div>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  step="10"
                  value={imgOffsetX}
                  onChange={(e) => setImgOffsetX(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Thời gian chờ Emoji bay (giây):</span>
                  <span className="text-indigo-400 font-bold">{bpCharWaitSec}s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={bpCharWaitSec}
                  onChange={(e) => setBpCharWaitSec(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                  <span>Thời gian dừng kết quả (giây):</span>
                  <span className="text-indigo-400 font-bold">{bpPauseSec}s</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.5"
                  value={bpPauseSec}
                  onChange={(e) => setBpPauseSec(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={runBlendPlus}
              className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-indigo-600/30 hover:scale-[1.02]'
              }`}
            >
              {isRunning ? <Square size={16} /> : <Wand2 size={16} />}
              {isRunning ? 'Dừng Blend+' : 'Bắt đầu Blend+ (Xoay 9:16)'}
            </button>
          </div>
        )}
      </div>

      {/* RIGHT STAGE: UNIFORM STAGE CANVAS WITH LIGHT GRID BACKGROUND MATCHING THE SCREENSHOT EXACTLY */}
      <div className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'}`}>
        <div
          ref={stageRef}
          className={`relative overflow-hidden cursor-auto transition-all duration-300 ${is916Mode
              ? 'w-full h-full bg-white flex items-center justify-center'
              : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
            }`}
        >
          {/* Nền Grid Kẻ Ô Mờ Tươi Sáng Chuẩn 100% Giống Hệt Trong Ảnh Mẫu */}
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              backgroundImage: `linear-gradient(#e0e7ff 1px, transparent 1px), linear-gradient(90deg, #e0e7ff 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* FULL HD 1080x1920 STAGE ROTATED -90DEG DYNAMICALLY SCALED TO FILL SCREEN PERFECTLY */}
          <div
            ref={theaterRef}
            className="relative w-[1080px] h-[1920px] bg-transparent overflow-hidden transition-transform duration-300"
            style={{
              transform: `rotate(-90deg) scale(${stageScale})`,
              transformOrigin: 'center center'
            }}
          >
            {/* EMOJI HEADER BAR ALONG STAGE TOP EDGE (Appears vertically on left side when rotated -90deg) */}
            {!showFinalGrid && headerEmojiItems.length > 0 && (
              <div 
                className="absolute z-30 flex flex-row gap-8 p-6 bg-white/95 border-3 border-purple-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] rounded-[56px] backdrop-blur-md transition-all duration-300 left-1/2 -translate-x-1/2"
                style={{
                  top: `${headerTop}px`
                }}
              >
                {headerEmojiItems.map((item, idx) => {
                  const isActive = activeTab === 'blendplus' ? bpActiveRowIdx === idx : activeStepIdx === idx;
                  const isDone = activeTab === 'blendplus' ? bpActiveRowIdx > idx : activeStepIdx > idx;

                  return (
                    <div
                      key={idx}
                      className={`relative bg-white border-4 rounded-[36px] p-3 flex items-center justify-center shadow-2xl transition-all duration-300 ${
                        isActive
                          ? 'border-purple-600 scale-110 shadow-purple-500/40 ring-8 ring-purple-500/20 animate-pulse'
                          : isDone
                          ? 'border-slate-300 opacity-60 grayscale-[0.2]'
                          : 'border-purple-100'
                      }`}
                      style={{
                        width: `${headerEmojiSize}px`,
                        height: `${headerEmojiSize}px`
                      }}
                    >
                      {/* BADGE ICON TOP-LEFT */}
                      <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-purple-600 border-3 border-white flex items-center justify-center shadow-xl z-10">
                        {BADGE_ICONS[idx % BADGE_ICONS.length]}
                      </div>

                      <img src={item.emojiSrc} alt={`Emoji ${idx + 1}`} className="w-full h-full object-contain filter drop-shadow-md" />
                    </div>
                  );
                })}
              </div>
            )}

            {/* LAYER 1: BG CHARACTER IMAGE */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-500 flex items-center justify-center p-8 ${showBgChar ? 'opacity-100' : 'opacity-0'}`}>
              {bgCharSrc && (
                <img 
                  src={bgCharSrc} 
                  alt="BG Character" 
                  className="w-full h-full object-contain transition-transform duration-300" 
                  style={{ transform: `translate(${imgOffsetX}px, ${imgOffsetY}px) scale(${imageScale / 100})` }}
                />
              )}
            </div>

            {/* LAYER 2: FLYING EMOJI */}
            {flyEmojiSrc && (
              <div
                className={`absolute w-56 h-56 z-20 pointer-events-none transition-all duration-750 flex items-center justify-center ${flyEmojiAnimClass}`}
                style={flyEmojiStyle}
              >
                <img src={flyEmojiSrc} alt="Flying Emoji" className="w-full h-full object-contain filter drop-shadow-2xl" />
              </div>
            )}

            {/* LAYER 3: CANVAS PIXEL VORTEX SWIRL */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-10 w-full h-full pointer-events-none transition-opacity duration-300 opacity-0"
            />

            {/* LAYER 4: COLLISION FLASH EXPLOSION */}
            {showFlash && (
              <div className="absolute inset-0 z-30 pointer-events-none bg-radial from-white via-pink-100/80 to-transparent animate-ping" />
            )}

            {/* LAYER 5: RESULT IMAGE REVEAL */}
            <div className={`absolute inset-0 z-20 transition-all duration-500 flex items-center justify-center bg-transparent p-8 ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
              {resultImgSrc && (
                <img 
                  src={resultImgSrc} 
                  alt="Result" 
                  className="w-full h-full object-contain transition-transform duration-300" 
                  style={{ transform: `translate(${imgOffsetX}px, ${imgOffsetY}px) scale(${imageScale / 100})` }}
                />
              )}
            </div>

            {/* LAYER 6: FINAL 4-GRID SUMMARY SCREEN OVERLAY */}
            {showFinalGrid && (
              <div className="absolute inset-0 z-40 bg-slate-950/95 flex flex-col p-8 animate-fade-in">
                <div className="text-center my-4">
                  <h2 className="text-xl font-black tracking-wider text-pink-400 uppercase drop-shadow-md">
                    {finalQuestion}
                  </h2>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-6 items-center justify-center">
                  {finalGridItems.map((item, i) => (
                    <div key={i} className="relative aspect-[3/4] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2">
                      <img src={item.resultSrc} alt={`Result ${i + 1}`} className="w-full h-full object-contain" />
                      
                      {/* EMOJI BADGE TOP */}
                      {item.emojiSrc && (
                        <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-slate-950/80 border border-slate-700 p-2 shadow-md">
                          <img src={item.emojiSrc} alt="Badge" className="w-full h-full object-contain" />
                        </div>
                      )}

                      {/* OPTION NUMBER BOTTOM */}
                      <div className="absolute bottom-4 inset-x-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl text-xs font-extrabold text-center text-white shadow-md">
                        Tùy chọn #{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
