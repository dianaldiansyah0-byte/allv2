import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Gamepad2, UserRound, Swords, Ticket, Smartphone } from 'lucide-react';
import { CATEGORIES } from '../mock';
import { useCatalog } from '../context/CatalogContext';
import { GameCard } from '../components/GameCard';
import HeroCarousel from '../components/HeroCarousel';
import FlashSale from '../components/home/FlashSale';
import { VoucherSection, SpecialOffers, PaymentMethods, HowToTopUp } from '../components/home/HomeSections';

const ICONS = { Gamepad2, UserRound, Swords, Ticket, Smartphone };

const HomePage = () => {
  const navigate = useNavigate();
  const { games } = useCatalog();
  const [q, setQ] = useState('');
  const filtered = (games || []).filter((g) => g.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <HeroCarousel />

      {/* Search + category tabs */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0b0e26] border border-[rgba(120,130,220,0.18)] focus-within:border-cyan-400/60 transition-colors">
            <Search className="w-5 h-5 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari game favoritmu..." className="bg-transparent outline-none w-full text-sm placeholder:text-slate-500" />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon];
            const active = c.id === 'game';
            return (
              <button key={c.id} onClick={() => navigate(c.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-head font-semibold transition-colors ${active ? 'text-[#04121a]' : 'text-slate-300 border border-[rgba(120,130,220,0.2)] hover:border-cyan-400/50 hover:text-white'}`}
                style={active ? { background: 'linear-gradient(100deg,#00e5ff,#4ff0ff)' } : {}}>
                <Icon className="w-4 h-4" /> {c.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Games */}
      <section className="max-w-7xl mx-auto px-4 mt-10">
        <div className="mb-6">
          <h2 className="font-display font-800 text-2xl text-white">Pilih Game</h2>
          <p className="text-sm text-slate-400">Top up favoritmu dengan harga termurah.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((g) => <GameCard key={g.slug} game={g} />)}
        </div>
        {filtered.length === 0 && <p className="text-center text-slate-400 py-10">Game tidak ditemukan.</p>}
      </section>

      <FlashSale />
      <VoucherSection />
      <SpecialOffers />
      <PaymentMethods />
      <HowToTopUp />
    </div>
  );
};

export default HomePage;
