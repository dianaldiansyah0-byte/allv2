import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, ReceiptText, Wallet, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { rupiah } from '../mock';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { myOrders } = useStore();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/masuk'); return; }
    myOrders().then(setOrders);
  }, [user]);

  if (!user) return null;
  const spent = orders.filter((o) => o.status === 'success').reduce((s, o) => s + o.total, 0);
  const success = orders.filter((o) => o.status === 'success').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="panel rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative w-20 h-20 rounded-full grid place-items-center text-2xl font-display font-900 text-[#04121a] shrink-0 glow-cyan" style={{ background: 'linear-gradient(135deg,#00e5ff,#ff2fb0)' }}>{user.name?.[0]?.toUpperCase()}</div>
        <div className="relative text-center sm:text-left flex-1">
          <h1 className="font-display font-900 text-2xl text-white">{user.name}</h1>
          <p className="text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start"><Mail className="w-4 h-4" /> {user.email}</p>
        </div>
        <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost-cyber text-xs relative"><LogOut className="w-4 h-4" /> Keluar</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Stat icon={Trophy} label="Transaksi Sukses" value={success} />
        <Stat icon={Wallet} label="Total Belanja" value={rupiah(spent)} />
        <Stat icon={ReceiptText} label="Total Pesanan" value={orders.length} />
      </div>

      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="font-head font-bold text-white text-lg">Pesanan Terakhir</h2>
        <button onClick={() => navigate('/transaksi')} className="text-sm text-cyan-300 hover:underline">Lihat semua</button>
      </div>
      <div className="space-y-3">
        {orders.slice(0, 4).map((o) => (
          <div key={o.id} className="panel rounded-xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg grid place-items-center shrink-0" style={{ background: o.gameGrad }}><span className="font-display font-900 text-white text-xs">{o.gameBadge}</span></div>
            <div className="flex-1"><p className="font-head font-bold text-white text-sm">{o.gameName} — {o.denomName}</p><p className="text-xs text-slate-400">{o.invoice}</p></div>
            <p className="font-display font-bold text-cyan-300 text-sm">{rupiah(o.total)}</p>
          </div>
        ))}
        {orders.length === 0 && <div className="panel rounded-xl p-8 text-center text-slate-400">Belum ada pesanan.</div>}
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }) => (
  <div className="panel rounded-xl p-4 text-center">
    <Icon className="w-5 h-5 mx-auto text-cyan-300 mb-2" />
    <p className="font-display font-800 text-white text-lg">{value}</p>
    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-head">{label}</p>
  </div>
);

export default ProfilePage;
