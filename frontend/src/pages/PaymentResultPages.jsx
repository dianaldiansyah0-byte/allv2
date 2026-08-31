import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, Loader2, XCircle, Home, ReceiptText, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Midtrans redirect landing page. Snap can redirect back with either
 * `order_id` (Midtrans) or our own `invoice` query parameter.
 */
export const PaymentSuccessPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get('order_id') || params.get('orderId');
  const invoiceParam = params.get('invoice');
  const [state, setState] = useState('checking'); // checking | paid | pending | timeout | error
  const [invoice, setInvoice] = useState(invoiceParam);
  const attempts = useRef(0);

  useEffect(() => {
    if (!orderId && !invoiceParam) { setState('error'); return; }
    let active = true;
    const poll = async () => {
      if (!active) return;
      if (attempts.current >= 10) { setState('timeout'); return; }
      attempts.current += 1;
      try {
        if (orderId) {
          const res = await axios.get(`${API}/payments/status/${orderId}`);
          if (!active) return;
          setInvoice(res.data.invoice);
          if (res.data.paymentStatus === 'paid' || res.data.orderStatus === 'success') { setState('paid'); return; }
          if (['deny', 'cancel', 'expire', 'failure'].includes(res.data.paymentStatus)) { setState('error'); return; }
        } else {
          const res = await axios.get(`${API}/orders/${invoiceParam}`);
          if (!active) return;
          if (res.data.status === 'success') { setState('paid'); return; }
          if (['failed', 'expired'].includes(res.data.status)) { setState('error'); return; }
        }
        setTimeout(poll, 2500);
      } catch (e) {
        console.error('Payment status poll failed:', e?.message || e);
        setTimeout(poll, 3000);
      }
    };
    poll();
    return () => { active = false; };
  }, [orderId, invoiceParam]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="panel rounded-2xl p-8 text-center animate-float-up" data-testid="payment-result">
        {state === 'checking' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-cyan-400 animate-spin mb-4" />
            <h1 className="font-display font-900 text-xl text-white">Memverifikasi Pembayaran...</h1>
            <p className="text-slate-400 mt-2">Mohon tunggu sebentar, jangan tutup halaman ini.</p>
          </>
        )}
        {state === 'paid' && (
          <>
            <div className="w-20 h-20 mx-auto grid place-items-center rounded-full mb-5 animate-pulse-glow" style={{ background: 'linear-gradient(135deg,#00e5ff,#b6ff3c)' }}>
              <CheckCircle2 className="w-10 h-10 text-[#04121a]" />
            </div>
            <h1 className="font-display font-900 text-2xl text-white">Pembayaran Berhasil</h1>
            <p className="text-slate-400 mt-2">Pesanan <span className="text-cyan-300 font-semibold">{invoice}</span> telah dibayar & sedang diproses.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => navigate('/transaksi')} className="btn-ghost-cyber flex-1"><ReceiptText className="w-4 h-4" /> Riwayat</button>
              <button onClick={() => navigate('/')} className="btn-cyber flex-1"><Home className="w-4 h-4" /> Beranda</button>
            </div>
          </>
        )}
        {state === 'timeout' && (
          <>
            <Clock className="w-12 h-12 mx-auto text-amber-400 mb-4" />
            <h1 className="font-display font-900 text-xl text-white">Masih Diproses</h1>
            <p className="text-slate-400 mt-2">Pembayaran belum terkonfirmasi Midtrans. Cek status di riwayat transaksi sebentar lagi.</p>
            <button onClick={() => navigate('/transaksi')} className="btn-cyber mt-6">Lihat Riwayat</button>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-rose-400 mb-4" />
            <h1 className="font-display font-900 text-xl text-white">Pembayaran Gagal</h1>
            <p className="text-slate-400 mt-2">Transaksi dibatalkan, ditolak, atau kedaluwarsa. Silakan coba lagi.</p>
            <div className="flex gap-3 mt-6">
              {invoice && <button onClick={() => navigate(`/pembayaran/${invoice}`)} className="btn-cyber flex-1">Coba Lagi</button>}
              <button onClick={() => navigate('/')} className="btn-ghost-cyber flex-1"><Home className="w-4 h-4" /> Beranda</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const PaymentCancelPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const invoice = params.get('invoice') || (params.get('order_id') || '').split('-')[0];
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="panel rounded-2xl p-8 text-center">
        <XCircle className="w-16 h-16 mx-auto text-slate-500 mb-4" />
        <h1 className="font-display font-900 text-2xl text-white">Pembayaran Dibatalkan</h1>
        <p className="text-slate-400 mt-2">Kamu membatalkan pembayaran. Pesanan masih menunggu.</p>
        <div className="flex gap-3 mt-6">
          {invoice && <button onClick={() => navigate(`/pembayaran/${invoice}`)} className="btn-cyber flex-1">Coba Lagi</button>}
          <button onClick={() => navigate('/')} className="btn-ghost-cyber flex-1"><Home className="w-4 h-4" /> Beranda</button>
        </div>
      </div>
    </div>
  );
};
