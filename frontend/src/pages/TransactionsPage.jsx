import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptText, Search, CheckCircle2, Clock, XCircle, ChevronRight, Filter } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { rupiah } from '../mock';

const StatusBadge = ({ status }) => {
  const map = {
    success: { label: 'Sukses', cls: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10', Icon: CheckCircle2 },
    pending: { label: 'Menunggu', cls: 'text-amber-300 border-amber-400/40 bg-amber-400/10', Icon: Clock },
    failed: { label: 'Gagal', cls: 'text-rose-300 border-rose-400/40 bg-rose-400/10', Icon: XCircle },
  };
  const m = map[status] || map.pending;
  return <span className={`chip border flex items-center gap-1 ${m.cls}`}><m.Icon className="w-3 h-3" /> {m.label}</span>;
};

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { myOrders, getOrder } = useStore();
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState('');
  const [checkResult, setCheckResult] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('all');

  useEffect(() => { window.scrollTo(0, 0); myOrders().then(setOrders); }, []);

  const gameOptions = useMemo(() => {
    const set = new Map();
    orders.forEach((o) => set.set(o.gameName, o.gameBadge));
    return Array.from(set.keys());
  }, [orders]);

  const filtered = useMemo(() => orders.filter((o) =>
    (statusFilter === 'all' || o.status === statusFilter) &&
    (gameFilter === 'all' || o.gameName === gameFilter)
  ), [orders, statusFilter, gameFilter]);

  const doCheck = async () => {
    if (!q.trim()) return;
    const o = await getOrder(q.trim());
    setCheckResult(o || null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 grid place-items-center clip-corner" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}><ReceiptText className="w-5 h-5 text-[#04121a]" /></div>
        <div>
          <h1 className="font-display font-800 text-2xl text-white">Riwayat & Cek Status</h1>
          <p className="text-sm text-slate-400">Lacak pesananmu dengan nomor invoice.</p>
        </div>
      </div>

      <div className="panel rounded-xl p-5 mb-8">
        <label className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">Cek Status Pesanan</label>
        <div className="flex gap-2 mt-2">
          <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] focus-within:border-cyan-400/60">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value.toUpperCase())} placeholder="Masukkan nomor invoice (mis. INV12345678)" className="bg-transparent outline-none w-full text-sm placeholder:text-slate-500" />
          </div>
          <button onClick={doCheck} className="btn-cyber text-sm px-5">Cek</button>
        </div>
        {checkResult === null && <p className="text-sm text-rose-300 mt-3">Invoice tidak ditemukan.</p>}
        {checkResult && (
          <div className="mt-4 panel rounded-lg p-4 flex items-center gap-4 animate-float-up">
            <div className="w-12 h-12 rounded-lg grid place-items-center shrink-0" style={{ background: checkResult.gameGrad }}><span className="font-display font-900 text-white text-sm">{checkResult.gameBadge}</span></div>
            <div className="flex-1">
              <p className="font-head font-bold text-white">{checkResult.gameName} — {checkResult.denomName}</p>
              <p className="text-xs text-slate-400">{checkResult.invoice} · {rupiah(checkResult.total)}</p>
            </div>
            <StatusBadge status={checkResult.status} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="font-head font-bold text-white text-lg">Transaksi Terakhir</h2>
        <div className="ml-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex rounded-lg overflow-hidden border border-[rgba(120,130,220,0.2)]">
            {[{ id: 'all', label: 'Semua' }, { id: 'success', label: 'Sukses' }, { id: 'pending', label: 'Menunggu' }].map((s) => (
              <button key={s.id} onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1.5 text-xs font-head font-bold uppercase tracking-wider transition-colors ${statusFilter === s.id ? 'text-[#04121a]' : 'text-slate-300 hover:text-white'}`}
                style={statusFilter === s.id ? { background: 'linear-gradient(100deg,#00e5ff,#4ff0ff)' } : {}}>
                {s.label}
              </button>
            ))}
          </div>
          <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-xs font-head font-semibold text-slate-200 outline-none focus:border-cyan-400/60">
            <option value="all">Semua Game</option>
            {gameOptions.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>
      {orders.length === 0 ? (
        <div className="panel rounded-xl p-10 text-center">
          <p className="text-slate-400">Belum ada transaksi.</p>
          <button onClick={() => navigate('/')} className="btn-ghost-cyber mt-4">Mulai Top Up</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel rounded-xl p-10 text-center">
          <p className="text-slate-400">Tidak ada transaksi yang cocok dengan filter.</p>
          <button onClick={() => { setStatusFilter('all'); setGameFilter('all'); }} className="btn-ghost-cyber mt-4">Reset Filter</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <button key={o.id} onClick={() => navigate(`/pembayaran/${o.invoice}`)} className="w-full text-left panel rounded-xl p-4 flex items-center gap-4 card-hover">
              <div className="w-12 h-12 rounded-lg grid place-items-center shrink-0" style={{ background: o.gameGrad }}><span className="font-display font-900 text-white text-sm">{o.gameBadge}</span></div>
              <div className="flex-1 min-w-0">
                <p className="font-head font-bold text-white truncate">{o.gameName} — {o.denomName}</p>
                <p className="text-xs text-slate-400">{o.invoice} · {new Date(o.createdAt).toLocaleString('id-ID')}</p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-cyan-300">{rupiah(o.total)}</p>
                <div className="mt-1 flex justify-end"><StatusBadge status={o.status} /></div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
