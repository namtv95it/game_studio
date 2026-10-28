import React from 'react';
import { Sparkles, Palette } from 'lucide-react';

// Danh sách các loại nền bóng (Shadow Background Styles)
// Danh sách các màu nền bóng (Shadow Base Colors)
export const SHADOW_COLOR_PRESETS = [
  { id: 'pure-black', name: 'Đen Tuyệt Đối', color: '#000000', label: 'Bóng Đen Chuẩn' },
  { id: 'grayscale', name: 'Đen Trắng (Grayscale)', type: 'grayscale', color: '#71717a', label: 'Ảnh Đen Trắng' },
  { id: 'charcoal', name: 'Than Chì', color: '#1e293b', label: 'Xám Than Đậm' },
  { id: 'deep-navy', name: 'Xanh Đêm', color: '#0f172a', label: 'Navy Huyền Bí' },
  { id: 'crimson', name: 'Đỏ Thẫm', color: '#881337', label: 'Bóng Đỏ Ma Mị' },
  { id: 'deep-purple', name: 'Tím Đậm', color: '#4c1d95', label: 'Bóng Tím Ảo Ảnh' },
  { id: 'emerald', name: 'Xanh Rêu Đậm', color: '#064e3b', label: 'Bóng Rừng Đêm' },
  { id: 'grad-dark-violet', name: 'Gradient Đen Tím', type: 'gradient', colors: ['#0f051d', '#3b0764', '#0f051d'], label: 'Tím Huyền Bí' },
  { id: 'grad-fire', name: 'Gradient Hỏa Băng', type: 'gradient', colors: ['#450a0a', '#b91c1c', '#7f1d1d'], label: 'Lửa Đỏ Rực' },
  { id: 'grad-cyber', name: 'Gradient Cyber', type: 'gradient', colors: ['#030712', '#1e1b4b', '#083344'], label: 'Cyberpunk Đêm' },
  { id: 'grad-neon-gold', name: 'Gradient Hoàng Kim', type: 'gradient', colors: ['#1c1917', '#78350f', '#b45309'], label: 'Ánh Kim Vàng' },
  { id: 'grad-silver', name: 'Gradient Kim Loại', type: 'gradient', colors: ['#0f172a', '#475569', '#1e293b'], label: 'Bạc Kim Loại' },
  { id: 'custom-color', name: 'Màu Tùy Chọn', type: 'custom', color: '#000000', label: 'Màu Tự Chọn' }
];

// Danh sách các họa tiết phủ lên bóng (Shadow Overlay Patterns)
export const SHADOW_PATTERN_PRESETS = [
  { id: 'none', name: 'Không họa tiết', label: 'Bóng trơn phẳng', icon: 'solid' },
  { id: 'tv-noise', name: 'Nhiễu TV Cổ Điển', label: 'Hạt Tivi Trắng Đen', noiseColor: 'monochrome' },
  { id: 'tv-noise-color', name: 'Nhiễu TV Màu RGB', label: 'Hạt Sóng Màu RGB', noiseColor: 'rgb' },
  { id: 'pattern-dots', name: 'Chấm Bi Huyền Bí', label: 'Họa tiết Chấm Bi', dotColor: '#38bdf8' },
  { id: 'pattern-stripes', name: 'Sọc Chéo Bí Ẩn', label: 'Họa tiết Sọc Chéo', stripeColor: '#a855f7' }
];

// Giữ lại SHADOW_STYLE_PRESETS cũ để tương thích ngược cho các file import cũ
export const SHADOW_STYLE_PRESETS = [
  ...SHADOW_COLOR_PRESETS,
  { id: 'tv-noise', name: 'Nhiễu TV Cổ Điển', type: 'noise', color: '#000000', noiseColor: 'monochrome', label: 'Hạt Tivi Trắng Đen' },
  { id: 'tv-noise-color', name: 'Nhiễu TV Màu RGB', type: 'noise', color: '#000000', noiseColor: 'rgb', label: 'Hạt Nhiễu Sóng Màu' },
  { id: 'pattern-dots', name: 'Chấm Bi Huyền Bí', type: 'pattern', pattern: 'dots', color: '#0a0a0a', dotColor: '#38bdf8', label: 'Nền Kín Chấm Bi' },
  { id: 'pattern-stripes', name: 'Sọc Chéo Bí Ẩn', type: 'pattern', pattern: 'stripes', color: '#0f172a', stripeColor: '#a855f7', label: 'Nền Kín Sọc Chéo' }
];

