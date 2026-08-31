import React, { useEffect, useState } from 'react';
import { CreditCard, Loader2, Save, CheckCircle2, XCircle, Copy, Check, PlugZap, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, Field, SelectField, ToggleRow, Empty } from '../ui';
import { useToast } from '../../hooks/use-toast';
import { rupiah } from '../../mock';

const MidtransAdmin = () => {
  const { getMidtrans, saveMidtrans, testMidtrans, listMidtransTx, refreshMidtransTx } = useAdmin();
  const { toast } = useToast();
  const [st, setSt] = useState(null);
  const [form, setForm] = useState({ serverKey: '', clientKey: '', isProduction: false, enabled: true });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [txs, setTxs] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(null);

  const notifUrl = `${process.env.REACT_APP_BACKEND_URL}/api/payments/midtrans/notification`;

  const loadStatus = () => getMidtrans().then((d) => {
    setSt(d);
    setForm({ serverKey: '', clientKey: d.clientKey || '', isProduction: !!d.isProduction, enabled: !!d.enabled });
  }).catch(() => {});
  const loadTx = () => { setLoadingTx(true); listMidtransTx().then((d) => { setTxs(d); setLoadingTx(false); }).catch(() => setLoadingTx(false)); };

  useEffect(() => { loadStatus(); loadTx(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { clientKey: form.clientKey, isProduction: form.isProduction, enabled: form.enabled };
      if (form.serverKey.trim()) payload.serverKey = form.serverKey.trim();
      const d = await saveMidtrans(payload);
      setSt(d); setForm((f) => ({ ...f, serverKey: '' }));
      toast({ title: 'Midtrans disimpan', description: `Mode ${d.mode}. Perubahan langsung aktif.` });
    } catch (e) { toast({ title: 'Gagal menyimpan', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const test = async () => {
    setTesting(true);
    try { const r = await testMidtrans(); toast({ title: 'Koneksi berhasil', description: r.message }); }
    catch (e) { toast({ title: 'Koneksi gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setTesting(false); }
  };

  const refresh = async (orderId) => {
    setRefreshing(orderId);
    try { await refreshMidtransTx(orderId); toast({ title: 'Status diperbarui' }); loadTx(); }
    catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setRefreshing(null); }
  };

  const copy = () => { navigator.clipboard.writeText(notifUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div>
      <PageTitle icon={CreditCard} title="Payment Gateway - Midtrans" desc="Kelola Server Key, Client Key, mode sandbox/production, dan pantau transaksi." />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="panel rounded-xl p-5">
          <p className="font-head font-bold text-white mb-3">Status</p>
          {st ? (
            <div className="space-y-2 text-sm" data-testid="midtrans-status">
              <Row label="Terkonfigurasi" ok={st.configured} />
              <Row label="Aktif" ok={st.enabled} />
              <div className="flex justify-between"><span className="text-slate-400">Mode</span><span className={`chip border ${st.isProduction ? 'border-rose-400/50 text-rose-200' : 'border-cyan-400/40 text-cyan-200'}`}>{st.mode}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Server Key</span><span className="text-slate-300 font-mono text-[11px]">{st.serverKeyMasked || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Client Key</span><span className="text-slate-300 font-mono text-[11px] truncate max-w-[130px]">{st.clientKey || '—'}</span></div>
            </div>
          ) : <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />}
          {st?.isProduction && (
            <p className="text-[11px] text-amber-300 mt-3 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Mode production: setiap pembayaran memakai uang nyata.</p>
          )}
          <button onClick={test} disabled={testing} className="btn-cyber text-xs mt-4 w-full" data-testid="midtrans-test-btn">
            {testing ? <><Loader2 className="w-4 h-4 animate-spin" /> Menguji...</> : <><PlugZap className="w-4 h-4" /> Tes Koneksi</>}
          </button>
        </div>

        <div className="panel rounded-xl p-5 lg:col-span-2">
          <p className="font-head font-bold text-white mb-4">Kredensial</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Server Key (rahasia)" type="password" value={form.serverKey} onChange={(v) => setForm({ ...form, serverKey: v })} placeholder={st?.serverKeyMasked ? `Tersimpan: ${st.serverKeyMasked}` : 'Mid-server-xxxx / SB-Mid-server-xxxx'} />
            <Field label="Client Key" value={form.clientKey} onChange={(v) => setForm({ ...form, clientKey: v })} placeholder="Mid-client-xxxx / SB-Mid-client-xxxx" />
            <SelectField label="Mode" value={form.isProduction ? 'production' : 'sandbox'} onChange={(v) => setForm({ ...form, isProduction: v === 'production' })}
              options={[{ value: 'sandbox', label: 'Sandbox (uji coba)' }, { value: 'production', label: 'Production (uang nyata)' }]} />
            <div className="flex items-end pb-2"><div className="w-full"><ToggleRow label="Aktifkan Midtrans" checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} /></div></div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <p className="text-[11px] text-slate-500">Server Key hanya dipakai di server dan tidak pernah dikirim ke browser. Kosongkan untuk mempertahankan key lama.</p>
            <button onClick={save} disabled={saving} className="btn-cyber text-sm ml-auto shrink-0" data-testid="midtrans-save-btn">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Simpan</>}</button>
          </div>
        </div>
      </div>

      <div className="panel rounded-xl p-4 mb-6">
        <p className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider mb-2">Payment Notification URL (tempel di dashboard Midtrans → Settings → Configuration)</p>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)]">
          <code className="text-xs text-cyan-300 flex-1 truncate">{notifUrl}</code>
          <button onClick={copy} className="w-8 h-8 grid place-items-center rounded-md border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
        </div>
        <a href="https://dashboard.midtrans.com/settings/config_info" target="_blank" rel="noreferrer" className="text-[11px] text-cyan-300 hover:underline mt-2 inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Buka dashboard Midtrans</a>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-head font-bold text-white">Transaksi Midtrans</h3>
        <button onClick={loadTx} className="btn-ghost-cyber text-[11px] py-1.5 px-3 ml-auto"><RefreshCw className="w-3.5 h-3.5" /> Muat Ulang</button>
      </div>
      {loadingTx ? <div className="grid place-items-center py-12"><Loader2 className="w-6 h-6 animate-spin text-cyan-400" /></div>
        : txs.length === 0 ? <Empty text="Belum ada transaksi Midtrans." /> : (
        <div className="panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="midtrans-tx-table">
              <thead><tr className="text-left text-slate-400 text-xs uppercase font-head bg-[#0b0e26]">
                <th className="py-2.5 px-3">Order ID</th><th className="py-2.5 px-3">Invoice</th><th className="py-2.5 px-3">Jumlah</th>
                <th className="py-2.5 px-3">Status</th><th className="py-2.5 px-3">Channel</th><th className="py-2.5 px-3">Mode</th><th className="py-2.5 px-3"></th>
              </tr></thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.order_id} className="border-t border-[rgba(120,130,220,0.1)]">
                    <td className="py-2 px-3 font-mono text-xs text-cyan-300">{t.order_id}</td>
                    <td className="py-2 px-3 text-slate-300">{t.invoice}</td>
                    <td className="py-2 px-3 text-white font-semibold">{rupiah(t.amount)}</td>
                    <td className="py-2 px-3"><span className={`chip border ${t.payment_status === 'paid' ? 'border-emerald-400/40 text-emerald-300' : t.payment_status === 'pending' ? 'border-amber-400/40 text-amber-300' : 'border-rose-400/40 text-rose-300'}`}>{t.payment_status}</span></td>
                    <td className="py-2 px-3 text-slate-400 text-xs">{t.midtrans?.payment_type || '—'}</td>
                    <td className="py-2 px-3 text-slate-500 text-xs">{t.mode}</td>
                    <td className="py-2 px-3 text-right"><button onClick={() => refresh(t.order_id)} disabled={refreshing === t.order_id} className="text-cyan-300 hover:text-cyan-200">{refreshing === t.order_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}</button></td>
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

export default MidtransAdmin;
