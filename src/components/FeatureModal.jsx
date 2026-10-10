import React from 'react';
import { Flashlight, Ghost, Disc, Wand2, X, ArrowRight } from 'lucide-react';

export const GAME_FEATURES = [
  {
    id: 'flashlight',
    title: 'Soi Đèn Pin',
    subtitle: 'Flashlight Reveal',
    description: 'Trải nghiệm bí ẩn, soi quầng sáng đèn pin để bộc lộ ảnh đầy màu sắc bên dưới.',
    icon: Flashlight,
    color: 'from-sky-500 to-blue-600',
    badge: 'Chức năng 1',
    active: true
  },
  {
    id: 'shadow',
    title: 'Ghép Bóng',
    subtitle: 'Shadow Match',
    description: 'Thử thách tìm và kéo ghép hình ảnh chính xác vào bóng đen silhouette nhân vật.',
    icon: Ghost,
    color: 'from-purple-500 to-indigo-600',
    badge: 'Chức năng 2',
    active: true
  },
  {
    id: 'luckywheel',
    title: 'Vòng Quay Cửa Bí Mật',
    subtitle: 'Lucky Wheel Doors',
    description: 'Thiết lập kịch bản 3 lượt quay vòng 3 cửa màu sắc nhận Quái vật, Hố đen hoặc Quà tặng.',
    icon: Disc,
    color: 'from-amber-500 to-orange-600',
    badge: 'Chức năng 3',
    active: true
  },
  {
    id: 'imageblend',
    title: 'Trộn Ảnh Blend & Blend+',
    subtitle: 'Vortex Pixel Fusion',
    description: 'Tính năng dung hợp biến đổi ảnh nhân vật + emoji thành dạng mới với hiệu ứng xoáy Pixel Vortex.',
    icon: Wand2,
    color: 'from-pink-500 to-purple-600',
    badge: 'Chức năng 4',
    active: true
  },
  {
    id: 'redemption',
    title: 'Ánh Sáng Cứu Rỗi',
    subtitle: 'The Redemption Effect',
    description: 'Chúa Jesus soi sáng và cảm hóa nhân vật Demon, chuyển đổi từ bóng tối sang ánh sáng qua 3 giai đoạn.',
    icon: Wand2,
    color: 'from-yellow-400 to-amber-600',
    badge: 'Chức năng 5 · MỚI',
    active: true
  }
];

export default function FeatureModal({ isOpen, onClose, onSelectFeature }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>


        {/* MODAL HEADER */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            🎮 KHO TÍNH NĂNG GAME STUDIO
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Chọn một chức năng minigame bên dưới để chuyển đổi ngay lập tức.
          </p>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GAME_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.id}
                onClick={() => {
                  if (feature.active) {
                    onSelectFeature(feature.id);
                    onClose();
                  }
                }}
                className={`group relative bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 transition-all duration-300 flex flex-col ${
                  feature.active 
                    ? 'hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {/* Badge Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-md`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    feature.active 
                      ? 'bg-slate-700 text-sky-300 border-slate-600' 
                      : 'bg-slate-800 text-amber-400 border-amber-500/30'
                  }`}>
                    {feature.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-sky-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mb-2">{feature.subtitle}</p>
                <p className="text-slate-300 text-xs leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Action Link */}
                <div className="flex items-center text-xs font-semibold text-sky-400 group-hover:text-sky-300 gap-1 mt-auto">
                  {feature.active ? (
                    <>
                      <span>Mở chức năng</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  ) : (
                    <span className="text-slate-500">Đang phát triển...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
