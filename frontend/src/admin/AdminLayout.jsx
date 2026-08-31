import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Gamepad2, ReceiptText, Ticket, Megaphone, Boxes, Plug, CreditCard, Users, History, Settings, LogOut, Terminal, Menu, ExternalLink, Images, Wallet } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const NAV = [
  { to: '/own', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/own/games', icon: Gamepad2, label: 'Game & Nominal' },
  { to: '/own/orders', icon: ReceiptText, label: 'Pesanan' },
  { to: '/own/vouchers', icon: Ticket, label: 'Voucher' },
  { to: '/own/promotions', icon: Megaphone, label: 'Promosi' },
  { to: '/own/content', icon: Boxes, label: 'Kelola Konten' },
  { to: '/own/media', icon: Images, label: 'Galeri Media' },
  { to: '/own/midtrans', icon: Wallet, label: 'Midtrans' },
  { to: '/own/digiflazz', icon: Plug, label: 'Digiflazz' },
  { to: '/own/payments', icon: CreditCard, label: 'Pembayaran' },
  { to: '/own/users', icon: Users, label: 'Pengguna' },
  { to: '/own/logs', icon: History, label: 'Log Aktivitas' },
  { to: '/own/settings', icon: Settings, label: 'Pengaturan' },
];

const AdminLayout = ({ children }) => {
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const SidebarInner = () => (
    <>
      <div className="flex items-center gap-2 px-5 h-16 border-b border-[rgba(120,130,220,0.14)]">
        <div className="w-9 h-9 grid place-items-center clip-corner" style={{ background: 'linear-gradient(135deg,#ff2fb0,#7c3aed)' }}><Terminal className="w-5 h-5 text-white" /></div>
        <div>
          <p className="font-display font-800 text-white text-sm leading-none">Allv2<span className="neon-cyan">Admin</span></p>
          <p className="text-[10px] text-slate-500 mt-1">Control Panel</p>
        </div>
      </div>
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} data-testid={`nav-${n.to.replace('/own', '').replace('/', '') || 'dashboard'}`}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-head font-semibold transition-colors ${isActive ? 'text-[#04121a]' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
            style={({ isActive }) => isActive ? { background: 'linear-gradient(100deg,#00e5ff,#4ff0ff)' } : {}}>
            <n.icon className="w-4 h-4" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-[rgba(120,130,220,0.14)] space-y-1">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-head font-semibold text-slate-300 hover:text-cyan-300 hover:bg-white/5"><ExternalLink className="w-4 h-4" /> Lihat Situs</a>
        <button onClick={() => { logout(); navigate('/own'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-head font-semibold text-rose-400 hover:bg-rose-500/10"><LogOut className="w-4 h-4" /> Keluar</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col glass border-r border-[rgba(120,130,220,0.14)] sticky top-0 h-screen">
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-64 flex flex-col glass h-full"><SidebarInner /></aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="h-16 glass border-b border-[rgba(120,130,220,0.14)] flex items-center gap-3 px-4 sticky top-0 z-40">
          <button className="lg:hidden p-2 text-slate-200" onClick={() => setOpen(true)}><Menu /></button>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-white font-head font-semibold leading-none">{admin?.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{admin?.email}</p>
            </div>
            <span className="w-9 h-9 rounded-full grid place-items-center text-sm font-bold text-[#04121a]" style={{ background: 'linear-gradient(135deg,#00e5ff,#ff2fb0)' }}>{admin?.name?.[0]?.toUpperCase()}</span>
          </div>
        </header>
        <div className="p-4 md:p-6 max-w-6xl mx-auto">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