// Cache canvas tạo pattern / hạt nhiễu để tối ưu render siêu mượt mà
const patternCache = {};

function getCachedPattern(patternId) {
  const cacheKey = patternId;
  if (patternCache[cacheKey]) return patternCache[cacheKey];

  const patCanvas = document.createElement('canvas');

  if (patternId === 'tv-noise' || patternId === 'tv-noise-color') {
    // Hạt nhiễu Tivi bán trong suốt: để lộ màu nền bóng bên dưới, tạo hạt cát nhiễu phim/TV cổ điển
    const size = 64;
    patCanvas.width = size;
    patCanvas.height = size;
    const patCtx = patCanvas.getContext('2d');
    const imgData = patCtx.createImageData(size, size);
    const buffer32 = new Uint32Array(imgData.data.buffer);
    const len = buffer32.length;

    if (patternId === 'tv-noise-color') {
      for (let i = 0; i < len; i++) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        // Alpha bán trong suốt (~38%) để lớp màu nền bóng vẫn nổi bật rõ nét
        const a = Math.floor(60 + Math.random() * 70);
        buffer32[i] = (a << 24) | (b << 16) | (g << 8) | r;
      }
    } else {
      // Monochrome TV Static (hạt cát nhiễu trắng đen lấp lánh bán trong suốt)
      for (let i = 0; i < len; i++) {
        const val = Math.random() > 0.5 ? 255 : 0;
        const a = Math.floor(40 + Math.random() * 60);
        buffer32[i] = (a << 24) | (val << 16) | (val << 8) | val;
      }
    }
    patCtx.putImageData(imgData, 0, 0);
  } else if (patternId === 'pattern-dots') {
    // Chấm bi màu trắng tinh khiết nổi bật rực rỡ trên bóng đen
    patCanvas.width = 16;
    patCanvas.height = 16;
    const patCtx = patCanvas.getContext('2d');
    patCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    patCtx.beginPath();
    patCtx.arc(8, 8, 3.5, 0, Math.PI * 2);
    patCtx.fill();
  } else if (patternId === 'pattern-stripes') {
    // Sọc chéo 45 độ màu trắng tinh khiết dày dặn trên bóng đen
    patCanvas.width = 20;
    patCanvas.height = 20;
    const patCtx = patCanvas.getContext('2d');
    patCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    patCtx.lineWidth = 3.5;
    patCtx.beginPath();
    patCtx.moveTo(-5, 15);
    patCtx.lineTo(15, -5);
    patCtx.moveTo(0, 20);
    patCtx.lineTo(20, 0);
    patCtx.moveTo(5, 25);
    patCtx.lineTo(25, 5);
    patCtx.stroke();
  }

  patternCache[cacheKey] = patCanvas;
  return patCanvas;
}

/**
 * Hàm tiện ích vẽ lớp nền bóng lên Context2D của Canvas
 * (1) Tô màu nền bóng kín hoàn toàn
 * (2) Hòa trộn lớp họa tiết bán trong suốt lên trên để vừa thấy rõ màu nền vừa thấy rõ hiệu ứng họa tiết
 */
