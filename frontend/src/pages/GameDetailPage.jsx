import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Zap, ShieldCheck, Info, Tag, ChevronRight, Wallet, Building2, Store, Check, BookOpen, AlertTriangle } from 'lucide-react';
import { rupiah } from '../mock';
import { useCatalog } from '../context/CatalogContext';
import { useStore } from '../context/StoreContext';
import { imgUrl } from '../lib/img';
import SafeImg from '../components/SafeImg';
import { useToast } from '../hooks/use-toast';

const GROUP_ICON = { 'E-Wallet & QRIS': Wallet, 'Transfer Bank (Virtual Account)': Building2, 'Retail': Store };

const GameDetailPage = () => {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getGame, payments } = useCatalog();
  const { createOrder, validateVoucher } = useStore();
  const PAYMENT_METHODS = payments || [];

  const game = getGame(slug);
  const [denomId, setDenomId] = useState(params.get('denom') || null);
  const [fields, setFields] = useState({});
  const [payId, setPayId] = useState('qris');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  const denom = useMemo(() => game?.denoms.find((d) => d.id === denomId), [game, denomId]);
  const pay = useMemo(() => PAYMENT_METHODS.flatMap((g) => g.items).find((p) => p.id === payId), [payId, PAYMENT_METHODS]);

  if (!game) return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-300">Game tidak ditemukan.</div>;

  const fee = pay?.fee || 0;
  const subtotal = denom?.price || 0;
  const discount = voucher?.discount || 0;
  const total = Math.max(0, subtotal + fee - discount);

  const applyVoucher = async () => {
    if (!denom) { toast({ title: 'Pilih nominal dulu', variant: 'destructive' }); return; }
    const res = await validateVoucher(voucherCode, subtotal);
    if (res.valid) { setVoucher(res); toast({ title: 'Voucher diterapkan', description: res.message }); }
    else { setVoucher(null); toast({ title: 'Voucher gagal', description: res.message, variant: 'destructive' }); }
  };

  const canBuy = denom && game.fields.every((f) => (fields[f.key] || '').trim().length > 0) && payId;

  const handleBuy = async () => {
    if (!canBuy) { toast({ title: 'Lengkapi data', description: 'Isi ID akun, pilih nominal & pembayaran.', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const order = await createOrder({
        gameSlug: game.slug, gameName: game.name, gameBadge: game.badge, gameGrad: game.grad,
        gameImage: game.image || null,
        denomId: denom.id, denomName: denom.name, account: fields,
        payment: pay.name, paymentId: pay.id,
        subtotal, fee, discount, voucherCode: voucher?.code || null, total,
        buyerSkuCode: denom.buyerSkuCode || null,
        customerNo: game.fields.map((f) => (fields[f.key] || '')).join(''),
      });
      navigate(`/pembayaran/${order.invoice}`);
    } catch (e) {
      toast({ title: 'Gagal membuat pesanan', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden panel mb-6">
        {game.banner ? (
          <>
            <SafeImg src={game.banner} alt={game.name} className="absolute inset-0 w-full h-full object-cover"
              fallback={<div className="absolute inset-0 opacity-40" style={{ background: game.grad }} />} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(5,6,15,0.94) 0%, rgba(5,6,15,0.6) 55%, rgba(5,6,15,0.3) 100%)' }} />
          </>
        ) : (
          <div className="absolute inset-0 opacity-40" style={{ background: game.grad }} />
        )}
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative p-6 flex items-center gap-5">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl grid place-items-center shrink-0 glow-cyan overflow-hidden" style={{ background: game.grad }}>
            <SafeImg src={game.image} alt={game.name} className="w-full h-full object-cover"
              fallback={<span className="font-display font-900 text-3xl text-white">{game.badge}</span>} />
          </div>
          <div>
            <h1 className="font-display font-900 text-2xl md:text-3xl text-white">{game.name}</h1>
            <p className="text-slate-300 font-head">{game.publisher} · {game.category}</p>
            <div className="flex gap-2 mt-3">
              <span className="chip bg-black/40 text-cyan-200 border border-cyan-400/40 flex items-center gap-1"><Zap className="w-3 h-3" /> Instan</span>
              <span className="chip bg-black/40 text-emerald-200 border border-emerald-400/40 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Aman</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: account */}
          <div className="panel rounded-xl p-5">
            <StepTitle n={1} title="Masukkan Data Akun" />
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              {game.fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={fields[f.key] || ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                      className="mt-1 w-full px-3 py-2.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-sm outline-none focus:border-cyan-400/60">
                      <option value="">Pilih {f.label}</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={fields[f.key] || ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="mt-1 w-full px-3 py-2.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-sm outline-none focus:border-cyan-400/60" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-[12px] text-slate-500 mt-3 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Pastikan data akun benar. Item masuk otomatis setelah pembayaran.</p>
          </div>

          {/* Step 2: nominal */}
          <div className="panel rounded-xl p-5">
            <StepTitle n={2} title="Pilih Nominal" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {game.denoms.map((d) => {
                const active = denomId === d.id;
                return (
                  <button key={d.id} onClick={() => setDenomId(d.id)}
                    className={`relative text-left p-3 rounded-lg border transition-all ${active ? 'border-cyan-400 glow-cyan bg-cyan-400/10' : 'border-[rgba(120,130,220,0.2)] bg-[#0b0e26] hover:border-cyan-400/50'}`}>
                    {d.tag && <span className="absolute -top-2 right-2 chip text-white" style={{ background: '#ff2fb0' }}>{d.tag}</span>}
                    <p className="font-head font-bold text-white text-sm">{d.name}</p>
                    <p className="font-display font-bold text-cyan-300 text-sm mt-1">{rupiah(d.price)}</p>
                    {d.oldPrice && <p className="text-[11px] text-slate-500 line-through">{rupiah(d.oldPrice)}</p>}
                    {active && <Check className="absolute top-2 left-2 w-4 h-4 text-cyan-300" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: payment */}
          <div className="panel rounded-xl p-5">
            <StepTitle n={3} title="Metode Pembayaran" />
            <div className="space-y-4 mt-4">
              {PAYMENT_METHODS.map((grp) => {
                const Icon = GROUP_ICON[grp.group] || Wallet;
                return (
                  <div key={grp.group}>
                    <p className="font-head font-bold uppercase tracking-wider text-xs text-slate-400 mb-2 flex items-center gap-2"><Icon className="w-4 h-4" /> {grp.group}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {grp.items.map((it) => {
                        const active = payId === it.id;
                        return (
                          <button key={it.id} onClick={() => setPayId(it.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${active ? 'border-cyan-400 bg-cyan-400/10' : 'border-[rgba(120,130,220,0.2)] bg-[#0b0e26] hover:border-cyan-400/50'}`}>
                            <span className="w-9 h-9 rounded-md grid place-items-center text-[10px] font-display font-bold text-[#04121a]" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>{it.badge}</span>
                            <div className="text-left flex-1">
                              <p className="text-sm text-white font-head font-semibold">{it.name}</p>
                              <p className="text-[11px] text-slate-400">{it.fee ? `Biaya ${rupiah(it.fee)}` : 'Tanpa biaya admin'}</p>
                            </div>
                            {active && <Check className="w-4 h-4 text-cyan-300" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info & panduan */}
          {(game.description || game.howTo || game.notes) && (
            <div className="panel rounded-xl p-5 space-y-5" data-testid="game-info">
              {game.description && (
                <div>
                  <h2 className="font-head font-bold text-white text-lg flex items-center gap-2"><Info className="w-4 h-4 text-cyan-300" /> Tentang {game.name}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed mt-2 whitespace-pre-line">{game.description}</p>
                </div>
              )}
              {game.howTo && (
                <div>
                  <h2 className="font-head font-bold text-white text-lg flex items-center gap-2"><BookOpen className="w-4 h-4 text-cyan-300" /> Cara Top Up</h2>
                  <ol className="mt-2 space-y-2">
                    {game.howTo.split('\n').filter((x) => x.trim()).map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="w-6 h-6 shrink-0 grid place-items-center rounded-full text-[11px] font-display font-bold text-[#04121a]" style={{ background: 'linear-gradient(135deg,#00e5ff,#b6ff3c)' }}>{i + 1}</span>
                        <span className="pt-0.5">{step.trim()}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {game.notes && (
                <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-4">
                  <p className="font-head font-bold text-amber-200 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Catatan Penting</p>
                  <p className="text-sm text-slate-300 mt-1.5 whitespace-pre-line">{game.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="panel rounded-xl p-5 lg:sticky lg:top-20">
            <h3 className="font-display font-800 text-white text-lg mb-4">Ringkasan Pesanan</h3>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-cyan-300" />
              <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} placeholder="Kode voucher"
                className="flex-1 px-3 py-2 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-sm outline-none focus:border-cyan-400/60" />
              <button onClick={applyVoucher} className="btn-ghost-cyber text-xs py-2 px-3">Pakai</button>
            </div>
            <div className="cyber-line my-4" />
            <Row label="Item" value={denom ? denom.name : '-'} />
            <Row label="Subtotal" value={rupiah(subtotal)} />
            <Row label="Biaya admin" value={rupiah(fee)} />
            {discount > 0 && <Row label="Diskon voucher" value={`- ${rupiah(discount)}`} accent />}
            <div className="cyber-line my-4" />
            <div className="flex items-center justify-between mb-4">
              <span className="font-head font-bold text-slate-300">Total</span>
              <span className="font-display font-900 text-xl neon-cyan">{rupiah(total)}</span>
            </div>
            <button onClick={handleBuy} disabled={!canBuy || loading} className="btn-cyber w-full">
              {loading ? 'Memproses...' : <>Beli Sekarang <ChevronRight className="w-4 h-4" /></>}
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-3 flex items-center justify-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Transaksi aman & terenkripsi</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepTitle = ({ n, title }) => (
  <div className="flex items-center gap-3">
    <span className="w-7 h-7 grid place-items-center rounded-full font-display font-bold text-sm text-[#04121a]" style={{ background: 'linear-gradient(135deg,#00e5ff,#b6ff3c)' }}>{n}</span>
    <h2 className="font-head font-bold text-white text-lg">{title}</h2>
  </div>
);

const Row = ({ label, value, accent }) => (
  <div className="flex items-center justify-between text-sm py-1">
    <span className="text-slate-400">{label}</span>
    <span className={accent ? 'text-emerald-400 font-semibold' : 'text-slate-200 font-semibold'}>{value}</span>
  </div>
);

export default GameDetailPage;
