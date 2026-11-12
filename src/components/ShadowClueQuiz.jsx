import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Upload, Play, Pause, RotateCcw, ChevronDown, ChevronUp, 
  Trash2, Plus, ArrowRight, ArrowLeft, Eye, HelpCircle, 
  CheckCircle2, Palette, Sparkles, Volume2, VolumeX 
} from 'lucide-react';
import { StageBackgroundOverlay } from '../context/StageBackgroundContext';
import NumberInput from './NumberInput';
import { saveLocalImage, loadLocalImage, removeLocalImage } from '../utils/localImageStorage';
import heroImg from '../assets/hero.png';

const DEFAULT_SETTINGS = {
  clueInterval: 4,     // Thời gian mỗi gợi ý (giây)
  holdDuration: 3.5,   // Thời gian hiển thị kết quả trước khi next (giây)
  cluesToShow: 3,      // Số lượng ô gợi ý màu (1 - 5)
  silhouetteColor: '#0a0d14', // Màu bóng đen silhouette
  bgColor: '#0f172a',  // Màu nền sân khấu
  soundEnabled: true,
  autoAdvance: true,
  loop: true,
};

// Hàm sinh các ô gợi ý chia vùng trên canvas 960x540
function generateCluePatches(W, H, count) {
  const cols = 4;
  const rows = 3;
  const cw = W / cols;
  const ch = H / rows;
  const candidates = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Bỏ bớt các góc rìa quá xa tâm
      const distFromCenter = Math.hypot((c + 0.5) - cols / 2, (r + 0.5) - rows / 2);
      candidates.push({
        x: c * cw + cw * 0.1,
        y: r * ch + ch * 0.1,
        w: cw * 0.8,
        h: ch * 0.8,
        dist: distFromCenter
      });
    }
  }

  // Sắp xếp ưu tiên các ô gần tâm hơn một chút rồi xáo trộn ngẫu nhiên
  candidates.sort(() => Math.random() - 0.5);
  return candidates.slice(0, Math.min(count, candidates.length));
}

