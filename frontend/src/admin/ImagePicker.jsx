import React, { useEffect, useRef, useState } from 'react';
import { Upload, Images, Link2, Trash2, Loader2, Check } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../hooks/use-toast';
import { imgUrl, resizeImageFile } from '../lib/img';
import { Modal } from './ui';

/**
 * Reusable image field: upload (auto-resized to the recommended size for the
 * spot it will be shown in), pick from the media library, or paste a URL.
 */
const ImagePicker = ({ label, value, onChange, recommended = { w: 800, h: 800 }, mode = 'cover', note, aspect = 'aspect-video', testId }) => {
  const { uploadMedia, listMedia } = useAdmin();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [urlMode, setUrlMode] = useState(false);

  useEffect(() => { if (galleryOpen) listMedia().then(setItems).catch(() => setItems([])); }, [galleryOpen]);

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { dataUrl, width, height } = await resizeImageFile(file, { maxW: recommended.w, maxH: recommended.h, mode });
      const saved = await uploadMedia({ name: file.name, dataUrl, width, height, usage: label });
      onChange(saved.url);
      toast({ title: 'Gambar diunggah', description: `${saved.name} · ${width || '?'}×${height || '?'} px` });
    } catch (err) {
      toast({ title: 'Gagal mengunggah', description: err?.response?.data?.detail || err.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">{label}</label>
        <span className="text-[10px] text-slate-500">Disarankan {recommended.w}×{recommended.h}px</span>
      </div>
      <div className={`mt-1.5 ${aspect} w-full rounded-lg border border-[rgba(120,130,220,0.25)] bg-[#0b0e26] overflow-hidden relative grid place-items-center`}>
        {value ? (
          <img src={imgUrl(value)} alt={label} className="w-full h-full object-contain" />
        ) : (
          <span className="text-[11px] text-slate-500">Belum ada gambar</span>
        )}
        {busy && <div className="absolute inset-0 bg-black/60 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-cyan-300" /></div>}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" data-testid={testId ? `${testId}-file` : undefined} />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="btn-cyber text-[11px] py-2 px-3" data-testid={testId ? `${testId}-upload` : undefined}><Upload className="w-3.5 h-3.5" /> Unggah</button>
        <button type="button" onClick={() => setGalleryOpen(true)} className="btn-ghost-cyber text-[11px] py-2 px-3" data-testid={testId ? `${testId}-gallery` : undefined}><Images className="w-3.5 h-3.5" /> Galeri</button>
        <button type="button" onClick={() => setUrlMode((v) => !v)} className="btn-ghost-cyber text-[11px] py-2 px-3"><Link2 className="w-3.5 h-3.5" /> URL</button>
        {value && <button type="button" onClick={() => onChange('')} className="w-8 h-8 grid place-items-center rounded-lg border border-rose-400/40 text-rose-400 hover:bg-rose-500/10"><Trash2 className="w-3.5 h-3.5" /></button>}
      </div>
      {urlMode && (
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://... atau /api/media/xxx"
          className="mt-2 w-full px-3 py-2 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-xs outline-none focus:border-cyan-400/60" />
      )}
      {note && <p className="text-[10px] text-slate-500 mt-1.5">{note}</p>}

      <Modal open={galleryOpen} onClose={() => setGalleryOpen(false)} title="Pilih dari Galeri">
        {items.length === 0 ? <p className="text-sm text-slate-400">Galeri masih kosong. Unggah gambar dulu.</p> : (
          <div className="grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto">
            {items.map((m) => (
              <button key={m.id} type="button" onClick={() => { onChange(m.url); setGalleryOpen(false); }}
                className="relative aspect-square rounded-lg overflow-hidden border border-[rgba(120,130,220,0.25)] hover:border-cyan-400 group bg-[#0b0e26]">
                <img src={imgUrl(m.url)} alt={m.name} className="w-full h-full object-cover" />
                {value === m.url && <span className="absolute top-1 right-1 w-5 h-5 grid place-items-center rounded-full bg-cyan-400 text-[#04121a]"><Check className="w-3 h-3" /></span>}
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-slate-200 truncate px-1 py-0.5">{m.width ? `${m.width}×${m.height}` : m.name}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImagePicker;
