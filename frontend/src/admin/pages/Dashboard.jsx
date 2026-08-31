import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Wallet, ShoppingCart, Users, Gamepad2, TrendingUp, Loader2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, StatusPill } from '../ui';
import { rupiah } from '../../mock';

const KPI = ({ icon: Icon, label, value, tint }) => (
  <div className="panel rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 grid place-items-center rounded-lg" style={{ background: tint }}><Icon className="w-5 h-5 text-[#04121a]" /></div>
    </div>
    <p className="font-display font-900 text-white text-xl mt-3">{value}</p>
    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-head">{label}</p>
  </div>
);

const Dashboard = () => {
  const { stats } = useAdmin();
  const [data, setData] = useState(null);

  useEffect(() => { stats().then(setData).catch(() => {}); }, []);

  if (!data) return <div className="grid place-items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;

  const maxRev = Math.max(1, ...data.revenueByDay.map((d) => d.value));

  return (
    <div>
      <PageTitle icon={LayoutDashboard} title="Dashboard" desc="Ringkasan performa toko top up kamu." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Wallet} label="Total Omzet" value={rupiah(data.revenue)} tint="linear-gradient(135deg,#00e5ff,#4ff0ff)" />
        <KPI icon={ShoppingCart} label="Total Pesanan" value={data.totalOrders} tint="linear-gradient(135deg,#b6ff3c,#00e5ff)" />
        <KPI icon={TrendingUp} label="Tingkat Sukses" value={`${data.successRate}%`} tint="linear-gradient(135deg,#ff2fb0,#7c3aed)" />
        <KPI icon={Users} label="Pelanggan" value={data.users} tint="linear-gradient(135deg,#a78bfa,#00e5ff)" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <div className="panel rounded-xl p-5 lg:col-span-2">
          <h3 className="font-head font-bold text-white mb-4">Omzet 7 Hari Terakhir</h3>
          <div className="flex items-end gap-2 h-48">
            {data.revenueByDay.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-md transition-all" style={{ height: `${(d.value / maxRev) * 100}%`, minHeight: '4px', background: 'linear-gradient(180deg,#00e5ff,#7c3aed)' }} title={rupiah(d.value)} />
                <span className="text-[10px] text-slate-500">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel rounded-xl p-5">
          <h3 className="font-head font-bold text-white mb-4">Status Pesanan</h3>
          <div className="space-y-3">
            <Bar label="Sukses" value={data.successOrders} total={data.totalOrders} color="#34d399" />
            <Bar label="Menunggu" value={data.pendingOrders} total={data.totalOrders} color="#fbbf24" />
            <Bar label="Game Aktif" value={data.games} total={data.games} color="#00e5ff" />
          </div>
        </div>
      </div>

      <div className="panel rounded-xl p-5 mt-6">
        <h3 className="font-head font-bold text-white mb-4">Pesanan Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 text-xs uppercase font-head">
              <th className="py-2 pr-3">Invoice</th><th className="py-2 pr-3">Game</th><th className="py-2 pr-3">Item</th><th className="py-2 pr-3">Total</th><th className="py-2">Status</th>
            </tr></thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-[rgba(120,130,220,0.1)]">
                  <td className="py-2.5 pr-3 text-cyan-300 font-mono text-xs">{o.invoice}</td>
                  <td className="py-2.5 pr-3 text-slate-200">{o.gameName}</td>
                  <td className="py-2.5 pr-3 text-slate-400">{o.denomName}</td>
                  <td className="py-2.5 pr-3 text-white font-semibold">{rupiah(o.total)}</td>
                  <td className="py-2.5"><StatusPill status={o.status} /></td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">Belum ada pesanan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Bar = ({ label, value, total, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1"><span className="text-slate-300">{label}</span><span className="text-white font-semibold">{value}</span></div>
    <div className="h-2 rounded-full bg-[#0b0e26] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${total ? (value / total) * 100 : 0}%`, background: color }} /></div>
  </div>
);

export default Dashboard;
