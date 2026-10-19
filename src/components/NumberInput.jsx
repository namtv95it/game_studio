import React, { useState, useEffect } from 'react';

/**
 * NumberInput: Ô nhập số thân thiện với trải nghiệm người dùng
 * - Khi bôi đen hoặc xóa hết (BackSpace): Cho phép ô trống tạm thời, không bị ép về min/default ngay lập tức làm khó chịu khi gõ số mới.
 * - Khi gõ số: Cập nhật state cha ngay nếu hợp lệ.
 * - Khi blur (rời chuột) hoặc nhấn Enter: Chuẩn hóa giá trị nằm trong khoảng [min, max] và gọi onChange chuẩn.
 */
export default function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = '',
  placeholder = '',
  disabled = false,
  autoSelectOnFocus = true
}) {
  const [localText, setLocalText] = useState(value !== undefined && value !== null ? String(value) : '');

  // Đồng bộ từ props value khi bên ngoài thay đổi (ví dụ kéo slider hoặc bấm preset)
  useEffect(() => {
    setLocalText(value !== undefined && value !== null ? String(value) : '');
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setLocalText(raw);

    // Nếu là ô trống hoặc chỉ có dấu '-' thì cho phép tạm thời không ép số
    if (raw === '' || raw === '-') {
      return;
    }

    const num = Number(raw);
    if (!isNaN(num)) {
      if (onChange) {
        onChange(num);
      }
    }
  };

  const handleBlur = () => {
    if (localText === '' || localText === '-' || isNaN(Number(localText))) {
      const fallback = min !== undefined ? min : (value !== undefined ? value : 0);
      setLocalText(String(fallback));
      if (onChange) onChange(fallback);
      return;
    }

    let num = Number(localText);
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;

    setLocalText(String(num));
    if (onChange && num !== value) {
      onChange(num);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleFocus = (e) => {
    if (autoSelectOnFocus) {
      e.target.select();
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localText}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
}
