import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, ShieldCheck, Zap, Headphones, Instagram, Send, MessageCircle, Facebook } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import SafeImg from './SafeImg';

const Footer = () => {
  const { settings } = useCatalog();
  const s = settings || {};
  const siteName = s.siteName || 'Allv2Store';
  const socials = [
    { I: Instagram, k: 'ig', href: s.socialInstagram },
    { I: Send, k: 'tg', href: s.socialTelegram },
    { I: Facebook, k: 'fb', href: s.socialFacebook },
    { I: MessageCircle, k: 'wa', href: s.whatsapp ? `https://wa.me/${s.whatsapp}` : '' },
  ].filter((x) => x.href);

  return (
    <footer className="mt-20 border-t border-[rgba(120,130,220,0.14)] bg-[#06081a]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <SafeImg src={s.logoUrl} alt={siteName} className="h-8 w-auto object-contain"
                fallback={(
                  <>
                    <div className="w-8 h-8 grid place-items-center clip-corner" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>
                      <Gamepad2 className="w-4 h-4 text-[#04121a]" />
                    </div>
                    <span className="font-display font-bold"><span className="neon-cyan">{siteName.slice(0, 5)}</span>{siteName.slice(5)}</span>
                  </>
                )} />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{s.footerAbout || 'Top up game termurah & instan.'}</p>
          </div>
          <div>
            <h4 className="font-head font-bold uppercase tracking-wider text-sm text-cyan-300 mb-3">Layanan</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-cyan-300">Top Up Game</Link></li>
              <li><Link to="/jual-akun" className="hover:text-cyan-300">Jual Beli Akun</Link></li>
              <li><Link to="/item-skin" className="hover:text-cyan-300">Item & Skin</Link></li>
              <li><Link to="/voucher" className="hover:text-cyan-300">Voucher</Link></li>
              <li><Link to="/pulsa" className="hover:text-cyan-300">Pulsa & Tagihan</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-head font-bold uppercase tracking-wider text-sm text-cyan-300 mb-3">Kenapa Kami</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-cyan-400" /> Proses instan otomatis</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-cyan-400" /> Pembayaran aman via Midtrans</li>
              <li className="flex items-center gap-2"><Headphones className="w-4 h-4 text-cyan-400" /> {s.supportHours || 'Support 24 jam'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-head font-bold uppercase tracking-wider text-sm text-cyan-300 mb-3">Ikuti Kami</h4>
            <div className="flex gap-3">
              {socials.length === 0 && <span className="text-xs text-slate-500">Belum ada akun sosial.</span>}
              {socials.map(({ I, k, href }) => (
                <a key={k} href={href} target="_blank" rel="noreferrer" className="w-10 h-10 grid place-items-center rounded-lg border border-[rgba(120,130,220,0.2)] text-slate-300 hover:text-cyan-300 hover:border-cyan-400/60 transition-colors"><I className="w-5 h-5" /></a>
              ))}
            </div>
            {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="btn-ghost-cyber text-xs mt-4 py-2 px-4">Hubungi Admin</a>}
          </div>
        </div>
        <div className="cyber-line my-8" />
        <p className="text-center text-xs text-slate-500">{s.footerNote || `© ${new Date().getFullYear()} ${siteName}. Semua transaksi diproses secara aman.`}</p>
      </div>
    </footer>
  );
};

export default Footer;
