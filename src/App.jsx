import React, { useState, useEffect } from 'react';
import FlashlightReveal from './components/FlashlightReveal';
import MultiFlashlightReveal from './components/MultiFlashlightReveal';
import ShadowMatch from './components/ShadowMatch';
import MultiShadowMatch from './components/MultiShadowMatch';
import LuckyWheel from './components/LuckyWheel';
import ImageBlend from './components/ImageBlend';
import RedemptionEffect from './components/RedemptionEffect';
import BombRevealStudio from './components/BombRevealStudio';
import FoldedPaperReveal from './components/FoldedPaperReveal';
import FireBurnReveal from './components/FireBurnReveal';
import ShadowClueQuiz from './components/ShadowClueQuiz';
import FeatureModal, { GAME_FEATURES } from './components/FeatureModal';
import BackgroundSelectorModal from './components/BackgroundSelectorModal';
import { StageBackgroundProvider } from './context/StageBackgroundContext';
import { LayoutGrid, Palette, Play } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('game_studio_active_tab') || 'flashlight';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [is916Mode, setIs916Mode] = useState(false);

  useEffect(() => {
    localStorage.setItem('game_studio_active_tab', activeTab);
  }, [activeTab]);

  const currentFeature = GAME_FEATURES.find(f => f.id === activeTab);

  return (
    <StageBackgroundProvider>
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

            {/* CÁC NÚT ĐIỀU HƯỚNG HEADER */}
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setIsBgModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-500 font-semibold text-xs rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer"
                title="Thay đổi mẫu hoa văn nền sân khấu"
              >
                <Palette size={16} className="text-amber-400" /> Đổi Nền Sân Khấu
              </button>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-500 font-semibold text-xs rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <LayoutGrid size={16} /> Kho Tính Năng
              </button>

              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('app:launch-916'));
                  setIs916Mode(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-98 cursor-pointer ring-1 ring-emerald-400/40"
                title="Khởi chạy chế độ quay video (Nhấn ESC để thoát)"
              >
                <Play size={16} className="fill-white" /> Khởi Chạy
              </button>
            </div>
          </header>
        )}

      {/* DYNAMIC SCREEN CONTENT */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'flashlight' && (
          <FlashlightReveal is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'multi_flashlight' && (
          <MultiFlashlightReveal is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'shadow' && (
          <ShadowMatch is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'multi_shadow' && (
          <MultiShadowMatch is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
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
        {activeTab === 'bomb_reveal' && (
          <BombRevealStudio is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'folded_paper' && (
          <FoldedPaperReveal is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'fire_burn' && (
          <FireBurnReveal is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
        {activeTab === 'shadow_quiz' && (
          <ShadowClueQuiz is916Mode={is916Mode} setIs916Mode={setIs916Mode} />
        )}
      </main>

      {/* POPUP MODAL KHO TÍNH NĂNG */}
      <FeatureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelectFeature={(id) => setActiveTab(id)} 
      />

      {/* POPUP MODAL CHỌN MẪU NỀN SÂN KHẤU */}
      <BackgroundSelectorModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
      />
    </div>
  </StageBackgroundProvider>
  );
}
