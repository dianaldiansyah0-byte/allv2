import React, { useEffect, useState } from 'react';
import { Boxes, Pencil, Trash2, Loader2, Plus } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, Field, ToggleRow, Modal, Empty } from '../ui';
import ImagePicker from '../ImagePicker';
import { rupiah } from '../../mock';
import { imgUrl } from '../../lib/img';
import { useToast } from '../../hooks/use-toast';

// config per collection: fields to edit + how to render a card
const CFG = {
  sellaccounts: {
    label: 'Jual Akun', coll: 'sellaccounts', image: true,
    fields: [
      { key: 'game', label: 'Game' }, { key: 'title', label: 'Judul' }, { key: 'rank', label: 'Rank' },
      { key: 'skins', label: 'Jumlah Skin', type: 'number' }, { key: 'price', label: 'Harga', type: 'number' },
      { key: 'badge', label: 'Badge' }, { key: 'grad', label: 'Gradient CSS' },
      { key: 'description', label: 'Deskripsi', textarea: true },
    ],
    blank: () => ({ game: '', title: '', rank: '', skins: 0, price: 0, badge: '', image: '', description: '', grad: 'linear-gradient(145deg,#00e5ff,#7c3aed)', active: true }),
    card: (it) => ({ title: it.title, sub: `${it.game} · ${it.rank}`, price: it.price, badge: it.badge, grad: it.grad, image: it.image }),
  },
  itemskins: {
    label: 'Item & Skin', coll: 'itemskins', image: true,
    fields: [
      { key: 'game', label: 'Game' }, { key: 'title', label: 'Judul' }, { key: 'price', label: 'Harga', type: 'number' },
      { key: 'badge', label: 'Badge' }, { key: 'grad', label: 'Gradient CSS' },
      { key: 'description', label: 'Deskripsi', textarea: true },
    ],
    blank: () => ({ game: '', title: '', price: 0, badge: '', image: '', description: '', grad: 'linear-gradient(145deg,#00e5ff,#7c3aed)', active: true }),
    card: (it) => ({ title: it.title, sub: it.game, price: it.price, badge: it.badge, grad: it.grad, image: it.image }),
  },
  pulsaoperators: {
    label: 'Operator Pulsa', coll: 'pulsaoperators', image: true,
    fields: [{ key: 'name', label: 'Nama' }, { key: 'badge', label: 'Badge' }],
    blank: () => ({ name: '', badge: '', image: '', active: true }),
    card: (it) => ({ title: it.name, sub: it.badge, image: it.image }),
  },
  pulsanominals: {
    label: 'Nominal Pulsa', coll: 'pulsanominals',
    fields: [{ key: 'amt', label: 'Nominal (Rp)', type: 'number' }, { key: 'price', label: 'Harga Jual (Rp)', type: 'number' }],
    blank: () => ({ amt: 0, price: 0, active: true }),
    card: (it) => ({ title: rupiah(it.amt), sub: `Jual ${rupiah(it.price)}` }),
  },
  tagihan: {
    label: 'Tagihan', coll: 'tagihan', image: true,
    fields: [{ key: 'name', label: 'Nama' }, { key: 'badge', label: 'Badge' }],
    blank: () => ({ name: '', badge: '', image: '', active: true }),
    card: (it) => ({ title: it.name, sub: it.badge, image: it.image }),
  },
};

const TABS = Object.keys(CFG);

const ContentAdmin = () => {
  const { listContent, createContent, updateContent, deleteContent } = useAdmin();
  const { toast } = useToast();
  const [tab, setTab] = useState('sellaccounts');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const cfg = CFG[tab];

  const load = (t) => { setLoading(true); listContent(CFG[t].coll).then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(tab); }, [tab]);

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) await createContent(cfg.coll, editing); else await updateContent(cfg.coll, editing.id, editing);
      toast({ title: 'Tersimpan' }); setEditing(null); load(tab);
    } catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); } finally { setSaving(false); }
  };
  const remove = async (it) => { if (!window.confirm('Hapus item ini?')) return; await deleteContent(cfg.coll, it.id); toast({ title: 'Dihapus' }); load(tab); };

  return (
    <div>
      <PageTitle icon={Boxes} title="Kelola Konten" desc="Atur Jual Akun, Item & Skin, Pulsa & Tagihan — lengkap dengan foto produk." />
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-head font-bold transition-colors ${tab === t ? 'text-[#04121a]' : 'text-slate-300 border border-[rgba(120,130,220,0.2)] hover:text-white'}`} style={tab === t ? { background: 'linear-gradient(100deg,#00e5ff,#4ff0ff)' } : {}}>{CFG[t].label}</button>
        ))}
        <button onClick={() => { setEditing(cfg.blank()); setIsNew(true); }} className="btn-cyber text-xs py-2 px-4 ml-auto" data-testid="content-add-btn"><Plus className="w-4 h-4" /> Tambah</button>
      </div>

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="w-7 h-7 animate-spin text-cyan-400" /></div>
        : items.length === 0 ? <Empty text="Belum ada item." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => { const c = cfg.card(it); return (
            <div key={it.id} className="panel rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg grid place-items-center shrink-0 overflow-hidden" style={{ background: c.grad || '#0b0e26' }}>
                  {c.image ? <img src={imgUrl(c.image)} alt="" className="w-full h-full object-cover" />
                    : c.badge ? <span className="font-display font-900 text-white text-[10px]">{c.badge}</span> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-head font-bold text-white text-sm truncate">{c.title}</p>
                  <p className="text-[11px] text-slate-400 truncate">{c.sub}</p>
                </div>
                {!it.active && <span className="chip bg-slate-700 text-slate-300">Off</span>}
              </div>
              {c.price != null && <p className="font-display font-bold text-cyan-300 mt-2">{rupiah(c.price)}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setEditing({ ...it }); setIsNew(false); }} className="btn-ghost-cyber text-xs py-2 px-3 flex-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => remove(it)} className="w-9 h-9 grid place-items-center rounded-lg border border-rose-400/40 text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ); })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`${isNew ? 'Tambah' : 'Edit'} ${cfg.label}`} onSave={save} saving={saving}>
        {editing && (
          <div className="space-y-3">
            {cfg.image && (
              <ImagePicker label="Foto Produk" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })}
                recommended={{ w: 800, h: 600 }} mode="cover" aspect="aspect-[4/3]" testId="content-image"
                note="800×600px. Ditampilkan pada kartu produk di situs." />
            )}
            <div className="grid grid-cols-2 gap-3">
              {cfg.fields.map((f) => (
                <div key={f.key} className={f.key === 'title' || f.key === 'grad' || f.textarea ? 'col-span-2' : ''}>
                  <Field label={f.label} type={f.type} textarea={f.textarea} value={editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} />
                </div>
              ))}
              {editing.grad && <div className="col-span-2 h-7 rounded-lg" style={{ background: editing.grad }} />}
              <div className="col-span-2"><ToggleRow label="Aktif" checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} /></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ContentAdmin;
