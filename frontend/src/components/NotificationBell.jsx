import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { rupiah } from '../mock';

const SEEN_KEY = 'av2_notif_seen';

const timeAgo = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myOrders } = useStore();
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);

  const success = orders.filter((o) => o.status === 'success');
  const seenCount = Number(localStorage.getItem(`${SEEN_KEY}_${user?.id}`) || 0);
  const unread = Math.max(0, success.length - seenCount);

  const load = useCallback(async () => {
    try {
      const data = await myOrders();
      setOrders(data);
    } catch (e) { console.error('NotificationBell load failed:', e?.message || e); }
  }, [myOrders]);

  useEffect(() => {
    if (!user) { setOrders([]); return; }
    load();
    const iv = setInterval(load, 20000);
    return () => clearInterval(iv);
  }, [user, load]);

  const handleOpen = (v) => {
    setOpen(v);
    if (v) {
      load();
      // mark all current successes as seen
      const cnt = orders.filter((o) => o.status === 'success').length;
      localStorage.setItem(`${SEEN_KEY}_${user?.id}`, String(cnt));
    }
  };

  if (!user) return null;

  const recent = orders.slice(0, 6);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="relative w-10 h-10 grid place-items-center rounded-full border border-[rgba(120,130,220,0.25)] hover:border-cyan-400/60 text-slate-200 hover:text-cyan-300 transition-colors">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[10px] font-bold text-white glow-magenta animate-pulse-glow" style={{ background: '#ff2fb0' }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[rgba(120,130,220,0.16)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span className="font-head font-bold uppercase tracking-wider text-sm text-white">Notifikasi Pesanan</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">Belum ada pesanan.</div>
          ) : (
            recent.map((o) => {
              const ok = o.status === 'success';
              return (
                <button
                  key={o.id}
                  onClick={() => { setOpen(false); navigate(`/pembayaran/${o.invoice}`); }}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-cyan-400/10 transition-colors border-b border-[rgba(120,130,220,0.08)]"
                >
                  <div className="w-10 h-10 rounded-lg grid place-items-center shrink-0" style={{ background: o.gameGrad }}>
                    <span className="font-display font-900 text-white text-[10px]">{o.gameBadge}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-head font-semibold truncate">{o.gameName} — {o.denomName}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      {ok ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                      {ok ? 'Berhasil diproses' : 'Menunggu pembayaran'} · {timeAgo(o.createdAt)}
                    </p>
                  </div>
                  <span className="font-display font-bold text-cyan-300 text-xs shrink-0">{rupiah(o.total)}</span>
                </button>
              );
            })
          )}
        </div>
        <button onClick={() => { setOpen(false); navigate('/transaksi'); }} className="w-full py-2.5 text-center text-sm font-head font-semibold text-cyan-300 hover:bg-cyan-400/10 transition-colors">
          Lihat Semua Transaksi
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
