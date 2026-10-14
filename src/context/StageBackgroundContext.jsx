import React, { createContext, useContext, useState, useEffect } from 'react';

// Danh sách các bảng màu nền pastel nhã nhặn, rõ ràng, không bị trùng màu hay quá chói
export const SUBTLE_COLOR_PALETTES = [
  { id: 'white', name: 'Không màu (Trắng tinh)', color: '#ffffff', textColor: 'text-slate-800', desc: 'Trắng nguyên bản sạch sẽ' },
  { id: 'cream', name: 'Kem ấm (Warm Cream)', color: '#fef3c7', textColor: 'text-amber-900', desc: 'Vàng kem ấm áp' },
  { id: 'sand', name: 'Vàng cát nhạt (Soft Sand)', color: '#faeed1', textColor: 'text-amber-800', desc: 'Tone be cát tự nhiên' },
  { id: 'slate', name: 'Xám sáng (Light Slate)', color: '#e2e8f0', textColor: 'text-slate-800', desc: 'Xám hiện đại trung tính' },
  { id: 'silver', name: 'Bạc lạnh (Cool Silver)', color: '#cbd5e1', textColor: 'text-slate-900', desc: 'Xám bạc tương phản tốt' },
  { id: 'mint', name: 'Xanh bạc hà (Soft Mint)', color: '#bbf7d0', textColor: 'text-emerald-950', desc: 'Xanh lá pastel tươi mát' },
  { id: 'teal', name: 'Xanh ngọc nhạt (Pale Teal)', color: '#99f6e4', textColor: 'text-teal-950', desc: 'Xanh ngọc dịu nhẹ' },
  { id: 'sky', name: 'Xanh da trời (Pastel Sky)', color: '#bae6fd', textColor: 'text-sky-950', desc: 'Xanh dương baby trong trẻo' },
  { id: 'lavender', name: 'Tím oải hương (Soft Lavender)', color: '#e9d5ff', textColor: 'text-purple-950', desc: 'Tím pastel mộng mơ' },
  { id: 'rose', name: 'Hồng phấn (Pastel Rose)', color: '#fbcfe8', textColor: 'text-rose-950', desc: 'Hồng phấn ngọt ngào' },
  { id: 'peach', name: 'Cam đào (Soft Peach)', color: '#fed7aa', textColor: 'text-orange-950', desc: 'Cam đào ấm áp' },
  { id: 'dark-slate', name: 'Studio Tối (Dark Studio)', color: '#0f172a', textColor: 'text-slate-200', desc: 'Tone đen than chì cao cấp' },
];

// Danh sách các kiểu hoa văn nền (Patterns)
export const STAGE_PATTERN_OPTIONS = [
  {
    id: 'none',
    name: 'Không hoa văn (Chỉ màu trơn)',
    category: 'solid',
    style: {
      backgroundImage: 'none'
    }
  },
  {
    id: 'grid-classic',
    name: 'Kẻ ô xám mờ (Classic Grid)',
    category: 'grid',
    style: {
      backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      opacity: 0.6
    }
  },
  {
    id: 'grid-fine',
    name: 'Kẻ ô li nhỏ (Millimeter Grid)',
    category: 'grid',
    style: {
      backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      opacity: 0.5
    }
  },
  {
    id: 'dots-subtle',
    name: 'Chấm bi mờ (Dotted Studio)',
    category: 'dots',
    style: {
      backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      opacity: 0.5
    }
  },
  {
    id: 'dots-dense',
    name: 'Chấm bi dày thanh nhã (Fine Dots)',
    category: 'dots',
    style: {
      backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
      backgroundSize: '16px 16px',
      opacity: 0.6
    }
  },
  {
    id: 'stripes-diagonal',
    name: 'Sọc chéo mờ (Diagonal Slanted)',
    category: 'stripes',
    style: {
      backgroundImage: 'repeating-linear-gradient(45deg, rgba(226, 232, 240, 0.45), rgba(226, 232, 240, 0.45) 12px, transparent 12px, transparent 24px)',
      opacity: 0.7
    }
  },
  {
    id: 'grad-soft',
    name: 'Gradient ánh sáng dịu',
    category: 'gradient',
    style: {
      backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.9), rgba(226, 232, 240, 0.4) 70%)',
      opacity: 0.8
    }
  }
];

const STORAGE_BG_COLOR_KEY = 'game_studio_stage_bg_color_v2';
const STORAGE_PATTERN_KEY = 'game_studio_stage_bg_pattern_v2';
const STORAGE_OPACITY_KEY = 'game_studio_stage_bg_opacity_v2';

const StageBackgroundContext = createContext({
  stageBgColor: '#ffffff',
  setStageBgColor: () => {},
  selectedPatternId: 'grid-classic',
  setSelectedPatternId: () => {},
  currentPattern: STAGE_PATTERN_OPTIONS[1],
  patternOpacity: 50,
  setPatternOpacity: () => {},
  handleResetToWhite: () => {}
});

export function StageBackgroundProvider({ children }) {
  // Màu nền sân khấu (Mặc định là trắng #ffffff)
  const [stageBgColor, setStageBgColor] = useState(() => {
    return localStorage.getItem(STORAGE_BG_COLOR_KEY) || '#ffffff';
  });

  // Mẫu hoa văn (Mặc định là kẻ ô grid-classic)
  const [selectedPatternId, setSelectedPatternId] = useState(() => {
    return localStorage.getItem(STORAGE_PATTERN_KEY) || 'grid-classic';
  });

  // Độ tương phản hoa văn
  const [patternOpacity, setPatternOpacity] = useState(() => {
    const val = localStorage.getItem(STORAGE_OPACITY_KEY);
    return val !== null ? Number(val) : 50;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_BG_COLOR_KEY, stageBgColor);
  }, [stageBgColor]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PATTERN_KEY, selectedPatternId);
  }, [selectedPatternId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_OPACITY_KEY, String(patternOpacity));
  }, [patternOpacity]);

  const currentPattern = STAGE_PATTERN_OPTIONS.find(p => p.id === selectedPatternId) || STAGE_PATTERN_OPTIONS[0];

  // Reset về trắng hoàn toàn (Không hoa văn)
  const handleResetToWhite = () => {
    setStageBgColor('#ffffff');
    setSelectedPatternId('none');
    setPatternOpacity(50);
  };

  return (
    <StageBackgroundContext.Provider value={{
      stageBgColor,
      setStageBgColor,
      selectedPatternId,
      setSelectedPatternId,
      currentPattern,
      patternOpacity,
      setPatternOpacity,
      handleResetToWhite
    }}>
      {children}
    </StageBackgroundContext.Provider>
  );
}

export function useStageBackground() {
  return useContext(StageBackgroundContext);
}

/**
 * Component render lớp phủ nền sân khấu
 * Tự động áp dụng cả màu nền và hoa văn trên tất cả chức năng
 */
export function StageBackgroundOverlay({ className = '' }) {
  const { stageBgColor, currentPattern, patternOpacity } = useStageBackground();

  const isDarkBg = stageBgColor === '#0f172a';

  return (
    <div 
      className={`absolute inset-0 pointer-events-none transition-all duration-300 ${className}`}
      style={{ backgroundColor: stageBgColor }}
    >
      {currentPattern.id !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-300"
          style={{
            ...currentPattern.style,
            opacity: ((currentPattern.style.opacity || 1) * (patternOpacity / 50)),
            filter: isDarkBg ? 'invert(1) brightness(0.6)' : 'none'
          }}
        />
      )}
    </div>
  );
}
