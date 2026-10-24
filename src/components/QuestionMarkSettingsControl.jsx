import React from 'react';
import { Plus, Trash2, Undo2, Redo2 } from 'lucide-react';

// Danh sách các mẫu dấu hỏi chấm nghệ thuật có sẵn (Question Mark Presets)
export const QUESTION_MARK_STYLE_PRESETS = [
  { id: 'bold-red', name: 'Đỏ Nổi Bật', color: '#ef4444', font: '"Arial Black", sans-serif', label: 'Cổ Điển' },
  { id: 'neon-yellow', name: 'Vàng Neon', color: '#facc15', font: '"Arial Black", sans-serif', label: 'Rực Rỡ' },
  { id: 'fire-orange', name: 'Cam Lửa', color: '#f97316', font: '"Impact", sans-serif', label: 'Kịch Tính' },
  { id: 'pure-white', name: 'Trắng Tinh', color: '#ffffff', font: '"Arial Black", sans-serif', label: 'Tương Phản' },
  { id: 'cyber-cyan', name: 'Xanh Cyan', color: '#06b6d4', font: '"Arial Black", sans-serif', label: 'Công Nghệ' },
  { id: 'toxic-green', name: 'Xanh Lá', color: '#22c55e', font: '"Impact", sans-serif', label: 'Bí Ẩn' },
  { id: 'magic-purple', name: 'Tím Ma Thuật', color: '#a855f7', font: '"Arial Black", sans-serif', label: 'Ma Mị' },
  { id: 'soft-pink', name: 'Hồng Pastel', color: '#f472b6', font: '"Arial Black", sans-serif', label: 'Ngọt Ngào' }
];

// Danh sách các mẫu bố cục dấu hỏi chấm sắp xếp sẵn (5 vị trí mẫu, 3 vị trí mẫu, 1 vị trí trung tâm...)
export const QUESTION_MARK_LAYOUT_PRESETS = [
  {
    id: 'five-scattered',
    name: '5 Dấu Rải Rác',
    desc: 'Phủ đều thân hình nhân vật',
    marks: [
      { id: 'qm-1', x: 270, y: 350, size: 55 },
      { id: 'qm-2', x: 220, y: 440, size: 45 },
      { id: 'qm-3', x: 320, y: 440, size: 45 },
      { id: 'qm-4', x: 270, y: 530, size: 50 },
      { id: 'qm-5', x: 270, y: 640, size: 45 }
    ]
  },
  {
    id: 'single-center',
    name: '1 Dấu Cực Đại',
    desc: 'Ngay chính giữa ngực nhân vật',
    marks: [
      { id: 'qm-center', x: 270, y: 480, size: 85 }
    ]
  },
  {
    id: 'trio-vertical',
    name: '3 Dấu Dọc Thẳng',
    desc: 'Đầu - Ngực - Chân',
    marks: [
      { id: 'qm-top', x: 270, y: 370, size: 50 },
      { id: 'qm-mid', x: 270, y: 490, size: 60 },
      { id: 'qm-bot', x: 270, y: 620, size: 50 }
    ]
  },
  {
    id: 'cross-dynamic',
    name: '4 Dấu Chữ Thập',
    desc: 'Tỏa 4 hướng bí ẩn',
    marks: [
      { id: 'qm-c-top', x: 270, y: 370, size: 45 },
      { id: 'qm-c-left', x: 200, y: 480, size: 45 },
      { id: 'qm-c-right', x: 340, y: 480, size: 45 },
      { id: 'qm-c-bot', x: 270, y: 590, size: 45 }
    ]
  }
];

