import React, { useEffect, useState } from 'react';
import { History, Loader2, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, Empty } from '../ui';

const ACTION = {
  create: { icon: Plus, cls: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10' },
  update: { icon: Pencil, cls: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10' },
  delete: { icon: Trash2, cls: 'text-rose-300 border-rose-400/40 bg-rose-400/10' },
};

const timeAgo = (iso) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return new Date(iso).toLocaleString('id-ID');
};

const ActivityLog = () => {
  const { logs } = useAdmin();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); logs().then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageTitle icon={History} title="Log Aktivitas" desc="Riwayat perubahan yang dilakukan admin." action={<button onClick={load} className="btn-ghost-cyber text-xs"><RefreshCw className="w-4 h-4" /> Muat Ulang</button>} />
      {loading ? <div className="grid place-items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>
        : items.length === 0 ? <Empty text="Belum ada aktivitas tercatat." /> : (
        <div className="panel rounded-xl divide-y divide-[rgba(120,130,220,0.1)]">
          {items.map((l) => { const a = ACTION[l.action] || ACTION.update; const Icon = a.icon; return (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3">
              <span className={`w-9 h-9 grid place-items-center rounded-lg border ${a.cls}`}><Icon className="w-4 h-4" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white"><span className="font-semibold">{l.adminName}</span> <span className="text-slate-400">{l.action}</span> <span className="text-cyan-300">{l.entity}</span>{l.detail ? <span className="text-slate-400"> — {l.detail}</span> : ''}</p>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">{timeAgo(l.createdAt)}</span>
            </div>
          ); })}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
