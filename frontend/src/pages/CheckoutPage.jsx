import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QrCode, Copy, Check, Clock, ShieldCheck, Loader2, CheckCircle2, Home, ReceiptText, Wallet, AlertTriangle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCatalog } from '../context/CatalogContext';
import { rupiah } from '../mock';
import { useToast } from '../hooks/use-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/** Loads Midtrans Snap.js once, using the client key from the backend. */
const useSnap = () => {
  const [cfg, setCfg] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const res = await axios.get(`${API}/payments/config`);
        if (cancelled) return;
        setCfg(res.data);
        if (!res.data?.enabled || !res.data?.clientKey) return;
        if (window.snap) { setReady(true); return; }
        const existing = document.getElementById('midtrans-snap');
        if (existing) {
          existing.addEventListener('load', () => setReady(true));
          return;
        }
        const script = document.createElement('script');
        script.id = 'midtrans-snap';
        script.src = res.data.snapJsUrl;
        script.setAttribute('data-client-key', res.data.clientKey);
        script.async = true;
        script.onload = () => { if (!cancelled) setReady(true); };
        script.onerror = () => console.error('Gagal memuat Midtrans Snap.js');
        document.body.appendChild(script);
      } catch (e) {
        console.error('Payment config failed:', e?.message || e);
      }
    };
    boot();
    return () => { cancelled = true; };
  }, []);

  return { cfg, ready };
};

