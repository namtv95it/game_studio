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

  const [activeTab, setActiveTab] = useState('colors');
  const [patternCategoryFilter, setPatternCategoryFilter] = useState('all');

  const currentPattern = STAGE_PATTERN_OPTIONS.find(p => p.id === selectedPatternId) || STAGE_PATTERN_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Palette className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                TÙY CHỈNH MÀU &amp; HOA VĂN NỀN SÂN KHẤU
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                  Thời Gian Thực
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Giao diện chia đôi: Bên trái tinh chỉnh thuộc tính, bên phải xem trước tỷ lệ thực tế.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToWhite}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
              title="Đặt lại nền trắng tinh khiết không hoa văn"
            >
              <RotateCcw size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Về Mặc Định</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          <div className="lg:col-span-7 flex flex-col p-5 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden bg-slate-900/60">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 shrink-0">
              <button
                onClick={() => setActiveTab('colors')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'colors'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/30'
                    : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                <Droplet size={15} /> 1. Chọn Màu Nền
              </button>
              <button
                onClick={() => setActiveTab('patterns')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'patterns'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/30'
                    : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                <Sliders size={15} /> 2. Hoa Văn Nền ({STAGE_PATTERN_OPTIONS.length})
              </button>
            </div>

            {activeTab === 'colors' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div
                  onClick={() => setStageBgColor('#ffffff')}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                    stageBgColor.toLowerCase() === '#ffffff'
                      ? 'border-sky-400 bg-sky-500/10 ring-2 ring-sky-400/20'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-300 shadow-md flex items-center justify-center">
                      {stageBgColor.toLowerCase() === '#ffffff' && (
                        <Check size={20} className="text-sky-600 font-bold" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        Màu Trắng Chuẩn (Mặc định Studio)
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Khuyên Dùng
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Nền sáng trong suốt và nổi bật bóng nhân vật tối đa.
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Bảng màu dịu mắt (Pastel / Studio Tone):</span>
                    <span className="text-[10px] text-slate-500">Đã tinh chỉnh tương phản</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SUBTLE_COLOR_PALETTES.map((palette) => {
                      const isSelected = stageBgColor.toLowerCase() === palette.color.toLowerCase();
                      return (
                        <div
                          key={palette.id}
                          onClick={() => setStageBgColor(palette.color)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'border-sky-400 bg-sky-500/10 ring-2 ring-sky-400/20 shadow-md'
                              : 'border-slate-750 bg-slate-800/80 hover:border-slate-600 hover:bg-slate-750'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg border border-slate-400/30 shadow-inner shrink-0 flex items-center justify-center relative"
                            style={{ backgroundColor: palette.color }}
                          >
                            {isSelected && (
                              <Check size={14} className={palette.color === '#0f172a' ? 'text-white' : 'text-slate-900'} />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-white truncate">
                              {palette.name.split('(')[0].trim()}
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

                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-300 font-medium">Tự chọn mã màu hex bất kỳ:</span>
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
                    <span className="text-[11px] text-slate-400">Đổi màu</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'patterns' && (
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  {[
                    { id: 'all', name: `Tất cả (${STAGE_PATTERN_OPTIONS.length})` },
                    { id: 'random', name: '✨ Ngẫu nhiên' },
                    { id: 'grid', name: 'Kẻ ô & Kỹ thuật' },
                    { id: 'dots', name: 'Chấm bi & Matrix' },
                    { id: 'stripes', name: 'Sọc & Kẻ chỉ' },
                    { id: 'geometric', name: 'Hình học & Gạch' },
                    { id: 'artistic', name: 'Nghệ thuật & Sóng' },
                    { id: 'gradient', name: 'Ánh sáng' }
                  ].map((cat) => {
                    const isActive = (patternCategoryFilter || 'all') === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setPatternCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {STAGE_PATTERN_OPTIONS
                    .filter(pat => {
                      if (!patternCategoryFilter || patternCategoryFilter === 'all') return true;
                      if (patternCategoryFilter === 'grid') return pat.category === 'grid' || pat.category === '3d';
                      if (patternCategoryFilter === 'geometric') return pat.category === 'geometric' || pat.category === '3d';
                      if (patternCategoryFilter === 'artistic') return pat.category === 'artistic' || pat.category === 'tech';
                      return pat.category === patternCategoryFilter;
                    })
                    .map((pat) => {
                      const isSelected = selectedPatternId === pat.id;
                      return (
                        <div
                          key={pat.id}
                          onClick={() => setSelectedPatternId(pat.id)}
                          className={`relative flex flex-col p-2 rounded-xl border-2 transition-all cursor-pointer group ${
                            isSelected
                              ? 'border-sky-400 bg-slate-800/90 shadow-lg shadow-sky-500/10 ring-2 ring-sky-400/20'
                              : 'border-slate-750 bg-slate-850 hover:border-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          <div 
                            className="w-full h-28 rounded-lg border border-slate-300/40 relative overflow-hidden shadow-inner flex items-center justify-center"
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
                              <span className="text-[10px] text-slate-400 font-semibold bg-black/40 px-1.5 py-0.5 rounded">
                                Trơn
                              </span>
                            )}
                            {pat.badge && (
                              <div className="absolute top-1 left-1 text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-slate-200 pointer-events-none">
                                {pat.badge}
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                              {pat.name.split('(')[0].trim()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

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
          </div>

          <div className="lg:col-span-5 flex flex-col p-5 bg-slate-950/50 overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                XEM TRƯỚC NỀN SÂN KHẤU
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                Thời gian thực
              </span>
            </div>
            <div 
              className="flex-1 w-full rounded-2xl border-2 border-slate-700/80 relative overflow-hidden shadow-2xl transition-all duration-300 min-h-[260px]"
              style={{ backgroundColor: stageBgColor }}
            >
              {currentPattern.id !== 'none' && (
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{
                    ...currentPattern.style,
                    opacity: (currentPattern.style.opacity || 1) * (patternOpacity / 50),
                    filter: stageBgColor === '#0f172a' ? 'invert(1) brightness(0.6)' : 'none'
                  }}
                />
              )}
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 text-[11px] flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-500 shrink-0" style={{ backgroundColor: stageBgColor }}></span>
                  <span className="font-bold text-white truncate">{stageBgColor === '#ffffff' ? 'Trắng' : stageBgColor}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-sky-300 truncate">{currentPattern.name}</span>
                </div>
                {currentPattern.id !== 'none' && (
                  <span className="text-slate-400 shrink-0">{patternOpacity}%</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="text-[11px] text-slate-400">
            Cài đặt được áp dụng ngay lập tức và lưu trữ tự động trên máy.
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  );
}
