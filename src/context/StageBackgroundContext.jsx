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

// Danh sách các kiểu hoa văn nền (Patterns) phong phú & thẩm mỹ cao
export const STAGE_PATTERN_OPTIONS = [
  {
    id: 'none',
    name: 'Không hoa văn (Chỉ màu trơn)',
    category: 'solid',
    badge: 'Màu trơn',
    style: {
      backgroundImage: 'none'
    }
  },
  {
    id: 'grid-classic',
    name: 'Kẻ ô xám mờ (Classic Grid)',
    category: 'grid',
    badge: 'Kẻ ô',
    style: {
      backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      opacity: 0.65
    }
  },
  {
    id: 'grid-fine',
    name: 'Kẻ ô li nhỏ (Millimeter Grid)',
    category: 'grid',
    badge: 'Ô li',
    style: {
      backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      opacity: 0.55
    }
  },
  {
    id: 'grid-blueprint',
    name: 'Bản thiết kế (Blueprint Tech Grid)',
    category: 'grid',
    badge: 'Kỹ thuật',
    style: {
      backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.4) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(148, 163, 184, 0.4) 1.5px, transparent 1.5px), linear-gradient(rgba(203, 213, 225, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(203, 213, 225, 0.25) 1px, transparent 1px)',
      backgroundSize: '80px 80px, 80px 80px, 16px 16px, 16px 16px',
      opacity: 0.75
    }
  },
  {
    id: 'grid-isometric',
    name: 'Lưới không gian 3D (Isometric 3D)',
    category: '3d',
    badge: '3D Mesh',
    style: {
      backgroundImage: 'linear-gradient(30deg, #94a3b8 12%, transparent 12.5%, transparent 87%, #94a3b8 87.5%, #94a3b8), linear-gradient(150deg, #94a3b8 12%, transparent 12.5%, transparent 87%, #94a3b8 87.5%, #94a3b8), linear-gradient(30deg, #94a3b8 12%, transparent 12.5%, transparent 87%, #94a3b8 87.5%, #94a3b8), linear-gradient(150deg, #94a3b8 12%, transparent 12.5%, transparent 87%, #94a3b8 87.5%, #94a3b8), linear-gradient(60deg, rgba(148, 163, 184, 0.4) 25%, transparent 25.5%, transparent 75%, rgba(148, 163, 184, 0.4) 75%, rgba(148, 163, 184, 0.4)), linear-gradient(60deg, rgba(148, 163, 184, 0.4) 25%, transparent 25.5%, transparent 75%, rgba(148, 163, 184, 0.4) 75%, rgba(148, 163, 184, 0.4))',
      backgroundSize: '40px 70px',
      backgroundPosition: '0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px',
      opacity: 0.35
    }
  },
  {
    id: 'dots-subtle',
    name: 'Chấm bi mờ (Dotted Studio)',
    category: 'dots',
    badge: 'Chấm bi',
    style: {
      backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
      backgroundSize: '28px 28px',
      opacity: 0.55
    }
  },
  {
    id: 'dots-dense',
    name: 'Chấm bi dày thanh nhã (Fine Dots)',
    category: 'dots',
    badge: 'Chấm mịn',
    style: {
      backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
      backgroundSize: '16px 16px',
      opacity: 0.65
    }
  },
  {
    id: 'dots-matrix',
    name: 'Ma trận điểm giao nhau (Plus Cross Matrix)',
    category: 'dots',
    badge: 'Dấu cộng +',
    style: {
      backgroundImage: 'radial-gradient(circle, #64748b 10%, transparent 11%), radial-gradient(circle at bottom left, #64748b 5%, transparent 6%), radial-gradient(circle at bottom right, #64748b 5%, transparent 6%), radial-gradient(circle at top left, #64748b 5%, transparent 6%), radial-gradient(circle at top right, #64748b 5%, transparent 6%)',
      backgroundSize: '32px 32px',
      opacity: 0.45
    }
  },
  {
    id: 'stripes-diagonal',
    name: 'Sọc chéo thanh lịch (Diagonal Slanted)',
    category: 'stripes',
    badge: 'Sọc chéo',
    style: {
      backgroundImage: 'repeating-linear-gradient(45deg, rgba(203, 213, 225, 0.45), rgba(203, 213, 225, 0.45) 12px, transparent 12px, transparent 24px)',
      opacity: 0.7
    }
  },
  {
    id: 'stripes-vertical',
    name: 'Sọc đứng kẻ chỉ (Vertical Pinstripe)',
    category: 'stripes',
    badge: 'Sọc đứng',
    style: {
      backgroundImage: 'repeating-linear-gradient(90deg, rgba(203, 213, 225, 0.6) 0px, rgba(203, 213, 225, 0.6) 1.5px, transparent 1.5px, transparent 24px)',
      opacity: 0.65
    }
  },
  {
    id: 'chevron-waves',
    name: 'Chữ V nghệ thuật (Chevron Zigzag)',
    category: 'geometric',
    badge: 'Zigzag',
    style: {
      backgroundImage: 'linear-gradient(135deg, rgba(148, 163, 184, 0.35) 25%, transparent 25%), linear-gradient(225deg, rgba(148, 163, 184, 0.35) 25%, transparent 25%), linear-gradient(315deg, rgba(148, 163, 184, 0.35) 25%, transparent 25%), linear-gradient(45deg, rgba(148, 163, 184, 0.35) 25%, transparent 25%)',
      backgroundPosition: '-15px 0, -15px 0, 0 0, 0 0',
      backgroundSize: '30px 30px',
      backgroundRepeat: 'repeat',
      opacity: 0.55
    }
  },
  {
    id: 'honeycomb-hex',
    name: 'Tổ ong lục giác (Honeycomb Hex)',
    category: 'geometric',
    badge: 'Lục giác',
    style: {
      backgroundImage: 'radial-gradient(circle farthest-side at 0% 50%, transparent 6px, #cbd5e1 6px, #cbd5e1 7px, transparent 7px), radial-gradient(circle farthest-side at 100% 50%, transparent 6px, #cbd5e1 6px, #cbd5e1 7px, transparent 7px)',
      backgroundSize: '28px 32px',
      backgroundPosition: '0 0, 14px 16px',
      opacity: 0.6
    }
  },
  {
    id: 'moroccan-tile',
    name: 'Gạch hoa Ma-rốc (Moroccan Lattice)',
    category: 'geometric',
    badge: 'Gạch bông',
    style: {
      backgroundImage: 'radial-gradient(circle at 100% 150%, #cbd5e1 24%, #e2e8f0 25%, #e2e8f0 28%, #cbd5e1 29%, #cbd5e1 36%, #e2e8f0 36%, #e2e8f0 40%, transparent 40%, transparent), radial-gradient(circle at 0 150%, #cbd5e1 24%, #e2e8f0 25%, #e2e8f0 28%, #cbd5e1 29%, #cbd5e1 36%, #e2e8f0 36%, #e2e8f0 40%, transparent 40%, transparent), radial-gradient(circle at 50% 100%, #e2e8f0 10%, #cbd5e1 11%, #cbd5e1 23%, #e2e8f0 24%, #e2e8f0 30%, #cbd5e1 31%, #cbd5e1 43%, #e2e8f0 44%, #e2e8f0 50%, transparent 50%, transparent), radial-gradient(circle at 100% 50%, #cbd5e1 5%, #e2e8f0 6%, #e2e8f0 15%, #cbd5e1 16%, #cbd5e1 20%, #e2e8f0 21%, #e2e8f0 30%, transparent 30%, transparent), radial-gradient(circle at 0 50%, #cbd5e1 5%, #e2e8f0 6%, #e2e8f0 15%, #cbd5e1 16%, #cbd5e1 20%, #e2e8f0 21%, #e2e8f0 30%, transparent 30%, transparent)',
      backgroundSize: '50px 25px',
      opacity: 0.5
    }
  },
  {
    id: 'japanese-waves',
    name: 'Sóng lượn Seigaiha (Japanese Waves)',
    category: 'artistic',
    badge: 'Sóng lượn',
    style: {
      backgroundImage: 'radial-gradient(circle at 50% 0, transparent 15px, #94a3b8 16px, #94a3b8 17px, transparent 18px), radial-gradient(circle at 50% 0, transparent 25px, #94a3b8 26px, #94a3b8 27px, transparent 28px), radial-gradient(circle at 50% 0, transparent 35px, #94a3b8 36px, #94a3b8 37px, transparent 38px)',
      backgroundSize: '50px 26px',
      opacity: 0.45
    }
  },
  {
    id: 'circuit-board',
    name: 'Mạch điện tử (Cyber Circuit)',
    category: 'tech',
    badge: 'Công nghệ',
    style: {
      backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px), radial-gradient(#94a3b8 2px, transparent 2px), linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
      backgroundSize: '48px 48px, 48px 48px, 24px 24px, 24px 24px',
      backgroundPosition: '0 0, 24px 24px, 0 0, 0 0',
      opacity: 0.55
    }
  },
  {
    id: 'stars-constellation',
    name: 'Chòm sao lấp lánh (Star Constellation)',
    category: 'artistic',
    badge: 'Chòm sao',
    style: {
      backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1.5px), radial-gradient(circle, #64748b 1.5px, transparent 2px), radial-gradient(circle, #cbd5e1 1px, transparent 1.5px)',
      backgroundSize: '40px 40px, 60px 60px, 80px 80px',
      backgroundPosition: '0 0, 25px 30px, 50px 10px',
      opacity: 0.65
    }
  },
  {
    id: 'diagonal-crosshatch',
    name: 'Ca-rô đan chéo (Diamond Crosshatch)',
    category: 'geometric',
    badge: 'Đan chéo',
    style: {
      backgroundImage: 'linear-gradient(45deg, rgba(203, 213, 225, 0.6) 1px, transparent 1px), linear-gradient(-45deg, rgba(203, 213, 225, 0.6) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      opacity: 0.6
    }
  },
  {
    id: 'grad-soft',
    name: 'Gradient ánh sáng dịu (Soft Spotlight)',
    category: 'gradient',
    badge: 'Hào quang',
    style: {
      backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.95), rgba(226, 232, 240, 0.5) 70%)',
      opacity: 0.8
    }
  },
  {
    id: 'grad-vignette',
    name: 'Vignette studio tỏa góc (Studio Vignette)',
    category: 'gradient',
    badge: 'Tỏa sáng',
    style: {
      backgroundImage: 'radial-gradient(circle at center, transparent 35%, rgba(148, 163, 184, 0.35) 100%)',
      opacity: 0.85
    }
  },
  // --- CÁC HOA VĂN NGẪU NHIÊN (RANDOM & ASYMMETRIC PATTERNS) ---
  {
    id: 'random-terrazzo',
    name: 'Đá mài Terrazzo ngẫu nhiên (Terrazzo Stone)',
    category: 'random',
    badge: 'Đá Terrazzo',
    style: {
      backgroundImage: `radial-gradient(circle at 18% 22%, #94a3b8 4px, transparent 5px),
        radial-gradient(ellipse 7px 4px at 68% 15%, #64748b 100%, transparent 100%),
        radial-gradient(circle at 83% 76%, #cbd5e1 6px, transparent 7px),
        radial-gradient(ellipse 5px 8px at 32% 64%, #94a3b8 100%, transparent 100%),
        radial-gradient(circle at 55% 82%, #475569 3.5px, transparent 4.5px),
        radial-gradient(ellipse 9px 5px at 8% 85%, #64748b 100%, transparent 100%),
        radial-gradient(circle at 88% 34%, #94a3b8 5px, transparent 6px),
        radial-gradient(ellipse 6px 3px at 45% 38%, #cbd5e1 100%, transparent 100%)`,
      backgroundSize: '130px 140px',
      opacity: 0.65
    }
  },
  {
    id: 'random-confetti',
    name: 'Pháo giấy tung bay (Scattered Confetti)',
    category: 'random',
    badge: 'Confetti',
    style: {
      backgroundImage: `linear-gradient(42deg, #64748b 8px, transparent 9px),
        linear-gradient(135deg, #94a3b8 6px, transparent 7px),
        radial-gradient(circle at 25% 75%, #475569 3px, transparent 4px),
        linear-gradient(215deg, #cbd5e1 7px, transparent 8px),
        radial-gradient(circle at 80% 20%, #94a3b8 4px, transparent 5px),
        linear-gradient(85deg, #64748b 5px, transparent 6px),
        radial-gradient(circle at 50% 50%, #64748b 2.5px, transparent 3.5px)`,
      backgroundSize: '120px 110px, 95px 125px, 80px 85px, 140px 130px, 110px 115px, 75px 90px, 105px 105px',
      backgroundPosition: '0 0, 30px 40px, 70px 15px, 15px 80px, 55px 60px, 90px 25px, 10px 45px',
      opacity: 0.6
    }
  },
  {
    id: 'random-memphis',
    name: 'Nghệ thuật ngẫu hứng (Memphis Abstract)',
    category: 'random',
    badge: 'Memphis',
    style: {
      backgroundImage: `radial-gradient(circle at 15% 25%, #64748b 6px, transparent 7px),
        linear-gradient(35deg, transparent 45%, #94a3b8 45%, #94a3b8 55%, transparent 55%),
        radial-gradient(circle at 75% 70%, transparent 10px, #64748b 11px, #64748b 13px, transparent 14px),
        radial-gradient(circle at 85% 20%, #cbd5e1 3px, transparent 4px),
        linear-gradient(-55deg, transparent 47%, #475569 47%, #475569 53%, transparent 53%),
        radial-gradient(circle at 35% 80%, #94a3b8 5px, transparent 6px)`,
      backgroundSize: '150px 150px, 110px 110px, 160px 160px, 90px 90px, 130px 130px, 140px 140px',
      backgroundPosition: '0 0, 45px 30px, 20px 60px, 80px 10px, 15px 90px, 70px 40px',
      opacity: 0.55
    }
  },
  {
    id: 'random-stardust',
    name: 'Bụi sao ngẫu nhiên (Star Dust Clusters)',
    category: 'random',
    badge: 'Bụi sao',
    style: {
      backgroundImage: `radial-gradient(1.5px 1.5px at 12% 18%, #64748b 100%, transparent),
        radial-gradient(2.5px 2.5px at 78% 28%, #475569 100%, transparent),
        radial-gradient(1px 1px at 45% 62%, #cbd5e1 100%, transparent),
        radial-gradient(3px 3px at 88% 82%, #64748b 100%, transparent),
        radial-gradient(1.5px 1.5px at 28% 85%, #94a3b8 100%, transparent),
        radial-gradient(2px 2px at 62% 42%, #475569 100%, transparent),
        radial-gradient(1px 1px at 92% 12%, #64748b 100%, transparent),
        radial-gradient(2px 2px at 5% 55%, #94a3b8 100%, transparent)`,
      backgroundSize: '160px 170px, 130px 140px, 90px 100px, 180px 190px, 110px 120px, 140px 150px, 80px 85px, 120px 130px',
      backgroundPosition: '0 0, 40px 50px, 20px 70px, 80px 20px, 60px 10px, 30px 90px, 10px 30px, 70px 60px',
      opacity: 0.7
    }
  },
  {
    id: 'random-blotches',
    name: 'Đốm nước hữu cơ (Organic Splash Drops)',
    category: 'random',
    badge: 'Giọt nước',
    style: {
      backgroundImage: `radial-gradient(circle at 22% 35%, rgba(100, 116, 139, 0.4) 0%, rgba(100, 116, 139, 0.3) 14px, transparent 18px),
        radial-gradient(ellipse 26px 14px at 78% 25%, rgba(148, 163, 184, 0.35) 0%, transparent 100%),
        radial-gradient(circle at 65% 78%, rgba(71, 85, 105, 0.35) 0%, rgba(71, 85, 105, 0.25) 10px, transparent 15px),
        radial-gradient(ellipse 16px 24px at 15% 82%, rgba(148, 163, 184, 0.3) 0%, transparent 100%),
        radial-gradient(circle at 45% 55%, rgba(100, 116, 139, 0.25) 0%, transparent 12px)`,
      backgroundSize: '170px 180px, 210px 190px, 150px 160px, 190px 220px, 130px 140px',
      backgroundPosition: '0 0, 50px 30px, 80px 70px, 20px 40px, 60px 90px',
      opacity: 0.65
    }
  },
  {
    id: 'random-bokeh',
    name: 'Hạt Bokeh mờ ảo (Cinematic Bokeh)',
    category: 'random',
    badge: 'Bokeh',
    style: {
      backgroundImage: `radial-gradient(circle at 20% 30%, rgba(148, 163, 184, 0.35) 0%, rgba(148, 163, 184, 0.08) 35px, transparent 40px),
        radial-gradient(circle at 75% 20%, rgba(203, 213, 225, 0.4) 0%, rgba(203, 213, 225, 0.1) 22px, transparent 28px),
        radial-gradient(circle at 82% 72%, rgba(100, 116, 139, 0.3) 0%, rgba(100, 116, 139, 0.05) 45px, transparent 52px),
        radial-gradient(circle at 35% 80%, rgba(148, 163, 184, 0.35) 0%, rgba(148, 163, 184, 0.08) 26px, transparent 32px),
        radial-gradient(circle at 50% 45%, rgba(203, 213, 225, 0.3) 0%, transparent 18px)`,
      backgroundSize: '240px 240px, 190px 190px, 280px 280px, 220px 220px, 160px 160px',
      backgroundPosition: '0 0, 70px 40px, 30px 80px, 110px 20px, 50px 100px',
      opacity: 0.75
    }
  },
  {
    id: 'random-splatter',
    name: 'Vết mực bọt nước (Ink & Foam Flecks)',
    category: 'random',
    badge: 'Bọt mực',
    style: {
      backgroundImage: `radial-gradient(circle at 10% 20%, #475569 2px, transparent 3px),
        radial-gradient(circle at 12% 23%, #475569 1.5px, transparent 2.5px),
        radial-gradient(circle at 15% 19%, #64748b 1px, transparent 2px),
        radial-gradient(circle at 70% 35%, #475569 2.5px, transparent 3.5px),
        radial-gradient(circle at 73% 38%, #64748b 1px, transparent 2px),
        radial-gradient(circle at 40% 75%, #334155 3px, transparent 4px),
        radial-gradient(circle at 43% 72%, #64748b 1px, transparent 2px),
        radial-gradient(circle at 45% 78%, #475569 1.5px, transparent 2.5px),
        radial-gradient(circle at 85% 85%, #64748b 2px, transparent 3px)`,
      backgroundSize: '150px 140px, 150px 140px, 150px 140px, 180px 170px, 180px 170px, 200px 190px, 200px 190px, 200px 190px, 130px 120px',
      backgroundPosition: '0 0, 5px 3px, -4px 6px, 40px 60px, 45px 58px, 90px 20px, 94px 22px, 86px 24px, 20px 80px',
      opacity: 0.65
    }
  },
  {
    id: 'random-polygons',
    name: 'Mảnh đa giác tán xạ (Low-Poly Shards)',
    category: 'random',
    badge: 'Mảnh vỡ',
    style: {
      backgroundImage: `linear-gradient(28deg, rgba(100, 116, 139, 0.3) 12px, transparent 13px),
        linear-gradient(118deg, rgba(148, 163, 184, 0.25) 15px, transparent 16px),
        linear-gradient(215deg, rgba(71, 85, 105, 0.25) 10px, transparent 11px),
        linear-gradient(305deg, rgba(148, 163, 184, 0.2) 18px, transparent 19px),
        linear-gradient(65deg, rgba(100, 116, 139, 0.25) 14px, transparent 15px)`,
      backgroundSize: '140px 160px, 180px 150px, 120px 130px, 200px 190px, 160px 170px',
      backgroundPosition: '0 0, 50px 40px, 30px 90px, 80px 20px, 15px 70px',
      opacity: 0.65
    }
  },
  // --- BỘ SƯU TẬP MỚI: HOA VĂN NGẪU NHIÊN BỔ SUNG ---
  {
    id: 'random-sakura',
    name: 'Hoa anh đào rơi (Falling Sakura)',
    category: 'random',
    badge: 'Sakura',
    style: {
      backgroundImage: `radial-gradient(ellipse 9px 5px at 15% 20%, rgba(100, 116, 139, 0.5) 100%, transparent),
        radial-gradient(ellipse 6px 8px at 40% 10%, rgba(148, 163, 184, 0.45) 100%, transparent),
        radial-gradient(ellipse 11px 6px at 72% 28%, rgba(100, 116, 139, 0.4) 100%, transparent),
        radial-gradient(ellipse 7px 4px at 88% 15%, rgba(71, 85, 105, 0.45) 100%, transparent),
        radial-gradient(ellipse 8px 5px at 25% 65%, rgba(148, 163, 184, 0.4) 100%, transparent),
        radial-gradient(ellipse 5px 9px at 60% 58%, rgba(100, 116, 139, 0.35) 100%, transparent),
        radial-gradient(ellipse 10px 5px at 82% 72%, rgba(148, 163, 184, 0.4) 100%, transparent),
        radial-gradient(ellipse 6px 7px at 10% 85%, rgba(71, 85, 105, 0.35) 100%, transparent),
        radial-gradient(circle at 50% 45%, rgba(100, 116, 139, 0.3) 2px, transparent 3px)`,
      backgroundSize: '200px 210px',
      opacity: 0.6
    }
  },
  {
    id: 'random-waterwave',
    name: 'Sóng nước nhấp nhô (Ripple Water)',
    category: 'random',
    badge: 'Sóng nước',
    style: {
      backgroundImage: `radial-gradient(ellipse 100% 50% at 50% 0%, rgba(100, 116, 139, 0.3) 0%, transparent 100%),
        radial-gradient(ellipse 80% 40% at 30% 50%, rgba(148, 163, 184, 0.2) 0%, transparent 100%),
        radial-gradient(ellipse 90% 45% at 70% 100%, rgba(71, 85, 105, 0.25) 0%, transparent 100%),
        linear-gradient(180deg, transparent 48%, rgba(100, 116, 139, 0.12) 50%, transparent 52%),
        linear-gradient(180deg, transparent 68%, rgba(148, 163, 184, 0.1) 70%, transparent 72%)`,
      backgroundSize: '250px 80px, 300px 100px, 280px 90px, 200px 60px, 200px 40px',
      backgroundPosition: '0 0, 30px 20px, 60px 40px, 0 30px, 0 50px',
      opacity: 0.7
    }
  },
  {
    id: 'random-brushstrokes',
    name: 'Nét cọ vẽ nghệ thuật (Brush Strokes)',
    category: 'random',
    badge: 'Nét cọ',
    style: {
      backgroundImage: `linear-gradient(12deg, transparent 40%, rgba(100, 116, 139, 0.3) 40%, rgba(100, 116, 139, 0.3) 55%, transparent 55%),
        linear-gradient(-8deg, transparent 30%, rgba(148, 163, 184, 0.25) 30%, rgba(148, 163, 184, 0.25) 42%, transparent 42%),
        linear-gradient(20deg, transparent 60%, rgba(71, 85, 105, 0.25) 60%, rgba(71, 85, 105, 0.25) 72%, transparent 72%),
        linear-gradient(-15deg, transparent 15%, rgba(100, 116, 139, 0.2) 15%, rgba(100, 116, 139, 0.2) 28%, transparent 28%)`,
      backgroundSize: '180px 120px, 220px 150px, 160px 130px, 200px 110px',
      backgroundPosition: '0 0, 60px 40px, 20px 80px, 100px 20px',
      opacity: 0.6
    }
  },
  {
    id: 'random-bubbles',
    name: 'Bong bóng nổi lên (Floating Bubbles)',
    category: 'random',
    badge: 'Bong bóng',
    style: {
      backgroundImage: `radial-gradient(circle at 20% 25%, transparent 10px, rgba(100, 116, 139, 0.35) 11px, rgba(100, 116, 139, 0.35) 13px, transparent 14px),
        radial-gradient(circle at 65% 18%, transparent 7px, rgba(148, 163, 184, 0.3) 8px, rgba(148, 163, 184, 0.3) 10px, transparent 11px),
        radial-gradient(circle at 85% 60%, transparent 14px, rgba(71, 85, 105, 0.3) 15px, rgba(71, 85, 105, 0.3) 17px, transparent 18px),
        radial-gradient(circle at 35% 72%, transparent 9px, rgba(100, 116, 139, 0.3) 10px, rgba(100, 116, 139, 0.3) 12px, transparent 13px),
        radial-gradient(circle at 50% 45%, transparent 5px, rgba(148, 163, 184, 0.25) 6px, rgba(148, 163, 184, 0.25) 8px, transparent 9px),
        radial-gradient(circle at 10% 80%, transparent 12px, rgba(100, 116, 139, 0.28) 13px, rgba(100, 116, 139, 0.28) 15px, transparent 16px)`,
      backgroundSize: '230px 240px',
      opacity: 0.7
    }
  },
  {
    id: 'random-snowflake',
    name: 'Bông tuyết lục giác (Snowflake Crystal)',
    category: 'random',
    badge: 'Bông tuyết',
    style: {
      backgroundImage: `linear-gradient(0deg, rgba(148, 163, 184, 0.4) 1.5px, transparent 1.5px),
        linear-gradient(60deg, rgba(148, 163, 184, 0.4) 1.5px, transparent 1.5px),
        linear-gradient(120deg, rgba(148, 163, 184, 0.4) 1.5px, transparent 1.5px),
        radial-gradient(circle at 50% 50%, rgba(100, 116, 139, 0.5) 2.5px, transparent 3px),
        radial-gradient(circle at 50% 0%, rgba(100, 116, 139, 0.4) 2px, transparent 2.5px),
        radial-gradient(circle at 50% 100%, rgba(100, 116, 139, 0.4) 2px, transparent 2.5px),
        radial-gradient(circle at 0% 50%, rgba(100, 116, 139, 0.4) 2px, transparent 2.5px),
        radial-gradient(circle at 100% 50%, rgba(100, 116, 139, 0.4) 2px, transparent 2.5px)`,
      backgroundSize: '60px 60px',
      backgroundPosition: '0 0, 0 0, 0 0, 30px 30px, 30px 0, 30px 60px, 0 30px, 60px 30px',
      opacity: 0.55
    }
  },
  {
    id: 'random-trianglemesh',
    name: 'Lưới tam giác kỹ thuật (Triangle Mesh)',
    category: 'random',
    badge: 'Tam giác',
    style: {
      backgroundImage: `linear-gradient(60deg, rgba(100, 116, 139, 0.3) 1px, transparent 1px),
        linear-gradient(120deg, rgba(100, 116, 139, 0.3) 1px, transparent 1px),
        linear-gradient(0deg, rgba(148, 163, 184, 0.2) 1px, transparent 1px)`,
      backgroundSize: '40px 69px, 40px 69px, 40px 69px',
      backgroundPosition: '0 0, 20px 0, 0 0',
      opacity: 0.65
    }
  },
  {
    id: 'random-marble',
    name: 'Vân đá cẩm thạch (Marble Veins)',
    category: 'random',
    badge: 'Đá cẩm thạch',
    style: {
      backgroundImage: `linear-gradient(135deg, transparent 20%, rgba(100, 116, 139, 0.2) 20%, rgba(100, 116, 139, 0.2) 22%, transparent 22%),
        linear-gradient(125deg, transparent 35%, rgba(148, 163, 184, 0.18) 35%, rgba(148, 163, 184, 0.18) 37%, transparent 37%),
        linear-gradient(140deg, transparent 55%, rgba(71, 85, 105, 0.15) 55%, rgba(71, 85, 105, 0.15) 58%, transparent 58%),
        linear-gradient(115deg, transparent 65%, rgba(100, 116, 139, 0.2) 65%, rgba(100, 116, 139, 0.2) 68%, transparent 68%),
        linear-gradient(145deg, transparent 75%, rgba(148, 163, 184, 0.15) 75%, rgba(148, 163, 184, 0.15) 78%, transparent 78%)`,
      backgroundSize: '300px 300px',
      opacity: 0.75
    }
  },
  {
    id: 'random-spiral',
    name: 'Xoáy ốc sên đồng tâm (Spiral Shell)',
    category: 'random',
    badge: 'Xoáy ốc',
    style: {
      backgroundImage: `radial-gradient(circle at 50% 50%, transparent 8px, rgba(100, 116, 139, 0.3) 9px, rgba(100, 116, 139, 0.3) 10px, transparent 11px),
        radial-gradient(circle at 50% 50%, transparent 18px, rgba(148, 163, 184, 0.25) 19px, rgba(148, 163, 184, 0.25) 20px, transparent 21px),
        radial-gradient(circle at 50% 50%, transparent 28px, rgba(100, 116, 139, 0.2) 29px, rgba(100, 116, 139, 0.2) 30px, transparent 31px),
        radial-gradient(circle at 50% 50%, transparent 38px, rgba(148, 163, 184, 0.18) 39px, rgba(148, 163, 184, 0.18) 40px, transparent 41px),
        radial-gradient(circle at 50% 50%, transparent 50px, rgba(100, 116, 139, 0.15) 51px, rgba(100, 116, 139, 0.15) 52px, transparent 53px)`,
      backgroundSize: '120px 120px',
      opacity: 0.6
    }
  },
  {
    id: 'random-chessboard',
    name: 'Bàn cờ trang trí (Decorative Checkerboard)',
    category: 'random',
    badge: 'Bàn cờ',
    style: {
      backgroundImage: `linear-gradient(45deg, rgba(100, 116, 139, 0.2) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(100, 116, 139, 0.2) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(100, 116, 139, 0.2) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(100, 116, 139, 0.2) 75%)`,
      backgroundSize: '48px 48px',
      backgroundPosition: '0 0, 0 24px, 24px -24px, -24px 0px',
      opacity: 0.7
    }
  },
  {
    id: 'random-fireworks',
    name: 'Pháo hoa bùng nổ (Firework Burst)',
    category: 'random',
    badge: 'Pháo hoa',
    style: {
      backgroundImage: `radial-gradient(circle at 25% 30%, rgba(100,116,139,0.4) 2px, transparent 3px),
        radial-gradient(circle at 28% 25%, rgba(100,116,139,0.3) 1.5px, transparent 2.5px),
        radial-gradient(circle at 22% 35%, rgba(100,116,139,0.3) 1.5px, transparent 2.5px),
        radial-gradient(circle at 31% 30%, rgba(100,116,139,0.25) 1px, transparent 2px),
        radial-gradient(circle at 20% 30%, rgba(100,116,139,0.25) 1px, transparent 2px),
        radial-gradient(circle at 25% 22%, rgba(100,116,139,0.25) 1px, transparent 2px),
        radial-gradient(circle at 25% 38%, rgba(100,116,139,0.25) 1px, transparent 2px),
        radial-gradient(circle at 70% 68%, rgba(148,163,184,0.4) 2px, transparent 3px),
        radial-gradient(circle at 73% 63%, rgba(148,163,184,0.3) 1.5px, transparent 2.5px),
        radial-gradient(circle at 67% 73%, rgba(148,163,184,0.3) 1.5px, transparent 2.5px),
        radial-gradient(circle at 76% 68%, rgba(148,163,184,0.25) 1px, transparent 2px),
        radial-gradient(circle at 64% 68%, rgba(148,163,184,0.25) 1px, transparent 2px),
        radial-gradient(circle at 70% 60%, rgba(148,163,184,0.25) 1px, transparent 2px),
        radial-gradient(circle at 70% 76%, rgba(148,163,184,0.25) 1px, transparent 2px)`,
      backgroundSize: '180px 180px',
      opacity: 0.7
    }
  },
  {
    id: 'random-sandstorm',
    name: 'Cát sa mạc cuộn xoáy (Desert Sandstorm)',
    category: 'random',
    badge: 'Cát xoáy',
    style: {
      backgroundImage: `linear-gradient(78deg, transparent 48%, rgba(100, 116, 139, 0.22) 49%, rgba(100, 116, 139, 0.22) 51%, transparent 52%),
        linear-gradient(72deg, transparent 38%, rgba(148, 163, 184, 0.18) 39%, rgba(148, 163, 184, 0.18) 41%, transparent 42%),
        linear-gradient(83deg, transparent 62%, rgba(71, 85, 105, 0.2) 63%, rgba(71, 85, 105, 0.2) 65%, transparent 66%),
        linear-gradient(67deg, transparent 25%, rgba(100, 116, 139, 0.18) 26%, rgba(100, 116, 139, 0.18) 28%, transparent 29%),
        linear-gradient(88deg, transparent 75%, rgba(148, 163, 184, 0.15) 76%, rgba(148, 163, 184, 0.15) 78%, transparent 79%)`,
      backgroundSize: '260px 70px, 200px 55px, 240px 65px, 180px 50px, 220px 60px',
      backgroundPosition: '0 0, 40px 20px, 80px 40px, 20px 55px, 60px 30px',
      opacity: 0.65
    }
  },
  {
    id: 'random-neon-grid',
    name: 'Lưới điện Neon phát sáng (Neon Cyber Grid)',
    category: 'random',
    badge: 'Neon Grid',
    style: {
      backgroundImage: `linear-gradient(rgba(100, 116, 139, 0.6) 1px, transparent 1px),
        linear-gradient(90deg, rgba(100, 116, 139, 0.6) 1px, transparent 1px),
        linear-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148, 163, 184, 0.2) 1px, transparent 1px),
        radial-gradient(circle at 0% 0%, rgba(100, 116, 139, 0.5) 3px, transparent 4px),
        radial-gradient(circle at 100% 0%, rgba(100, 116, 139, 0.5) 3px, transparent 4px),
        radial-gradient(circle at 0% 100%, rgba(100, 116, 139, 0.5) 3px, transparent 4px),
        radial-gradient(circle at 100% 100%, rgba(100, 116, 139, 0.5) 3px, transparent 4px)`,
      backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px, 80px 80px, 80px 80px, 80px 80px, 80px 80px',
      opacity: 0.55
    }
  },
  {
    id: 'random-linen',
    name: 'Vải lanh dệt thủ công (Woven Linen Textile)',
    category: 'random',
    badge: 'Vải dệt',
    style: {
      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(100, 116, 139, 0.15) 3px, rgba(100, 116, 139, 0.15) 4px),
        repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(100, 116, 139, 0.15) 3px, rgba(100, 116, 139, 0.15) 4px),
        repeating-linear-gradient(0deg, transparent, transparent 7px, rgba(148, 163, 184, 0.1) 7px, rgba(148, 163, 184, 0.1) 8px),
        repeating-linear-gradient(90deg, transparent, transparent 7px, rgba(148, 163, 184, 0.1) 7px, rgba(148, 163, 184, 0.1) 8px)`,
      opacity: 0.8
    }
  },
  {
    id: 'random-hatching',
    name: 'Nét vẽ chì gạch chéo (Pencil Cross-Hatching)',
    category: 'random',
    badge: 'Nét chì',
    style: {
      backgroundImage: `repeating-linear-gradient(35deg, rgba(100, 116, 139, 0.25) 0px, rgba(100, 116, 139, 0.25) 1px, transparent 1px, transparent 14px),
        repeating-linear-gradient(-35deg, rgba(100, 116, 139, 0.2) 0px, rgba(100, 116, 139, 0.2) 1px, transparent 1px, transparent 14px)`,
      opacity: 0.7
    }
  },
  {
    id: 'random-puzzle',
    name: 'Mảnh ghép puzzle nghệ thuật (Puzzle Tiles)',
    category: 'random',
    badge: 'Puzzle',
    style: {
      backgroundImage: `radial-gradient(circle at 0% 50%, transparent 8px, rgba(100,116,139,0.3) 9px, rgba(100,116,139,0.3) 10px, transparent 11px),
        radial-gradient(circle at 100% 50%, transparent 8px, rgba(100,116,139,0.3) 9px, rgba(100,116,139,0.3) 10px, transparent 11px),
        radial-gradient(circle at 50% 0%, transparent 8px, rgba(100,116,139,0.3) 9px, rgba(100,116,139,0.3) 10px, transparent 11px),
        radial-gradient(circle at 50% 100%, transparent 8px, rgba(100,116,139,0.3) 9px, rgba(100,116,139,0.3) 10px, transparent 11px),
        linear-gradient(rgba(100, 116, 139, 0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(100, 116, 139, 0.3) 1px, transparent 1px)`,
      backgroundSize: '60px 60px',
      opacity: 0.55
    }
  },
  {
    id: 'random-herringbone',
    name: 'Xương cá đan chéo (Herringbone Weave)',
    category: 'random',
    badge: 'Xương cá',
    style: {
      backgroundImage: `linear-gradient(45deg, rgba(100,116,139,0.3) 25%, transparent 25%, transparent 75%, rgba(100,116,139,0.3) 75%),
        linear-gradient(45deg, rgba(100,116,139,0.3) 25%, transparent 25%, transparent 75%, rgba(100,116,139,0.3) 75%)`,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 10px 10px',
      opacity: 0.55
    }
  },
  {
    id: 'random-galaxy',
    name: 'Dải ngân hà cuộn xoáy (Galaxy Swirl)',
    category: 'random',
    badge: 'Ngân hà',
    style: {
      backgroundImage: `radial-gradient(ellipse 60% 30% at 30% 40%, rgba(100,116,139,0.25) 0%, transparent 100%),
        radial-gradient(ellipse 40% 60% at 70% 60%, rgba(148,163,184,0.2) 0%, transparent 100%),
        radial-gradient(1px 1px at 15% 20%, rgba(100,116,139,0.6) 100%, transparent),
        radial-gradient(1.5px 1.5px at 55% 35%, rgba(148,163,184,0.7) 100%, transparent),
        radial-gradient(1px 1px at 80% 15%, rgba(71,85,105,0.5) 100%, transparent),
        radial-gradient(2px 2px at 35% 75%, rgba(100,116,139,0.6) 100%, transparent),
        radial-gradient(1px 1px at 90% 80%, rgba(148,163,184,0.5) 100%, transparent),
        radial-gradient(1.5px 1.5px at 20% 85%, rgba(71,85,105,0.4) 100%, transparent)`,
      backgroundSize: '350px 350px, 280px 280px, 200px 200px, 150px 150px, 180px 180px, 220px 220px, 160px 160px, 240px 240px',
      backgroundPosition: '0 0, 50px 30px, 0 0, 40px 60px, 80px 20px, 20px 80px, 60px 40px, 30px 10px',
      opacity: 0.7
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
