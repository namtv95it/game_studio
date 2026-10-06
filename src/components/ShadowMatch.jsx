import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Play } from 'lucide-react';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80'
];

export default function ShadowMatch({ is916Mode: propIs916Mode, setIs916Mode: propSetIs916Mode }) {
  const [images, setImages] = useState(DEFAULT_IMAGES);
  const [targetIndex, setTargetIndex] = useState(0);
  const [handSize, setHandSize] = useState(48);
  const [targetScale, setTargetScale] = useState(100);
  const [targetOffsetY, setTargetOffsetY] = useState(0);

  // States for Interactivity
  const [pickedItem, setPickedItem] = useState(null); // { index, src }
  const [placedItems, setPlacedItems] = useState([]); // [{ index, src, x, y, width, height }]
  const [selectedPlacedIndex, setSelectedPlacedIndex] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [internalIs916Mode, setInternalIs916Mode] = useState(false);

  const is916Mode = propIs916Mode !== undefined ? propIs916Mode : internalIs916Mode;
  const setIs916Mode = propSetIs916Mode || setInternalIs916Mode;

  const stageRef = useRef(null);

  // Keyboard Event: Spacebar to Reset & ESC to exit 9:16 mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        resetGame();
      }
      if (e.key === 'Escape' || e.code === 'Escape') {
        setIs916Mode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIs916Mode]);

  // Track Cursor Position
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  // Step 1: Click Pick Top Image
  const handlePickItem = (index, src) => {
    setPickedItem({ index, src });
    setSelectedPlacedIndex(null);
  };

  // Step 2 & 3: Click Place Image on Stage
  const handleStageClick = (e) => {
    if (pickedItem) {
      const rect = stageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newItem = {
        id: Date.now(),
        index: pickedItem.index,
        src: pickedItem.src,
        x: x - 120,
        y: y - 120,
        width: 240,
        height: 240
      };

      setPlacedItems([...placedItems, newItem]);
      setSelectedPlacedIndex(placedItems.length);
      setPickedItem(null);
    } else {
      setSelectedPlacedIndex(null);
    }
  };

  // Reset Game
  const resetGame = () => {
    setPlacedItems([]);
    setPickedItem(null);
    setSelectedPlacedIndex(null);
  };

  // Handle Image Upload
  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const updated = [...images];
      updated[index] = url;
      setImages(updated);
    }
  };

  return (
    <div className={`flex w-full bg-slate-900 relative ${is916Mode ? 'h-full' : 'h-[calc(100vh-56px)]'}`}>
      {/* TRẠNG THÁI 2: GIỮ NGUYÊN SIDEBAR (Nút Khởi Chạy dùng để bật Trạng Thái 1: Ẩn Hết) */}
      {!is916Mode && (
        <div className="w-80 bg-slate-800 p-5 border-r border-slate-700 flex flex-col gap-5 overflow-y-auto">
          <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2">
            👻 CÀI ĐẶT GHÉP BÓNG
          </h2>

          {/* Upload 3 Images */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs text-slate-400 font-medium">Tải Lên 3 Hình Ảnh PNG:</label>
            <div className="flex gap-2">
              {images.map((src, i) => (
                <label 
                  key={i} 
                  className={`flex-1 h-15 bg-slate-700 rounded-lg cursor-pointer overflow-hidden relative border transition-all ${
                    i === targetIndex ? 'border-purple-400 ring-2 ring-purple-400/50' : 'border-slate-600 hover:border-slate-400'
                  }`}
                >
                  <img src={src} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, i)} className="hidden" />
                </label>
              ))}
            </div>
          </div>

          {/* Select Target Silhouette */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Chọn Ảnh Làm Bóng Đen Mục Tiêu:</label>
            <select value={targetIndex} onChange={(e) => setTargetIndex(Number(e.target.value))} className="p-2.5 bg-slate-700 text-white rounded-lg border-none focus:ring-2 focus:ring-purple-400 outline-none cursor-pointer">
              <option value="0">Thẻ Ảnh Số 1 (Mặc định)</option>
              <option value="1">Thẻ Ảnh Số 2</option>
              <option value="2">Thẻ Ảnh Số 3</option>
            </select>
          </div>

          {/* Hand Size */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Kích Thước Bàn Tay 👆 ({handSize}px):</label>
            <input type="range" min="24" max="100" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Target Scale */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Tỉ Lệ Bóng Đen ({targetScale}%):</label>
            <input type="range" min="50" max="200" value={targetScale} onChange={(e) => setTargetScale(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Target OffsetY */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-slate-400 font-medium">Vị Trí Bóng Đen Lên/Xuống ({targetOffsetY}px):</label>
            <input type="range" min="-300" max="300" value={targetOffsetY} onChange={(e) => setTargetOffsetY(Number(e.target.value))} className="accent-purple-400 cursor-pointer" />
          </div>

          {/* Reset Button */}
          <button 
            onClick={resetGame} 
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm cursor-pointer"
          >
            <RefreshCw size={16} /> Reset Vị Trí (Spacebar)
          </button>

          {/* Nút Chuyển Sang Trạng Thái 1: Ẩn Hết Để Quay Video */}
          <button 
            onClick={() => setIs916Mode(true)} 
            className="mt-auto p-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Play size={18} /> Ẩn Giao Diện Quay Video (ESC Quay Lại)
          </button>
        </div>
      )}

      {/* KHUNG HIỂN THỊ KHU VỰC SÂN KHẤU (LUÔN LUÔN HIỂN THỊ GIỐNG KHI ĐANG CHẠY) */}
      <div className={`flex-1 flex items-center justify-center relative overflow-hidden transition-all ${
        is916Mode ? 'fixed inset-0 z-50 bg-white' : 'bg-slate-950 p-4'
      }`}>
        <div 
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onClick={handleStageClick}
          className={`relative overflow-hidden cursor-none transition-all duration-300 ${
            is916Mode 
              ? 'w-full h-full bg-white flex items-center justify-center' 
              : 'w-full h-full max-w-[1200px] max-h-[700px] bg-white rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-center'
          }`}
        >
          {/* Nền Grid Kẻ Ô Mờ Chuẩn Nhất Xuất Hiện Ở Cả 2 Trạng Thái */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* SÂN KHẤU XOAY NẰM NGANG 90 ĐỘ GIỐNG HỆT KHI ĐANG CHẠY */}
          <div 
            className="relative w-[600px] h-[600px] flex items-center justify-center"
            style={{
              transform: `rotate(-90deg) scale(${(targetScale / 100) * (is916Mode ? 1.2 : 0.95)})`,
              transformOrigin: 'center center'
            }}
          >
            {/* TOP ROW: 3 SMALL CARDS */}
            <div className="absolute top-5 left-0 right-0 flex justify-center gap-5 z-10">
              {images.map((src, i) => (
                <div 
                  key={i} 
                  onClick={(e) => { e.stopPropagation(); handlePickItem(i, src); }}
                  className="w-22 h-22 rounded-xl overflow-hidden border-3 border-sky-400 cursor-pointer shadow-xl hover:scale-105 transition-transform"
                >
                  <img src={src} alt={`Card ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* CENTER STAGE: TARGET SILHOUETTE #000000 NẰM NGANG */}
            <div 
              className="absolute top-[55%] left-1/2 flex items-center justify-center w-80 h-80 -translate-x-1/2 -translate-y-1/2"
              style={{ 
                transform: `translate(-50%, -50%) translateY(${targetOffsetY}px)`
              }}
            >
              <img 
                src={images[targetIndex]} 
                alt="Target Silhouette" 
                className="w-full h-full object-contain brightness-0 contrast-100"
              />
            </div>

            {/* PLACED CARDS ON STAGE */}
            {placedItems.map((item, idx) => (
              <div 
                key={item.id}
                onClick={(e) => { e.stopPropagation(); setSelectedPlacedIndex(idx); }}
                className={`absolute rounded-xl ${selectedPlacedIndex === idx ? 'border-2 border-dashed border-sky-400' : ''}`}
                style={{ 
                  left: `${item.x}px`, 
                  top: `${item.y}px`, 
                  width: `${item.width}px`, 
                  height: `${item.height}px`
                }}
              >
                <img src={item.src} alt="Placed" className="w-full h-full object-contain" />
                
                {/* 4 Corner Resize Handles */}
                {selectedPlacedIndex === idx && (
                  <>
                    <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-sky-400 rounded-full" />
                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-sky-400 rounded-full" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-sky-400 rounded-full" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-sky-400 rounded-full" />
                  </>
                )}
              </div>
            ))}

            {/* PICKED FOLLOWING ITEM */}
            {pickedItem && (
              <div 
                className="absolute w-64 h-64 pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-90 z-20"
                style={{ 
                  left: `${cursorPos.x}px`, 
                  top: `${cursorPos.y}px`
                }}
              >
                <img src={pickedItem.src} alt="Following" className="w-full h-full object-contain" />
              </div>
            )}
          </div>

          {/* HAND CURSOR 👆 */}
          <div 
            className="absolute pointer-events-none select-none z-30"
            style={{ 
              left: `${cursorPos.x}px`, 
              top: `${cursorPos.y}px`, 
              fontSize: `${handSize}px`, 
              transform: 'translate(-50%, -50%) rotate(-90deg)'
            }}
          >
            👆
          </div>
        </div>
      </div>
    </div>
  );
}
