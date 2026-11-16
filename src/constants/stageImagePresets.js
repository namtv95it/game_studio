/**
 * Preset Background Images for Game Studio Stage
 * Tự động nạp tất cả ảnh nền mẫu từ thư mục src/assets/background/
 */

const rawBgs = import.meta.glob('../assets/background/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' });

// Sắp xếp tự nhiên theo số thứ tự (bg (1), bg (2) ... bg (10))
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

const bgPaths = Object.keys(rawBgs).sort(naturalSort);

export const STAGE_BG_IMAGE_PRESETS = bgPaths.map((p, idx) => {
  const fileNameMatch = p.match(/([^/]+)\.(png|jpg|jpeg|webp)$/i);
  const fullName = fileNameMatch ? fileNameMatch[1] : `Ảnh Nền ${idx + 1}`;
  
  // Chuẩn hóa tên hiển thị: ví dụ 'bg (1)' -> 'Ảnh Nền 1'
  const numberMatch = fullName.match(/\((\d+)\)/);
  const displayName = numberMatch ? `Ảnh Nền ${numberMatch[1]}` : fullName;

  return {
    id: `bg-preset-${idx + 1}`,
    name: displayName,
    category: 'studio',
    desc: `Ảnh nền mẫu ${displayName}`,
    url: rawBgs[p]
  };
});
