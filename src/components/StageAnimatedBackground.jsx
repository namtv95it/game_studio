import React, { useRef, useEffect } from 'react';

/**
 * Danh sách các hiệu ứng nền động có sẵn
 */
export const STAGE_ANIMATED_EFFECTS = [
  { id: 'none', name: 'Không hiệu ứng', icon: '🚫', desc: 'Tắt hiệu ứng động' },
  { id: 'rain', name: 'Mưa Rơi', icon: '🌧️', desc: 'Cơn mưa rơi rào rạt với vệt nước và giọt bắn' },
  { id: 'bubbles', name: 'Bong Bóng Bay', icon: '🫧', desc: 'Bong bóng xà phòng ngũ sắc bồng bềnh lơ lửng' },
  { id: 'hearts', name: 'Trái Tim Bay', icon: '💖', desc: 'Những trái tim ngọt ngào bay lượn lãng mạn' },
  { id: 'leaves', name: 'Lá Mùa Thu', icon: '🍂', desc: 'Những chiếc lá vàng cam chao đảo theo gió thu' },
  { id: 'snow', name: 'Tuyết Rơi', icon: '❄️', desc: 'Bông tuyết trắng tinh khôi rơi êm đềm' },
  { id: 'sparkles', name: 'Đom Đóm & Ánh Sao', icon: '✨', desc: 'Đốm sáng lấp lánh phát quang huyền ảo ban đêm' },
  { id: 'sakura', name: 'Hoa Anh Đào', icon: '🌸', desc: 'Cánh hoa hồng phấn bay phấp phới dịu dàng' },
  { id: 'confetti', name: 'Pháo Giấy / Tiệc', icon: '🎉', desc: 'Dải kim tuyến nhiều màu sắc rơi vui tươi' },
];

export const DEFAULT_ANIMATED_SETTINGS = {
  speed: 1,      // 0.5 (Chậm) | 1 (Vừa) | 1.8 (Nhanh)
  density: 1,    // 0.5 (Ít) | 1 (Vừa) | 1.8 (Nhiều)
  opacity: 85,   // 20% - 100%
  size: 100,     // 50% - 180%
  direction: 0   // Góc xoay hướng: 0 | 90 | 180 | 270 deg
};

/**
 * Component Canvas 2D render hiệu ứng nền động hiệu năng cao 60FPS
 */
