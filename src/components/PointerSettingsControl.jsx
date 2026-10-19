import React, { useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, MapPin, Compass } from 'lucide-react';
import NumberInput from './NumberInput';

export const POINTER_PRESETS = [
  { id: 'finger_up', emoji: '👆', label: 'Ngón tay', rotation: -90, anchor: 'tip' },
  { id: 'finger_right', emoji: '👉', label: 'Chỉ ngang', rotation: 0, anchor: 'tip' },
  { id: 'flashlight', emoji: '🔦', label: 'Đèn pin', rotation: 0, anchor: 'center' },
  { id: 'mag_glass', emoji: '🔍', label: 'Kính lúp', rotation: 0, anchor: 'center' },
  { id: 'mag_glass_right', emoji: '🔎', label: 'Kính lúp 2', rotation: 0, anchor: 'center' },
  { id: 'heart', emoji: '❤️', label: 'Trái tim', rotation: 0, anchor: 'center' },
  { id: 'sparkle_heart', emoji: '💖', label: 'Tim sao', rotation: 0, anchor: 'center' },
  { id: 'star', emoji: '⭐', label: 'Ngôi sao', rotation: 0, anchor: 'center' },
  { id: 'wand', emoji: '🪄', label: 'Đũa phép', rotation: 0, anchor: 'tip' },
  { id: 'target', emoji: '🎯', label: 'Mục tiêu', rotation: 0, anchor: 'center' },
  { id: 'paw', emoji: '🐾', label: 'Chân thú', rotation: 0, anchor: 'center' },
  { id: 'pin', emoji: '📍', label: 'Ghim đỏ', rotation: 0, anchor: 'tip' },
  { id: 'fire', emoji: '🔥', label: 'Ngọn lửa', rotation: 0, anchor: 'center' },
  { id: 'eyes', emoji: '👀', label: 'Đôi mắt', rotation: 0, anchor: 'center' },
  { id: 'sparkles', emoji: '✨', label: 'Lấp lánh', rotation: 0, anchor: 'center' }
];

export function getPointerStyle({
  x,
  y,
  size = 48,
  rotation = -90,
  offsetX = 0,
  offsetY = 0,
  anchor = 'tip'
}) {
  const isTip = anchor === 'tip';
  const posX = (x || 0) + (offsetX || 0);
  const posY = (y || 0) + (offsetY || 0);
  return {
    left: `${posX}px`,
    top: `${posY}px`,
    fontSize: `${size}px`,
    lineHeight: 1,
    transformOrigin: isTip ? '50% 12%' : '50% 50%',
    transform: `translate(-50%, ${isTip ? '-12%' : '-50%'}) rotate(${rotation}deg)`
  };
}

