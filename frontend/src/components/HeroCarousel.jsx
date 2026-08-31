import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import SafeImg from './SafeImg';

const HeroCarousel = () => {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const { banners } = useCatalog();
  const HERO_BANNERS = banners || [];
  const n = HERO_BANNERS.length;

  const go = useCallback((d) => setI((p) => (p + d + n) % (n || 1)), [n]);

  useEffect(() => {
    if (!n) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  if (!n) return null;

  return (
    <section className="relative max-w-7xl mx-auto px-4 pt-6">
      <div className="relative h-[240px] md:h-[300px] rounded-2xl overflow-hidden panel">
        {HERO_BANNERS.map((b, idx) => (
          <div key={b.id}
            className={`absolute inset-0 transition-all duration-700 ${idx === i ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}>
            <SafeImg src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover"
              fallback={<div className="absolute inset-0" style={{ background: 'linear-gradient(120deg,#0b0e26,#1b2050)' }} />} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(5,6,15,0.92) 0%, rgba(5,6,15,0.55) 45%, rgba(5,6,15,0.25) 100%)' }} />
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-xl">
              <span className="chip w-fit mb-3 flex items-center gap-1 text-[#04121a]" style={{ background: 'linear-gradient(90deg,#00e5ff,#b6ff3c)' }}><Zap className="w-3 h-3" /> {b.tag}</span>
              <h2 className="font-display font-900 text-3xl md:text-5xl text-white leading-none drop-shadow-lg">{b.title}</h2>
              <p className="text-slate-300 mt-3 font-head text-lg">{b.subtitle}</p>
              <button onClick={() => navigate(`/game/${b.game}`)} className="btn-cyber w-fit mt-5 text-sm"><Zap className="w-4 h-4" /> Top Up Sekarang</button>
            </div>
          </div>
        ))}

        <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full glass hover:glow-cyan text-white z-10"><ChevronLeft /></button>
        <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full glass hover:glow-cyan text-white z-10"><ChevronRight /></button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_BANNERS.map((b, idx) => (
            <button key={b.id} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-8 bg-cyan-400' : 'w-2 bg-white/40'}`} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
