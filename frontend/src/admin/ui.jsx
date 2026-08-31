import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Loader2, Plus } from 'lucide-react';

export const PageTitle = ({ icon: Icon, title, desc, action }) => (
  <div className="flex items-start gap-3 mb-6">
    <div className="w-11 h-11 grid place-items-center clip-corner shrink-0" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>
      <Icon className="w-5 h-5 text-[#04121a]" />
    </div>
    <div className="flex-1">
      <h1 className="font-display font-800 text-xl md:text-2xl text-white">{title}</h1>
      {desc && <p className="text-sm text-slate-400">{desc}</p>}
    </div>
    {action}
  </div>
);

export const AddButton = ({ onClick, label = 'Tambah' }) => (
  <button onClick={onClick} className="btn-cyber text-xs py-2.5 px-4"><Plus className="w-4 h-4" /> {label}</button>
);

export const Field = ({ label, value, onChange, type = 'text', placeholder, textarea }) => (
  <div>
    <label className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">{label}</label>
    {textarea ? (
      <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="mt-1 w-full px-3 py-2.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-sm outline-none focus:border-cyan-400/60" />
    ) : (
      <input type={type} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-sm outline-none focus:border-cyan-400/60" />
    )}
  </div>
);

export const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">{label}</label>
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full px-3 py-2.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-sm outline-none focus:border-cyan-400/60">
      {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

export const ToggleRow = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between">
    {label && <span className="text-sm text-slate-300 font-head">{label}</span>}
    <Switch checked={!!checked} onCheckedChange={onChange} />
  </div>
);

export const Modal = ({ open, onClose, title, children, onSave, saving, saveLabel = 'Simpan' }) => (
  <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
    <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="font-display">{title}</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">{children}</div>
      {onSave && (
        <DialogFooter>
          <button onClick={onClose} className="btn-ghost-cyber text-xs">Batal</button>
          <button onClick={onSave} disabled={saving} className="btn-cyber text-xs py-2.5 px-4">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveLabel}</button>
        </DialogFooter>
      )}
    </DialogContent>
  </Dialog>
);

export const StatusPill = ({ status }) => {
  const map = {
    success: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/10',
    pending: 'text-amber-300 border-amber-400/40 bg-amber-400/10',
    failed: 'text-rose-300 border-rose-400/40 bg-rose-400/10',
  };
  return <span className={`chip border ${map[status] || map.pending}`}>{status}</span>;
};

export const Empty = ({ text }) => (
  <div className="panel rounded-xl p-10 text-center text-slate-400">{text}</div>
);
