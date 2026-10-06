import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Play } from 'lucide-react';

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&auto=format&fit=crop&q=80'
];

export default function ShadowMatch() {
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
  const [is916Mode, setIs916Mode] = useState(false);

  const stageRef = useRef(null);

  // Keyboard Event: Spacebar to Reset
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        resetGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <div className="flex w-full h-[calc(100vh-56px)] bg-slate-900">
      {/* SIDEBAR SETTINGS WITH TAILWIND */}
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
          <select value={targetIndex} onChange={(e) => setTargetIndex(Number(e.target.value))} className="p-2.5 bg-slate-700 text-white rounded-lg border-none focus:ring-2 focus:ring-purple-400 outline-none">
            <option value={0}>Thẻ Ảnh Số 1 (Mặc định)</option>
            <option value={1}>Thẻ Ảnh Số 2</option>
            <option value={2}>Thẻ Ảnh Số 3</option>
          </select>
        </div>

        {/* Hand Size */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium">Kích Thước Bàn Tay 👆 ({handSize}px):</label>
          <input type="range" min="24" max="100" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} className="accent-purple-400" />
        </div>

        {/* Target Scale */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium">Tỉ Lệ Bóng Đen ({targetScale}%):</label>
          <input type="range" min="50" max="200" value={targetScale} onChange={(e) => setTargetScale(Number(e.target.value))} className="accent-purple-400" />
        </div>

        {/* Target OffsetY */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-400 font-medium">Vị Trí Bóng Đen Lên/Xuống ({targetOffsetY}px):</label>
          <input type="range" min="-300" max="300" value={targetOffsetY} onChange={(e) => setTargetOffsetY(Number(e.target.value))} className="accent-purple-400" />
        </div>

        {/* Reset Button */}
        <button 
          onClick={resetGame} 
          className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm cursor-pointer"
        >
          <RefreshCw size={16} /> Reset Vị Trí (Spacebar)
        </button>

        {/* 9:16 Run Button */}
        <button 
          onClick={() => setIs916Mode(!is916Mode)} 
          className={`mt-auto p-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
            is916Mode ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
          }`}
        >
          <Play size={18} /> {is916Mode ? 'Thoát Chế Độ 9:16' : 'Chạy Tìm Ảnh Theo Bóng (9:16)'}
        </button>

      </div>

      {/* STAGE DISPLAY AREA WITH TAILWIND */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 relative overflow-hidden">
        <div 
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onClick={handleStageClick}
          className={`relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl cursor-none border-2 border-slate-700 transition-all ${
            is916Mode ? 'w-[450px] h-[800px]' : 'w-[650px] h-[650px]'
          }`}
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

          {/* CENTER STAGE: TARGET SILHOUETTE #000000 */}
          <div 
            className="absolute top-[55%] left-1/2 flex items-center justify-center w-64 h-64 -translate-x-1/2 -translate-y-1/2"
            style={{ 
              transform: `translate(-50%, -50%) scale(${targetScale / 100}) translateY(${targetOffsetY}px)`
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
                top: `${cursorPos.y}px`, 
                transform: `translate(-50%, -50%) scale(${targetScale / 100})`
              }}
            >
              <img src={pickedItem.src} alt="Following" className="w-full h-full object-contain" />
            </div>
          )}

          {/* HAND CURSOR 👆 */}
          <div 
            className="absolute pointer-events-none select-none drop-shadow-2xl z-30"
            style={{ 
              left: `${cursorPos.x}px`, 
              top: `${cursorPos.y}px`, 
              fontSize: `${handSize}px`, 
              transform: 'translate(-30%, -20%)'
            }}
          >
            👆
          </div>
        </div>
      </div>
    </div>
  );
}