const CheckoutPage = () => {
  const { invoice } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getOrder, payOrder } = useStore();
  const { settings } = useCatalog();
  const { cfg, ready } = useSnap();
  const [order, setOrder] = useState(null);
  const [paying, setPaying] = useState(false);
  const [snapLoading, setSnapLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const vaNumber = '8808' + (invoice || '').replace(/\D/g, '').slice(-10).padStart(10, '0');

  const reload = useCallback(async () => {
    const o = await getOrder(invoice);
    setOrder(o);
    return o;
  }, [invoice]);

  useEffect(() => { window.scrollTo(0, 0); reload(); }, [invoice]);

  // While a Snap payment is in-flight, poll the order until it flips to success
  useEffect(() => {
    if (!waiting) return;
    let tries = 0;
    const t = setInterval(async () => {
      tries += 1;
      const o = await reload();
      if (o?.status === 'success' || tries > 20) { setWaiting(false); clearInterval(t); }
    }, 3000);
    return () => clearInterval(t);
  }, [waiting, reload]);

  if (order === null) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-300">Memuat pesanan...</div>;
  if (!order) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-slate-300 mb-4">Pesanan tidak ditemukan.</p>
      <button onClick={() => navigate('/')} className="btn-ghost-cyber">Kembali ke Beranda</button>
    </div>
  );

  const isQris = order.paymentId === 'qris' || ['dana', 'gopay', 'ovo', 'shopeepay'].includes(order.paymentId);
  const success = order.status === 'success';
  const allowManual = settings?.allowManualPay !== false;

  const handlePay = async () => {
    setPaying(true);
    try {
      const updated = await payOrder(order.id);
      setOrder(updated);
      toast({ title: 'Pembayaran dikonfirmasi', description: 'Item sedang dikirim ke akunmu.' });
    } catch (e) {
      toast({ title: 'Gagal', description: e?.response?.data?.detail || e.message, variant: 'destructive' });
    } finally { setPaying(false); }
  };

  const copyVa = () => { navigator.clipboard.writeText(vaNumber); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const handleMidtrans = async () => {
    setSnapLoading(true);
    try {
      const res = await axios.post(`${API}/payments/checkout`, { invoice: order.invoice });
      const { token, redirectUrl, orderId } = res.data;
      if (!token) throw new Error('Token pembayaran tidak diterima.');
      if (window.snap && ready) {
        setSnapLoading(false);
        window.snap.pay(token, {
          language: 'id',
          onSuccess: () => { setWaiting(true); toast({ title: 'Pembayaran diterima', description: 'Menunggu konfirmasi dari Midtrans...' }); },
          onPending: () => { setWaiting(true); toast({ title: 'Menunggu pembayaran', description: 'Selesaikan pembayaran sesuai instruksi.' }); },
          onError: () => toast({ title: 'Pembayaran gagal', description: 'Silakan coba metode lain.', variant: 'destructive' }),
          onClose: () => toast({ title: 'Popup ditutup', description: `Pesanan ${orderId} masih menunggu pembayaran.` }),
        });
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error('Snap belum siap. Muat ulang halaman.');
      }
    } catch (e) {
      console.error('Midtrans checkout failed:', e?.message || e);
      toast({ title: 'Gagal', description: e?.response?.data?.detail || e.message || 'Tidak dapat memulai pembayaran.', variant: 'destructive' });
      setSnapLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="panel rounded-2xl p-8 text-center animate-float-up">
          <div className="w-20 h-20 mx-auto grid place-items-center rounded-full mb-5 animate-pulse-glow" style={{ background: 'linear-gradient(135deg,#00e5ff,#b6ff3c)' }}>
            <CheckCircle2 className="w-10 h-10 text-[#04121a]" />
          </div>
          <h1 className="font-display font-900 text-2xl text-white">Pembayaran Berhasil</h1>
          <p className="text-slate-400 mt-2">Pesanan <span className="text-cyan-300 font-semibold">{order.invoice}</span> berhasil diproses.</p>
          <div className="panel rounded-xl p-4 mt-6 text-left">
            <SumRow label="Game" value={order.gameName} />
            <SumRow label="Item" value={order.denomName} />
            <SumRow label="Total dibayar" value={rupiah(order.total)} />
            <SumRow label="Status" value={<span className="text-emerald-400">Sukses</span>} />
            {order.digiflazz?.sn && <SumRow label="Serial / SN" value={order.digiflazz.sn} />}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate('/transaksi')} className="btn-ghost-cyber flex-1"><ReceiptText className="w-4 h-4" /> Riwayat</button>
            <button onClick={() => navigate('/')} className="btn-cyber flex-1"><Home className="w-4 h-4" /> Beranda</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-display font-900 text-2xl text-white mb-1">Selesaikan Pembayaran</h1>
      <p className="text-slate-400 text-sm mb-6">Invoice <span className="text-cyan-300">{order.invoice}</span></p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="panel rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="chip text-[#04121a]" style={{ background: '#00e5ff' }}>{order.payment}</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-amber-300"><Clock className="w-4 h-4" /> {waiting ? 'Memverifikasi...' : 'Menunggu pembayaran'}</span>
          </div>

          <div className="rounded-xl p-4 border border-cyan-400/25 bg-cyan-400/5">
            <p className="font-head font-bold text-white text-sm">Bayar via Midtrans</p>
            <p className="text-[12px] text-slate-400 mt-1">Pilih {isQris ? 'QRIS / e-wallet' : 'Virtual Account, e-wallet, atau kartu'} langsung di jendela pembayaran resmi Midtrans.</p>
            <button onClick={handleMidtrans} disabled={snapLoading || waiting || cfg?.enabled === false} className="btn-cyber w-full mt-3" data-testid="pay-midtrans-btn">
              {snapLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyiapkan pembayaran...</> : <><Wallet className="w-4 h-4" /> Bayar {rupiah(order.total)}</>}
            </button>
            {cfg?.enabled === false && (
              <p className="text-[11px] text-amber-300 mt-2 flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Midtrans belum aktif. Hubungi admin toko.</p>
            )}
            {cfg?.mode === 'sandbox' && <p className="text-[11px] text-slate-500 mt-2">Mode sandbox: gunakan data pembayaran uji coba Midtrans.</p>}
          </div>

          <div className="cyber-line my-6" />

          {isQris ? (
            <div className="text-center">
              <div className="w-40 h-40 mx-auto bg-white rounded-xl grid place-items-center p-3 opacity-90">
                <QrCode className="w-full h-full text-black" />
              </div>
              <p className="text-sm text-slate-400 mt-3">QRIS resmi akan muncul di jendela Midtrans setelah kamu menekan tombol bayar.</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-head uppercase tracking-wider text-slate-400">Nomor Virtual Account (referensi)</p>
              <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)]">
                <span className="font-display font-bold text-cyan-300 text-lg tracking-wider flex-1">{vaNumber}</span>
                <button onClick={copyVa} className="w-9 h-9 grid place-items-center rounded-md border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
              </div>
              <p className="text-sm text-slate-400 mt-3">Nomor VA final diterbitkan oleh Midtrans di jendela pembayaran.</p>
            </div>
          )}

          {allowManual && (
            <>
              <div className="flex items-center gap-3 my-4"><div className="h-px flex-1 bg-[rgba(120,130,220,0.2)]" /><span className="text-[11px] text-slate-500">atau</span><div className="h-px flex-1 bg-[rgba(120,130,220,0.2)]" /></div>
              <button onClick={handlePay} disabled={paying} className="btn-ghost-cyber w-full" data-testid="pay-manual-btn">
                {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...</> : 'Saya Sudah Bayar (Konfirmasi Manual)'}
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-3">Konfirmasi manual bisa dimatikan admin di Pengaturan.</p>
            </>
          )}
        </div>

        <div className="panel rounded-xl p-6 h-fit">
          <h3 className="font-display font-800 text-white text-lg mb-4">Ringkasan</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-lg grid place-items-center overflow-hidden" style={{ background: order.gameGrad }}>
              <span className="font-display font-900 text-white text-sm">{order.gameBadge}</span>
            </div>
            <div>
              <p className="font-head font-bold text-white">{order.gameName}</p>
              <p className="text-sm text-cyan-300">{order.denomName}</p>
            </div>
          </div>
          <SumRow label="Akun" value={Object.values(order.account || {}).join(' · ')} />
          <div className="cyber-line my-4" />
          <SumRow label="Subtotal" value={rupiah(order.subtotal)} />
          <SumRow label="Biaya admin" value={rupiah(order.fee)} />
          {order.discount > 0 && <SumRow label="Diskon" value={`- ${rupiah(order.discount)}`} />}
          <div className="cyber-line my-4" />
          <div className="flex items-center justify-between">
            <span className="font-head font-bold text-slate-300">Total</span>
            <span className="font-display font-900 text-xl neon-cyan">{rupiah(order.total)}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Pembayaran diproses oleh Midtrans, gateway berlisensi Bank Indonesia.</p>
        </div>
      </div>
    </div>
  );
};

const SumRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm py-1 gap-3">
    <span className="text-slate-400 shrink-0">{label}</span>
    <span className="text-slate-200 font-semibold text-right truncate">{value}</span>
  </div>
);

export default CheckoutPage;
