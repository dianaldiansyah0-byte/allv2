import React, { useEffect, useState, useMemo } from 'react';
import { ReceiptText, Loader2, Search } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, StatusPill, Empty } from '../ui';
import { rupiah } from '../../mock';
import { useToast } from '../../hooks/use-toast';

const OrdersAdmin = () => {
  const { listOrders, updateOrder } = useAdmin();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const load = () => { setLoading(true); listOrders().then((d) => { setOrders(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const change = async (o, val) => {
    try { await updateOrder(o.id, val); setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, status: val } : x)); toast({ title: 'Status diperbarui' }); }
    catch (e) { toast({ title: 'Gagal', variant: 'destructive' }); }
  };

  const filtered = useMemo(() => orders.filter((o) =>
    (status === 'all' || o.status === status) &&
    (!q || o.invoice?.toLowerCase().includes(q.toLowerCase()) || o.gameName?.toLowerCase().includes(q.toLowerCase()) || (o.userName || '').toLowerCase().includes(q.toLowerCase()))
  ), [orders, status, q]);

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;

  return (
    <div>
      <PageTitle icon={ReceiptText} title="Pesanan" desc="Kelola semua transaksi dan ubah statusnya." />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] focus-within:border-cyan-400/60">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari invoice / game / user" className="bg-transparent outline-none w-full text-sm" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-sm outline-none">
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {filtered.length === 0 ? <Empty text="Tidak ada pesanan." /> : (
        <div className="panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 text-xs uppercase font-head bg-[#0b0e26]">
                <th className="py-3 px-3">Invoice</th><th className="py-3 px-3">User</th><th className="py-3 px-3">Game / Item</th><th className="py-3 px-3">Total</th><th className="py-3 px-3">Status</th><th className="py-3 px-3">Ubah</th>
              </tr></thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t border-[rgba(120,130,220,0.1)]">
                    <td className="py-2.5 px-3 text-cyan-300 font-mono text-xs">{o.invoice}</td>
                    <td className="py-2.5 px-3 text-slate-300">{o.userName || 'Guest'}</td>
                    <td className="py-2.5 px-3 text-slate-200">{o.gameName}<span className="text-slate-500"> · {o.denomName}</span></td>
                    <td className="py-2.5 px-3 text-white font-semibold">{rupiah(o.total)}</td>
                    <td className="py-2.5 px-3"><StatusPill status={o.status} /></td>
                    <td className="py-2.5 px-3">
                      <select value={o.status} onChange={(e) => change(o, e.target.value)} className="px-2 py-1 rounded-md bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-xs outline-none">
                        <option value="pending">pending</option><option value="success">success</option><option value="failed">failed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersAdmin;