export default function QuestionMarkSettingsControl({
  enableQuestionMarks,
  setEnableQuestionMarks,
  questionMarks = [],
  setQuestionMarksWithHistory, // Hàm cập nhật kèm lịch sử undo/redo
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  qmColor = '#ef4444',
  setQmColor,
  qmDefaultSize = 48,
  setQmDefaultSize,
  qmRandomColor = false,
  setQmRandomColor,
  qmRandomSize = false,
  setQmRandomSize,
  qmMinSize = 24,
  setQmMinSize,
  qmMaxSize = 80,
  setQmMaxSize,
  isPlacingQm,
  setIsPlacingQm,
  onClearAll,
  themeColor = 'rose'
}) {
  const activeRingColor = themeColor === 'purple' ? 'ring-purple-400' : 'ring-rose-400';
  const activeBgColor = themeColor === 'purple' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-rose-600 hover:bg-rose-500';
  const activeTextColor = themeColor === 'purple' ? 'text-purple-400' : 'text-rose-400';
  const accentCheckboxColor = themeColor === 'purple' ? 'accent-purple-500' : 'accent-rose-500';
  const accentSliderColor = themeColor === 'purple' ? 'accent-purple-500' : 'accent-rose-500';

  // Helper random màu từ bảng presets hoặc màu sắc rực rỡ
  const getRandomPresetColor = () => {
    const randomIndex = Math.floor(Math.random() * QUESTION_MARK_STYLE_PRESETS.length);
    return QUESTION_MARK_STYLE_PRESETS[randomIndex].color;
  };

  // Helper random kích thước trong khoảng [min, max]
  const getRandomSizeInRange = (min, max) => {
    const validMin = Math.min(min, max);
    const validMax = Math.max(min, max);
    return Math.floor(Math.random() * (validMax - validMin + 1)) + validMin;
  };

  // Xử lý áp dụng ngẫu nhiên màu cho toàn bộ dấu ? đang có
  const handleRandomizeExistingColors = () => {
    if (questionMarks.length > 0 && setQuestionMarksWithHistory) {
      setQuestionMarksWithHistory(
        questionMarks.map((q) => ({
          ...q,
          color: getRandomPresetColor()
        }))
      );
    }
  };

  // Xử lý áp dụng ngẫu nhiên cỡ chữ cho toàn bộ dấu ? đang có
  const handleRandomizeExistingSizes = (min = qmMinSize, max = qmMaxSize) => {
    if (questionMarks.length > 0 && setQuestionMarksWithHistory) {
      setQuestionMarksWithHistory(
        questionMarks.map((q) => ({
          ...q,
          size: getRandomSizeInRange(min, max)
        }))
      );
    }
  };

  return (
    <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-800">
      {/* 1. Toggle Bật/Tắt */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-300 font-medium">Bật Dấu Hỏi Chấm:</span>
        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={enableQuestionMarks}
            onChange={(e) => setEnableQuestionMarks(e.target.checked)}
            className="accent-rose-500 cursor-pointer"
          />
          <span className={enableQuestionMarks ? `${activeTextColor} font-bold` : 'text-slate-400'}>
            {enableQuestionMarks ? 'Đang Bật' : 'Đang Tắt'}
          </span>
        </label>
      </div>

      {enableQuestionMarks && (
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
          {/* 2. Nút Bật/Tắt chế độ nhấp chuột đặt dấu ? */}
          <button
            type="button"
            onClick={() => setIsPlacingQm(!isPlacingQm)}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
              isPlacingQm
                ? `${activeBgColor} text-white ring-2 ${activeRingColor} animate-pulse`
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
            }`}
          >
            <Plus size={14} />
            {isPlacingQm ? '📍 ĐANG BẬT ĐẶT DẤU ? (Nhấp lên bóng để thêm)' : '➕ Nhấp chuột để đặt dấu ?'}
          </button>

          {/* 3. NÚT HOÀN TÁC & TIẾN (UNDO / REDO) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              type="button"
              disabled={!canUndo}
              onClick={onUndo}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                canUndo
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer active:scale-95 shadow-sm'
                  : 'bg-slate-900/40 text-slate-600 cursor-not-allowed border border-slate-800/40'
              }`}
              title="Hoàn tác thay đổi vừa thực hiện (Ctrl+Z)"
            >
              <Undo2 size={13} /> Hoàn tác
            </button>

            <button
              type="button"
              disabled={!canRedo}
              onClick={onRedo}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                canRedo
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer active:scale-95 shadow-sm'
                  : 'bg-slate-900/40 text-slate-600 cursor-not-allowed border border-slate-800/40'
              }`}
              title="Tiến tới thao tác kế tiếp (Ctrl+Y)"
            >
              <Redo2 size={13} /> Tiến tới
            </button>
          </div>

          {/* 4. MẪU DẤU HỎI CHẤM NỔI BẬT (Màu sắc & Phông chữ nghệ thuật) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
              <span className="flex items-center gap-1">✨ Chọn Mẫu Dấu Hỏi:</span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">{qmRandomColor ? '🎲 Ngẫu nhiên' : qmColor}</span>
            </div>

            <div className={`grid grid-cols-4 gap-1.5 transition-opacity ${qmRandomColor ? 'opacity-40 pointer-events-none' : ''}`}>
              {QUESTION_MARK_STYLE_PRESETS.map((style) => {
                const isSelected = !qmRandomColor && qmColor.toLowerCase() === style.color.toLowerCase();
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setQmColor && setQmColor(style.color)}
                    className={`p-1.5 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-white ring-1 ring-white/60 shadow-md scale-105'
                        : 'bg-slate-900/70 border-slate-750 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                    title={style.name}
                  >
                    <span
                      className="text-base font-black leading-none drop-shadow-sm select-none"
                      style={{ color: style.color, fontFamily: style.font }}
                    >
                      ?
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1 truncate w-full text-center leading-none">
                      {style.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Cài đặt Cỡ chữ & Màu sắc (Hỗ trợ Checkbox Ngẫu nhiên) */}
          <div className="flex flex-col gap-2.5 pt-1">
            {/* --- PHẦN MÀU SẮC & CHECKBOX NGẪU NHIÊN --- */}
            <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">Màu sắc:</span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={qmRandomColor}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (setQmRandomColor) setQmRandomColor(checked);
                      if (checked) {
                        handleRandomizeExistingColors();
                      } else {
                        // Khôi phục lại màu đồng nhất
                        if (questionMarks.length > 0 && setQuestionMarksWithHistory) {
                          setQuestionMarksWithHistory(questionMarks.map((q) => {
                            const { color, ...rest } = q;
                            return rest;
                          }));
                        }
                      }
                    }}
                    className={`${accentCheckboxColor} cursor-pointer rounded`}
                  />
                  <span className={qmRandomColor ? `${activeTextColor} font-bold flex items-center gap-1` : 'text-slate-400'}>
                    🎲 Ngẫu nhiên màu
                  </span>
                </label>
              </div>

              {!qmRandomColor ? (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Màu tùy ý:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={qmColor}
                      onChange={(e) => {
                        const newColor = e.target.value;
                        if (setQmColor) setQmColor(newColor);
                        if (questionMarks.length > 0 && setQuestionMarksWithHistory) {
                          setQuestionMarksWithHistory(questionMarks.map((q) => ({ ...q, color: undefined })));
                        }
                      }}
                      className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                    />
                    <span className="text-[10px] font-mono text-slate-300 uppercase">{qmColor}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[10px] text-emerald-400/90 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-800/30">
                  <span>✨ Mỗi dấu '?' sẽ có màu sắc ngẫu nhiên rực rỡ</span>
                  {questionMarks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleRandomizeExistingColors}
                      className="text-[10px] underline hover:text-emerald-300 cursor-pointer font-medium"
                    >
                      Đổi lại màu
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* --- PHẦN CỠ CHỮ & CHECKBOX NGẪU NHIÊN TRONG PHẠM VI --- */}
            <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300">Cỡ chữ:</span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={qmRandomSize}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (setQmRandomSize) setQmRandomSize(checked);
                      if (checked) {
                        handleRandomizeExistingSizes();
                      } else {
                        // Khôi phục lại cỡ chữ chuẩn qmDefaultSize
                        if (questionMarks.length > 0 && setQuestionMarksWithHistory) {
                          setQuestionMarksWithHistory(questionMarks.map((q) => ({ ...q, size: qmDefaultSize })));
                        }
                      }
                    }}
                    className={`${accentCheckboxColor} cursor-pointer rounded`}
                  />
                  <span className={qmRandomSize ? `${activeTextColor} font-bold flex items-center gap-1` : 'text-slate-400'}>
                    🎲 Cỡ chữ ngẫu nhiên
                  </span>
                </label>
              </div>

              {!qmRandomSize ? (
                /* Slider cỡ chữ cố định */
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Kích thước cố định:</span>
                    <span className="font-mono text-white text-[11px]">{qmDefaultSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="120"
                    value={qmDefaultSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      if (setQmDefaultSize) setQmDefaultSize(newSize);
                      if (questionMarks.length > 0 && setQuestionMarksWithHistory) {
                        setQuestionMarksWithHistory(questionMarks.map((q) => ({ ...q, size: newSize })));
                      }
                    }}
                    className={`${accentSliderColor} cursor-pointer h-1.5`}
                  />
                </div>
              ) : (
                /* 2 Slider phạm vi ngẫu nhiên Min - Max */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-amber-300 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/30">
                    <span>Phạm vi: <b>{qmMinSize}px</b> → <b>{qmMaxSize}px</b></span>
                    {questionMarks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRandomizeExistingSizes(qmMinSize, qmMaxSize)}
                        className="text-[10px] underline hover:text-amber-200 cursor-pointer font-medium"
                      >
                        Đổi lại cỡ
                      </button>
                    )}
                  </div>

                  {/* Min Size Slider */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Cỡ nhỏ nhất (Min):</span>
                      <span className="font-mono text-white text-[10px]">{qmMinSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="100"
                      value={qmMinSize}
                      onChange={(e) => {
                        const newMin = Math.min(Number(e.target.value), qmMaxSize - 4);
                        if (setQmMinSize) setQmMinSize(newMin);
                        handleRandomizeExistingSizes(newMin, qmMaxSize);
                      }}
                      className={`${accentSliderColor} cursor-pointer h-1.5`}
                    />
                  </div>

                  {/* Max Size Slider */}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Cỡ lớn nhất (Max):</span>
                      <span className="font-mono text-white text-[10px]">{qmMaxSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="24"
                      max="130"
                      value={qmMaxSize}
                      onChange={(e) => {
                        const newMax = Math.max(Number(e.target.value), qmMinSize + 4);
                        if (setQmMaxSize) setQmMaxSize(newMax);
                        handleRandomizeExistingSizes(qmMinSize, newMax);
                      }}
                      className={`${accentSliderColor} cursor-pointer h-1.5`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KHUNG XEM TRƯỚC TRỰC QUAN KÍCH THƯỚC VÀ MÀU SẮC THEO CÀI ĐẶT HIỆN TẠI */}
          <div className="flex flex-col gap-1.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                👁️ Xem trước mẫu:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {qmRandomSize ? `${qmMinSize}~${qmMaxSize}px` : `${qmDefaultSize}px`} •{' '}
                {qmRandomColor ? (
                  <span className="text-amber-400 font-medium">Đa sắc</span>
                ) : (
                  <span style={{ color: qmColor }}>{qmColor}</span>
                )}
              </span>
            </div>

            <div className="relative h-28 w-full bg-slate-900/90 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
              {/* Lưới ô vuông mờ tạo cảm giác canvas trong suốt */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle, #64748b 1px, transparent 1px)`,
                  backgroundSize: '12px 12px'
                }}
              />

              {/* Dấu ? hiển thị hoặc 3 dấu ? đa sắc/kích cỡ nếu bật ngẫu nhiên */}
              {qmRandomColor || qmRandomSize ? (
                <div className="relative flex items-center justify-center gap-3 select-none">
                  <span
                    style={{
                      fontSize: `${Math.min(qmRandomSize ? qmMinSize : qmDefaultSize, 70)}px`,
                      color: qmRandomColor ? '#06b6d4' : qmColor,
                      fontFamily: '"Arial Black", "Arial", sans-serif',
                      lineHeight: 1,
                      textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)'
                    }}
                    className="font-black drop-shadow-lg"
                  >
                    ?
                  </span>
                  <span
                    style={{
                      fontSize: `${Math.min(qmRandomSize ? Math.round((qmMinSize + qmMaxSize) / 2) : qmDefaultSize, 85)}px`,
                      color: qmRandomColor ? '#facc15' : qmColor,
                      fontFamily: '"Arial Black", "Arial", sans-serif',
                      lineHeight: 1,
                      textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)'
                    }}
                    className="font-black drop-shadow-lg"
                  >
                    ?
                  </span>
                  <span
                    style={{
                      fontSize: `${Math.min(qmRandomSize ? qmMaxSize : qmDefaultSize, 90)}px`,
                      color: qmRandomColor ? '#ef4444' : qmColor,
                      fontFamily: '"Arial Black", "Arial", sans-serif',
                      lineHeight: 1,
                      textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)'
                    }}
                    className="font-black drop-shadow-lg"
                  >
                    ?
                  </span>
                </div>
              ) : (
                <div className="relative flex items-center justify-center select-none transition-all duration-150">
                  <span
                    style={{
                      fontSize: `${Math.min(qmDefaultSize, 90)}px`,
                      color: qmColor,
                      fontFamily: '"Arial Black", "Arial", sans-serif',
                      lineHeight: 1,
                      textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)'
                    }}
                    className="font-black drop-shadow-lg"
                  >
                    ?
                  </span>
                </div>
              )}

              {/* Tag kích thước thực tế */}
              <div className="absolute bottom-1 right-1.5 text-[9px] font-mono text-slate-500 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800/60 pointer-events-none">
                {qmRandomSize ? `Phạm vi: ${qmMinSize}-${qmMaxSize}px` : `Tỉ lệ thật: ${qmDefaultSize}px`}
              </div>
            </div>
          </div>

          {/* 7. Danh sách các dấu hỏi chấm & nút xóa tất cả */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              Đang có: <b className="text-white">{questionMarks.length}</b> dấu hỏi
            </span>
            {questionMarks.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} /> Xóa tất cả dấu ?
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
