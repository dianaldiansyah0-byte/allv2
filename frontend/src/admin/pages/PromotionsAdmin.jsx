import React, { useEffect, useState } from 'react';
import { Megaphone, Pencil, Trash2, Loader2, Plus } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useCatalog } from '../../context/CatalogContext';
import { PageTitle, Field, SelectField, Modal, ToggleRow, Empty } from '../ui';
import ImagePicker from '../ImagePicker';
import { rupiah } from '../../mock';
import { imgUrl } from '../../lib/img';
import { useToast } from '../../hooks/use-toast';

const TABS = [
  { id: 'banners', label: 'Banner / Hero' },
  { id: 'flashsale', label: 'Flash Sale' },
  { id: 'specialoffers', label: 'Penawaran Spesial' },
];

const PromotionsAdmin = () => {
  const { listContent, createContent, updateContent, deleteContent } = useAdmin();
  const { games } = useCatalog();
  const { toast } = useToast();
  const [tab, setTab] = useState('banners');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = (t) => { setLoading(true); listContent(t).then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(tab); }, [tab]);

  const gameOpts = (games || []).map((g) => ({ value: g.slug, label: g.name }));
  const denomOpts = (slug) => { const g = (games || []).find((x) => x.slug === slug); return (g?.denoms || []).map((d) => ({ value: d.id, label: `${d.name} (${rupiah(d.price)})` })); };

  const blank = () => {
    if (tab === 'banners') return { tag: 'PROMO', title: '', subtitle: '', game: games?.[0]?.slug || '', image: '', order: items.length + 1, active: true };
    if (tab === 'flashsale') return { gameSlug: games?.[0]?.slug || '', denomId: '', discount: 10, active: true };
    return { gameSlug: games?.[0]?.slug || '', denomId: '', active: true };
  };

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) await createContent(tab, editing); else await updateContent(tab, editing.id, editing);
      toast({ title: 'Tersimpan' }); setEditing(null); load(tab);
    } catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); } finally { setSaving(false); }
  };
  const remove = async (it) => { if (!window.confirm('Hapus item ini?')) return; await deleteContent(tab, it.id); toast({ title: 'Dihapus' }); load(tab); };

  return (
    <div>
      <PageTitle icon={Megaphone} title="Promosi" desc="Atur banner beranda (dengan gambar), flash sale, dan penawaran spesial." />
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-head font-bold transition-colors ${tab === t.id ? 'text-[#04121a]' : 'text-slate-300 border border-[rgba(120,130,220,0.2)] hover:text-white'}`} style={tab === t.id ? { background: 'linear-gradient(100deg,#00e5ff,#4ff0ff)' } : {}}>{t.label}</button>
        ))}
        <button onClick={() => { setEditing(blank()); setIsNew(true); }} className="btn-cyber text-xs py-2 px-4 ml-auto" data-testid="promo-add-btn"><Plus className="w-4 h-4" /> Tambah</button>
      </div>

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="w-7 h-7 animate-spin text-cyan-400" /></div>
        : items.length === 0 ? <Empty text="Belum ada item." /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.id} className="panel rounded-xl p-4">
              {tab === 'banners' ? (
                <>
                  <div className="h-20 rounded-lg mb-3 relative overflow-hidden" style={{ background: '#0b0e26' }}>
                    {it.image && <img src={imgUrl(it.image)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />}
                    <div className="absolute inset-0 grid place-items-center"><span className="font-display font-900 text-white text-sm drop-shadow">{it.title}</span></div>
                  </div>
                  <p className="text-[11px] text-cyan-300">{it.tag}</p>
                  <p className="text-sm text-slate-300">{it.subtitle}</p>
                </>
              ) : (
                <>
                  <p className="font-head font-bold text-white">{it.gameSlug}</p>
                  <p className="text-sm text-cyan-300">{it.denomId}{tab === 'flashsale' ? ` · -${it.discount}%` : ''}</p>
                </>
              )}
              {!it.active && <span className="chip bg-slate-700 text-slate-300 mt-2 inline-block">Off</span>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => { setEditing({ ...it }); setIsNew(false); }} className="btn-ghost-cyber text-xs py-2 px-3 flex-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => remove(it)} className="w-9 h-9 grid place-items-center rounded-lg border border-rose-400/40 text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'Tambah Promosi' : 'Edit Promosi'} onSave={save} saving={saving}>
        {editing && tab === 'banners' && (
          <>
            <ImagePicker label="Gambar Banner" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })}
              recommended={{ w: 1600, h: 600 }} mode="cover" aspect="aspect-[8/3]" testId="banner-image"
              note="1600×600px. Teks banner otomatis diberi gradasi agar tetap terbaca." />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tag" value={editing.tag} onChange={(v) => setEditing({ ...editing, tag: v })} />
              <Field label="Urutan" type="number" value={editing.order} onChange={(v) => setEditing({ ...editing, order: v })} />
            </div>
            <Field label="Judul" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
            <Field label="Subjudul" value={editing.subtitle} onChange={(v) => setEditing({ ...editing, subtitle: v })} />
            <SelectField label="Game Tujuan" value={editing.game} onChange={(v) => setEditing({ ...editing, game: v })} options={gameOpts} />
            <ToggleRow label="Aktif" checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} />
          </>
        )}
        {editing && tab !== 'banners' && (
          <>
            <SelectField label="Game" value={editing.gameSlug} onChange={(v) => setEditing({ ...editing, gameSlug: v, denomId: '' })} options={gameOpts} />
            <SelectField label="Nominal" value={editing.denomId} onChange={(v) => setEditing({ ...editing, denomId: v })} options={[{ value: '', label: 'Pilih nominal' }, ...denomOpts(editing.gameSlug)]} />
            {tab === 'flashsale' && <Field label="Diskon (%)" type="number" value={editing.discount} onChange={(v) => setEditing({ ...editing, discount: v })} />}
            <ToggleRow label="Aktif" checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} />
          </>
        )}
      </Modal>
    </div>
  );
};

export default PromotionsAdmin;
