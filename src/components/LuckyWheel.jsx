import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Play, Disc, Settings, RotateCcw, Heart, Layers } from 'lucide-react';

// Hình ảnh mặc định chất lượng cao dành cho Sonic, Tails, Knuckles và Phần thưởng
const DEFAULT_CHARACTERS = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', // Pikachu (Char 1)
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png',  // Charmander (Char 2)
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png'   // Squirtle (Char 3)
];

const DEFAULT_REWARDS = [
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png', // Mewtwo (Quái vật / Monster)
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',  // Gengar (Hố đen / Black Hole)
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png'  // Eevee (Quà thưởng / Gift)
];

const DEFAULT_COUPLE_IMG = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/175.png'; // Togepi (Kết quả hợp thể / Quà)

const STORAGE_KEY = 'lucky_wheel_settings_v2';

export default function LuckyWheel({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  const getSavedSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  const initialSettings = getSavedSettings();

  // --- MÀN HÌNH 1: SETUP CONFIG STATE ---
  const [isSetup, setIsSetup] = useState(true);

  const [characters, setCharacters] = useState(initialSettings.characters || DEFAULT_CHARACTERS);
  const [rewards, setRewards] = useState(initialSettings.rewards || DEFAULT_REWARDS);
  const [coupleImg, setCoupleImg] = useState(initialSettings.coupleImg || DEFAULT_COUPLE_IMG);

  // Thiết lập 3 lượt chơi (Mapping)
  const [scenarios, setScenarios] = useState(initialSettings.scenarios || [
    { charIndex: 0, doorColor: 'red', rewardIndex: 0 },    // Lượt 1: Char 1 -> Cửa Đỏ -> Quái vật (Bị cào)
    { charIndex: 1, doorColor: 'blue', rewardIndex: 1 },   // Lượt 2: Char 2 -> Cửa Xanh -> Hố đen (Bị hút)
    { charIndex: 2, doorColor: 'yellow', rewardIndex: 2 }  // Lượt 3: Char 3 -> Cửa Vàng -> Quà thưởng (Chiến thắng)
  ]);

  // Settings Tinh chỉnh Vị trí & Kích thước (Không giới hạn max)
  const [handSize, setHandSize] = useState(initialSettings.handSize ?? 48);

  const [wheelSize, setWheelSize] = useState(initialSettings.wheelSize ?? 260);
  const [wheelOffsetX, setWheelOffsetX] = useState(initialSettings.wheelOffsetX ?? 0);
  const [wheelOffsetY, setWheelOffsetY] = useState(initialSettings.wheelOffsetY ?? 0);

  // Kích thước cửa tăng đồng bộ tỷ lệ cả Rộng và Cao (width: doorSize, height: doorSize * 1.555)
  const [doorSize, setDoorSize] = useState(initialSettings.doorSize ?? initialSettings.doorWidth ?? 144);
  const [doorGap, setDoorGap] = useState(initialSettings.doorGap ?? 24);
  const [doorOffsetX, setDoorOffsetX] = useState(initialSettings.doorOffsetX ?? 0);
  const [doorOffsetY, setDoorOffsetY] = useState(initialSettings.doorOffsetY ?? 0);

  const [charSize, setCharSize] = useState(initialSettings.charSize ?? 128);
  const [charOffsetX, setCharOffsetX] = useState(initialSettings.charOffsetX ?? 0);
  const [charOffsetY, setCharOffsetY] = useState(initialSettings.charOffsetY ?? 0);

  // --- MÀN HÌNH 2: GAMEPLAY RUNTIME STATE ---
  const [currentTurn, setCurrentTurn] = useState(0); // 0, 1, 2
  const [turnPhase, setTurnPhase] = useState('idle'); // 'idle' | 'spinning' | 'walking' | 'action' | 'finished'
  const [wheelRotation, setWheelRotation] = useState(0);
  const [usedColors, setUsedColors] = useState([]); // Danh sách màu cửa đã quay xong
  const [openDoors, setOpenDoors] = useState({}); // { red: true/false, blue: true/false, yellow: true/false }
  const [charPos, setCharPos] = useState({ x: 0, y: 0, status: 'normal' }); // status: 'normal' | 'ko' | 'sucked' | 'dancing'

  // Cursor & Mode State
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  const stageRef = useRef(null);
  const doorRefs = useRef({});

  // Tự động lưu Cài đặt vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        handSize,
        wheelSize,
        wheelOffsetX,
        wheelOffsetY,
        doorSize,
        doorGap,
        doorOffsetX,
        doorOffsetY,
        charSize,
        charOffsetX,
        charOffsetY,
        coupleImg,
        characters,
        rewards,
        scenarios
      }));
    } catch (e) {
      console.error('Lỗi lưu Cài đặt LuckyWheel:', e);
    }
  }, [handSize, wheelSize, wheelOffsetX, wheelOffsetY, doorSize, doorGap, doorOffsetX, doorOffsetY, charSize, charOffsetX, charOffsetY, coupleImg, characters, rewards, scenarios]);

  // 1. Tải ảnh nhân vật
  const handleCharUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const updated = [...characters];
      updated[index] = url;
      setCharacters(updated);
    }
  };

  // 2. Tải ảnh phần thưởng
  const handleRewardUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const updated = [...rewards];
      updated[index] = url;
      setRewards(updated);
    }
  };

  // 3. Tải ảnh kết quả đặt giữa 2 nhân vật khi nhận quà
  const handleCoupleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoupleImg(URL.createObjectURL(file));
    }
  };

  // 4. Cập nhật Kịch bản lượt chơi
  const updateScenario = (turnIndex, field, value) => {
    const updated = [...scenarios];
    updated[turnIndex] = { ...updated[turnIndex], [field]: value };
    setScenarios(updated);
  };

  // Tracking vị trí con trỏ chuột
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // --- LUỒNG CHẠY GAMEPLAY ---

  const runTurn = (turnIdx = currentTurn, autoNext = true) => {
    if (turnIdx >= 3) return;

    const currentScenario = scenarios[turnIdx];
    if (!currentScenario) return;

    const targetColor = currentScenario.doorColor;

    setCurrentTurn(turnIdx);
    setTurnPhase('spinning');
    setCharPos({ x: 0, y: 0, status: 'normal' });

    // Góc xoay chuẩn đưa màu cửa lên đỉnh kim chỉ mốc 12h
    const targetRotations = { red: 300, blue: 180, yellow: 60 };
    const targetAngle = targetRotations[targetColor] ?? 0;

    setWheelRotation(prev => prev + 1800 + (360 - (prev % 360)) + targetAngle);

    // STEP 1 & 2: Vòng quay chạy 3.2s
    setTimeout(() => {
      setUsedColors(prev => [...prev, targetColor]);
      setTurnPhase('walking');

      // STEP 3: Di chuyển đến trước cửa (1.0s)
      setTimeout(() => {
        setTurnPhase('action');
        setOpenDoors(prev => ({ ...prev, [targetColor]: true }));

        // STEP 4: Mở cửa & Kích hoạt Animation (0.4s)
        setTimeout(() => {
          const rewardIdx = currentScenario.rewardIndex;
          if (rewardIdx === 0) {
            setCharPos(prev => ({ ...prev, status: 'ko' }));
          } else if (rewardIdx === 1) {
            setCharPos(prev => ({ ...prev, status: 'sucked' }));
          } else {
            setCharPos(prev => ({ ...prev, status: 'dancing' }));
          }

          // Kết thúc lượt sau 2.5s animation
          setTimeout(() => {
            if (turnIdx < 2) {
              if (autoNext) {
                setTimeout(() => {
                  runTurn(turnIdx + 1, true);
                }, 1200);
              } else {
                setCurrentTurn(turnIdx + 1);
                setTurnPhase('idle');
              }
            } else {
              setTurnPhase('finished');
            }
          }, 2500);

        }, 400);

      }, 1000);

    }, 3200);
  };

  const resetGame = () => {
    setCurrentTurn(0);
    setTurnPhase('idle');
    setWheelRotation(0);
    setUsedColors([]);
    setOpenDoors({});
    setCharPos({ x: 0, y: 0, status: 'normal' });
  };

  const handleStartGame = () => {
    setIsSetup(false);
    setIs916Mode(true);
    resetGame();

    setTimeout(() => {
      runTurn(0, true);
    }, 600);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (!isSetup) {
          if (turnPhase === 'idle' || turnPhase === 'finished') {
            resetGame();
            setTimeout(() => runTurn(0, true), 300);
          }
        }
      }
      if (e.key === 'Escape' || e.code === 'Escape') {
        setIs916Mode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSetup, turnPhase, currentTurn, scenarios]);

  const currentScenario = scenarios[currentTurn] || scenarios[0];
  const activeCharImg = characters[currentScenario.charIndex];

  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>

      {/* SIDEBAR BÊN TRÁI: SETUP & CÀI ĐẶT */}
      {!is916Mode && (
        <div className="w-96 bg-slate-800 p-5 border-r border-slate-700 flex flex-col gap-4 overflow-y-auto z-30">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              🎡 VÒNG QUAY CỬA BÍ MẬT
            </h2>
            <button
              onClick={() => setIsSetup(!isSetup)}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Settings size={14} /> {isSetup ? 'Xem Gameplay' : 'Cài Đặt'}
            </button>
          </div>

          {/* MÀN HÌNH CÀI ĐẶT (SETUP SCREEN) */}
          {isSetup ? (
            <div className="flex flex-col gap-4">
              {/* 1. Tải 3 Nhân Vật */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-amber-400 font-bold uppercase tracking-wide">1. Tải 3 Nhân Vật (PNG):</label>
                <div className="grid grid-cols-3 gap-2">
                  {characters.map((src, i) => (
                    <label key={i} className="h-16 bg-slate-700 rounded-lg cursor-pointer relative overflow-hidden border border-slate-600 hover:border-amber-400 flex items-center justify-center p-1">
                      <img src={src} alt={`Char ${i}`} className="w-full h-full object-contain" />
                      <input type="file" accept="image/*" onChange={(e) => handleCharUpload(e, i)} className="hidden" />
                      <span className="absolute bottom-0 right-0 bg-slate-900/80 text-[10px] text-slate-300 px-1 rounded-tl">NV {i + 1}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Tải 3 Phần Thưởng */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-amber-400 font-bold uppercase tracking-wide">2. Tải 3 Phần Thưởng/Hình Phạt:</label>
                <div className="grid grid-cols-3 gap-2">
                  {rewards.map((src, i) => (
                    <label key={i} className="h-16 bg-slate-700 rounded-lg cursor-pointer relative overflow-hidden border border-slate-600 hover:border-amber-400 flex items-center justify-center p-1">
                      <img src={src} alt={`Reward ${i}`} className="w-full h-full object-contain" />
                      <input type="file" accept="image/*" onChange={(e) => handleRewardUpload(e, i)} className="hidden" />
                      <span className="absolute bottom-0 right-0 bg-slate-900/80 text-[10px] text-slate-300 px-1 rounded-tl">
                        {i === 0 ? 'Quái vật' : i === 1 ? 'Hố đen' : 'Quà'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Tải Ảnh Kết Quả Hợp Thể / Kết Đôi Khai Mở Khi Nhận Quà */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-pink-400 font-bold uppercase tracking-wide flex items-center gap-1">
                  <Heart size={14} /> 3. Ảnh Hiển Thị Khi Nhận Quà (Đặt Giữa):
                </label>
                <label className="h-16 bg-slate-700 rounded-lg cursor-pointer relative overflow-hidden border border-dashed border-pink-500 hover:border-pink-400 flex items-center justify-center p-1">
                  <img src={coupleImg} alt="Couple Result" className="w-full h-full object-contain" />
                  <input type="file" accept="image/*" onChange={handleCoupleUpload} className="hidden" />
                  <span className="absolute bottom-0 right-0 bg-pink-900/80 text-[10px] text-pink-200 px-1 rounded-tl">Ảnh Kết Đôi</span>
                </label>
              </div>

              {/* 4. Thiết Lập Kịch Bản 3 Lượt */}
              <div className="flex flex-col gap-3 border-t border-slate-700 pt-3">
                <label className="text-xs text-amber-400 font-bold uppercase tracking-wide">4. Kịch Bản 3 Lượt Quay:</label>
                {[0, 1, 2].map((turnIdx) => (
                  <div key={turnIdx} className="bg-slate-900/70 p-3 rounded-xl border border-slate-700 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300">Lượt {turnIdx + 1}:</span>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <select value={scenarios[turnIdx].charIndex} onChange={(e) => updateScenario(turnIdx, 'charIndex', Number(e.target.value))} className="bg-slate-700 text-white p-1.5 rounded border border-slate-600 outline-none">
                        <option value={0}>NV 1</option>
                        <option value={1}>NV 2</option>
                        <option value={2}>NV 3</option>
                      </select>
                      <select value={scenarios[turnIdx].doorColor} onChange={(e) => updateScenario(turnIdx, 'doorColor', e.target.value)} className="bg-slate-700 text-white p-1.5 rounded border border-slate-600 outline-none">
                        <option value="red">🔴 Cửa Đỏ</option>
                        <option value="blue">🔵 Cửa Xanh</option>
                        <option value="yellow">🟡 Cửa Vàng</option>
                      </select>
                      <select value={scenarios[turnIdx].rewardIndex} onChange={(e) => updateScenario(turnIdx, 'rewardIndex', Number(e.target.value))} className="bg-slate-700 text-white p-1.5 rounded border border-slate-600 outline-none">
                        <option value={0}>👹 Quái vật</option>
                        <option value={1}>🌀 Hố đen</option>
                        <option value={2}>🎁 Quà (Mưa tim)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nút Bắt Đầu Game */}
              <button
                onClick={handleStartGame}
                className="mt-2 w-full p-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={18} /> BẮT ĐẦU GAMEPLAY (TỰ ĐỘNG QUAY VIDEO)
              </button>
            </div>
          ) : (
            /* MÀN HÌNH CONTROLS & TINH CHỈNH VỊ TRÍ KÍCH THƯỚC GAMEPLAY */
            <div className="flex flex-col gap-4">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 flex flex-col gap-2">
                <span className="text-xs text-slate-400">Trạng Thái Lượt Chơi:</span>
                <div className="text-sm font-bold text-amber-400">
                  Lượt {currentTurn + 1} / 3: Nhân Vật {currentScenario.charIndex + 1}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => runTurn()} disabled={turnPhase !== 'idle' && turnPhase !== 'finished'} className="flex-1 p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer">
                  <Disc size={15} /> Play
                </button>
                <button onClick={resetGame} className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer">
                  <RotateCcw size={15} /> Reset
                </button>
              </div>

              {/* KHU VỰC CÀI ĐẶT VỊ TRÍ VÀ KÍCH THƯỚC */}
              <div className="flex flex-col gap-4 border-t border-slate-700 pt-3 text-xs">
                <h3 className="font-bold text-sky-400 flex items-center gap-1 uppercase tracking-wider">
                  <Layers size={14} /> Cài Đặt Vị Trí & Kích Thước
                </h3>

                {/* 1. VÒNG QUAY */}
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/80 flex flex-col gap-2">
                  <span className="font-bold text-amber-300">🎡 Vòng Quay:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kích thước:</span>
                    <input type="number" min="1" max="9999" value={wheelSize} onChange={(e) => setWheelSize(Number(e.target.value))} className="w-16 px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                  </div>
                  <input type="range" min="50" max="2000" value={wheelSize} onChange={(e) => setWheelSize(Number(e.target.value))} className="accent-amber-400 cursor-pointer" />

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400">Ngang (X):</span>
                      <input type="number" min="-9999" max="9999" value={wheelOffsetX} onChange={(e) => setWheelOffsetX(Number(e.target.value))} className="w-full px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400">Dọc (Y):</span>
                      <input type="number" min="-9999" max="9999" value={wheelOffsetY} onChange={(e) => setWheelOffsetY(Number(e.target.value))} className="w-full px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                    </div>
                  </div>
                </div>

                {/* 2. BỘ CỬA (TĂNG TỶ LỆ ĐỀU RỘNG & CAO) */}
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/80 flex flex-col gap-2">
                  <span className="font-bold text-sky-300">🚪 Bộ Cửa (Tăng Tỷ Lệ Đều):</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kích thước cửa:</span>
                    <input type="number" min="1" max="9999" value={doorSize} onChange={(e) => setDoorSize(Number(e.target.value))} className="w-16 px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                  </div>
                  <input type="range" min="20" max="2000" value={doorSize} onChange={(e) => setDoorSize(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-400">Khoảng cách:</span>
                    <input type="number" min="0" max="9999" value={doorGap} onChange={(e) => setDoorGap(Number(e.target.value))} className="w-16 px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                  </div>
                  <input type="range" min="0" max="1000" value={doorGap} onChange={(e) => setDoorGap(Number(e.target.value))} className="accent-sky-400 cursor-pointer" />

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400">Ngang (X):</span>
                      <input type="number" min="-9999" max="9999" value={doorOffsetX} onChange={(e) => setDoorOffsetX(Number(e.target.value))} className="w-full px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400">Dọc (Y):</span>
                      <input type="number" min="-9999" max="9999" value={doorOffsetY} onChange={(e) => setDoorOffsetY(Number(e.target.value))} className="w-full px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                    </div>
                  </div>
                </div>

                {/* 3. NHÂN VẬT */}
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/80 flex flex-col gap-2">
                  <span className="font-bold text-purple-300">🧍 Nhân Vật:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kích thước:</span>
                    <input type="number" min="1" max="9999" value={charSize} onChange={(e) => setCharSize(Number(e.target.value))} className="w-16 px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                  </div>
                  <input type="range" min="20" max="2000" value={charSize} onChange={(e) => setCharSize(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400">Ngang (X):</span>
                      <input type="number" min="-9999" max="9999" value={charOffsetX} onChange={(e) => setCharOffsetX(Number(e.target.value))} className="w-full px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400">Dọc (Y):</span>
                      <input type="number" min="-9999" max="9999" value={charOffsetY} onChange={(e) => setCharOffsetY(Number(e.target.value))} className="w-full px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                    </div>
                  </div>
                </div>

                {/* 4. BÀN TAY 👆 */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kích thước Bàn Tay 👆:</span>
                    <input type="number" min="1" max="9999" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="w-16 px-1.5 py-0.5 bg-slate-700 text-white rounded text-right" />
                  </div>
                  <input type="range" min="24" max="2000" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="accent-amber-400 cursor-pointer" />
                </div>
              </div>

              <button
                onClick={() => setIs916Mode(true)}
                className="mt-2 p-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer text-xs"
              >
                <Play size={16} /> Ẩn Giao Diện Quay Video (ESC Quay Lại)
              </button>
            </div>
          )}
        </div>
      )}

      {/* SÂN KHẤU GAMEPLAY (STAGE CANVAS - ROTATED 90 DEG LANDSCAPE) */}
      <div className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'}`}>
        <div
          ref={stageRef}
          onMouseMove={handleMouseMove}
          className={`relative overflow-hidden cursor-auto transition-all duration-300 ${is916Mode
              ? 'w-full h-full bg-white flex items-center justify-center'
              : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
            }`}
        >
          {/* Nền Grid Kẻ Ô Mờ Chuẩn Nhất */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* GAMEPLAY LAYOUT CONTAINER (Rotated -90deg for 9:16 Short Video Aspect) */}
          <div className="relative w-[540px] h-[960px] flex flex-col items-center justify-between p-6 select-none" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center center' }}>

            {/* 1. VÒNG QUAY 3 MÀU */}
            <div
              className="relative flex flex-col items-center mt-4 transition-all duration-300"
              style={{
                transform: `translate(${wheelOffsetX}px, ${wheelOffsetY}px)`
              }}
            >
              {/* Kim Chỉ Vòng Quay */}
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-red-600 absolute -top-4 z-20 drop-shadow-md" />

              {/* Vòng Quay SVG */}
              <div
                className="rounded-full shadow-2xl transition-transform duration-3000 ease-[cubic-bezier(0.15,0.85,0.35,1.0)] border-8 border-amber-400 bg-amber-400 relative overflow-hidden"
                style={{
                  width: `${wheelSize}px`,
                  height: `${wheelSize}px`,
                  transform: `rotate(${wheelRotation}deg)`
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M 50 50 L 50 0 A 50 50 0 0 1 93.3 75 Z" fill={usedColors.includes('red') ? '#94a3b8' : '#ef4444'} />
                  <path d="M 50 50 L 93.3 75 A 50 50 0 0 1 6.7 75 Z" fill={usedColors.includes('blue') ? '#64748b' : '#3b82f6'} />
                  <path d="M 50 50 L 6.7 75 A 50 50 0 0 1 50 0 Z" fill={usedColors.includes('yellow') ? '#475569' : '#eab308'} />
                  <circle cx="50" cy="50" r="12" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* 2. BỘ 3 CÁNH CỬA */}
            <div
              className="flex items-center justify-center transition-all duration-300 my-auto"
              style={{
                gap: `${doorGap}px`,
                transform: `translate(${doorOffsetX}px, ${doorOffsetY}px)`
              }}
            >
              {[
                { color: 'red', bg: 'bg-red-500', border: 'border-red-600', name: 'Cửa Đỏ' },
                { color: 'blue', bg: 'bg-blue-500', border: 'border-blue-600', name: 'Cửa Xanh' },
                { color: 'yellow', bg: 'bg-amber-400', border: 'border-amber-500', name: 'Cửa Vàng' }
              ].map((door) => {
                const isOpen = openDoors[door.color];
                const assignedScenario = scenarios.find(s => s.doorColor === door.color);
                const rewardImg = assignedScenario ? rewards[assignedScenario.rewardIndex] : null;

                return (
                  <div
                    key={door.color}
                    ref={el => doorRefs.current[door.color] = el}
                    className="relative shrink-0 rounded-t-full border-4 border-amber-800 bg-amber-950 shadow-2xl flex items-center justify-center overflow-hidden transition-all"
                    style={{
                      width: `${doorSize}px`,
                      minWidth: `${doorSize}px`,
                      height: `${Math.round(doorSize * 1.75)}px`
                    }}
                  >
                    {/* HÌNH ẢNH PHẦN THƯỞNG BÊN TRONG CỬA (Ẩn khi nhận Quà thưởng) */}
                    <div className="absolute inset-0 p-3 flex items-center justify-center bg-slate-900">
                      {rewardImg && assignedScenario?.rewardIndex !== 2 && (
                        <img src={rewardImg} alt="Reward Behind Door" className="w-full h-full object-contain animate-fade-in" />
                      )}
                    </div>

                    {/* VỎ CÁNH CỬA BẰNG GỖ */}
                    <div
                      className={`absolute inset-0 ${door.bg} border-4 ${door.border} rounded-t-full transition-transform duration-700 origin-left flex items-center justify-end pr-3 shadow-inner ${isOpen ? '-translate-x-full opacity-20' : 'translate-x-0 opacity-100'
                        }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-amber-200 border-2 border-amber-600 shadow-md" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3. NHÂN VẬT & ANIMATION KẾT QUẢ */}
            <div
              className="relative w-full h-40 flex items-center justify-center transition-all duration-300"
              style={{
                transform: `translate(${charOffsetX}px, ${charOffsetY}px)`
              }}
            >
              {activeCharImg && (
                <div
                  className={`relative transition-all duration-700 ease-out flex items-center justify-center ${charPos.status === 'ko'
                      ? 'rotate-90 scale-90 translate-y-8 opacity-80'
                      : charPos.status === 'sucked'
                        ? 'scale-0 rotate-[1080deg] -translate-y-40 duration-1000'
                        : charPos.status === 'dancing'
                          ? 'animate-bounce scale-110'
                          : turnPhase === 'walking'
                            ? '-translate-y-24 scale-105'
                            : 'translate-y-0 scale-100'
                    }`}
                >
                  {/* NẾU LÀ TRẠNG THÁI NHẬN QUÀ (DANCING), HIỂN THỊ TRỰC TIẾP ẢNH NHẬN QUÀ (COUPLEIMG) THAY THẾ NHÂN VẬT */}
                  {charPos.status === 'dancing' && coupleImg ? (
                    <img
                      src={coupleImg}
                      alt="Gift Reveal"
                      className="object-contain drop-shadow-2xl transition-all scale-110"
                      style={{ width: `${charSize}px`, height: `${charSize}px` }}
                    />
                  ) : (
                    <img
                      src={activeCharImg}
                      alt="Character"
                      className="object-contain drop-shadow-xl transition-all"
                      style={{ width: `${charSize}px`, height: `${charSize}px` }}
                    />
                  )}

                  {/* VẾT CÀO ANIMATION (Khi gặp Quái vật) */}
                  {charPos.status === 'ko' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-full h-2 bg-red-600 rotate-45 animate-ping shadow-lg shadow-red-500" />
                      <div className="w-full h-2 bg-red-500 -rotate-45 animate-ping shadow-lg shadow-red-500" />
                    </div>
                  )}

                  {/* MƯA TRÁI TIM (Khi nhận Quà) */}
                  {charPos.status === 'dancing' && (
                    <div className="absolute -top-12 inset-x-0 flex justify-around pointer-events-none text-2xl animate-bounce">
                      <span>💖</span>
                      <span>✨</span>
                      <span>🎉</span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
