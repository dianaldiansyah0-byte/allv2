import React, { useEffect, useState } from 'react';
import { Gamepad2, Pencil, Trash2, Loader2, Plus, X } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, AddButton, Field, Modal, ToggleRow, Empty } from '../ui';
import ImagePicker from '../ImagePicker';
import { rupiah } from '../../mock';
import { imgUrl } from '../../lib/img';
import { useToast } from '../../hooks/use-toast';

const blank = () => ({ slug: '', name: '', publisher: '', category: '', unit: '', badge: '', priceFrom: 0, grad: 'linear-gradient(145deg,#00e5ff,#7c3aed)', image: '', banner: '', description: '', howTo: '', notes: '', popular: false, active: true, fields: [{ key: 'userId', label: 'User ID', placeholder: 'ID akun' }], denoms: [] });

const GamesAdmin = () => {
  const { listGames, createGame, updateGame, deleteGame } = useAdmin();
  const { toast } = useToast();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('info');

  const load = () => { setLoading(true); listGames().then((d) => { setGames(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(blank()); setIsNew(true); setTab('info'); };
  const openEdit = (g) => { setEditing({ ...blank(), ...JSON.parse(JSON.stringify(g)) }); setIsNew(false); setTab('info'); };

  const save = async () => {
    if (!editing.slug || !editing.name) { toast({ title: 'Slug & nama wajib', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (isNew) await createGame(editing); else await updateGame(editing.slug, editing);
      toast({ title: 'Tersimpan', description: `${editing.name} berhasil disimpan.` });
      setEditing(null); load();
    } catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const remove = async (g) => {
    if (!window.confirm(`Hapus game ${g.name}?`)) return;
    await deleteGame(g.slug); toast({ title: 'Dihapus' }); load();
  };

  const setDenom = (i, key, val) => { const d = [...editing.denoms]; d[i] = { ...d[i], [key]: val }; setEditing({ ...editing, denoms: d }); };
  const addDenom = () => setEditing({ ...editing, denoms: [...editing.denoms, { id: `${editing.slug || 'd'}-${editing.denoms.length + 1}`, name: '', amount: 0, price: 0, tag: '' }] });
  const rmDenom = (i) => setEditing({ ...editing, denoms: editing.denoms.filter((_, idx) => idx !== i) });

  const setField = (i, key, val) => { const f = [...(editing.fields || [])]; f[i] = { ...f[i], [key]: val }; setEditing({ ...editing, fields: f }); };
  const addField = () => setEditing({ ...editing, fields: [...(editing.fields || []), { key: '', label: '', placeholder: '' }] });
  const rmField = (i) => setEditing({ ...editing, fields: (editing.fields || []).filter((_, idx) => idx !== i) });

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;

  const TABS = [{ id: 'info', label: 'Info' }, { id: 'media', label: 'Gambar' }, { id: 'detail', label: 'Detail & Panduan' }, { id: 'denoms', label: 'Nominal' }, { id: 'fields', label: 'Form Akun' }];

  return (
    <div>
      <PageTitle icon={Gamepad2} title="Game & Nominal" desc="Kelola daftar game, cover, detail informasi, dan denominasi harga." action={<AddButton onClick={openNew} label="Game Baru" />} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((g) => (
          <div key={g.slug} className="panel rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg grid place-items-center overflow-hidden shrink-0" style={{ background: g.grad }}>
                {g.image ? <img src={imgUrl(g.image)} alt={g.name} className="w-full h-full object-cover" />
                  : <span className="font-display font-900 text-white text-xs">{g.badge}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-head font-bold text-white truncate">{g.name}</p>
                <p className="text-[11px] text-slate-400">{g.denoms?.length || 0} nominal · {g.category}</p>
              </div>
              {!g.active && <span className="chip bg-slate-700 text-slate-300">Off</span>}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => openEdit(g)} className="btn-ghost-cyber text-xs py-2 px-3 flex-1" data-testid={`edit-game-${g.slug}`}><Pencil className="w-3.5 h-3.5" /> Edit</button>
              <button onClick={() => remove(g)} className="w-9 h-9 grid place-items-center rounded-lg border border-rose-400/40 text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
      {games.length === 0 && <Empty text="Belum ada game." />}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'Tambah Game' : `Edit ${editing?.name}`} onSave={save} saving={saving}>
        {editing && (
          <>
            <div className="flex gap-1.5 flex-wrap">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-md text-[11px] font-head font-bold ${tab === t.id ? 'text-[#04121a]' : 'text-slate-300 border border-[rgba(120,130,220,0.2)]'}`} style={tab === t.id ? { background: 'linear-gradient(100deg,#00e5ff,#4ff0ff)' } : {}}>{t.label}</button>
              ))}
            </div>

            {tab === 'info' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nama" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
                  <Field label="Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} placeholder="mobile-legends" />
                  <Field label="Publisher" value={editing.publisher} onChange={(v) => setEditing({ ...editing, publisher: v })} />
                  <Field label="Kategori" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} />
                  <Field label="Unit" value={editing.unit} onChange={(v) => setEditing({ ...editing, unit: v })} placeholder="Diamonds" />
                  <Field label="Badge" value={editing.badge} onChange={(v) => setEditing({ ...editing, badge: v })} placeholder="ML" />
                  <Field label="Harga Mulai" type="number" value={editing.priceFrom} onChange={(v) => setEditing({ ...editing, priceFrom: v })} />
                  <Field label="Brand Digiflazz" value={editing.digiflazzBrand} onChange={(v) => setEditing({ ...editing, digiflazzBrand: v })} placeholder="Mobile Legends" />
                </div>
                <Field label="Gradient (CSS)" value={editing.grad} onChange={(v) => setEditing({ ...editing, grad: v })} />
                <div className="h-8 rounded-lg" style={{ background: editing.grad }} />
                <div className="grid grid-cols-2 gap-3">
                  <ToggleRow label="Populer (HOT)" checked={editing.popular} onChange={(v) => setEditing({ ...editing, popular: v })} />
                  <ToggleRow label="Aktif" checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} />
                </div>
              </>
            )}

            {tab === 'media' && (
              <div className="space-y-5">
                <ImagePicker label="Cover Game (kartu)" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })}
                  recommended={{ w: 512, h: 512 }} mode="cover" aspect="aspect-square" testId="game-cover"
                  note="Persegi 512×512px. Dipakai di kartu game beranda & pencarian." />
                <ImagePicker label="Banner Halaman Game" value={editing.banner} onChange={(v) => setEditing({ ...editing, banner: v })}
                  recommended={{ w: 1600, h: 600 }} mode="cover" aspect="aspect-[8/3]" testId="game-banner"
                  note="Lebar 1600×600px. Tampil sebagai header halaman detail game." />
              </div>
            )}

            {tab === 'detail' && (
              <div className="space-y-3">
                <Field label="Deskripsi Game" textarea value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} placeholder="Ceritakan tentang game & layanan top up-nya..." />
                <Field label="Cara Top Up (satu langkah per baris)" textarea value={editing.howTo} onChange={(v) => setEditing({ ...editing, howTo: v })} placeholder={'Masukkan User ID & Zone ID\nPilih nominal diamond\nPilih metode pembayaran\nBayar & item masuk otomatis'} />
                <Field label="Catatan Penting" textarea value={editing.notes} onChange={(v) => setEditing({ ...editing, notes: v })} placeholder="Contoh: pastikan User ID benar, item tidak bisa dikembalikan." />
              </div>
            )}

            {tab === 'denoms' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">Nominal / Denominasi</span>
                  <button onClick={addDenom} className="chip border border-cyan-400/40 text-cyan-200 flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {editing.denoms.map((d, i) => (
                    <div key={d.id || `denom-${i}`} className="flex items-center gap-2 bg-[#0b0e26] rounded-lg p-2 border border-[rgba(120,130,220,0.15)]">
                      <input value={d.name} onChange={(e) => setDenom(i, 'name', e.target.value)} placeholder="86 Diamonds" className="bg-transparent outline-none text-xs w-24 text-white" />
                      <input type="number" value={d.price} onChange={(e) => setDenom(i, 'price', Number(e.target.value))} placeholder="harga" className="bg-transparent outline-none text-xs w-16 text-cyan-300" />
                      <input value={d.tag || ''} onChange={(e) => setDenom(i, 'tag', e.target.value)} placeholder="tag" className="bg-transparent outline-none text-xs w-12 text-slate-400" />
                      <input value={d.buyerSkuCode || ''} onChange={(e) => setDenom(i, 'buyerSkuCode', e.target.value)} placeholder="SKU Digiflazz" className="bg-transparent outline-none text-xs w-28 text-fuchsia-300" title="buyer_sku_code Digiflazz" />
                      <button onClick={() => rmDenom(i)} className="ml-auto text-rose-400"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {editing.denoms.length === 0 && <p className="text-xs text-slate-500">Belum ada nominal.</p>}
                </div>
              </div>
            )}

            {tab === 'fields' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">Field Data Akun</span>
                  <button onClick={addField} className="chip border border-cyan-400/40 text-cyan-200 flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(editing.fields || []).map((f, i) => (
                    <div key={`fld-${i}`} className="flex items-center gap-2 bg-[#0b0e26] rounded-lg p-2 border border-[rgba(120,130,220,0.15)]">
                      <input value={f.key || ''} onChange={(e) => setField(i, 'key', e.target.value)} placeholder="key" className="bg-transparent outline-none text-xs w-20 text-fuchsia-300" />
                      <input value={f.label || ''} onChange={(e) => setField(i, 'label', e.target.value)} placeholder="Label" className="bg-transparent outline-none text-xs w-24 text-white" />
                      <input value={f.placeholder || ''} onChange={(e) => setField(i, 'placeholder', e.target.value)} placeholder="contoh isian" className="bg-transparent outline-none text-xs flex-1 text-slate-400" />
                      <button onClick={() => rmField(i)} className="text-rose-400"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Field ini yang harus diisi pembeli di halaman game (mis. User ID, Zone ID).</p>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default GamesAdmin;
