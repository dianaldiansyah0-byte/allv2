import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, Trash2, Plus } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, Field, Modal, Empty } from '../ui';
import { Switch } from '../../components/ui/switch';
import { rupiah } from '../../mock';
import { useToast } from '../../hooks/use-toast';

const PaymentsAdmin = () => {
  const { listPayments, updatePayment, createPayment, deletePayment } = useAdmin();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); listPayments().then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggle = async (p) => { await updatePayment(p.id, { active: !p.active }); setItems((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !x.active } : x)); };
  const saveFee = async () => { setSaving(true); try { await updatePayment(editing.id, { fee: editing.fee, name: editing.name, badge: editing.badge, midtransChannels: editing.midtransChannels || '' }); toast({ title: 'Tersimpan' }); setEditing(null); load(); } catch (e) { toast({ title: 'Gagal', variant: 'destructive' }); } finally { setSaving(false); } };
  const addNew = async () => { const name = window.prompt('Nama metode pembayaran?'); if (!name) return; await createPayment({ name, group: 'E-Wallet & QRIS', badge: name.slice(0, 4).toUpperCase(), fee: 0 }); toast({ title: 'Ditambahkan' }); load(); };
  const remove = async (p) => { if (!window.confirm(`Hapus ${p.name}?`)) return; await deletePayment(p.id); load(); };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;

  const groups = [...new Set(items.map((i) => i.group))];

  return (
    <div>
      <PageTitle icon={CreditCard} title="Metode Pembayaran" desc="Aktif/nonaktifkan channel dan atur biaya admin." action={<button onClick={addNew} className="btn-cyber text-xs py-2.5 px-4"><Plus className="w-4 h-4" /> Tambah</button>} />
      {items.length === 0 ? <Empty text="Belum ada metode." /> : groups.map((grp) => (
        <div key={grp} className="mb-6">
          <p className="font-head font-bold uppercase tracking-wider text-sm text-cyan-300 mb-3">{grp}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.filter((i) => i.group === grp).map((p) => (
              <div key={p.id} className="panel rounded-xl p-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg grid place-items-center text-[10px] font-display font-bold text-[#04121a]" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>{p.badge}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-head font-bold text-white text-sm truncate">{p.name}</p>
                  <button onClick={() => setEditing({ ...p })} className="text-[11px] text-slate-400 hover:text-cyan-300">Biaya {rupiah(p.fee)} · edit</button>
                </div>
                <Switch checked={!!p.active} onCheckedChange={() => toggle(p)} />
                <button onClick={() => remove(p)} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Pembayaran" onSave={saveFee} saving={saving}>
        {editing && (<>
          <Field label="Nama" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
          <Field label="Badge" value={editing.badge} onChange={(v) => setEditing({ ...editing, badge: v })} />
          <Field label="Biaya Admin (Rp)" type="number" value={editing.fee} onChange={(v) => setEditing({ ...editing, fee: v })} />
          <Field label="Channel Midtrans (opsional)" value={editing.midtransChannels} onChange={(v) => setEditing({ ...editing, midtransChannels: v })} placeholder="contoh: other_qris, gopay" />
          <p className="text-[11px] text-slate-500">Kosongkan agar jendela Midtrans menampilkan semua channel yang aktif di akun merchant kamu. Isi hanya jika ingin membatasi (mis. <code>bca_va</code>, <code>gopay</code>, <code>other_qris</code>).</p>
        </>)}
      </Modal>
    </div>
  );
};

export default PaymentsAdmin;
