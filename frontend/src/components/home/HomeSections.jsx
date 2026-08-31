import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Copy, Check, Gift, CreditCard, MousePointerClick, KeyboardIcon, BadgeCheck, Wallet, Building2, Store } from 'lucide-react';
import { HOW_TO, rupiah } from '../../mock';
import { useCatalog } from '../../context/CatalogContext';
import { useToast } from '../../hooks/use-toast';

export const VoucherSection = () => {
  const { toast } = useToast();
  const { vouchers } = useCatalog();
  const VOUCHERS = vouchers || [];
  const [copied, setCopied] = useState(null);
  const copy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast({ title: 'Kode disalin!', description: `Voucher ${code} siap dipakai saat checkout.` });
    setTimeout(() => setCopied(null), 1500);
  };
  return (
    <section className="max-w-7xl mx-auto px-4 mt-14">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 grid place-items-center clip-corner" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}><Ticket className="w-5 h-5 text-[#04121a]" /></div>
        <div>
          <h2 className="font-display font-800 text-2xl text-white">Voucher</h2>
          <p className="text-sm text-slate-400">Pakai kode ini saat checkout untuk potongan harga.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {VOUCHERS.map((v) => (
          <div key={v.code} className="panel rounded-xl p-4 flex items-center justify-between card-hover border-l-2" style={{ borderLeftColor: '#00e5ff' }}>
            <div>
              <p className="font-display font-bold text-cyan-300 tracking-wide">{v.code}</p>
              <p className="text-sm text-slate-200 mt-0.5">{v.desc}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{v.min}</p>
            </div>
            <button onClick={() => copy(v.code)} className="w-10 h-10 grid place-items-center rounded-lg border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10 transition-colors">
              {copied === v.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export const SpecialOffers = () => {
  const navigate = useNavigate();
  const { specialOffers, getGame } = useCatalog();
  const items = (specialOffers || []).map((s) => {
    const g = getGame(s.gameSlug);
    const d = g?.denoms?.find((x) => x.id === s.denomId);
    return { g, d };
  }).filter((x) => x.g && x.d);
  if (!items.length) return null;
  return (
    <section className="max-w-7xl mx-auto px-4 mt-14">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 grid place-items-center clip-corner" style={{ background: 'linear-gradient(135deg,#b6ff3c,#00e5ff)' }}><Gift className="w-5 h-5 text-[#04121a]" /></div>
        <div>
          <h2 className="font-display font-800 text-2xl text-white">Penawaran Spesial</h2>
          <p className="text-sm text-slate-400">Nominal besar dengan bonus ekstra, selagi tersedia.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ g, d }) => (
          <button key={`${g.slug}-${d.id}`} onClick={() => navigate(`/game/${g.slug}?denom=${d.id}`)} className="group text-left">
            <div className="panel card-hover rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg grid place-items-center shrink-0" style={{ background: g.grad }}>
                <span className="font-display font-900 text-white">{g.badge}</span>
              </div>
              <div className="flex-1">
                {d.bonus && <span className="chip text-[#04121a] mb-1 inline-block" style={{ background: '#b6ff3c' }}>{d.bonus}</span>}
                <p className="font-head font-bold text-white">{d.name}</p>
                <p className="text-[12px] text-slate-400">{g.name}</p>
                <p className="font-display font-bold text-cyan-300 mt-1">{rupiah(d.price)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

const GROUP_ICON = { 'E-Wallet & QRIS': Wallet, 'Transfer Bank (Virtual Account)': Building2, 'Retail': Store };

export const PaymentMethods = () => {
  const { payments } = useCatalog();
  const PAYMENT_METHODS = payments || [];
  return (
  <section className="max-w-7xl mx-auto px-4 mt-14">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 grid place-items-center clip-corner" style={{ background: 'linear-gradient(135deg,#7c3aed,#ff2fb0)' }}><CreditCard className="w-5 h-5 text-white" /></div>
      <div>
        <h2 className="font-display font-800 text-2xl text-white">Metode Pembayaran</h2>
        <p className="text-sm text-slate-400">Pilih dari 11+ channel pembayaran, semuanya terverifikasi.</p>
      </div>
    </div>
    <div className="grid md:grid-cols-3 gap-4">
      {PAYMENT_METHODS.map((grp) => {
        const Icon = GROUP_ICON[grp.group] || Wallet;
        return (
          <div key={grp.group} className="panel rounded-xl p-5">
            <p className="font-head font-bold uppercase tracking-wider text-sm text-cyan-300 mb-4 flex items-center gap-2"><Icon className="w-4 h-4" /> {grp.group}</p>
            <div className="flex flex-wrap gap-2">
              {grp.items.map((it) => (
                <span key={it.id} className="px-3 py-2 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.18)] text-xs font-head font-bold text-slate-200">{it.name}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </section>
  );
};

const STEP_ICON = { MousePointerClick, KeyboardIcon, BadgeCheck };

export const HowToTopUp = () => (
  <section className="max-w-7xl mx-auto px-4 mt-14">
    <div className="text-center mb-8">
      <h2 className="font-display font-800 text-2xl text-white">Cara Top Up</h2>
      <p className="text-sm text-slate-400 mt-1">Hanya butuh 3 langkah, item langsung masuk ke akunmu.</p>
    </div>
    <div className="grid md:grid-cols-3 gap-4 relative">
      {HOW_TO.map((s) => {
        const Icon = STEP_ICON[s.icon];
        return (
          <div key={s.step} className="panel rounded-xl p-6 text-center card-hover">
            <div className="w-14 h-14 mx-auto grid place-items-center rounded-full mb-4 animate-pulse-glow" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="font-display font-900 text-cyan-300 text-sm mb-1">Langkah {s.step}</div>
            <h3 className="font-head font-bold text-white text-lg">{s.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{s.desc}</p>
          </div>
        );
      })}
    </div>
  </section>
);
