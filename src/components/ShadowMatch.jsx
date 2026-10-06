import React, { useState, useEffect, useRef } from 'react';
import { Upload, RefreshCw, Play, Move, Maximize2 } from 'lucide-react';

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
    <div style={{ display: 'flex', width: '100%', height: '100vh', background: '#0f172a' }}>
      {/* SIDEBAR SETTINGS */}
      <div style={{ width: '320px', background: '#1e293b', padding: '20px', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👻 CÀI ĐẶT GHÉP BÓNG
        </h2>

        {/* Upload 3 Images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Tải Lên 3 Hình Ảnh PNG:</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {images.map((src, i) => (
              <label key={i} style={{ flex: 1, height: '60px', background: '#334155', borderRadius: '8px', cursor: 'pointer', overflow: 'hidden', border: i === targetIndex ? '2px solid #a855f7' : '1px solid #475569', position: 'relative' }}>
                <img src={src} alt={`Upload ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, i)} style={{ display: 'none' }} />
              </label>
            ))}
          </div>
        </div>

        {/* Select Target Silhouette */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Chọn Ảnh Làm Bóng Đen Mục Tiêu:</label>
          <select value={targetIndex} onChange={(e) => setTargetIndex(Number(e.target.value))} style={{ padding: '10px', background: '#334155', color: 'white', borderRadius: '8px', border: 'none' }}>
            <option value={0}>Thẻ Ảnh Số 1 (Mặc định)</option>
            <option value={1}>Thẻ Ảnh Số 2</option>
            <option value={2}>Thẻ Ảnh Số 3</option>
          </select>
        </div>

        {/* Hand Size */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Kích Thước Bàn Tay 👆 ({handSize}px):</label>
          <input type="range" min="24" max="100" value={handSize} onChange={(e) => setHandSize(Number(e.target.value))} style={{ accentColor: '#a855f7' }} />
        </div>

        {/* Target Scale */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Tỉ Lệ Bóng Đen ({targetScale}%):</label>
          <input type="range" min="50" max="200" value={targetScale} onChange={(e) => setTargetScale(Number(e.target.value))} style={{ accentColor: '#a855f7' }} />
        </div>

        {/* Target OffsetY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Vị Trí Bóng Đen Lên/Xuống ({targetOffsetY}px):</label>
          <input type="range" min="-300" max="300" value={targetOffsetY} onChange={(e) => setTargetOffsetY(Number(e.target.value))} style={{ accentColor: '#a855f7' }} />
        </div>

        {/* Reset Button */}
        <button 
          onClick={resetGame} 
          style={{ padding: '10px', background: '#475569', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} /> Reset Vị Trí (Spacebar)
        </button>

        {/* 9:16 Run Button */}
        <button 
          onClick={() => setIs916Mode(!is916Mode)} 
          style={{ marginTop: 'auto', padding: '12px', background: is916Mode ? '#ef4444' : '#9333ea', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Play size={18} /> {is916Mode ? 'Thoát Chế Độ 9:16' : 'Chạy Tìm Ảnh Theo Bóng (9:16)'}
        </button>
      </div>

      {/* STAGE DISPLAY AREA */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', position: 'relative', overflow: 'hidden' }}>
        <div 
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onClick={handleStageClick}
          style={{ 
            width: is916Mode ? '450px' : '650px', 
            height: is916Mode ? '800px' : '650px', 
            position: 'relative', 
            background: '#0f172a',
            borderRadius: '16px', 
            overflow: 'hidden', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            cursor: 'none',
            border: '2px solid #334155'
          }}
        >
          {/* TOP ROW: 3 SMALL CARDS */}
          <div style={{ position: 'absolute', top: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '20px', zIndex: 10 }}>
            {images.map((src, i) => (
              <div 
                key={i} 
                onClick={(e) => { e.stopPropagation(); handlePickItem(i, src); }}
                style={{ 
                  width: '90px', 
                  height: '90px', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  border: '3px solid #38bdf8', 
                  cursor: 'pointer', 
                  transform: 'scale(1)', 
                  transition: 'transform 0.2s',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                }}
              >
                <img src={src} alt={`Card ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>

          {/* CENTER STAGE: TARGET SILHOUETTE #000000 */}
          <div 
            style={{ 
              position: 'absolute', 
              top: '55%', 
              left: '50%', 
              transform: `translate(-50%, -50%) scale(${targetScale / 100}) translateY(${targetOffsetY}px)`,
              width: '260px', 
              height: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyInContent: 'center'
            }}
          >
            <img 
              src={images[targetIndex]} 
              alt="Target Silhouette" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                filter: 'brightness(0) contrast(100%)' // Chuyển thành Bóng Đen đặc màu #000000
              }} 
            />
          </div>

          {/* PLACED CARDS ON STAGE */}
          {placedItems.map((item, idx) => (
            <div 
              key={item.id}
              onClick={(e) => { e.stopPropagation(); setSelectedPlacedIndex(idx); }}
              style={{ 
                position: 'absolute', 
                left: `${item.x}px`, 
                top: `${item.y}px`, 
                width: `${item.width}px`, 
                height: `${item.height}px`,
                border: selectedPlacedIndex === idx ? '2px dashed #38bdf8' : 'none',
                borderRadius: '12px'
              }}
            >
              <img src={item.src} alt="Placed" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              
              {/* 4 Corner Resize Handles */}
              {selectedPlacedIndex === idx && (
                <>
                  <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '14px', height: '14px', background: '#38bdf8', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '14px', height: '14px', background: '#38bdf8', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '14px', height: '14px', background: '#38bdf8', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '14px', height: '14px', background: '#38bdf8', borderRadius: '50%' }} />
                </>
              )}
            </div>
          ))}

          {/* PICKED FOLLOWING ITEM */}
          {pickedItem && (
            <div 
              style={{ 
                position: 'absolute', 
                left: `${cursorPos.x}px`, 
                top: `${cursorPos.y}px`, 
                width: `${260 * (targetScale / 100)}px`, 
                height: `${260 * (targetScale / 100)}px`, 
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
                opacity: 0.9,
                zIndex: 20
              }}
            >
              <img src={pickedItem.src} alt="Following" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          )}

          {/* HAND CURSOR 👆 */}
          <div 
            style={{ 
              position: 'absolute', 
              left: `${cursorPos.x}px`, 
              top: `${cursorPos.y}px`, 
              fontSize: `${handSize}px`, 
              pointerEvents: 'none',
              transform: 'translate(-30%, -20%)',
              userSelect: 'none',
              zIndex: 30,
              filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.5))'
            }}
          >
            👆
          </div>
        </div>
      </div>
    </div>
  );
}
