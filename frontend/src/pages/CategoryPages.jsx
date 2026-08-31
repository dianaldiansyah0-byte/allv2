import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Swords, Ticket, Smartphone, Copy, Check, ShieldCheck, Zap, Receipt } from 'lucide-react';
import { rupiah } from '../mock';
import { useCatalog } from '../context/CatalogContext';
import { ProductCard } from '../components/GameCard';
import { imgUrl } from '../lib/img';
import SafeImg from '../components/SafeImg';
import { useToast } from '../hooks/use-toast';

const PageHeader = ({ icon: Icon, title, desc }) => (
  <div className="flex items-center gap-3 mb-8">
    <div className="w-11 h-11 grid place-items-center clip-corner" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}><Icon className="w-5 h-5 text-[#04121a]" /></div>
    <div>
      <h1 className="font-display font-800 text-2xl text-white">{title}</h1>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  </div>
);

export const JualAkunPage = () => {
  const { toast } = useToast();
  const { sellAccounts } = useCatalog();
  const SELL_ACCOUNTS = sellAccounts || [];
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader icon={UserRound} title="Jual Beli Akun" desc="Akun gaming premium bergaransi, transaksi aman via rekber." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SELL_ACCOUNTS.map((a) => (
          <div key={a.id} className="panel card-hover rounded-xl overflow-hidden flex flex-col">
            <div className="relative aspect-video grid place-items-center overflow-hidden" style={{ background: a.grad }}>
              <SafeImg src={a.image} alt={a.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy"
                fallback={(
                  <>
                    <div className="absolute inset-0 grid-bg opacity-25" />
                    <span className="font-display font-900 text-2xl text-white/95">{a.badge}</span>
                  </>
                )} />
              <span className="absolute top-2 left-2 chip bg-black/40 text-cyan-200 border border-cyan-400/40 z-10">{a.rank}</span>
            </div>
            <div className="p-3 flex flex-col flex-1">
              <p className="font-head font-bold text-white text-sm leading-tight">{a.title}</p>
              <p className="text-[12px] text-slate-400 mt-0.5">{a.game} · {a.skins} skin</p>
              <div className="mt-auto pt-2 flex items-end justify-between">
                <p className="font-display font-bold text-cyan-300">{rupiah(a.price)}</p>
                <button onClick={() => toast({ title: 'Segera hadir', description: 'Fitur pembelian akun akan aktif setelah verifikasi rekber.' })} className="chip border border-cyan-400/40 text-cyan-200 hover:bg-cyan-400/10">Beli</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ItemSkinPage = () => {
  const { toast } = useToast();
  const { itemSkins } = useCatalog();
  const ITEM_SKINS = itemSkins || [];
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader icon={Swords} title="Item & Skin" desc="Skin langka, bundle, dan item eksklusif untuk gaya bermainmu." />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ITEM_SKINS.map((s) => (
          <ProductCard key={s.id} badge={s.badge} grad={s.grad} image={s.image} title={s.title} sub={s.game} price={s.price}
            onClick={() => toast({ title: 'Ditambahkan', description: `${s.title} — lanjutkan checkout untuk membeli.` })} />
        ))}
      </div>
    </div>
  );
};

export const VoucherPage = () => {
  const { toast } = useToast();
  const { vouchers } = useCatalog();
  const VOUCHERS = vouchers || [];
  const [copied, setCopied] = useState(null);
  const copy = (c) => { navigator.clipboard.writeText(c); setCopied(c); toast({ title: 'Kode disalin!', description: `Voucher ${c} siap dipakai.` }); setTimeout(() => setCopied(null), 1500); };
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PageHeader icon={Ticket} title="Voucher & Promo" desc="Kumpulkan kode diskon dan hemat setiap top up." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {VOUCHERS.map((v) => (
          <div key={v.code} className="panel card-hover rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20" style={{ background: 'radial-gradient(circle,#00e5ff,transparent)' }} />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-300" /><p className="font-display font-bold text-cyan-300 tracking-wide">{v.code}</p></div>
              <button onClick={() => copy(v.code)} className="w-9 h-9 grid place-items-center rounded-lg border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10">{copied === v.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
            </div>
            <p className="text-sm text-slate-200 mt-3">{v.desc}</p>
            <p className="text-[11px] text-slate-500 mt-1">{v.min}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PulsaPage = () => {
  const { toast } = useToast();
  const { pulsa } = useCatalog();
  const PULSA_OPERATORS = pulsa?.operators || [];
  const PULSA_NOMINALS = pulsa?.nominals || [];
  const TAGIHAN = pulsa?.tagihan || [];
  const [tab, setTab] = useState('pulsa');
  const [op, setOp] = useState(PULSA_OPERATORS[0]?.id);
  const [phone, setPhone] = useState('');
  const [sel, setSel] = useState(null);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader icon={Smartphone} title="Pulsa & Tagihan" desc="Isi pulsa, paket data, dan bayar tagihan dengan cepat." />
      <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-lg bg-[#0b0e26] max-w-sm">
        {[{ id: 'pulsa', label: 'Pulsa' }, { id: 'tagihan', label: 'Tagihan' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`py-2 rounded-md text-sm font-head font-bold uppercase tracking-wider ${tab === t.id ? 'text-[#04121a]' : 'text-slate-400'}`}
            style={tab === t.id ? { background: 'linear-gradient(100deg,#00e5ff,#4ff0ff)' } : {}}>{t.label}</button>
        ))}
      </div>

      {tab === 'pulsa' ? (
        <div className="panel rounded-xl p-5 space-y-5">
          <div>
            <label className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">Nomor HP</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="0812xxxxxxxx" className="mt-1 w-full px-3 py-2.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] text-sm outline-none focus:border-cyan-400/60" />
          </div>
          <div>
            <p className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider mb-2">Operator</p>
            <div className="flex flex-wrap gap-2">
              {PULSA_OPERATORS.map((o) => (
                <button key={o.id} onClick={() => setOp(o.id)} className={`px-3 py-2 rounded-lg text-xs font-head font-bold border ${op === o.id ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200' : 'border-[rgba(120,130,220,0.2)] text-slate-300'}`}>{o.name}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider mb-2">Nominal</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PULSA_NOMINALS.map((n) => (
                <button key={n.amt} onClick={() => setSel(n)} className={`p-3 rounded-lg border text-left ${sel?.amt === n.amt ? 'border-cyan-400 bg-cyan-400/10' : 'border-[rgba(120,130,220,0.2)] bg-[#0b0e26]'}`}>
                  <p className="font-head font-bold text-white text-sm">{rupiah(n.amt)}</p>
                  <p className="text-[11px] text-cyan-300">{rupiah(n.price)}</p>
                </button>
              ))}
            </div>
          </div>
          <button disabled={!phone || !sel} onClick={() => toast({ title: 'Pesanan dibuat', description: `Pulsa ${rupiah(sel.amt)} untuk ${phone} (simulasi).` })} className="btn-cyber w-full">Beli Pulsa</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {TAGIHAN.map((t) => (
            <button key={t.id} onClick={() => toast({ title: t.name, description: 'Fitur pembayaran tagihan (simulasi).' })} className="panel card-hover rounded-xl p-5 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-lg grid place-items-center text-[#04121a] font-display font-bold text-xs" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>{t.badge}</div>
              <div><p className="font-head font-bold text-white">{t.name}</p><p className="text-xs text-slate-400 flex items-center gap-1"><Receipt className="w-3 h-3" /> Bayar tagihan</p></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
