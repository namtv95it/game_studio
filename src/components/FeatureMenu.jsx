import React from 'react';
import { Flashlight, Ghost, Sparkles, PlusCircle, ArrowRight } from 'lucide-react';

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
    id: 'coming_soon_1',
    title: 'Chức Năng Mới 3',
    subtitle: 'Feature #3',
    description: 'Tính năng tương tác độc đáo dành cho Video Short / TikTok sắp được ra mắt...',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600',
    badge: 'Sắp ra mắt',
    active: false
  }
];

export default function FeatureMenu({ onSelectFeature }) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-slate-900 p-8 flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full text-center mb-12">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
          🎮 KHO TÍNH NĂNG GAME STUDIO
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Chọn một chức năng minigame tương tác bên dưới để bắt đầu cấu hình và sản xuất video Short/TikTok chuẩn 9:16 Full HD.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {GAME_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div 
              key={feature.id}
              onClick={() => feature.active && onSelectFeature(feature.id)}
              className={`group relative bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 transition-all duration-300 ${
                feature.active 
                  ? 'hover:border-slate-500 hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-1 cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Badge Header */}
              <div className="flex justify-between items-center mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-md`}>
                  <Icon size={24} />
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  feature.active 
                    ? 'bg-slate-700 text-sky-300 border-slate-600' 
                    : 'bg-slate-800 text-amber-400 border-amber-500/30'
                }`}>
                  {feature.badge}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-sky-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-xs font-medium text-slate-400 mb-3">{feature.subtitle}</p>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {feature.description}
              </p>

              {/* Action Link */}
              <div className="flex items-center text-sm font-semibold text-sky-400 group-hover:text-sky-300 gap-1 mt-auto">
                {feature.active ? (
                  <>
                    <span>Khởi chạy ngay</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
  );
}
