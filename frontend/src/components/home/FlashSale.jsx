import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Timer } from 'lucide-react';
import { rupiah } from '../../mock';
import { useCatalog } from '../../context/CatalogContext';

const Countdown = () => {
  const [t, setT] = useState({ h: 14, m: 51, s: 25 });
  useEffect(() => {
    const iv = setInterval(() => {
      setT((p) => {
        let { h, m, s } = p;
        s--; if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  const p = (x) => String(x).padStart(2, '0');
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-magenta/40" style={{ borderColor: 'rgba(255,47,176,0.4)', background: 'rgba(255,47,176,0.08)' }}>
      <Timer className="w-4 h-4" style={{ color: '#ff2fb0' }} />
      <span className="text-xs text-slate-300">Berakhir dalam</span>
      <span className="font-display font-bold neon-magenta text-sm">{p(t.h)}:{p(t.m)}:{p(t.s)}</span>
    </div>
  );
};

const FlashSale = () => {
  const navigate = useNavigate();
  const { flashSale, getGame } = useCatalog();
  const items = (flashSale || []).map((f) => {
    const g = getGame(f.gameSlug);
    const d = g?.denoms?.find((x) => x.id === f.denomId);
    return { g, d, discount: f.discount };
  }).filter((x) => x.g && x.d);

  if (!items.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 mt-14">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="w-10 h-10 grid place-items-center clip-corner" style={{ background: 'linear-gradient(135deg,#ff2fb0,#7c3aed)' }}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-display font-800 text-2xl text-white">Flash Sale</h2>
          <p className="text-sm text-slate-400">Nominal pilihan dengan diskon terbatas, berganti setiap hari.</p>
        </div>
        <div className="ml-auto"><Countdown /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ g, d, discount }) => (
          <button key={`${g.slug}-${d.id}`} onClick={() => navigate(`/game/${g.slug}?denom=${d.id}`)} className="group text-left">
            <div className="panel card-hover rounded-xl overflow-hidden">
              <div className="relative aspect-video grid place-items-center" style={{ background: g.grad }}>
                <div className="absolute inset-0 grid-bg opacity-25" />
                <span className="font-display font-900 text-2xl text-white/95">{g.badge}</span>
                <span className="absolute top-2 left-2 chip glow-magenta text-white flex items-center gap-1" style={{ background: '#ff2fb0' }}><Zap className="w-3 h-3" /> -{discount}%</span>
              </div>
              <div className="p-3">
                <p className="font-head font-bold text-white text-sm">{d.name}</p>
                <p className="text-[12px] text-slate-400">{g.name}</p>
                <p className="font-display font-bold text-cyan-300 mt-1">{rupiah(d.price)}</p>
                {d.oldPrice && <p className="text-[11px] text-slate-500 line-through">{rupiah(d.oldPrice)}</p>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default FlashSale;