export default function ShadowClueQuiz({ is916Mode, setIs916Mode }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('shadow_quiz_settings_v1');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Danh sách các nhân vật: { name: string, imageKey: string }
  const [characters, setCharacters] = useState([]);
  const [charImages, setCharImages] = useState({}); // imageKey -> HTMLImageElement
  const [roundIndex, setRoundIndex] = useState(0);
  const [clueIndex, setClueIndex] = useState(0); // 0 = silhouette, 1..N = clue, N+1 = revealed
  const [quizState, setQuizState] = useState('ready'); // 'ready' | 'running' | 'revealed' | 'paused'
  const [stageScale, setStageScale] = useState(1);
  const [openSections, setOpenSections] = useState({ list: true, time: true, style: false });

  const canvasRef = useRef(null);
  const stageWrapperRef = useRef(null);
  const cluePatchesRef = useRef([]);
  const timerRef = useRef(null);
  const timerStartRef = useRef(0);
  const timerRemainingRef = useRef(0);
  const audioCtxRef = useRef(null);

  // Lưu settings vào localStorage
  useEffect(() => {
    try {
      const toSave = {
        ...settings,
        characterNames: characters.map(c => c.name),
      };
      localStorage.setItem('shadow_quiz_settings_v1', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Lỗi khi lưu cấu hình Shadow Quiz:', e);
    }
  }, [settings, characters]);

  // Load danh sách nhân vật và ảnh từ IndexedDB lúc khởi chạy
  useEffect(() => {
    async function initData() {
      let savedNames = [];
      try {
        const saved = JSON.parse(localStorage.getItem('shadow_quiz_settings_v1') || '{}');
        if (Array.isArray(saved.characterNames)) savedNames = saved.characterNames;
      } catch {}

      const loadedChars = [];
      const imgMap = {};

      for (let i = 0; i < 10; i++) {
        const key = `shadow_quiz_image_${i}`;
        const dataUrl = await loadLocalImage(key);
        if (dataUrl) {
          loadedChars.push({
            name: savedNames[i] || `Nhân vật ${i + 1}`,
            imageKey: key
          });
          const img = new Image();
          await new Promise(res => {
            img.onload = res;
            img.onerror = res;
            img.src = dataUrl;
          });
          imgMap[key] = img;
        } else if (i === 0 && loadedChars.length === 0) {
          // Nếu chưa có ảnh nào thì tải ảnh mặc định hero
          loadedChars.push({
            name: savedNames[0] || 'Siêu Anh Hùng',
            imageKey: 'default_hero'
          });
          const img = new Image();
          await new Promise(res => {
            img.onload = res;
            img.src = heroImg;
          });
          imgMap['default_hero'] = img;
        }
      }

      setCharacters(loadedChars);
      setCharImages(imgMap);
    }

    initData();
  }, []);

  // Âm thanh báo hiệu (ting ting khi có gợi ý mới, hoặc khi đoán đúng)
  const playSound = useCallback((type) => {
    if (!settings.soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'clue') {
        // Âm thanh "ping" nhẹ nhàng
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'reveal') {
        // Âm thanh fan-fare kết thúc mở màn
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        osc.start(now);
        osc.stop(now + 0.75);
      }
    } catch {}
  }, [settings.soundEnabled]);

  // Scale tính toán khung hình 960x540 (16:9 chuẩn)
  useEffect(() => {
    function handleResize() {
      if (!stageWrapperRef.current) return;
      const rect = stageWrapperRef.current.getBoundingClientRect();
      const pad = is916Mode ? 0 : 32;
      const availW = Math.max(300, rect.width - pad);
      const availH = Math.max(200, rect.height - pad);
      const scale = Math.min(availW / 960, availH / 540, 1.4);
      setStageScale(Math.max(0.3, scale));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [is916Mode]);

  // Khởi động vòng chơi mới
  const startRound = useCallback((index) => {
    clearTimeout(timerRef.current);
    setRoundIndex(index);
    setClueIndex(0);
    setQuizState('running');
    cluePatchesRef.current = generateCluePatches(960, 540, settings.cluesToShow);
    timerStartRef.current = Date.now();

    // Lên lịch cho gợi ý đầu tiên
    timerRef.current = setTimeout(() => {
      advanceClue(1);
    }, settings.clueInterval * 1000);
  }, [settings.clueInterval, settings.cluesToShow]);

  // Tiến trình mở gợi ý tiếp theo
  const advanceClue = useCallback((nextClue) => {
    if (nextClue <= settings.cluesToShow) {
      setClueIndex(nextClue);
      playSound('clue');
      timerStartRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        advanceClue(nextClue + 1);
      }, settings.clueInterval * 1000);
    } else {
      // Đã mở hết gợi ý -> Mở toàn bộ hình ảnh
      setClueIndex(settings.cluesToShow + 1);
      setQuizState('revealed');
      playSound('reveal');

      if (settings.autoAdvance) {
        timerRef.current = setTimeout(() => {
          setRoundIndex(prev => {
            const nextRound = prev + 1;
            if (nextRound >= characters.length) {
              if (settings.loop) {
                startRound(0);
                return 0;
              } else {
                setQuizState('ready');
                return 0;
              }
            } else {
              startRound(nextRound);
              return nextRound;
            }
          });
        }, settings.holdDuration * 1000);
      }
    }
  }, [settings.cluesToShow, settings.clueInterval, settings.autoAdvance, settings.holdDuration, settings.loop, characters.length, playSound, startRound]);

  // Bắt đầu / Tạm dừng
  const togglePlay = useCallback(() => {
    if (quizState === 'ready') {
      startRound(roundIndex);
    } else if (quizState === 'running') {
      clearTimeout(timerRef.current);
      setQuizState('paused');
    } else if (quizState === 'paused') {
      setQuizState('running');
      timerStartRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        advanceClue(clueIndex + 1);
      }, settings.clueInterval * 1000);
    } else if (quizState === 'revealed') {
      // Đang hiển thị kết quả mà bấm Space -> sang luôn nhân vật tiếp
      const nextRound = (roundIndex + 1) % characters.length;
      startRound(nextRound);
    }
  }, [quizState, roundIndex, clueIndex, characters.length, settings.clueInterval, startRound, advanceClue]);

  // Chuyển thủ công tới round
  const goToRound = useCallback((idx) => {
    if (idx < 0 || idx >= characters.length) return;
    startRound(idx);
  }, [characters.length, startRound]);

  // Keyboard điều khiển
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        goToRound((roundIndex + 1) % characters.length);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goToRound((roundIndex - 1 + characters.length) % characters.length);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        startRound(0);
      } else if (e.code === 'Escape' && is916Mode) {
        setIs916Mode(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, goToRound, roundIndex, characters.length, startRound, is916Mode, setIs916Mode]);

  // Vẽ Canvas liên tục
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 960;
    const H = 540;

    let rafId;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // 1. Nền canvas
      ctx.fillStyle = settings.bgColor;
      ctx.fillRect(0, 0, W, H);

      const currentChar = characters[roundIndex];
      const img = currentChar ? charImages[currentChar.imageKey] : null;

      if (!img) {
        // Placeholder khi chưa có ảnh
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(W / 2 - 200, H / 2 - 120, 400, 240);
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Chưa có nhân vật nào trong danh sách', W / 2, H / 2);
      } else {
        // Tính toán căn giữa và vừa vặn kích thước
        const fitScale = Math.min((W * 0.8) / img.naturalWidth, (H * 0.8) / img.naturalHeight);
        const dw = img.naturalWidth * fitScale;
        const dh = img.naturalHeight * fitScale;
        const dx = (W - dw) / 2;
        const dy = (H - dh) / 2;

        const isFullyRevealed = quizState === 'revealed' || clueIndex > settings.cluesToShow;

        if (isFullyRevealed) {
          // Vẽ ảnh màu đầy đủ
          ctx.drawImage(img, dx, dy, dw, dh);
        } else {
          // Vẽ bóng đen Silhouette
          // Sử dụng offscreen canvas để cắt chuẩn hình dạng alpha của nhân vật
          const offCanvas = document.createElement('canvas');
          offCanvas.width = W;
          offCanvas.height = H;
          const offCtx = offCanvas.getContext('2d');

          // Tô màu bóng đen
          offCtx.fillStyle = settings.silhouetteColor;
          offCtx.fillRect(0, 0, W, H);

          // Cắt theo alpha nhân vật
          offCtx.globalCompositeOperation = 'destination-in';
          offCtx.drawImage(img, dx, dy, dw, dh);

          // Vẽ bóng đen lên canvas chính
          ctx.drawImage(offCanvas, 0, 0);

          // Vẽ các mảng màu gợi ý (Clue Patches)
          for (let i = 0; i < clueIndex; i++) {
            const patch = cluePatchesRef.current[i];
            if (!patch) continue;

            ctx.save();
            ctx.beginPath();
            ctx.rect(patch.x, patch.y, patch.w, patch.h);
            ctx.clip();

            // Vẽ ảnh màu bên trong vùng giới hạn
            ctx.drawImage(img, dx, dy, dw, dh);

            // Viền sáng xung quanh ô gợi ý
            ctx.strokeStyle = 'rgba(255, 230, 0, 0.85)';
            ctx.lineWidth = 3;
            ctx.strokeRect(patch.x, patch.y, patch.w, patch.h);
            ctx.restore();
          }
        }
      }

      // 2. UI Overlay trên màn hình ghi hình
      // Round badge (Góc trên bên trái)
      if (characters.length > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        ctx.roundRect(24, 24, 180, 42, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`🎮 Câu ${roundIndex + 1} / ${characters.length}`, 40, 51);
        ctx.restore();
      }

      // Clue counter (Góc trên bên phải)
      if (quizState === 'running' || quizState === 'paused') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        ctx.roundRect(W - 204, 24, 180, 42, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 15px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🔍 Gợi ý: ${clueIndex} / ${settings.cluesToShow}`, W - 114, 51);
        ctx.restore();
      }

      // Thanh đếm ngược thời gian gợi ý ở đáy canvas
      if (quizState === 'running') {
        const elapsed = (Date.now() - timerStartRef.current) / 1000;
        const progress = Math.min(elapsed / settings.clueInterval, 1);
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.fillRect(0, H - 6, W * (1 - progress), 6);
        ctx.restore();
      }

      // Tên nhân vật hiện ra khi đã mở toang (Lộ diện)
      if (quizState === 'revealed') {
        const charName = currentChar?.name || `Nhân vật bí mật`;
        ctx.save();
        ctx.font = 'bold 32px system-ui, sans-serif';
        const textWidth = ctx.measureText(charName).width;
        const boxWidth = Math.max(260, textWidth + 80);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.beginPath();
        ctx.roundRect((W - boxWidth) / 2, H - 90, boxWidth, 60, 16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(charName, W / 2, H - 49);
        ctx.restore();
      }

      // Thông báo sẵn sàng khi mới mở
      if (quizState === 'ready') {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = 'bold 24px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NHẤN SPACE ĐỂ BẮT ĐẦU ĐỐ VUI', W / 2, H / 2);
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [characters, charImages, roundIndex, clueIndex, quizState, settings]);

  // Thêm nhân vật mới
  const handleAddCharacter = async (e) => {
    const file = e.target.files?.[0];
    if (!file || characters.length >= 10) return;

    const newIndex = characters.length;
    const key = `shadow_quiz_image_${newIndex}`;

    try {
      await saveLocalImage(key, file);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setCharImages(prev => ({ ...prev, [key]: img }));
      };
      img.src = url;

      const newChar = {
        name: file.name.replace(/\.[^/.]+$/, ''), // Lấy tên file bỏ đuôi
        imageKey: key
      };
      setCharacters(prev => [...prev, newChar]);
    } catch (err) {
      console.error('Lỗi khi thêm nhân vật:', err);
    }
  };

  // Cập nhật tên nhân vật
  const handleUpdateName = (index, newName) => {
    setCharacters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: newName };
      return updated;
    });
  };

  // Xóa nhân vật
  const handleDeleteCharacter = async (index) => {
    if (characters.length <= 1) return;
    const target = characters[index];
    if (target.imageKey !== 'default_hero') {
      await removeLocalImage(target.imageKey);
    }
    setCharacters(prev => prev.filter((_, i) => i !== index));
    if (roundIndex >= index && roundIndex > 0) {
      setRoundIndex(p => p - 1);
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden relative select-none">
      {/* SÂN KHẤU 16:9 CHUẨN LANDSCAPE */}
      <div 
        ref={stageWrapperRef}
        className="flex-1 relative flex items-center justify-center p-3 bg-slate-900/60 overflow-hidden"
      >
        <StageBackgroundOverlay />

        {/* KHUNG CANVAS 960x540 TỈ LỆ 16:9 CHUẨN */}
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
              width: '960px',
              height: '540px',
              transform: `translate(-50%, -50%) scale(${stageScale})`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="w-full h-full block bg-slate-900 rounded-lg"
            />
          </div>

          {/* THANH ĐIỀU KHIỂN NHANH TRÊN MÀN HÌNH */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 pointer-events-auto bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/80 shadow-2xl">
            <button
              onClick={() => goToRound((roundIndex - 1 + characters.length) % characters.length)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Nhân vật trước (←)"
            >
              <ArrowLeft size={16} />
            </button>

            <button
              onClick={togglePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {quizState === 'running' ? (
                <>
                  <Pause size={14} className="fill-white" /> Tạm Dừng (Space)
                </>
              ) : (
                <>
                  <Play size={14} className="fill-white" /> {quizState === 'ready' ? 'Bắt Đầu (Space)' : 'Tiếp Tục (Space)'}
                </>
              )}
            </button>

            <button
              onClick={() => goToRound((roundIndex + 1) % characters.length)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Nhân vật tiếp theo (→)"
            >
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => startRound(roundIndex)}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-full transition-colors cursor-pointer ml-1"
              title="Đoán lại câu này (R)"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* CỘT CÀI ĐẶT BÊN PHẢI (Ẩn khi quay fullscreen) */}
      {!is916Mode && (
        <aside className="w-84 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full overflow-hidden z-20">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
              <Eye size={20} />
              <span>Giải Mã Bóng Đen</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
              Video Dài 16:9
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* MỤC 1: DANH SÁCH NHÂN VẬT SERIES */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, list: !p.list }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Upload size={14} className="text-sky-400" /> Danh Sách Nhân Vật ({characters.length}/10)
                </span>
                {openSections.list ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.list && (
                <div className="p-3 pt-0 space-y-2.5">
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {characters.map((char, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                          roundIndex === idx 
                            ? 'bg-sky-500/15 border-sky-500/60 text-white' 
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="w-5 text-center font-bold text-[11px] text-slate-400">{idx + 1}</span>
                        <input
                          type="text"
                          value={char.name}
                          onChange={(e) => handleUpdateName(idx, e.target.value)}
                          placeholder="Tên nhân vật..."
                          className="flex-1 bg-slate-950/70 border border-slate-700 px-2 py-1 rounded text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                        <button
                          onClick={() => goToRound(idx)}
                          className="p-1 hover:text-sky-400 text-slate-400 transition-colors cursor-pointer"
                          title="Chuyển đến câu này"
                        >
                          <Play size={13} />
                        </button>
                        {characters.length > 1 && (
                          <button
                            onClick={() => handleDeleteCharacter(idx)}
                            className="p-1 hover:text-red-400 text-slate-500 transition-colors cursor-pointer"
                            title="Xóa nhân vật"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {characters.length < 10 && (
                    <label className="flex items-center justify-center gap-2 w-full py-2 px-3 border border-dashed border-slate-700 hover:border-sky-500/60 bg-slate-900/60 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-all text-slate-300 text-xs font-medium">
                      <Plus size={14} className="text-sky-400" />
                      <span>Thêm nhân vật mới (+)...</span>
                      <input type="file" accept="image/*" onChange={handleAddCharacter} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* MỤC 2: THỜI GIAN & GỢI Ý */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, time: !p.time }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" /> Nhịp Độ & Thời Gian
                </span>
                {openSections.time ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.time && (
                <div className="p-3 pt-0 space-y-3">
                  <NumberInput
                    label="Số lượng ô gợi ý:"
                    value={settings.cluesToShow}
                    onChange={(val) => setSettings(p => ({ ...p, cluesToShow: val }))}
                    min={1}
                    max={5}
                    step={1}
                  />

                  <NumberInput
                    label="Thời gian mỗi gợi ý (s):"
                    value={settings.clueInterval}
                    onChange={(val) => setSettings(p => ({ ...p, clueInterval: val }))}
                    min={2}
                    max={12}
                    step={0.5}
                  />

                  <NumberInput
                    label="Giữ kết quả trước khi next (s):"
                    value={settings.holdDuration}
                    onChange={(val) => setSettings(p => ({ ...p, holdDuration: val }))}
                    min={2}
                    max={10}
                    step={0.5}
                  />

                  <div className="pt-1">
                    <button
                      onClick={() => setSettings(p => ({ ...p, autoAdvance: !p.autoAdvance }))}
                      className={`flex items-center justify-between w-full p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        settings.autoAdvance
                          ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                          : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      <span>Tự động chuyển câu tiếp theo</span>
                      <span>{settings.autoAdvance ? 'BẬT' : 'TẮT'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MỤC 3: MÀU SẮC & ÂM THANH */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSections(p => ({ ...p, style: !p.style }))}
                className="w-full flex items-center justify-between p-3 font-semibold text-slate-200 hover:bg-slate-800/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Palette size={14} className="text-purple-400" /> Tùy Biến Giao Diện
                </span>
                {openSections.style ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              {openSections.style && (
                <div className="p-3 pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Màu bóng silhouette:</span>
                    <input
                      type="color"
                      value={settings.silhouetteColor}
                      onChange={(e) => setSettings(p => ({ ...p, silhouetteColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Màu nền sân khấu:</span>
                    <input
                      type="color"
                      value={settings.bgColor}
                      onChange={(e) => setSettings(p => ({ ...p, bgColor: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>

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
                      Hiệu ứng âm thanh Ping
                    </span>
                    <span>{settings.soundEnabled ? 'BẬT' : 'TẮT'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* HƯỚNG DẪN QUAY VIDEO DÀI */}
            <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl text-slate-400 space-y-1.5 text-[11px] leading-relaxed">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                🎬 Mẹo quay YouTube Video Dài (16:9):
              </div>
              <div>• Thêm từ 5 - 10 nhân vật theo một chủ đề (Anime, Marvel, Game, Pokemon...).</div>
              <div>• Bấm <b>"Khởi Chạy"</b> ở header để ẩn menu, sau đó bật phần mềm quay màn hình (OBS).</div>
              <div>• Bấm phím <b>Space</b>: Toàn bộ series sẽ tự động chạy, hiện từng gợi ý, lộ tên nhân vật và tự động chuyển câu hỏi!</div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
