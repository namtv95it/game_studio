import React, { useState } from 'react';
import FlashlightReveal from './components/FlashlightReveal';
import ShadowMatch from './components/ShadowMatch';
import { Flashlight, Ghost } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('flashlight'); // 'flashlight' | 'shadow'

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER TAB NAVIGATION */}
      <header style={{ height: '56px', background: '#0f172a', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(to right, #38bdf8, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🎮 GAME STUDIO WEB APP
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
          <button 
            onClick={() => setActiveTab('flashlight')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              border: 'none', 
              cursor: 'pointer', 
              background: activeTab === 'flashlight' ? '#0284c7' : 'transparent',
              color: activeTab === 'flashlight' ? 'white' : '#94a3b8',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Flashlight size={18} /> Chức Năng 1: Soi Đèn Pin
          </button>

          <button 
            onClick={() => setActiveTab('shadow')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              border: 'none', 
              cursor: 'pointer', 
              background: activeTab === 'shadow' ? '#9333ea' : 'transparent',
              color: activeTab === 'shadow' ? 'white' : '#94a3b8',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            <Ghost size={18} /> Chức Năng 2: Ghép Bóng
          </button>
        </div>
      </header>

      {/* TAB CONTENT */}
      <main style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'flashlight' ? <FlashlightReveal /> : <ShadowMatch />}
      </main>
    </div>
  );
}
