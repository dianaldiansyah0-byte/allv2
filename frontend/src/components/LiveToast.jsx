import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { LIVE_FEED } from '../mock';

const LiveToast = () => {
  const [idx, setIdx] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let mounted = true;
    const cycle = () => {
      if (!mounted) return;
      setShow(true);
      setTimeout(() => mounted && setShow(false), 4200);
      setTimeout(() => { if (mounted) setIdx((i) => (i + 1) % LIVE_FEED.length); }, 5000);
    };
    const first = setTimeout(cycle, 2500);
    const interval = setInterval(cycle, 8000);
    return () => { mounted = false; clearTimeout(first); clearInterval(interval); };
  }, []);

  const f = LIVE_FEED[idx];

  return (
    <div className={`fixed left-4 bottom-4 z-40 transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
      <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 max-w-xs glow-cyan">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-cyan-400/40 animate-ping" />
          <span className="relative w-2.5 h-2.5 rounded-full bg-cyan-400 block" />
        </div>
        <div className="text-sm">
          <p className="text-slate-200"><span className="font-semibold text-white">{f.user}</span> baru saja top up <span className="text-cyan-300 font-semibold">{f.item}</span></p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {f.game} berhasil diproses</p>
        </div>
        <Sparkles className="w-4 h-4 text-magenta ml-auto shrink-0" style={{ color: '#ff2fb0' }} />
      </div>
    </div>
  );
};

export default LiveToast;
