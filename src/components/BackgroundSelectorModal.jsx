import React, { useState } from 'react';
import { Palette, X, Check, RotateCcw, Sliders, Droplet } from 'lucide-react';
import { 
  useStageBackground, 
  SUBTLE_COLOR_PALETTES, 
  STAGE_PATTERN_OPTIONS 
} from '../context/StageBackgroundContext';

export default function BackgroundSelectorModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { 
    stageBgColor, 
    setStageBgColor, 
    selectedPatternId, 
    setSelectedPatternId, 
    patternOpacity, 
    setPatternOpacity,
    handleResetToWhite 
  } = useStageBackground();

  const [activeTab, setActiveTab] = useState('colors'); // 'colors' | 'patterns'

  const currentPattern = STAGE_PATTERN_OPTIONS.find(p => p.id === selectedPatternId) || STAGE_PATTERN_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Palette className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              TÙY CHỈNH MÀU & HOA VĂN NỀN
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                Toàn bộ chức năng
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Chọn màu nền dịu nhẹ (hoặc trắng hoàn toàn) kết hợp với hoa văn kẻ ô / chấm bi thanh lịch.
            </p>
          </div>
        </div>

        {/* PREVIEW KHUNG XEM TRƯỚC SÂN KHẤU THỜI GIAN THỰC */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-16 h-12 rounded-xl border border-slate-400/50 relative overflow-hidden shadow-inner flex items-center justify-center transition-all"
              style={{ backgroundColor: stageBgColor }}
            >
              {currentPattern.id !== 'none' && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    ...currentPattern.style,
                    opacity: (currentPattern.style.opacity || 1) * (patternOpacity / 50),
                    filter: stageBgColor === '#0f172a' ? 'invert(1) brightness(0.6)' : 'none'
                  }}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                Đang dùng: 
                <span className="inline-block w-3 h-3 rounded-full border border-slate-500" style={{ backgroundColor: stageBgColor }}></span>
                <span className="text-sky-300">
                  {stageBgColor === '#ffffff' ? 'Màu Trắng' : stageBgColor}
                </span>
                <span className="text-slate-400 text-[11px]">• {currentPattern.name}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {stageBgColor === '#ffffff' && currentPattern.id === 'none' 
                  ? '✅ Nền trắng tinh khiết hoàn toàn, không hoa văn' 
                  : 'Độ tương phản dịu mắt, tối ưu để quay video'}
              </span>
            </div>
          </div>

          {/* Nút đặt lại màu trắng hoàn toàn */}
          <button
            onClick={handleResetToWhite}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
            title="Đặt lại nền trắng tinh khiết không hoa văn"
          >
            <RotateCcw size={13} className="text-amber-400" /> Về Mặc Định (Trắng)
          </button>
        </div>

        {/* NAVIGATION TABS: CHỌN MÀU NỀN VS CHỌN HOA VĂN */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'colors'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
            }`}
          >
            <Droplet size={15} /> 1. Chọn Màu Nền (Bao gồm Màu Trắng)
          </button>
          <button
            onClick={() => setActiveTab('patterns')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'patterns'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
            }`}
          >
            <Sliders size={15} /> 2. Chọn Kiểu Hoa Văn (Kẻ ô, Chấm bi, Không hoa văn)
          </button>
        </div>

        {/* TAB 1: BẢNG CHỌN MÀU NỀN */}
        {activeTab === 'colors' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Tùy chọn nút to: KHÔNG MÀU (MÀU TRẮNG TINH) */}
            <div
              onClick={() => setStageBgColor('#ffffff')}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                stageBgColor.toLowerCase() === '#ffffff'
                  ? 'border-sky-400 bg-sky-500/10 ring-2 ring-sky-400/20'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-300 shadow flex items-center justify-center">
                  {stageBgColor.toLowerCase() === '#ffffff' && (
                    <Check size={18} className="text-sky-600" strokeWidth={3} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    ⚪ Không Màu (Màu Trắng Tinh Khiết)
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                      Khuyên Dùng
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Nền trắng nguyên bản #ffffff, sạch sẽ, làm nổi bật nhân vật và đèn pin rõ nét nhất
                  </span>
                </div>
              </div>
              <button 
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  stageBgColor.toLowerCase() === '#ffffff' ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {stageBgColor.toLowerCase() === '#ffffff' ? 'Đang Chọn' : 'Chọn Trắng'}
              </button>
            </div>

            {/* DANH SÁCH BẢNG MÀU DỊU NHẸ (PASTEL SUBTLE COLORS) */}
            <div>
              <span className="text-xs font-bold text-slate-300 mb-2.5 block">
                Các tông màu Studio nhã nhặn khác (Không sặc sỡ):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SUBTLE_COLOR_PALETTES.filter(p => p.id !== 'white').map((palette) => {
                  const isSelected = stageBgColor.toLowerCase() === palette.color.toLowerCase();
                  return (
                    <div
                      key={palette.id}
                      onClick={() => setStageBgColor(palette.color)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${
                        isSelected
                          ? 'border-sky-400 bg-slate-800 shadow-lg ring-2 ring-sky-400/30'
                          : 'border-slate-700/80 bg-slate-850 hover:bg-slate-800 hover:border-slate-500'
                      }`}
                    >
                      <div 
                        className="w-9 h-9 rounded-xl border-2 border-slate-300/80 shadow-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: palette.color }}
                      >
                        {isSelected && <Check size={16} className={palette.id === 'dark-slate' ? 'text-white' : 'text-slate-900'} strokeWidth={3} />}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-sky-300' : 'text-slate-100'}`}>
                          {palette.name}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {palette.desc || palette.color}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BỘ CHỌN MÀU TỰ DO (CUSTOM COLOR PICKER) */}
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-medium">Hoặc tự chọn màu bất kỳ:</span>
                <span className="text-xs font-mono text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {stageBgColor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={stageBgColor}
                  onChange={(e) => setStageBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-600 cursor-pointer bg-transparent p-0"
                />
                <span className="text-[11px] text-slate-400">Chọn màu</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BẢNG CHỌN HOA VĂN (PATTERNS) */}
        {activeTab === 'patterns' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STAGE_PATTERN_OPTIONS.map((pat) => {
                const isSelected = selectedPatternId === pat.id;
                return (
                  <div
                    key={pat.id}
                    onClick={() => setSelectedPatternId(pat.id)}
                    className={`relative flex flex-col p-2.5 rounded-2xl border-2 transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-sky-400 bg-slate-800/90 shadow-xl shadow-sky-500/10 ring-2 ring-sky-400/20'
                        : 'border-slate-700/80 bg-slate-850 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {/* PREVIEW BOX VỚI MÀU NỀN HIỆN TẠI */}
                    <div 
                      className="w-full h-20 rounded-xl border border-slate-300/40 relative overflow-hidden shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: stageBgColor }}
                    >
                      {pat.id !== 'none' && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            ...pat.style,
                            opacity: (pat.style.opacity || 1) * (patternOpacity / 50),
                            filter: stageBgColor === '#0f172a' ? 'invert(1) brightness(0.6)' : 'none'
                          }}
                        />
                      )}
                      {pat.id === 'none' && (
                        <span className="text-xs text-slate-400 font-semibold bg-black/40 px-2 py-1 rounded">
                          Không hoa văn
                        </span>
                      )}
                      {/* Badge được chọn */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* NAME */}
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                        {pat.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SLIDER ĐIỀU CHỈNH ĐỘ ĐẬM NHẠT HOA VĂN */}
            {selectedPatternId !== 'none' && (
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300 font-medium">Độ đậm hoa văn:</span>
                  <span className="text-xs font-mono text-sky-400 font-bold">{patternOpacity}%</span>
                </div>
                <div className="flex-1 max-w-xs">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={patternOpacity}
                    onChange={(e) => setPatternOpacity(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Tự động lưu và đồng bộ toàn bộ minigame.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            Áp Dụng Xong
          </button>
        </div>
      </div>
    </div>
  );
}