export default function PointerSettingsControl({
  isOpen: propIsOpen,
  onToggle: propOnToggle,
  isAccordion = true,
  pointerEmoji = '👆',
  setPointerEmoji,
  pointerSize = 48,
  setPointerSize,
  pointerRotation = -90,
  setPointerRotation,
  pointerOffsetX = 0,
  setPointerOffsetX,
  pointerOffsetY = 0,
  setPointerOffsetY,
  pointerAnchor = 'tip',
  setPointerAnchor,
  enablePointer = true,
  setEnablePointer,
  lockPointerToCenter = false,
  setLockPointerToCenter,
  themeColor = 'sky' // 'sky' | 'purple' | 'amber'
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const handleToggle = propOnToggle || (() => setInternalIsOpen(!isOpen));

  const isSky = themeColor === 'sky';
  const isPurple = themeColor === 'purple';

  const activeBorder = isSky
    ? 'border-sky-400 ring-2 ring-sky-400/40 bg-sky-500/20'
    : isPurple
    ? 'border-purple-400 ring-2 ring-purple-400/40 bg-purple-500/20'
    : 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-500/20';

  const accentClass = isSky
    ? 'accent-sky-400'
    : isPurple
    ? 'accent-purple-400'
    : 'accent-amber-400';

  const textColor = isSky
    ? 'text-sky-300'
    : isPurple
    ? 'text-purple-300'
    : 'text-amber-300';

  const cardBorder = isSky
    ? 'border-sky-500/30'
    : isPurple
    ? 'border-purple-500/30'
    : 'border-amber-500/30';

  const activeBg = isSky
    ? 'bg-sky-600 text-white font-bold shadow'
    : isPurple
    ? 'bg-purple-600 text-white font-bold shadow'
    : 'bg-amber-600 text-white font-bold shadow';

  const activeBtnBorder = isSky
    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
    : isPurple
    ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold'
    : 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold';

  const badgeBg = isSky
    ? 'bg-sky-500/20 text-sky-300'
    : isPurple
    ? 'bg-purple-500/20 text-purple-300'
    : 'bg-amber-500/20 text-amber-300';

  const focusBorder = isSky
    ? 'focus:border-sky-400'
    : isPurple
    ? 'focus:border-purple-400'
    : 'focus:border-amber-400';

  const handleSelectPreset = (preset) => {
    setPointerEmoji(preset.emoji);
    if (setPointerRotation) setPointerRotation(preset.rotation);
    if (setPointerAnchor) setPointerAnchor(preset.anchor);
  };

  const handleReset = () => {
    setPointerEmoji('👆');
    if (setPointerSize) setPointerSize(48);
    if (setPointerRotation) setPointerRotation(-90);
    if (setPointerOffsetX) setPointerOffsetX(0);
    if (setPointerOffsetY) setPointerOffsetY(0);
    if (setPointerAnchor) setPointerAnchor('tip');
    if (setEnablePointer) setEnablePointer(true);
    if (setLockPointerToCenter) setLockPointerToCenter(false);
  };

  const handleSetOffset = (ox, oy) => {
    if (setPointerOffsetX) setPointerOffsetX(ox);
    if (setPointerOffsetY) setPointerOffsetY(oy);
  };

  const renderContent = () => (
    <div className="flex flex-col gap-3">
      {/* 1. HÀNG ĐIỀU KHIỂN ĐỈNH: BẬT/TẮT & ĐẶT LẠI */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
          {setEnablePointer && (
            <input
              type="checkbox"
              checked={enablePointer}
              onChange={(e) => setEnablePointer(e.target.checked)}
              className={`${accentClass} cursor-pointer`}
            />
          )}
          <span className={enablePointer ? `${textColor} font-bold` : 'text-slate-400'}>
            {enablePointer ? 'Đang bật con trỏ' : 'Đã tắt con trỏ'}
          </span>
        </label>
        <button
          type="button"
          onClick={handleReset}
          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 bg-slate-800 rounded border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
          title="Khôi phục toàn bộ con trỏ về ngón tay mặc định"
        >
          <RotateCcw size={11} /> Mặc định
        </button>
      </div>

      {/* CHECKBOX CỐ ĐỊNH CON TRỎ VÀO TÂM ĐỂ ĐIỀU CHỈNH */}
      {setLockPointerToCenter && (
        <label className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
          lockPointerToCenter
            ? 'bg-amber-500/15 border-amber-500/60 text-amber-200 shadow-sm ring-1 ring-amber-500/30'
            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
        }`}>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={lockPointerToCenter}
              onChange={(e) => setLockPointerToCenter(e.target.checked)}
              className="accent-amber-400 cursor-pointer w-4 h-4 rounded"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <span>📌</span> Cố định con trỏ vào tâm
              </span>
              <span className="text-[10px] text-slate-400">
                Khóa con trỏ giữa sân khấu để dễ kéo thanh trượt căn chỉnh
              </span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
            lockPointerToCenter ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
          }`}>
            {lockPointerToCenter ? 'Khóa Tâm' : 'Tự do'}
          </span>
        </label>
      )}

      {enablePointer && (
        <>
          {/* 2. CHỌN MẪU EMOJI CÓ SẴN (PRESETS) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Mẫu Con Trỏ Có Sẵn:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {POINTER_PRESETS.map((preset) => {
                const isActive = pointerEmoji === preset.emoji;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-7 h-7 flex items-center justify-center text-sm rounded-lg border transition-all cursor-pointer ${
                      isActive
                        ? `${activeBorder} scale-110 font-bold shadow-md`
                        : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-500 hover:scale-105'
                    }`}
                    title={`${preset.label} (${preset.emoji})`}
                  >
                    {preset.emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. TỰ NHẬP EMOJI & KÍCH THƯỚC */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400 font-medium">Tự Nhập Emoji:</label>
              <input
                type="text"
                value={pointerEmoji}
                onChange={(e) => setPointerEmoji(e.target.value)}
                placeholder="Dán emoji..."
                className={`w-full px-2 py-1 bg-slate-800 text-white rounded text-xs border border-slate-700 focus:outline-none ${focusBorder} font-sans`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-slate-400 font-medium">Kích Thước:</label>
                <div className="flex items-center gap-1">
                  <NumberInput
                    min={10}
                    max={500}
                    value={pointerSize}
                    onChange={(val) => setPointerSize(val)}
                    className={`w-12 px-1 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none ${focusBorder} font-mono`}
                  />
                  <span className="text-[11px] text-slate-400">px</span>
                </div>
              </div>
              <input
                type="range"
                min="16"
                max="250"
                value={pointerSize}
                onChange={(e) => setPointerSize(Number(e.target.value))}
                className={`${accentClass} cursor-pointer h-1.5 mt-1.5`}
              />
            </div>
          </div>

          {/* 4. CHỈNH GÓC XOAY (ROTATION) */}
          {setPointerRotation && (
            <div className="flex flex-col gap-1.5 p-2 bg-slate-950/40 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Compass size={13} className={textColor} /> Chỉnh Góc Xoay:
                </span>
                <div className="flex items-center gap-1">
                  <NumberInput
                    min={-180}
                    max={180}
                    value={pointerRotation ?? -90}
                    onChange={(val) => setPointerRotation(val)}
                    className={`w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-xs text-right border border-slate-600 focus:outline-none ${focusBorder} font-mono`}
                  />
                  <span className="text-xs text-slate-400">°</span>
                </div>
              </div>
              {/* Nút góc nhanh */}
              <div className="flex items-center gap-1">
                {[-90, 0, 45, 90, 180].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setPointerRotation(deg)}
                    className={`flex-1 py-0.5 text-[10px] rounded border transition-colors cursor-pointer ${
                      pointerRotation === deg
                        ? activeBtnBorder
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
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
                step="1"
                value={pointerRotation ?? -90}
                onChange={(e) => setPointerRotation(Number(e.target.value))}
                className={`${accentClass} cursor-pointer h-1.5`}
              />
            </div>
          )}

          {/* 5. CHỈNH VỊ TRÍ CON TRỎ (OFFSET X & OFFSET Y) - NỔI BẬT & RÕ RÀNG */}
          {(setPointerOffsetX || setPointerOffsetY) && (
            <div className="flex flex-col gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-700/80">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <span className={`${textColor} font-bold flex items-center gap-1.5`}>
                  <MapPin size={14} className={textColor} /> Vị Trí Con Trỏ (Độ Lệch X/Y):
                </span>
                <button
                  type="button"
                  onClick={() => handleSetOffset(0, 0)}
                  className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer flex items-center gap-1"
                  title="Đặt lại vị trí về chính tâm (0, 0)"
                >
                  <RotateCcw size={10} /> Về (0, 0)
                </button>
              </div>

              {/* Nút Vị Trí Nhanh */}
              <div className="flex items-center gap-1">
                {[
                  { label: 'Tâm (0,0)', ox: 0, oy: 0 },
                  { label: 'Trái-Trên', ox: -30, oy: -30 },
                  { label: 'Phải-Trên', ox: 30, oy: -30 },
                  { label: 'Lệch Dưới', ox: 0, oy: 35 }
                ].map((pos) => {
                  const isCur = pointerOffsetX === pos.ox && pointerOffsetY === pos.oy;
                  return (
                    <button
                      key={pos.label}
                      type="button"
                      onClick={() => handleSetOffset(pos.ox, pos.oy)}
                      className={`flex-1 py-1 text-[10px] rounded border transition-colors cursor-pointer ${
                        isCur
                          ? activeBtnBorder
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {pos.label}
                    </button>
                  );
                })}
              </div>

              {/* Offset X Slider */}
              {setPointerOffsetX && (
                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Ngang (X - Trái / Phải):</span>
                    <div className="flex items-center gap-1">
                      <NumberInput
                        min={-300}
                        max={300}
                        value={pointerOffsetX ?? 0}
                        onChange={(val) => setPointerOffsetX(val)}
                        className={`w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-[11px] text-right border border-slate-600 focus:outline-none ${focusBorder} font-mono`}
                      />
                      <span className="text-slate-400">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    value={pointerOffsetX ?? 0}
                    onChange={(e) => setPointerOffsetX(Number(e.target.value))}
                    className={`${accentClass} cursor-pointer h-1.5`}
                  />
                </div>
              )}

              {/* Offset Y Slider */}
              {setPointerOffsetY && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Dọc (Y - Lên / Xuống):</span>
                    <div className="flex items-center gap-1">
                      <NumberInput
                        min={-300}
                        max={300}
                        value={pointerOffsetY ?? 0}
                        onChange={(val) => setPointerOffsetY(val)}
                        className={`w-14 px-1.5 py-0.5 bg-slate-700 text-white rounded text-[11px] text-right border border-slate-600 focus:outline-none ${focusBorder} font-mono`}
                      />
                      <span className="text-slate-400">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-150"
                    max="150"
                    value={pointerOffsetY ?? 0}
                    onChange={(e) => setPointerOffsetY(Number(e.target.value))}
                    className={`${accentClass} cursor-pointer h-1.5`}
                  />
                </div>
              )}
            </div>
          )}

          {/* 6. ĐIỂM NEO CON TRỎ (ANCHOR) */}
          {setPointerAnchor && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 font-medium">Điểm Neo Gốc:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPointerAnchor('tip')}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    pointerAnchor === 'tip'
                      ? activeBg
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Điểm neo tại đầu mũi nhọn (👆, ☝️, 🪄, 📍)"
                >
                  👆 Đầu trỏ
                </button>
                <button
                  type="button"
                  onClick={() => setPointerAnchor('center')}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                    pointerAnchor === 'center'
                      ? activeBg
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Điểm neo tại tâm giữa (🔦, 🔍, ❤️, 🎯, ⭐)"
                >
                  🎯 Tâm giữa
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (!isAccordion) {
    return (
      <div className={`p-3.5 bg-slate-900/50 rounded-xl border ${cardBorder}`}>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/50 rounded-xl border ${cardBorder} overflow-hidden shadow-sm shrink-0`}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-800/80 hover:bg-slate-750 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-base select-none leading-none">{pointerEmoji || '👆'}</span>
          <span className={`text-xs font-bold ${textColor}`}>Con Trỏ Chỉ Điểm</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            enablePointer ? badgeBg : 'bg-slate-700 text-slate-400'
          }`}>
            {enablePointer ? `${pointerSize}px` : 'Tắt'}
          </span>
          {isOpen ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3.5 border-t border-slate-800">
          {renderContent()}
        </div>
      )}
    </div>
  );
}
