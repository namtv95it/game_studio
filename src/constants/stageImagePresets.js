/**
 * Preset Background Images for Game Studio Stage
 * Tự động nạp tất cả ảnh nền mẫu từ thư mục src/assets/background/
 */

// Danh mục phân loại ảnh nền sân khấu
export const STAGE_BG_CATEGORIES = [
  { id: 'all', name: 'Tất Cả', icon: '🌟' },
  { id: 'main', name: 'Bộ Nền Chính', icon: '🎨' },
  { id: 'series-1', name: 'Bộ Sưu Tập 1', icon: '🏙️' },
  { id: 'series-2', name: 'Bộ Sưu Tập 2', icon: '🏞️' },
  { id: 'series-3', name: 'Bộ Sưu Tập 3', icon: '🎪' },
];

const rawBgs = import.meta.glob('../assets/background/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });
const rawThumbs = import.meta.glob('../assets/background/thumbs/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });

// Sắp xếp tự nhiên theo số thứ tự (bg (1), bg (2) ... bg (10))
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

const bgPaths = Object.keys(rawBgs).sort(naturalSort);

export const STAGE_BG_IMAGE_PRESETS = bgPaths.map((p, idx) => {
  const fileNameMatch = p.match(/([^/]+)\.(png|jpg|jpeg|webp)$/i);
  const fullName = fileNameMatch ? fileNameMatch[1] : `Ảnh Nền ${idx + 1}`;
  const fileBaseWithExt = fileNameMatch ? `${fileNameMatch[1]}.${fileNameMatch[2]}` : '';

  // Xác định phân loại dựa trên tiền tố file
  let category = 'main';
  let catPrefix = 'Chính';
  if (fullName.startsWith('000-bg')) {
    category = 'series-1';
    catPrefix = 'Bộ 1';
  } else if (fullName.startsWith('0001-bg')) {
    category = 'series-2';
    catPrefix = 'Bộ 2';
  } else if (fullName.startsWith('001bg')) {
    category = 'series-3';
    catPrefix = 'Bộ 3';
  }

  // Chuẩn hóa tên hiển thị: ví dụ 'bg (1)' -> 'Nền 1', '000-bg (5)' -> 'Bộ 1 - Số 5'
  const numberMatch = fullName.match(/\((\d+)\)/);
  const num = numberMatch ? numberMatch[1] : `${idx + 1}`;
  const displayName = category === 'main' ? `Nền ${num}` : `${catPrefix} #${num}`;

  // Tìm URL thumbnail tương ứng (chỉ ~15-20 KB), fallback về ảnh gốc nếu không có
  const thumbKey = Object.keys(rawThumbs).find(k => k.endsWith('/' + fileBaseWithExt));
  const thumbUrl = thumbKey ? rawThumbs[thumbKey] : rawBgs[p];

  return {
    id: `bg-preset-${idx + 1}`,
    name: displayName,
    category,
    desc: `Ảnh nền mẫu ${displayName}`,
    url: rawBgs[p],
    thumbUrl
  };
});
