import React, { useEffect, useRef, useState } from 'react';
import { Images, Upload, Trash2, Loader2, Copy, Check, HardDrive } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, Empty, SelectField } from '../ui';
import { useToast } from '../../hooks/use-toast';
import { imgUrl, resizeImageFile } from '../../lib/img';

const PRESETS = [
  { value: 'logo', label: 'Logo situs (240×64)', w: 240, h: 64, mode: 'contain' },
  { value: 'favicon', label: 'Favicon (64×64)', w: 64, h: 64, mode: 'cover' },
  { value: 'cover', label: 'Cover game (512×512)', w: 512, h: 512, mode: 'cover' },
  { value: 'banner', label: 'Banner hero (1600×600)', w: 1600, h: 600, mode: 'cover' },
  { value: 'product', label: 'Kartu produk (800×600)', w: 800, h: 600, mode: 'cover' },
  { value: 'original', label: 'Asli (maks 1600px)', w: 1600, h: 1600, mode: 'contain' },
];

const MediaAdmin = () => {
  const { listMedia, uploadMedia, deleteMedia } = useAdmin();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [preset, setPreset] = useState('original');
  const [copied, setCopied] = useState(null);

  const load = () => { setLoading(true); listMedia().then((d) => { setItems(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const p = PRESETS.find((x) => x.value === preset) || PRESETS[5];

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    let ok = 0;
    for (const file of files) {
      try {
        const { dataUrl, width, height } = await resizeImageFile(file, { maxW: p.w, maxH: p.h, mode: p.mode });
        await uploadMedia({ name: file.name, dataUrl, width, height, usage: p.value });
        ok += 1;
      } catch (err) {
        toast({ title: `Gagal: ${file.name}`, description: err?.response?.data?.detail || err.message, variant: 'destructive' });
      }
    }
    setBusy(false);
    if (ok) toast({ title: `${ok} gambar diunggah`, description: `Diubah ke ukuran ${p.w}×${p.h}px.` });
    load();
  };

  const remove = async (m) => {
    if (!window.confirm(`Hapus ${m.name}?`)) return;
    await deleteMedia(m.id); toast({ title: 'Gambar dihapus' }); load();
  };

  const copy = (m) => { navigator.clipboard.writeText(m.url); setCopied(m.id); setTimeout(() => setCopied(null), 1500); };

  const totalKb = Math.round(items.reduce((s, m) => s + (m.size || 0), 0) / 1024);

  return (
    <div>
      <PageTitle icon={Images} title="Galeri Media" desc="Unggah logo, cover game, banner, dan foto produk. Ukuran otomatis disesuaikan." />

      <div className="panel rounded-xl p-5 mb-6">
        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <SelectField label="Ukuran Target" value={preset} onChange={setPreset} options={PRESETS.map((x) => ({ value: x.value, label: x.label }))} />
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={upload} className="hidden" data-testid="media-file-input" />
            <button onClick={() => fileRef.current?.click()} disabled={busy} className="btn-cyber text-sm" data-testid="media-upload-btn">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengunggah...</> : <><Upload className="w-4 h-4" /> Unggah Gambar</>}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> {items.length} gambar · {totalKb} KB terpakai · maks 3 MB per gambar (JPG, PNG, WebP, SVG).</p>
      </div>

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="w-7 h-7 animate-spin text-cyan-400" /></div>
        : items.length === 0 ? <Empty text="Galeri masih kosong. Unggah gambar pertama kamu." /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="media-grid">
          {items.map((m) => (
            <div key={m.id} className="panel rounded-xl overflow-hidden">
              <div className="aspect-video bg-[#0b0e26] grid place-items-center">
                <img src={imgUrl(m.url)} alt={m.name} className="w-full h-full object-contain" />
              </div>
              <div className="p-3">
                <p className="text-xs font-head font-bold text-white truncate">{m.name}</p>
                <p className="text-[10px] text-slate-400">{m.width ? `${m.width}×${m.height} px · ` : ''}{Math.round((m.size || 0) / 1024)} KB{m.usage ? ` · ${m.usage}` : ''}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => copy(m)} className="btn-ghost-cyber text-[11px] py-1.5 px-2 flex-1">{copied === m.id ? <><Check className="w-3 h-3" /> Tersalin</> : <><Copy className="w-3 h-3" /> URL</>}</button>
                  <button onClick={() => remove(m)} className="w-7 h-7 grid place-items-center rounded-md border border-rose-400/40 text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaAdmin;
