// Danh sách các khung PNG có sẵn được tổ chức theo 2 mục: Kính Lúp và Khung Ngang
const rawFrames = import.meta.glob('../assets/khung/**/*.png', { eager: true, import: 'default' });

// Sắp xếp tự nhiên theo số (1, 2, 3... 10, 11)
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

const kinhLupPaths = Object.keys(rawFrames)
  .filter((p) => p.includes('/kinh-lup/'))
  .sort(naturalSort);

const khungNgangPaths = Object.keys(rawFrames)
  .filter((p) => p.includes('/khung-ngang/'))
  .sort(naturalSort);

export const KINH_LUP_FRAMES = kinhLupPaths.map((p, idx) => ({
  id: `kinh-lup-${idx + 1}`,
  name: `Kính Lúp ${idx + 1}`,
  src: rawFrames[p],
  category: 'kinh-lup',
  defaultShape: 'circle'
}));

export const KHUNG_NGANG_FRAMES = khungNgangPaths.map((p, idx) => ({
  id: `khung-ngang-${idx + 1}`,
  name: `Khung Ngang ${idx + 1}`,
  src: rawFrames[p],
  category: 'khung-ngang',
  defaultShape: 'custom' // Khung chữ nhật/ngang
}));

export const BEAM_FRAME_CATEGORIES = [
  { id: 'kinh-lup', name: '🔍 Kính Lúp', count: KINH_LUP_FRAMES.length, frames: KINH_LUP_FRAMES },
  { id: 'khung-ngang', name: '🖼️ Khung Ngang', count: KHUNG_NGANG_FRAMES.length, frames: KHUNG_NGANG_FRAMES }
];

