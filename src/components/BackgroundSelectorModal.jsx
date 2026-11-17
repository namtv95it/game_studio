import React, { useState, useEffect } from 'react';
import { 
  Palette, X, Check, RotateCcw, Sliders, Droplet, Heart, 
  Image as ImageIcon, RotateCw, Move, Eye, EyeOff,
  Play, Sparkles, FlipHorizontal, FlipVertical, Upload, Trash2, 
  Sun, Contrast, Layers, Maximize2, RefreshCw 
} from 'lucide-react';
import { 
  useStageBackground, 
  SUBTLE_COLOR_PALETTES, 
  STAGE_PATTERN_OPTIONS,
  DEFAULT_BG_IMAGE_SETTINGS
} from '../context/StageBackgroundContext';
import { STAGE_BG_IMAGE_PRESETS, STAGE_BG_CATEGORIES } from '../constants/stageImagePresets';
import NumberInput from './NumberInput';

export default function BackgroundSelectorModal({ isOpen, onClose, initialTab = 'colors', onLaunchPreview }) {
  if (!isOpen) return null;

  const { 
    stageBgColor, 
    setStageBgColor, 
    selectedPatternId, 
    setSelectedPatternId, 
    patternOpacity, 
    setPatternOpacity,
    handleResetToWhite,
    favoritePatternIds,
    toggleFavoritePattern,
    isFavoritePattern,
    stageBgType,
    setStageBgType,
    stageBgImage,
    stageBgImageSettings,
    updateStageBgImageSetting,
    handleUploadStageBgImage,
    handleSelectPresetBgImage,
    handleClearStageBgImage,
    handleResetStageBgImageSettings
  } = useStageBackground();

  const [activeTab, setActiveTab] = useState(initialTab || 'colors');
  const [patternCategoryFilter, setPatternCategoryFilter] = useState('all');
  const [bgImageCategoryFilter, setBgImageCategoryFilter] = useState('all');
  const [previewMode, setPreviewMode] = useState('landscape'); // 'landscape' (16:9) | 'portrait' (9:16)
  const [showGhostCharacter, setShowGhostCharacter] = useState(true);
  const [moveStep, setMoveStep] = useState(10);

  // Đồng bộ activeTab khi initialTab thay đổi
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const currentPattern = STAGE_PATTERN_OPTIONS.find(p => p.id === selectedPatternId) || STAGE_PATTERN_OPTIONS[0];
  const s = stageBgImageSettings || DEFAULT_BG_IMAGE_SETTINGS;

  // Tính năng tự động scale để vừa vặn khi xoay 90° hoặc 270°
  const handleAutoFitRotation = () => {
    const isRotatedVertical = Math.abs(s.rotation || 0) % 180 !== 0;
    if (isRotatedVertical) {
      // 960 / 540 ≈ 1.78 -> 178%
      updateStageBgImageSetting('scale', 178);
    } else {
      updateStageBgImageSetting('scale', 100);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Palette className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                TÙY CHỈNH NỀN SÂN KHẤU
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 rounded-full border border-sky-500/30">
                  Thời Gian Thực
                </span>
                {stageBgType === 'image' && stageBgImage && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đang Dùng Ảnh Nền
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Lựa chọn màu sắc, hoa văn CSS hoặc tải hình ảnh làm nền kèm công cụ xoay, chỉnh sửa và xem trước.
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
              <span className="hidden sm:inline">Về Nền Trắng</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY MODAL */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* CỘT TRÁI: ĐIỀU KHIỂN & CÀI ĐẶT */}
          <div className="lg:col-span-7 flex flex-col p-5 border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden bg-slate-900/60">
            {/* 3 TAB ĐIỀU HƯỚNG */}
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 shrink-0">
              <button
                onClick={() => setActiveTab('colors')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'colors'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/30'
                    : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                <Droplet size={14} /> 1. Màu Nền
              </button>
              <button
                onClick={() => setActiveTab('patterns')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'patterns'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/30'
                    : 'bg-slate-800/90 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                <Sliders size={14} /> 2. Hoa Văn ({STAGE_PATTERN_OPTIONS.length})
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                  activeTab === 'image'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/30'
                    : 'bg-slate-800/90 text-purple-300 hover:text-white hover:bg-slate-750 border border-purple-500/30'
                }`}
              >
                <ImageIcon size={14} /> 3. Hình Ảnh Nền
                {stageBgImage && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1.5 right-1.5" />
                )}
              </button>
            </div>

            {/* TAB 1: CHỌN MÀU NỀN */}
            {activeTab === 'colors' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Switch chuyển nhanh */}
                {stageBgType === 'image' && (
                  <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-200">
                    <span>Đang kích hoạt ảnh nền. Bấm chuyển sang để dùng màu &amp; hoa văn:</span>
                    <button
                      type="button"
                      onClick={() => setStageBgType('pattern')}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Dùng Màu Này
                    </button>
                  </div>
                )}

                <div
                  onClick={() => { setStageBgColor('#ffffff'); setStageBgType('pattern'); }}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                    stageBgColor.toLowerCase() === '#ffffff' && stageBgType === 'pattern'
                      ? 'border-sky-400 bg-sky-500/10 ring-2 ring-sky-400/20'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-300 shadow-md flex items-center justify-center">
                      {stageBgColor.toLowerCase() === '#ffffff' && stageBgType === 'pattern' && (
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
                      const isSelected = stageBgColor.toLowerCase() === palette.color.toLowerCase() && stageBgType === 'pattern';
                      return (
                        <div
                          key={palette.id}
                          onClick={() => { setStageBgColor(palette.color); setStageBgType('pattern'); }}
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
                      onChange={(e) => { setStageBgColor(e.target.value); setStageBgType('pattern'); }}
                      className="w-8 h-8 rounded-lg border border-slate-600 cursor-pointer bg-transparent p-0"
                    />
                    <span className="text-[11px] text-slate-400">Đổi màu</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CHỌN HOA VĂN CSS */}
            {activeTab === 'patterns' && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Switch chuyển nhanh nếu đang dùng ảnh */}
                {stageBgType === 'image' && (
                  <div className="p-2 mb-2 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-200 shrink-0">
                    <span>Đang kích hoạt ảnh nền. Bấm để chuyển sang chế độ hoa văn:</span>
                    <button
                      type="button"
                      onClick={() => setStageBgType('pattern')}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Dùng Hoa Văn
                    </button>
                  </div>
                )}

                {/* Thanh danh mục cố định ở trên */}
                <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2.5 text-[11px] no-scrollbar border-b border-slate-800/80">
                  {[
                    { id: 'all', name: `Tất cả (${STAGE_PATTERN_OPTIONS.length})` },
                    ...(favoritePatternIds.length > 0 ? [{ id: 'favorites', name: `❤️ Yêu thích (${favoritePatternIds.length})` }] : []),
                    { id: 'notebook', name: '📖 Trang vở' },
                    { id: 'wood', name: '🪵 Vân gỗ' },
                    { id: 'random', name: '✨ Ngẫu nhiên' },
                    { id: 'grid', name: 'Kẻ ô & Kỹ thuật' },
                    { id: 'dots', name: 'Chấm bi & Matrix' },
                    { id: 'stripes', name: 'Sọc & Kẻ chỉ' },
                    { id: 'geometric', name: 'Hình học & Gạch' },
                    { id: 'artistic', name: 'Nghệ thuật & Sóng' },
                    { id: 'gradient', name: 'Ánh sáng' },
                    { id: 'nature', name: '🌿 Thiên nhiên' },
                    { id: 'ocean', name: '🌊 Đại dương' },
                    { id: 'retro', name: '📺 Retro' },
                    { id: 'tribal', name: '🏺 Dân tộc' },
                    { id: 'architecture', name: '🏛️ Kiến trúc' },
                    { id: 'science', name: '🔬 Khoa học' },
                    { id: 'game', name: '🎮 Game' },
                    { id: 'deco', name: '🎨 Trang trí' },
                    { id: 'special', name: '⭐ Đặc biệt' }
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

                {/* Danh sách hoa văn cuộn độc lập */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2">
                    {STAGE_PATTERN_OPTIONS
                      .filter(pat => {
                        if (!patternCategoryFilter || patternCategoryFilter === 'all') return true;
                        if (patternCategoryFilter === 'favorites') return favoritePatternIds.includes(pat.id);
                        if (patternCategoryFilter === 'notebook') return pat.category === 'notebook' || pat.id.startsWith('notebook-');
                        if (patternCategoryFilter === 'wood') return pat.category === 'wood' || pat.id.startsWith('wood-');
                        if (patternCategoryFilter === 'random') return pat.category === 'random' || pat.id.startsWith('random-') || pat.id.startsWith('wood-');
                        if (patternCategoryFilter === 'grid') return pat.category === 'grid' || pat.category === '3d' || pat.id.includes('grid');
                        if (patternCategoryFilter === 'stripes') return pat.category === 'stripes' || pat.category === 'notebook' || pat.id.startsWith('notebook-');
                        if (patternCategoryFilter === 'geometric') return pat.category === 'geometric' || pat.category === '3d';
                        if (patternCategoryFilter === 'artistic') return pat.category === 'artistic' || pat.category === 'tech';
                        if (patternCategoryFilter === 'nature') return pat.id.startsWith('nature-') || pat.category === 'wood' || pat.id.startsWith('wood-');
                        if (patternCategoryFilter === 'ocean') return pat.id.startsWith('ocean-');
                        if (patternCategoryFilter === 'retro') return pat.id.startsWith('retro-') || pat.id.startsWith('fabric-');
                        if (patternCategoryFilter === 'tribal') return pat.id.startsWith('tribal-');
                        if (patternCategoryFilter === 'architecture') return pat.id.startsWith('arch-');
                        if (patternCategoryFilter === 'science') return pat.id.startsWith('sci-');
                        if (patternCategoryFilter === 'game') return pat.id.startsWith('game-');
                        if (patternCategoryFilter === 'deco') return pat.id.startsWith('deco-');
                        if (patternCategoryFilter === 'special') return pat.id.startsWith('special-') || pat.id.startsWith('light-');
                        return pat.category === patternCategoryFilter;
                      })
                      .map((pat) => {
                        const isSelected = selectedPatternId === pat.id && stageBgType === 'pattern';
                        const isFav = isFavoritePattern(pat.id);
                        return (
                          <div
                            key={pat.id}
                            onClick={() => { setSelectedPatternId(pat.id); setStageBgType('pattern'); }}
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
                              {pat.id !== 'none' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoritePattern(pat.id);
                                  }}
                                  className={`absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                                    isFav
                                      ? 'bg-rose-500 text-white scale-110 shadow-rose-500/40'
                                      : 'bg-black/50 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-rose-500/80 hover:text-white'
                                  }`}
                                  title={isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                                >
                                  <Heart size={12} className={isFav ? 'fill-white' : ''} strokeWidth={2.5} />
                                </button>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center justify-between">
                              <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-sky-300' : 'text-slate-200'}`}>
                                {pat.name.split('(')[0].trim()}
                              </span>
                              {isFav && (
                                <Heart size={10} className="fill-rose-400 text-rose-400 shrink-0 ml-1" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {selectedPatternId !== 'none' && (
                  <div className="shrink-0 pt-2.5 mt-2 border-t border-slate-800">
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
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
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: HÌNH ẢNH NỀN SÂN KHẤU (MỚI: XOAY, CHỈNH SỬA, MẪU CÓ SẴN, BỘ LỌC) */}
            {activeTab === 'image' && (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
                {/* 1. THANH TRẠNG THÁI KÍCH HOẠT */}
                <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${stageBgType === 'image' && stageBgImage ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <div>
                      <div className="text-xs font-bold text-white">
                        {stageBgType === 'image' && stageBgImage ? 'Đang kích hoạt Ảnh Nền Sân Khấu' : 'Chưa kích hoạt Ảnh Nền'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {stageBgImage ? 'Có thể xoay, thu phóng, chỉnh offset và hiệu ứng bên dưới' : 'Tải ảnh từ máy tính hoặc chọn mẫu sẵn có bên dưới'}
                      </div>
                    </div>
                  </div>
                  {stageBgImage && (
                    <button
                      type="button"
                      onClick={() => setStageBgType(stageBgType === 'image' ? 'pattern' : 'image')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow ${
                        stageBgType === 'image'
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40'
                      }`}
                    >
                      {stageBgType === 'image' ? '✓ Đang Bật' : 'Bật Ảnh Nền'}
                    </button>
                  )}
                </div>

                {/* 2. CHỌN ẢNH: TẢI LÊN HOẶC CHỌN MẪU CÓ SẴN */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Upload size={14} className="text-purple-400" /> Tải Ảnh Hoặc Chọn Mẫu Nền:
                    </span>
                    {stageBgImage && (
                      <button
                        type="button"
                        onClick={handleClearStageBgImage}
                        className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        title="Xóa ảnh nền hiện tại"
                      >
                        <Trash2 size={12} /> Xóa ảnh
                      </button>
                    )}
                  </div>

                  {/* Nút Upload ảnh lớn */}
                  <div className="flex gap-2 items-center">
                    <label className="flex-1 py-2 px-3 rounded-xl border border-dashed border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/15 text-center text-xs font-bold text-purple-300 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm">
                      <Upload size={14} />
                      {stageBgImage ? '🔄 Tải Lên Ảnh Khác Từ Máy Tính' : '📂 Tải Ảnh Lên Từ Máy Tính (PNG, JPG, WebP)'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadStageBgImage(file);
                          e.target.value = '';
                        }} 
                      />
                    </label>
                  </div>

                  {/* Danh sách mẫu ảnh nền có sẵn (Phân nhóm & Nạp thumbnail siêu nhẹ) */}
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-200 font-bold">
                        <ImageIcon size={13} className="text-purple-400" />
                        Kho Ảnh Nền Mẫu ({STAGE_BG_IMAGE_PRESETS.length} ảnh):
                      </span>
                      <span className="text-[10px] text-purple-300 font-mono bg-purple-950/70 border border-purple-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={10} className="text-purple-400" />
                        Đã nén WebP siêu tốc
                      </span>
                    </div>

                    {/* Thanh lọc theo nhóm / danh mục */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-2.5 custom-scrollbar">
                      {STAGE_BG_CATEGORIES.map(cat => {
                        const count = cat.id === 'all'
                          ? STAGE_BG_IMAGE_PRESETS.length
                          : STAGE_BG_IMAGE_PRESETS.filter(p => p.category === cat.id).length;
                        const isActive = bgImageCategoryFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setBgImageCategoryFilter(cat.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/40'
                                : 'bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-750 border border-slate-700/60'
                            }`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                              isActive ? 'bg-purple-700 text-purple-100' : 'bg-slate-900/70 text-purple-300'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Lưới hiển thị ảnh (Cuộn mượt mà với ảnh thumbnail nhỏ 20KB) */}
                    <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                      {STAGE_BG_IMAGE_PRESETS
                        .filter(preset => bgImageCategoryFilter === 'all' || preset.category === bgImageCategoryFilter)
                        .map((preset) => {
                          const isCurrent = stageBgImage === preset.url && stageBgType === 'image';
                          return (
                            <div
                              key={preset.id}
                              onClick={() => handleSelectPresetBgImage(preset.url)}
                              className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                                isCurrent
                                  ? 'border-purple-400 ring-2 ring-purple-400/30 shadow-lg shadow-purple-500/20'
                                  : 'border-slate-750 hover:border-purple-400/60 bg-slate-800'
                              }`}
                              title={`${preset.name}: ${preset.desc}`}
                            >
                              <div className="w-full h-16 bg-slate-950 overflow-hidden relative">
                                <img 
                                  src={preset.thumbUrl || preset.url} 
                                  alt={preset.name} 
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                />
                                {isCurrent && (
                                  <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow">
                                      <Check size={12} strokeWidth={3} />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="p-1 bg-slate-850 text-center truncate">
                                <span className="text-[10px] font-semibold text-slate-300 group-hover:text-white truncate block">
                                  {preset.name}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* 3. CÔNG CỤ CHỈNH SỬA & XOAY ẢNH NỀN (CHỈ HIỂN THỊ KHI CÓ ẢNH) */}
                {stageBgImage && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <RotateCw size={14} /> Công Cụ Xoay &amp; Căn Chỉnh Khung:
                      </span>
                      <button
                        type="button"
                        onClick={handleResetStageBgImageSettings}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        title="Khôi phục toàn bộ cài đặt ảnh về mặc định"
                      >
                        <RotateCcw size={11} /> Khôi phục gốc
                      </button>
                    </div>

                    {/* HÀNG CÔNG CỤ XOAY */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-300">Góc Xoay Ảnh:</span>
                          <span className="text-[10px] text-emerald-400 block">✓ Mặc định 0° đã tự xoay khớp chiều nhân vật</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('rotation', ((s.rotation || 0) - 90))}
                            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-purple-600/40 text-purple-300 rounded border border-slate-700 cursor-pointer"
                            title="Xoay ngược chiều kim đồng hồ 90 độ"
                          >
                            ↶ -90°
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('rotation', ((s.rotation || 0) + 90))}
                            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-purple-600/40 text-purple-300 rounded border border-slate-700 cursor-pointer"
                            title="Xoay theo chiều kim đồng hồ 90 độ"
                          >
                            ↷ +90°
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('rotation', 0)}
                            className={`px-2 py-1 text-[11px] rounded border cursor-pointer font-bold ${
                              (s.rotation || 0) === 0
                                ? 'bg-purple-600 text-white border-purple-400 shadow'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            }`}
                            title="Về góc chuẩn khớp chiều nhân vật (0 độ)"
                          >
                            0° Chuẩn
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('rotation', 180)}
                            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                            title="Đảo ngược 180 độ"
                          >
                            180°
                          </button>
                          <NumberInput
                            value={s.rotation || 0}
                            onChange={(val) => updateStageBgImageSetting('rotation', val)}
                            min={-360}
                            max={360}
                            step={1}
                            suffix="°"
                            className="w-16 ml-1"
                          />
                        </div>
                      </div>

                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={s.rotation || 0}
                        onChange={(e) => updateStageBgImageSetting('rotation', Number(e.target.value))}
                        className="w-full accent-purple-400 cursor-pointer h-1.5"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>-180°</span>
                        <span>-90°</span>
                        <span>0° (Khớp Chuẩn Nhân Vật)</span>
                        <span>+90°</span>
                        <span>+180°</span>
                      </div>
                    </div>

                    {/* HÀNG CĂN CHỈNH KHUNG (FIT) & THU PHÓNG (SCALE) & LẬT ẢNH */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                      {/* Chế độ vừa khung (Fit) */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">Chế Độ Vừa Khung:</span>
                        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-750">
                          {[
                            { id: 'cover', label: 'Phủ Đầy (Cover)', desc: 'Tự cắt mép thừa' },
                            { id: 'contain', label: 'Vừa Vặn (Contain)', desc: 'Thấy trọn ảnh' },
                            { id: 'fill', label: 'Kéo Giãn (Fill)', desc: 'Kín cả 4 góc' },
                            { id: 'original', label: 'Gốc (1:1)', desc: 'Kích thước thực' }
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => updateStageBgImageSetting('fit', m.id)}
                              className={`px-2 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                                (s.fit || 'cover') === m.id
                                  ? 'bg-purple-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title={m.desc}
                            >
                              {m.label.split('(')[0].trim()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Thu phóng (Scale %) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span className="font-semibold">Độ Thu Phóng (Zoom):</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateStageBgImageSetting('scale', Math.max(20, (s.scale || 100) - 10))}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700"
                            >
                              -10%
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStageBgImageSetting('scale', Math.min(300, (s.scale || 100) + 10))}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700"
                            >
                              +10%
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStageBgImageSetting('scale', 100)}
                              className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                            >
                              100%
                            </button>
                            <NumberInput
                              value={s.scale || 100}
                              onChange={(val) => updateStageBgImageSetting('scale', val)}
                              min={20}
                              max={300}
                              step={1}
                              suffix="%"
                              className="w-16"
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="300"
                          value={s.scale || 100}
                          onChange={(e) => updateStageBgImageSetting('scale', Number(e.target.value))}
                          className="w-full accent-purple-400 cursor-pointer h-1.5"
                        />
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>20% (Thu nhỏ)</span>
                          <span>100% (Chuẩn)</span>
                          <span>300% (Phóng to)</span>
                        </div>
                      </div>

                      {/* Lật ảnh (Flip) */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                        <span className="text-xs font-semibold text-slate-300">Lật / Gương (Flip):</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('flipX', !s.flipX)}
                            className={`px-2.5 py-1 text-xs rounded-lg border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              s.flipX
                                ? 'bg-purple-600 text-white border-purple-400 shadow'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                            }`}
                          >
                            <FlipHorizontal size={13} />
                            <span>Lật Ngang {s.flipX ? '(Bật)' : ''}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('flipY', !s.flipY)}
                            className={`px-2.5 py-1 text-xs rounded-lg border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              s.flipY
                                ? 'bg-purple-600 text-white border-purple-400 shadow'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                            }`}
                          >
                            <FlipVertical size={13} />
                            <span>Lật Dọc {s.flipY ? '(Bật)' : ''}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* HÀNG DỊCH CHUYỂN VỊ TRÍ (OFFSET X & Y & D-PAD) */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <Move size={13} /> Vị Trí Dịch Chuyển (X &amp; Y):
                        </span>
                        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-750">
                          {[5, 10, 25, 50].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => setMoveStep(step)}
                              className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer ${
                                moveStep === step ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {step}px
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cụm D-pad điều hướng */}
                      <div className="flex items-center justify-center py-1">
                        <div className="grid grid-cols-3 gap-1.5 w-36">
                          <div />
                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('offsetY', (s.offsetY || 0) - moveStep)}
                            className="h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-purple-600/40 border border-slate-700 text-purple-300 text-xs font-bold active:scale-95 cursor-pointer shadow"
                            title={`Dịch Lên ${moveStep}px`}
                          >
                            ▲
                          </button>
                          <div />

                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('offsetX', (s.offsetX || 0) - moveStep)}
                            className="h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-purple-600/40 border border-slate-700 text-purple-300 text-xs font-bold active:scale-95 cursor-pointer shadow"
                            title={`Dịch Trái ${moveStep}px`}
                          >
                            ◄
                          </button>
                          <button
                            type="button"
                            onClick={() => { updateStageBgImageSetting('offsetX', 0); updateStageBgImageSetting('offsetY', 0); }}
                            className="h-7 flex items-center justify-center rounded-lg bg-slate-850 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-white text-[9px] font-mono active:scale-95 cursor-pointer"
                            title="Đưa về tâm chính giữa"
                          >
                            Tâm
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('offsetX', (s.offsetX || 0) + moveStep)}
                            className="h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-purple-600/40 border border-slate-700 text-purple-300 text-xs font-bold active:scale-95 cursor-pointer shadow"
                            title={`Dịch Phải ${moveStep}px`}
                          >
                            ►
                          </button>

                          <div />
                          <button
                            type="button"
                            onClick={() => updateStageBgImageSetting('offsetY', (s.offsetY || 0) + moveStep)}
                            className="h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-purple-600/40 border border-slate-700 text-purple-300 text-xs font-bold active:scale-95 cursor-pointer shadow"
                            title={`Dịch Xuống ${moveStep}px`}
                          >
                            ▼
                          </button>
                          <div />
                        </div>
                      </div>

                      {/* Slider X & Y */}
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span>Ngang (X):</span>
                            <span className="font-mono text-purple-300">{s.offsetX || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-500"
                            max="500"
                            value={s.offsetX || 0}
                            onChange={(e) => updateStageBgImageSetting('offsetX', Number(e.target.value))}
                            className="w-full accent-purple-400 cursor-pointer h-1.5"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span>Dọc (Y):</span>
                            <span className="font-mono text-purple-300">{s.offsetY || 0}px</span>
                          </div>
                          <input
                            type="range"
                            min="-500"
                            max="500"
                            value={s.offsetY || 0}
                            onChange={(e) => updateStageBgImageSetting('offsetY', Number(e.target.value))}
                            className="w-full accent-purple-400 cursor-pointer h-1.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* HÀNG BỘ LỌC HÌNH ẢNH (BRIGHTNESS, CONTRAST, BLUR, OPACITY) */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Sun size={13} /> Bộ Lọc &amp; Hiệu Ứng Hình Ảnh:
                      </span>

                      {/* Độ Mờ (Opacity) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Độ Rõ / Mờ (Opacity):</span>
                          <span className="font-mono text-purple-300 font-bold">{s.opacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={s.opacity ?? 100}
                          onChange={(e) => updateStageBgImageSetting('opacity', Number(e.target.value))}
                          className="w-full accent-purple-400 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Độ Sáng (Brightness) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Độ Sáng (Brightness):</span>
                          <span className="font-mono text-purple-300 font-bold">{s.brightness ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={s.brightness ?? 100}
                          onChange={(e) => updateStageBgImageSetting('brightness', Number(e.target.value))}
                          className="w-full accent-purple-400 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Độ Tương Phản (Contrast) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Độ Tương Phản (Contrast):</span>
                          <span className="font-mono text-purple-300 font-bold">{s.contrast ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          value={s.contrast ?? 100}
                          onChange={(e) => updateStageBgImageSetting('contrast', Number(e.target.value))}
                          className="w-full accent-purple-400 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Làm Mờ Nhẹ (Blur) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span>Làm Mờ Hậu Cảnh (Blur Bokeh):</span>
                          <span className="font-mono text-purple-300 font-bold">{s.blur || 0}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={s.blur || 0}
                          onChange={(e) => updateStageBgImageSetting('blur', Number(e.target.value))}
                          className="w-full accent-purple-400 cursor-pointer h-1.5"
                        />
                      </div>

                      {/* Checkbox Phủ Hoa Văn Mờ */}
                      <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
                        <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!s.overlayPattern}
                            onChange={(e) => updateStageBgImageSetting('overlayPattern', e.target.checked)}
                            className="accent-purple-500 rounded"
                          />
                          <span>Phủ thêm hoa văn kẻ ô lên trên ảnh nền</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: XEM TRƯỚC SÂN KHẤU THỜI GIAN THỰC (KÈM NÚT KHỞI CHẠY) */}
          <div className="lg:col-span-5 flex flex-col p-5 bg-slate-950/50 overflow-hidden">
            {/* Header thanh xem trước */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                XEM TRƯỚC SÂN KHẤU
              </span>
              <div className="flex items-center gap-1.5">
                {/* Chế độ xem: Ngang 16:9 vs Dọc 9:16 */}
                <button
                  type="button"
                  onClick={() => setPreviewMode('landscape')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    previewMode === 'landscape'
                      ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Xem dạng khung ngang sân khấu studio"
                >
                  16:9 Ngang
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('portrait')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    previewMode === 'portrait'
                      ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Xem dạng màn hình điện thoại 9:16 như chế độ Khởi chạy"
                >
                  9:16 Điện Thoại
                </button>
              </div>
            </div>

            {/* KHUNG XEM TRƯỚC SÂN KHẤU LINH HOẠT */}
            <div className="flex-1 w-full flex items-center justify-center p-2 overflow-hidden min-h-[280px]">
              <div 
                className={`relative rounded-2xl border-2 border-slate-700/80 overflow-hidden shadow-2xl transition-all duration-300 flex items-center justify-center ${
                  previewMode === 'portrait' ? 'w-[210px] h-[370px]' : 'w-full h-[250px] sm:h-[290px]'
                }`}
                style={{ backgroundColor: stageBgColor }}
              >
                {/* Lớp ảnh nền sân khấu */}
                {stageBgType === 'image' && stageBgImage && (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
                    <div
                      className="relative flex items-center justify-center shrink-0 pointer-events-none"
                      style={{
                        width: previewMode === 'portrait' ? '210px' : '270px',
                        height: previewMode === 'portrait' ? '370px' : '480px',
                        transform: `rotate(${(previewMode === 'portrait' ? 0 : -90) + (s.rotation || 0)}deg)`,
                        transformOrigin: 'center center'
                      }}
                    >
                      <img
                        src={stageBgImage}
                        alt="Stage Preview"
                        className="w-full h-full pointer-events-none select-none max-w-none transition-transform duration-75"
                        style={{
                          objectFit: s.fit === 'original' ? 'none' : s.fit,
                          transform: `
                            translate(${s.offsetX || 0}px, ${s.offsetY || 0}px)
                            scale(${((s.scale || 100) / 100) * (s.flipX ? -1 : 1)}, ${((s.scale || 100) / 100) * (s.flipY ? -1 : 1)})
                          `,
                          opacity: (s.opacity ?? 100) / 100,
                          filter: `
                            brightness(${s.brightness ?? 100}%)
                            contrast(${s.contrast ?? 100}%)
                            blur(${s.blur || 0}px)
                            grayscale(${s.grayscale || 0}%)
                          `
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Lớp hoa văn CSS (nếu ở mode pattern hoặc bật overlay hoa văn lên ảnh) */}
                {(stageBgType === 'pattern' || s.overlayPattern) && currentPattern && currentPattern.id !== 'none' && (
                  <div
                    className="absolute inset-0 pointer-events-none transition-all duration-300"
                    style={{
                      ...currentPattern.style,
                      opacity: ((currentPattern.style.opacity || 1) * (patternOpacity / 50)) * (stageBgType === 'image' ? 0.6 : 1),
                      filter: stageBgColor === '#0f172a' ? 'invert(1) brightness(0.6)' : 'none'
                    }}
                  />
                )}

                {/* MẪU BÓNG NHÂN VẬT & ĐÈN PIN ĐỂ QUAN SÁT TƯƠNG PHẢN */}
                {showGhostCharacter && (
                  <div 
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                    style={{
                      transform: previewMode === 'landscape' ? 'rotate(-90deg)' : 'none',
                      transformOrigin: 'center center'
                    }}
                  >
                    {/* Vệt sáng đèn pin mô phỏng */}
                    <div className="absolute w-28 h-28 rounded-full border-2 border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_25px_rgba(250,204,21,0.3)] animate-pulse" />
                    {/* Bóng nhân vật tượng trưng */}
                    <div className="relative z-10 flex flex-col items-center opacity-85">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-700 shadow flex items-center justify-center text-xs">
                        🎮
                      </div>
                      <div className="w-14 h-16 rounded-2xl bg-slate-900/90 border border-slate-700 mt-1 shadow-md flex items-center justify-center text-[10px] text-slate-300">
                        Nhân Vật
                      </div>
                    </div>
                  </div>
                )}

                {/* Badge thông tin góc dưới */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 text-[10px] flex items-center justify-between text-slate-300 z-20">
                  <div className="flex items-center gap-2 truncate">
                    <span 
                      className="w-3 h-3 rounded-full border border-slate-500 shrink-0" 
                      style={{ backgroundColor: stageBgColor }} 
                    />
                    <span className="font-bold text-white truncate">
                      {stageBgType === 'image' ? 'Ảnh Nền' : (stageBgColor === '#ffffff' ? 'Trắng' : stageBgColor)}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-sky-300 truncate">
                      {stageBgType === 'image' ? `${s.rotation || 0}° • Zoom ${s.scale || 100}%` : currentPattern.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGhostCharacter(!showGhostCharacter)}
                    className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer shrink-0"
                    title="Ẩn/Hiện nhân vật và đèn mẫu để quan sát"
                  >
                    {showGhostCharacter ? <EyeOff size={11} /> : <Eye size={11} />}
                    <span>{showGhostCharacter ? 'Ẩn Mẫu' : 'Hiện Mẫu'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* NÚT VÀO CHẾ ĐỘ KHỞI CHẠY ĐỂ XEM TRƯỚC (THEO ĐÚNG YÊU CẦU CỦA USER) */}
            <div className="pt-2 shrink-0 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onLaunchPreview) {
                    onLaunchPreview();
                  } else {
                    onClose();
                  }
                }}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer ring-1 ring-emerald-400/40 flex items-center justify-center gap-2"
                title="Khởi chạy toàn màn hình với nền vừa chỉnh (Nhấn ESC để quay lại)"
              >
                <Play size={14} className="fill-white" />
                <span>🚀 Vào Chế Độ Khởi Chạy Để Xem Trước</span>
              </button>
              <div className="text-[10px] text-slate-400 text-center">
                Vào chế độ toàn màn hình 9:16 để chơi thử và soi đèn pin thực tế • Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">ESC</kbd> để thoát
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-900/95 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Cài đặt nền tự động lưu trữ trên máy.</span>
            {stageBgType === 'image' && stageBgImage && (
              <span className="text-purple-300 font-semibold">• Đang áp dụng nền hình ảnh</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              Hoàn Tất &amp; Áp Dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
