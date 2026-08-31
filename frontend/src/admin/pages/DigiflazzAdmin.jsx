import React, { useEffect, useState } from 'react';
import { Plug, Wallet, RefreshCw, Loader2, CheckCircle2, XCircle, Search, Copy, Check, Wand2, RotateCw, Save, KeyRound } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, Empty, Field, SelectField, ToggleRow } from '../ui';
import { rupiah } from '../../mock';
import { useToast } from '../../hooks/use-toast';

const DigiflazzAdmin = () => {
  const { getDigiflazz, saveDigiflazz, dgfBalance, dgfSync, dgfProducts, dgfAutomap, dgfRetryPending } = useAdmin();
  const { toast } = useToast();
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ username: '', devKey: '', prodKey: '', mode: 'development', webhookSecret: '', enabled: true });
  const [saving, setSaving] = useState(false);
  const [balance, setBalance] = useState(null);
  const [loadingBal, setLoadingBal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mapping, setMapping] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);

  const loadStatus = () => getDigiflazz().then((d) => {
    setStatus(d);
    setForm({ username: d.username || '', devKey: '', prodKey: '', mode: d.mode || 'development', webhookSecret: '', enabled: !!d.enabled });
  }).catch(() => {});

  useEffect(() => { loadStatus(); dgfProducts().then(setProducts).catch(() => {}); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { username: form.username, mode: form.mode, enabled: form.enabled };
      if (form.devKey.trim()) payload.devKey = form.devKey.trim();
      if (form.prodKey.trim()) payload.prodKey = form.prodKey.trim();
      if (form.webhookSecret.trim()) payload.webhookSecret = form.webhookSecret.trim();
      const d = await saveDigiflazz(payload);
      setStatus(d);
      setForm((f) => ({ ...f, devKey: '', prodKey: '', webhookSecret: '' }));
      toast({ title: 'Kredensial Digiflazz disimpan', description: d.configured ? 'Siap dipakai. Coba Cek Saldo.' : 'Masih ada field yang kosong.' });
    } catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const loadBalance = async () => {
    setLoadingBal(true);
    try { const b = await dgfBalance(); setBalance(b?.deposit ?? b); toast({ title: 'Koneksi Digiflazz OK' }); }
    catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setLoadingBal(false); }
  };

  const sync = async () => {
    setSyncing(true);
    try { const r = await dgfSync(); toast({ title: 'Sinkron berhasil', description: `${r.count} produk diperbarui.` }); dgfProducts().then(setProducts); }
    catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setSyncing(false); }
  };

  const automap = async () => {
    setMapping(true);
    try { const r = await dgfAutomap(); toast({ title: 'Auto-Map selesai', description: `${r.mapped} nominal dicocokkan ke SKU Digiflazz + harga jual diperbarui.` }); }
    catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setMapping(false); }
  };

  const retry = async () => {
    setRetrying(true);
    try { const r = await dgfRetryPending(); toast({ title: 'Cek pending selesai', description: `${r.checked} pesanan pending dicek ulang.` }); }
    catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setRetrying(false); }
  };

  const webhookUrl = `${process.env.REACT_APP_BACKEND_URL}/api/webhooks/digiflazz`;
  const copyWebhook = () => { navigator.clipboard.writeText(webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const filtered = products.filter((p) => !q || (p.product_name || '').toLowerCase().includes(q.toLowerCase()) || (p.buyer_sku_code || '').toLowerCase().includes(q.toLowerCase()) || (p.brand || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageTitle icon={Plug} title="Integrasi Digiflazz" desc="Isi kredensial H2H, sinkron produk, cek saldo, dan proses otomatis." />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="panel rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-cyan-300" />
            <p className="font-head font-bold text-white">Kredensial Digiflazz</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="username Digiflazz" />
            <SelectField label="Mode" value={form.mode} onChange={(v) => setForm({ ...form, mode: v })}
              options={[{ value: 'development', label: 'Development (testing)' }, { value: 'production', label: 'Production (transaksi nyata)' }]} />
            <Field label="Development Key" type="password" value={form.devKey} onChange={(v) => setForm({ ...form, devKey: v })} placeholder={status?.hasDevKey ? `Tersimpan: ${status.devKeyMasked}` : 'API key development'} />
            <Field label="Production Key" type="password" value={form.prodKey} onChange={(v) => setForm({ ...form, prodKey: v })} placeholder={status?.hasProdKey ? `Tersimpan: ${status.prodKeyMasked}` : 'API key production'} />
            <Field label="Webhook Secret" type="password" value={form.webhookSecret} onChange={(v) => setForm({ ...form, webhookSecret: v })} placeholder={status?.webhookConfigured ? `Tersimpan: ${status.webhookSecretMasked}` : 'secret dari panel Digiflazz'} />
            <div className="flex items-end pb-2"><div className="w-full"><ToggleRow label="Aktifkan Digiflazz" checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} /></div></div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <p className="text-[11px] text-slate-500">Key disimpan di database dan tidak pernah ditampilkan penuh. Kosongkan untuk mempertahankan key lama.</p>
            <button onClick={save} disabled={saving} className="btn-cyber text-sm ml-auto shrink-0" data-testid="dgf-save-btn">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Simpan</>}</button>
          </div>
        </div>

        <div className="panel rounded-xl p-5">
          <p className="font-head font-bold text-white mb-3">Status Koneksi</p>
          {status ? (
            <div className="space-y-2 text-sm" data-testid="dgf-status">
              <Row label="Terkonfigurasi" ok={status.configured} />
              <Row label="Aktif" ok={status.enabled} />
              <div className="flex justify-between"><span className="text-slate-400">Mode</span><span className="chip border border-cyan-400/40 text-cyan-200">{status.mode}</span></div>
              <Row label="Development Key" ok={status.hasDevKey} />
              <Row label="Production Key" ok={status.hasProdKey} />
              <Row label="Webhook Secret" ok={status.webhookConfigured} />
            </div>
          ) : <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />}
          <div className="cyber-line my-4" />
          <p className="font-head font-bold text-white mb-2 flex items-center gap-2 text-sm"><Wallet className="w-4 h-4 text-cyan-300" /> Saldo</p>
          <p className="font-display font-900 text-2xl neon-cyan">{balance != null ? rupiah(balance) : '—'}</p>
          <button onClick={loadBalance} disabled={loadingBal} className="btn-ghost-cyber text-xs mt-3 w-full" data-testid="dgf-balance-btn">{loadingBal ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Tes Koneksi / Cek Saldo</>}</button>
        </div>
      </div>

      <div className="panel rounded-xl p-5 mb-6">
        <p className="font-head font-bold text-white mb-3">Otomasi</p>
        <p className="text-sm text-slate-400 mb-3">{products.length} produk tersimpan di katalog Digiflazz.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={sync} disabled={syncing} className="btn-cyber text-xs py-2.5 px-3">{syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Sinkron Harga</>}</button>
          <button onClick={automap} disabled={mapping} className="btn-ghost-cyber text-xs py-2.5 px-3">{mapping ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4" /> Auto-Map SKU</>}</button>
          <button onClick={retry} disabled={retrying} className="btn-ghost-cyber text-xs py-2.5 px-3">{retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCw className="w-4 h-4" /> Cek Pending</>}</button>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">Auto-Map mencocokkan nominal game ke SKU + menerapkan margin harga (atur di Pengaturan). Pesanan pending dicek ulang otomatis tiap 2 menit.</p>
      </div>

      <div className="panel rounded-xl p-4 mb-6">
        <p className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider mb-2">URL Webhook (tempel di panel Digiflazz)</p>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)]">
          <code className="text-xs text-cyan-300 flex-1 truncate">{webhookUrl}</code>
          <button onClick={copyWebhook} className="w-8 h-8 grid place-items-center rounded-md border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-head font-bold text-white">Katalog Produk Digiflazz</h3>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] focus-within:border-cyan-400/60">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari produk / SKU / brand" className="bg-transparent outline-none text-sm w-56" />
        </div>
      </div>
      {products.length === 0 ? <Empty text="Belum ada produk. Isi kredensial lalu klik Sinkron Harga." /> : (
        <div className="panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0"><tr className="text-left text-slate-400 text-xs uppercase font-head bg-[#0b0e26]">
                <th className="py-2.5 px-3">Produk</th><th className="py-2.5 px-3">Brand</th><th className="py-2.5 px-3">SKU</th><th className="py-2.5 px-3">Harga</th><th className="py-2.5 px-3">Status</th>
              </tr></thead>
              <tbody>
                {filtered.slice(0, 300).map((p) => (
                  <tr key={p.buyer_sku_code} className="border-t border-[rgba(120,130,220,0.1)]">
                    <td className="py-2 px-3 text-slate-200">{p.product_name}</td>
                    <td className="py-2 px-3 text-slate-400">{p.brand}</td>
                    <td className="py-2 px-3 text-cyan-300 font-mono text-xs">{p.buyer_sku_code}</td>
                    <td className="py-2 px-3 text-white font-semibold">{rupiah(p.price)}</td>
                    <td className="py-2 px-3">{(p.buyer_product_status && p.seller_product_status) ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}</td>
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

const Row = ({ label, ok }) => (
  <div className="flex justify-between items-center">
    <span className="text-slate-400">{label}</span>
    {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
  </div>
);

export default DigiflazzAdmin;