export default function StageAnimatedBackground({
  effect = 'none',
  settings = DEFAULT_ANIMATED_SETTINGS,
  className = ''
}) {
  const canvasRef = useRef(null);
  const animFrameId = useRef(null);

  useEffect(() => {
    if (!effect || effect === 'none') {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth || 960);
    let height = (canvas.height = canvas.offsetHeight || 540);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 960;
      height = canvas.height = canvas.offsetHeight || 540;
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);

    const speedMul = settings.speed ?? 1;
    const densityMul = settings.density ?? 1;
    const baseAlpha = (settings.opacity ?? 85) / 100;
    const sizeMul = (settings.size ?? 100) / 100;

    // Khởi tạo các mảng hạt (Particles) theo từng loại hiệu ứng
    let particles = [];
    let splashes = [];

    const baseCountMap = {
      rain: 90,
      bubbles: 30,
      hearts: 25,
      leaves: 26,
      snow: 75,
      sparkles: 45,
      sakura: 32,
      confetti: 45
    };

    const targetCount = Math.round((baseCountMap[effect] || 35) * densityMul);

    // Hàm tạo hạt mới tùy theo effect
    const createParticle = (initialRandomY = true) => {
      const y = initialRandomY ? Math.random() * height : -30;
      const x = Math.random() * width;

      switch (effect) {
        case 'rain':
          return {
            x: Math.random() * (width + 100) - 50,
            y,
            len: (18 + Math.random() * 16) * sizeMul,
            vx: -2 * speedMul,
            vy: (12 + Math.random() * 8) * speedMul,
            width: (1 + Math.random() * 1.5) * sizeMul,
            alpha: (0.4 + Math.random() * 0.4) * baseAlpha
          };

        case 'bubbles':
          return {
            x: Math.random() * width,
            y: initialRandomY ? Math.random() * height : height + 30 + Math.random() * 20,
            r: (10 + Math.random() * 20) * sizeMul,
            vy: -(1.2 + Math.random() * 2.2) * speedMul,
            vx: (Math.random() - 0.5) * 0.8 * speedMul,
            phase: Math.random() * Math.PI * 2,
            hue: Math.floor(Math.random() * 360),
            alpha: (0.5 + Math.random() * 0.4) * baseAlpha
          };

        case 'hearts': {
          const colors = ['#f43f5e', '#ec4899', '#f472b6', '#fb7185', '#e11d48', '#ff758f'];
          return {
            x: Math.random() * width,
            y: initialRandomY ? Math.random() * height : height + 35,
            size: (12 + Math.random() * 16) * sizeMul,
            vy: -(1.2 + Math.random() * 2) * speedMul,
            vx: 0,
            phase: Math.random() * Math.PI * 2,
            sway: 1.2 + Math.random() * 1.5,
            rot: (Math.random() - 0.5) * 0.4,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: (0.6 + Math.random() * 0.35) * baseAlpha
          };
        }

        case 'leaves': {
          const colors = ['#f97316', '#ea580c', '#eab308', '#d97706', '#ef4444', '#b45309'];
          return {
            x: Math.random() * width,
            y,
            size: (14 + Math.random() * 16) * sizeMul,
            vy: (1.5 + Math.random() * 2.2) * speedMul,
            vx: (0.6 + Math.random() * 1.2) * speedMul,
            phase: Math.random() * Math.PI * 2,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.05 * speedMul,
            flip: Math.random() * Math.PI,
            flipSpeed: (0.02 + Math.random() * 0.04) * speedMul,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: (0.7 + Math.random() * 0.3) * baseAlpha
          };
        }

        case 'snow':
          return {
            x: Math.random() * width,
            y,
            r: (2 + Math.random() * 4.5) * sizeMul,
            vy: (1 + Math.random() * 2.2) * speedMul,
            vx: (Math.random() - 0.4) * 0.8 * speedMul,
            phase: Math.random() * Math.PI * 2,
            alpha: (0.5 + Math.random() * 0.45) * baseAlpha
          };

        case 'sparkles':
          return {
            x: Math.random() * width,
            y: Math.random() * height,
            r: (2 + Math.random() * 4) * sizeMul,
            vx: (Math.random() - 0.5) * 0.8 * speedMul,
            vy: (Math.random() - 0.5) * 0.8 * speedMul,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: (0.03 + Math.random() * 0.05) * speedMul,
            color: Math.random() > 0.4 ? '#fde047' : '#67e8f9',
            alpha: Math.random() * baseAlpha
          };

        case 'sakura': {
          const colors = ['#fbcfe8', '#f472b6', '#fda4af', '#fecdd3'];
          return {
            x: Math.random() * width,
            y,
            w: (10 + Math.random() * 8) * sizeMul,
            h: (14 + Math.random() * 10) * sizeMul,
            vy: (1.2 + Math.random() * 1.8) * speedMul,
            vx: (0.8 + Math.random() * 1.4) * speedMul,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (0.01 + Math.random() * 0.03) * speedMul,
            phase: Math.random() * Math.PI * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: (0.7 + Math.random() * 0.25) * baseAlpha
          };
        }

        case 'confetti': {
          const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#8b5cf6', '#06b6d4', '#f97316'];
          return {
            x: Math.random() * width,
            y,
            w: (7 + Math.random() * 8) * sizeMul,
            h: (10 + Math.random() * 12) * sizeMul,
            vy: (2 + Math.random() * 3) * speedMul,
            vx: (Math.random() - 0.5) * 1.8 * speedMul,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.08 * speedMul,
            phase: Math.random() * Math.PI * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: (0.8 + Math.random() * 0.2) * baseAlpha
          };
        }

        default:
          return {};
      }
    };

    // Khởi tạo các hạt
    for (let i = 0; i < targetCount; i++) {
      particles.push(createParticle(true));
    }

    // Vòng lặp Render Animation
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. RENDER MƯA (RAIN)
      if (effect === 'rain') {
        ctx.lineCap = 'round';
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha})`;
          ctx.lineWidth = p.width;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 1.5, p.y + p.len);
          ctx.stroke();

          // Khi chạm đáy màn hình: tạo giọt bắn
          if (p.y > height - 10) {
            if (Math.random() > 0.6) {
              splashes.push({
                x: p.x,
                y: height - 6 + Math.random() * 4,
                r: 1,
                maxR: (3 + Math.random() * 5) * sizeMul,
                alpha: p.alpha * 0.8
              });
            }
            particles[i] = createParticle(false);
          } else if (p.x < -30) {
            particles[i] = createParticle(false);
          }
        }

        // Vẽ các giọt bắn tung tóe (Splashes)
        for (let sIdx = splashes.length - 1; sIdx >= 0; sIdx--) {
          const sp = splashes[sIdx];
          sp.r += 0.8 * speedMul;
          sp.alpha -= 0.06 * speedMul;
          if (sp.alpha <= 0 || sp.r >= sp.maxR) {
            splashes.splice(sIdx, 1);
            continue;
          }
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.r * 1.8, sp.r * 0.6, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(224, 242, 254, ${sp.alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // 2. RENDER BONG BÓNG (BUBBLES)
      else if (effect === 'bubbles') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.phase += 0.03 * speedMul;
          p.x += Math.sin(p.phase) * 0.8 * speedMul + p.vx;
          p.y += p.vy;

          // Bong bóng có phản quang đa sắc
          const grad = ctx.createRadialGradient(
            p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.1,
            p.x, p.y, p.r
          );
          grad.addColorStop(0, `hsla(${p.hue}, 85%, 90%, ${p.alpha * 0.8})`);
          grad.addColorStop(0.6, `hsla(${(p.hue + 60) % 360}, 80%, 75%, ${p.alpha * 0.35})`);
          grad.addColorStop(0.95, `hsla(${(p.hue + 140) % 360}, 90%, 65%, ${p.alpha * 0.85})`);
          grad.addColorStop(1, `hsla(${p.hue}, 100%, 100%, ${p.alpha * 0.95})`);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Điểm sáng phản chiếu ánh sáng trắng (Specular highlight)
          ctx.beginPath();
          ctx.ellipse(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.28, p.r * 0.14, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.9})`;
          ctx.fill();

          if (p.y < -p.r * 2) {
            particles[i] = createParticle(false);
          }
        }
      }

      // 3. RENDER TRÁI TIM (HEARTS)
      else if (effect === 'hearts') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.phase += 0.035 * speedMul;
          p.x += Math.sin(p.phase) * p.sway * speedMul;
          p.y += p.vy;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(p.phase * 0.8) * 0.25);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          // Vẽ hình trái tim bằng Bezier Curve
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(0, s * 0.35);
          ctx.bezierCurveTo(-s * 0.6, -s * 0.2, -s * 0.5, -s * 0.7, 0, -s * 0.35);
          ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 0.6, -s * 0.2, 0, s * 0.35);
          ctx.fill();

          // Điểm sáng ngọt ngào
          ctx.beginPath();
          ctx.arc(-s * 0.2, -s * 0.35, s * 0.1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();

          ctx.restore();

          if (p.y < -p.size * 2) {
            particles[i] = createParticle(false);
          }
        }
      }

      // 4. RENDER LÁ MÙA THU (LEAVES)
      else if (effect === 'leaves') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.phase += 0.03 * speedMul;
          p.x += Math.sin(p.phase) * 1.5 * speedMul + p.vx;
          p.y += p.vy;
          p.rot += p.rotSpeed;
          p.flip += p.flipSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.flip)); // Tạo hiệu ứng lật lá 3D trong gió
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          // Vẽ chiếc lá phong / lá oval thuôn nhọn
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(s * 0.6, -s * 0.2, 0, s);
          ctx.quadraticCurveTo(-s * 0.6, -s * 0.2, 0, -s);
          ctx.fill();

          // Gân lá chính
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.lineWidth = 1;
          ctx.moveTo(0, -s * 0.8);
          ctx.lineTo(0, s * 0.8);
          ctx.stroke();

          ctx.restore();

          if (p.y > height + p.size * 2 || p.x > width + p.size * 2) {
            particles[i] = createParticle(false);
          }
        }
      }

      // 5. RENDER TUYẾT (SNOW)
      else if (effect === 'snow') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.phase += 0.02 * speedMul;
          p.x += Math.sin(p.phase) * 0.7 * speedMul + p.vx;
          p.y += p.vy;

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
          grad.addColorStop(0.6, `rgba(255, 255, 255, ${p.alpha * 0.7})`);
          grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          if (p.y > height + p.r * 2) {
            particles[i] = createParticle(false);
          }
        }
      }

      // 6. RENDER ĐOM ĐÓM & ÁNH SAO (SPARKLES)
      else if (effect === 'sparkles') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.pulse += p.pulseSpeed;

          // Giới hạn biên màn hình, đổi hướng nhẹ
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          const currentAlpha = (0.2 + Math.abs(Math.sin(p.pulse)) * 0.8) * baseAlpha;

          // Hào quang tỏa sáng mềm mại
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
          grad.addColorStop(0, p.color === '#fde047' ? `rgba(254, 240, 138, ${currentAlpha})` : `rgba(165, 243, 252, ${currentAlpha})`);
          grad.addColorStop(0.4, p.color === '#fde047' ? `rgba(250, 204, 21, ${currentAlpha * 0.6})` : `rgba(56, 189, 248, ${currentAlpha * 0.6})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Nhân sáng ở tâm
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.95})`;
          ctx.fill();
        }
      }

      // 7. RENDER HOA ANH ĐÀO (SAKURA)
      else if (effect === 'sakura') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.phase += 0.025 * speedMul;
          p.x += Math.sin(p.phase) * 1.2 * speedMul + p.vx;
          p.y += p.vy;
          p.rot += p.rotSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;

          // Cánh hoa khuyết nhẹ ở đỉnh
          const w = p.w;
          const h = p.h;
          ctx.beginPath();
          ctx.moveTo(0, -h * 0.5);
          ctx.bezierCurveTo(w * 0.7, -h * 0.3, w * 0.6, h * 0.4, 0, h * 0.5);
          ctx.bezierCurveTo(-w * 0.6, h * 0.4, -w * 0.7, -h * 0.3, 0, -h * 0.5);
          ctx.fill();

          ctx.restore();

          if (p.y > height + p.h || p.x > width + p.w) {
            particles[i] = createParticle(false);
          }
        }
      }

      // 8. RENDER PHÁO GIẤY / CONFETTI
      else if (effect === 'confetti') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.phase += 0.04 * speedMul;
          p.x += Math.sin(p.phase) * 1.5 * speedMul + p.vx;
          p.y += p.vy;
          p.rot += p.rotSpeed;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(Math.cos(p.phase), 1); // Hiệu ứng dải ruy băng lật trong không khí
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();

          if (p.y > height + p.h) {
            particles[i] = createParticle(false);
          }
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      ro.disconnect();
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [effect, settings.speed, settings.density, settings.opacity, settings.size, settings.direction]);

  if (!effect || effect === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${className}`}
    />
  );
}
