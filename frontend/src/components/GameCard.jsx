import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { rupiah } from '../mock';
import SafeImg from './SafeImg';

export const GameCard = ({ game }) => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(`/game/${game.slug}`)} className="group text-left" data-testid={`game-card-${game.slug}`}>
      <div className="panel card-hover rounded-xl overflow-hidden">
        <div className="relative aspect-square grid place-items-center overflow-hidden" style={{ background: game.grad }}>
          <SafeImg src={game.image} alt={game.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy"
            fallback={(
              <>
                <div className="absolute inset-0 grid-bg opacity-30" />
                <span className="font-display font-900 text-3xl text-white/95 drop-shadow-lg tracking-tight">{game.badge}</span>
              </>
            )} />
          {game.popular && (
            <span className="absolute top-2 left-2 chip bg-black/40 text-cyan-200 border border-cyan-400/40 z-10">HOT</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
            <span className="btn-cyber text-xs py-2 px-4"><Zap className="w-4 h-4" /> Top Up</span>
          </div>
        </div>
        <div className="p-3">
          <p className="font-head font-bold text-white text-sm truncate">{game.name}</p>
          <p className="text-[12px] text-slate-400">Mulai {rupiah(game.priceFrom)}</p>
        </div>
      </div>
    </button>
  );
};

export const ProductCard = ({ badge, grad, image, title, sub, price, oldPrice, tag, onClick, cta = 'Beli' }) => (
  <button onClick={onClick} className="group text-left">
    <div className="panel card-hover rounded-xl overflow-hidden h-full flex flex-col">
      <div className="relative aspect-[4/3] grid place-items-center overflow-hidden" style={{ background: grad }}>
        <SafeImg src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" loading="lazy"
          fallback={(
            <>
              <div className="absolute inset-0 grid-bg opacity-25" />
              <span className="font-display font-900 text-2xl text-white/95">{badge}</span>
            </>
          )} />
        {tag && <span className="absolute top-2 right-2 chip glow-magenta text-white z-10" style={{ background: '#ff2fb0' }}>{tag}</span>}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="font-head font-bold text-white text-sm leading-tight">{title}</p>
        {sub && <p className="text-[12px] text-slate-400">{sub}</p>}
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div>
            <p className="font-display font-bold text-cyan-300">{rupiah(price)}</p>
            {oldPrice && <p className="text-[11px] text-slate-500 line-through">{rupiah(oldPrice)}</p>}
          </div>
          <span className="chip border border-cyan-400/40 text-cyan-200 group-hover:bg-cyan-400/10">{cta}</span>
        </div>
      </div>
    </div>
  </button>
);
