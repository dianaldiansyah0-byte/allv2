import React, { useEffect, useState } from 'react';
import { Users, Loader2, Search, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, Empty } from '../ui';

const UsersAdmin = () => {
  const { listUsers } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => { listUsers().then((d) => { setUsers(d); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const filtered = users.filter((u) => !q || u.name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()));

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;

  return (
    <div>
      <PageTitle icon={Users} title="Pengguna" desc="Daftar pelanggan dan admin terdaftar." />
      <div className="flex items-center gap-2 mb-4 max-w-sm px-3 py-2 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] focus-within:border-cyan-400/60">
        <Search className="w-4 h-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / email" className="bg-transparent outline-none w-full text-sm" />
      </div>
      {filtered.length === 0 ? <Empty text="Tidak ada pengguna." /> : (
        <div className="panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400 text-xs uppercase font-head bg-[#0b0e26]">
                <th className="py-3 px-3">Nama</th><th className="py-3 px-3">Email</th><th className="py-3 px-3">Role</th><th className="py-3 px-3">Pesanan</th><th className="py-3 px-3">Bergabung</th>
              </tr></thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-[rgba(120,130,220,0.1)]">
                    <td className="py-2.5 px-3"><div className="flex items-center gap-2"><span className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold text-[#04121a]" style={{ background: 'linear-gradient(135deg,#00e5ff,#ff2fb0)' }}>{u.name?.[0]?.toUpperCase()}</span><span className="text-white">{u.name}</span></div></td>
                    <td className="py-2.5 px-3 text-slate-300">{u.email}</td>
                    <td className="py-2.5 px-3">{u.role === 'admin' ? <span className="chip border border-magenta/40 text-magenta flex items-center gap-1 w-fit" style={{ color: '#ff2fb0', borderColor: 'rgba(255,47,176,0.4)' }}><ShieldCheck className="w-3 h-3" /> admin</span> : <span className="chip border border-cyan-400/30 text-cyan-200">user</span>}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">{u.orderCount}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'}</td>
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

export default UsersAdmin;
