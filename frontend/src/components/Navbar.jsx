import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, UserRound, Swords, Ticket, Smartphone, Search, Menu, X, LogOut, ReceiptText, User } from 'lucide-react';
import { CATEGORIES } from '../mock';
import { useCatalog } from '../context/CatalogContext';
import { useAuth } from '../context/AuthContext';
import { imgUrl } from '../lib/img';
import SafeImg from './SafeImg';
import NotificationBell from './NotificationBell';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from './ui/dropdown-menu';

const ICONS = { Gamepad2, UserRound, Swords, Ticket, Smartphone };

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { games, settings } = useCatalog();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [showSug, setShowSug] = useState(false);

  const results = q.trim()
    ? (games || []).filter((g) => g.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6)
    : [];

  const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  return (
    <header className="sticky top-0 z-50">
      <div className="glass border-b border-[rgba(120,130,220,0.14)]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0 group" data-testid="site-logo">
            <SafeImg src={settings?.logoUrl} alt={settings?.siteName || 'Logo'} className="w-auto object-contain"
              style={{ height: `${Math.min(Number(settings?.logoWidth) || 36, 56)}px` }}
              fallback={(
                <>
                  <div className="w-9 h-9 grid place-items-center clip-corner animate-pulse-glow" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>
                    <Gamepad2 className="w-5 h-5 text-[#04121a]" />
                  </div>
                  <span className="font-display font-800 text-lg tracking-wide">
                    <span className="neon-cyan">{(settings?.siteName || 'Allv2Store').slice(0, 5)}</span>
                    <span className="text-white">{(settings?.siteName || 'Allv2Store').slice(5)}</span>
                  </span>
                </>
              )} />
          </Link>

          {/* Search desktop */}
          <div className="relative hidden md:block flex-1 max-w-md">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.18)] focus-within:border-cyan-400/60 transition-colors">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setShowSug(true); }}
                onFocus={() => setShowSug(true)}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                placeholder="Cari game favoritmu..."
                className="bg-transparent outline-none text-sm w-full placeholder:text-slate-500"
              />
            </div>
            {showSug && results.length > 0 && (
              <div className="absolute mt-2 w-full panel rounded-lg overflow-hidden z-50 animate-float-up">
                {results.map((g) => (
                  <button key={g.slug} onMouseDown={() => navigate(`/game/${g.slug}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-400/10 text-left transition-colors">
                    <span className="w-8 h-8 rounded-md grid place-items-center text-[10px] font-display font-bold text-white" style={{ background: g.grad }}>{g.badge}</span>
                    <div>
                      <div className="text-sm text-white">{g.name}</div>
                      <div className="text-[11px] text-slate-400">{g.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1 ml-auto">
            {CATEGORIES.map((c) => {
              const Icon = ICONS[c.icon];
              return (
                <Link key={c.id} to={c.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-head font-semibold transition-colors ${isActive(c.path) ? 'text-cyan-300 bg-cyan-400/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}>
                  <Icon className="w-4 h-4" /> {c.label}
                </Link>
              );
            })}
          </nav>

          {/* Account */}
          <div className="ml-auto lg:ml-2 flex items-center gap-2">
            {user && <NotificationBell />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-[rgba(120,130,220,0.25)] hover:border-cyan-400/60 transition-colors">
                    <span className="w-8 h-8 rounded-full grid place-items-center text-sm font-bold text-[#04121a]" style={{ background: 'linear-gradient(135deg,#00e5ff,#ff2fb0)' }}>{user.name?.[0]?.toUpperCase()}</span>
                    <span className="hidden sm:block text-sm text-slate-200 max-w-[90px] truncate">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-slate-400 text-xs">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}><User className="w-4 h-4 mr-2" /> Profil Saya</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/transaksi')}><ReceiptText className="w-4 h-4 mr-2" /> Riwayat Transaksi</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-rose-400 focus:text-rose-400"><LogOut className="w-4 h-4 mr-2" /> Keluar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/masuk" className="btn-ghost-cyber text-xs py-2 px-4">Masuk</Link>
            )}
            <button className="lg:hidden p-2 text-slate-200" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden glass border-b border-[rgba(120,130,220,0.14)] px-4 py-3 space-y-1 animate-float-up">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon];
            return (
              <Link key={c.id} to={c.path} onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-head font-semibold ${isActive(c.path) ? 'text-cyan-300 bg-cyan-400/10' : 'text-slate-300'}`}>
                <Icon className="w-4 h-4" /> {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Navbar;