export function applyShadowBackgroundToCanvas(
  ctx,
  width,
  height,
  shadowStyle = 'pure-black',
  customShadowColor = '#000000',
  shadowOpacity = 100,
  shadowPattern = 'none'
) {
  let effectivePattern = shadowPattern;
  let effectiveColorStyle = shadowStyle;

  if (['tv-noise', 'tv-noise-color', 'pattern-dots', 'pattern-stripes'].includes(shadowStyle)) {
    effectivePattern = shadowStyle;
    effectiveColorStyle = 'pure-black';
  }

  const colorPreset = SHADOW_COLOR_PRESETS.find((p) => p.id === effectiveColorStyle) || SHADOW_COLOR_PRESETS[0];
  const opacityAlpha = Math.max(0.05, Math.min(1, (shadowOpacity ?? 100) / 100));

  ctx.save();
  ctx.globalAlpha = opacityAlpha;

  // BƯỚC 1: TÔ MÀU NỀN BÓNG KÍN 100% HOẶC CHUYỂN THÀNH ĐEN TRẮNG (GRAYSCALE)
  if (effectiveColorStyle === 'grayscale') {
    // Biến hình ảnh thành đen trắng CHỈ trên pixel có nội dung hình ảnh (alpha > 0)
    // Giữ nguyên 100% độ trong suốt ở ngoài nền, không làm đổi màu nền trong suốt
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const len = data.length;
      for (let i = 0; i < len; i += 4) {
        const a = data[i + 3];
        if (a > 0) {
          // Tính độ sáng theo chuẩn Rec. 709 / sRGB (Luminance)
          const gray = Math.round(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]);
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (err) {
      console.error('Grayscale processing error:', err);
    }
  } else if (effectiveColorStyle === 'custom-color') {
    ctx.fillStyle = customShadowColor || '#000000';
    ctx.fillRect(0, 0, width, height);
  } else if (colorPreset.type === 'gradient') {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    const cols = colorPreset.colors || ['#000000', '#1e293b'];
    cols.forEach((col, idx) => {
      grad.addColorStop(idx / (cols.length - 1), col);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = colorPreset.color || '#000000';
    ctx.fillRect(0, 0, width, height);
  }

  // BƯỚC 2: PHỦ HỌA TIẾT LÊN TRÊN LỚP MÀU NỀN
  if (effectivePattern && effectivePattern !== 'none') {
    const patCanvas = getCachedPattern(effectivePattern);
    try {
      const pattern = ctx.createPattern(patCanvas, 'repeat');
      if (pattern) {
        // Sử dụng 'source-atop' để họa tiết chỉ vẽ đè lên lớp nền màu đã có, bảo toàn 100% màu nền bên dưới
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
    } catch (err) {
      console.error('Pattern fill error:', err);
    }
  }

  ctx.restore();
}


/**
 * Component giao diện cài đặt Màu nền bóng & Họa tiết (Tách riêng 2 cột / 2 phần rõ ràng)
 */
export default function ShadowStyleSettingsControl({
  shadowStyle = 'pure-black',
  setShadowStyle,
  customShadowColor = '#000000',
  setCustomShadowColor,
  shadowOpacity = 100,
  setShadowOpacity,
  shadowPattern = 'none',
  setShadowPattern,
  themeColor = 'purple'
}) {
  const accentClass = themeColor === 'sky' ? 'accent-sky-400' : 'accent-purple-400';
  const ringClass = themeColor === 'sky' ? 'ring-sky-400/50 border-sky-400' : 'ring-purple-400/50 border-purple-400';
  const selectedBgClass = themeColor === 'sky' ? 'bg-sky-950/60' : 'bg-purple-950/60';
  const textClass = themeColor === 'sky' ? 'text-sky-300' : 'text-purple-300';
  const activeTabClass = themeColor === 'sky' ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' : 'bg-purple-500/20 text-purple-300 border-purple-500/40';

  // Đồng bộ pattern
  const activePattern = shadowPattern !== undefined ? shadowPattern : 'none';
  const handleSelectPattern = (patternId) => {
    if (setShadowPattern) {
      setShadowPattern(patternId);
    }
    // Nếu shadowStyle đang lưu pattern cũ, tự động chuyển shadowStyle về pure-black
    if (setShadowStyle && ['tv-noise', 'tv-noise-color', 'pattern-dots', 'pattern-stripes'].includes(shadowStyle)) {
      setShadowStyle('pure-black');
    }
  };

  // Xác định màu được chọn (nếu shadowStyle là pattern cũ thì fallback về pure-black)
  const effectiveColorId = ['tv-noise', 'tv-noise-color', 'pattern-dots', 'pattern-stripes'].includes(shadowStyle)
    ? 'pure-black'
    : shadowStyle;

  return (
    <div className="flex flex-col gap-3">
      {/* KHU VỰC 2 PHẦN XẾP THÀNH 2 HÀNG NGANG: HÀNG 1 MÀU BÓNG, HÀNG 2 HỌA TIẾT */}
      <div className="flex flex-col gap-3">
        
        {/* PHẦN 1: CHỌN MÀU NỀN BÓNG */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between px-0.5 pb-1.5 border-b border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              1. Màu Nền Bóng
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {SHADOW_COLOR_PRESETS.find(p => p.id === effectiveColorId)?.name || 'Tùy chọn'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
            {SHADOW_COLOR_PRESETS.map((preset) => {
              const isSelected = effectiveColorId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setShadowStyle(preset.id)}
                  title={preset.name}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                    isSelected
                      ? `${selectedBgClass} ${ringClass} text-white shadow-sm ring-1`
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750 hover:text-white'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-md border border-slate-600 shrink-0 shadow-inner overflow-hidden flex items-center justify-center"
                    style={
                      preset.type === 'custom'
                        ? { backgroundColor: customShadowColor }
                        : preset.type === 'grayscale'
                        ? { background: 'linear-gradient(135deg, #ffffff 0%, #71717a 50%, #18181b 100%)' }
                        : preset.type === 'gradient'
                        ? { background: `linear-gradient(135deg, ${preset.colors.join(', ')})` }
                        : { backgroundColor: preset.color }
                    }
                  />
                  <span className="text-[10px] font-medium leading-tight w-full px-0.5 break-words">
                    {preset.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hộp chọn mã màu nếu chọn 'Màu Tùy Chọn' */}
          {effectiveColorId === 'custom-color' && (
            <div className="flex items-center justify-between p-1.5 mt-1 rounded-lg bg-slate-950/80 border border-slate-750">
              <span className="text-[10px] text-slate-300">Tự chọn:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={customShadowColor}
                  onChange={(e) => setCustomShadowColor(e.target.value)}
                  className="w-5 h-5 rounded border border-slate-600 cursor-pointer bg-transparent p-0"
                />
                <span className={`text-[10px] font-mono uppercase ${textClass}`}>{customShadowColor}</span>
              </div>
            </div>
          )}
        </div>

        {/* PHẦN 2: CHỌN HỌA TIẾT PHỦ */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between px-0.5 pb-1.5 border-b border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              2. Họa Tiết Phủ
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {SHADOW_PATTERN_PRESETS.find(p => p.id === activePattern)?.name || 'Không'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
            {SHADOW_PATTERN_PRESETS.map((pat) => {
              const isSelected = activePattern === pat.id;
              return (
                <button
                  key={pat.id}
                  type="button"
                  onClick={() => handleSelectPattern(pat.id)}
                  title={`${pat.name} - ${pat.label}`}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                    isSelected
                      ? `${selectedBgClass} ${ringClass} text-white shadow-sm ring-1`
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-750 hover:text-white'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-md border border-slate-600 shrink-0 shadow-inner overflow-hidden"
                    style={{
                      backgroundColor:
                        effectiveColorId === 'custom-color'
                          ? customShadowColor
                          : SHADOW_COLOR_PRESETS.find((p) => p.id === effectiveColorId)?.color || '#000000',
                      backgroundImage:
                        pat.id === 'none'
                          ? 'none'
                          : pat.id === 'tv-noise'
                          ? 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)'
                          : pat.id === 'tv-noise-color'
                          ? 'radial-gradient(circle, rgba(255,0,85,0.7) 1px, transparent 1px), radial-gradient(circle, rgba(0,255,102,0.7) 1px, transparent 1px), radial-gradient(circle, rgba(0,153,255,0.7) 1px, transparent 1px)'
                          : pat.id === 'pattern-dots'
                          ? 'radial-gradient(circle, rgba(255,255,255,0.95) 2px, transparent 2px)'
                          : 'repeating-linear-gradient(45deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9) 2px, transparent 2px, transparent 5px)',
                      backgroundSize:
                        pat.id === 'tv-noise' || pat.id === 'tv-noise-color'
                          ? '3px 3px'
                          : pat.id === 'pattern-dots'
                          ? '6px 6px'
                          : 'auto'
                    }}
                  />
                  <span className="text-[10px] font-medium leading-tight w-full px-0.5 break-words">
                    {pat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Độ đậm bóng */}
      <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Độ đậm của bóng:</span>
          <span className="text-white font-mono text-[11px]">{shadowOpacity}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={shadowOpacity}
          onChange={(e) => setShadowOpacity(Number(e.target.value))}
          className={`${accentClass} cursor-pointer h-1.5`}
        />
      </div>
    </div>
  );
}


