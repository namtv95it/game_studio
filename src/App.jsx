import React, { useState, useEffect } from 'react';
import FlashlightReveal from './components/FlashlightReveal';
import ShadowMatch from './components/ShadowMatch';
import LuckyWheel from './components/LuckyWheel';
import ImageBlend from './components/ImageBlend';
import RedemptionEffect from './components/RedemptionEffect';
import FeatureModal, { GAME_FEATURES } from './components/FeatureModal';
import { LayoutGrid } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('game_studio_active_tab') || 'flashlight';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [is916Mode, setIs916Mode] = useState(false);

  useEffect(() => {
    localStorage.setItem('game_studio_active_tab', activeTab);
  }, [activeTab]);

  const currentFeature = GAME_FEATURES.find(f => f.id === activeTab);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-900 overflow-hidden relative">
      {/* HEADER NAVIGATION (Ẩn hoàn toàn khi ở chế độ Khởi chạy 9:16) */}
      {!is916Mode && (
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-40">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              🎮 GAME STUDIO
            </span>

            {currentFeature && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-sky-400 border border-slate-700 rounded-full">
                {currentFeature.title}
              </span>
            )}
          </div>

          {/* CHỈ HIỂN THỊ NÚT KHO TÍNH NĂNG */}
          <div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <LayoutGrid size={16} /> Kho Tính Năng
            </button>
          </div>
        </header>
      )}

      {/* DYNAMIC SCREEN CONTENT */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'flashlight' && (
          <FlashlightReveal is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'shadow' && (
          <ShadowMatch is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'luckywheel' && (
          <LuckyWheel is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'imageblend' && (
          <ImageBlend is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'redemption' && (
          <RedemptionEffect is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
      </main>

      {/* POPUP MODAL KHO TÍNH NĂNG */}
      <FeatureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelectFeature={(id) => setActiveTab(id)} 
      />
    </div>
  );
}
