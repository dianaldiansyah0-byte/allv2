import React, { useEffect, useState } from 'react';
import { Ticket, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, AddButton, Field, SelectField, Modal, ToggleRow, Empty } from '../ui';
import { rupiah } from '../../mock';
import { useToast } from '../../hooks/use-toast';

const blank = () => ({ code: '', desc: '', min: '', type: 'fixed', value: 0, maxCut: 0, minSpend: 0, active: true });

const VouchersAdmin = () => {
  const { listVouchers, createVoucher, updateVoucher, deleteVoucher } = useAdmin();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); listVouchers().then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.code) { toast({ title: 'Kode wajib', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (isNew) await createVoucher(editing); else await updateVoucher(editing.code, editing);
      toast({ title: 'Tersimpan' }); setEditing(null); load();
    } catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const remove = async (v) => { if (!window.confirm(`Hapus voucher ${v.code}?`)) return; await deleteVoucher(v.code); toast({ title: 'Dihapus' }); load(); };

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;

  return (
    <div>
      <PageTitle icon={Ticket} title="Voucher" desc="Kelola kode diskon untuk pelanggan." action={<AddButton onClick={() => { setEditing(blank()); setIsNew(true); }} label="Voucher Baru" />} />
      {items.length === 0 ? <Empty text="Belum ada voucher." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((v) => (
            <div key={v.code} className="panel rounded-xl p-4 border-l-2" style={{ borderLeftColor: '#00e5ff' }}>
              <div className="flex items-start justify-between">
                <p className="font-display font-bold text-cyan-300">{v.code}</p>
                {!v.active && <span className="chip bg-slate-700 text-slate-300">Off</span>}
              </div>
              <p className="text-sm text-slate-200 mt-1">{v.desc}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{v.type === 'fixed' ? `Potongan ${rupiah(v.value)}` : `Diskon ${v.value}% (maks ${rupiah(v.maxCut || 0)})`} · Min {rupiah(v.minSpend)}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setEditing({ ...v }); setIsNew(false); }} className="btn-ghost-cyber text-xs py-2 px-3 flex-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => remove(v)} className="w-9 h-9 grid place-items-center rounded-lg border border-rose-400/40 text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'Tambah Voucher' : `Edit ${editing?.code}`} onSave={save} saving={saving}>
        {editing && (
          <>
            <Field label="Kode" value={editing.code} onChange={(v) => setEditing({ ...editing, code: v.toUpperCase() })} placeholder="CYBER15" />
            <Field label="Deskripsi" value={editing.desc} onChange={(v) => setEditing({ ...editing, desc: v })} />
            <Field label="Teks Minimum (tampilan)" value={editing.min} onChange={(v) => setEditing({ ...editing, min: v })} placeholder="Min. belanja Rp 50.000" />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Tipe" value={editing.type} onChange={(v) => setEditing({ ...editing, type: v })} options={[{ value: 'fixed', label: 'Potongan Tetap' }, { value: 'percent', label: 'Persentase' }]} />
              <Field label={editing.type === 'fixed' ? 'Nilai (Rp)' : 'Nilai (%)'} type="number" value={editing.value} onChange={(v) => setEditing({ ...editing, value: v })} />
              {editing.type === 'percent' && <Field label="Maks Potongan (Rp)" type="number" value={editing.maxCut} onChange={(v) => setEditing({ ...editing, maxCut: v })} />}
              <Field label="Min. Belanja (Rp)" type="number" value={editing.minSpend} onChange={(v) => setEditing({ ...editing, minSpend: v })} />
            </div>
            <ToggleRow label="Aktif" checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} />
          </>
        )}
      </Modal>
    </div>
  );
};

export default VouchersAdmin;
