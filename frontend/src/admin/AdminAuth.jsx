import React, { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Lock, User, Loader2, Terminal } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../hooks/use-toast';

const AdminAuth = () => {
  const { setupStatus, setup, login } = useAdmin();
  const { toast } = useToast();
  const [hasAdmin, setHasAdmin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setupStatus().then((s) => { setHasAdmin(s.hasAdmin); setChecking(false); }).catch(() => setChecking(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (hasAdmin) { await login(form.email, form.password); toast({ title: 'Selamat datang, Admin' }); }
      else { await setup(form.name, form.email, form.password); toast({ title: 'Admin pertama dibuat!' }); }
    } catch (err) { toast({ title: 'Gagal', description: err.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 grid-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto grid place-items-center clip-corner animate-pulse-glow mb-3" style={{ background: 'linear-gradient(135deg,#ff2fb0,#7c3aed)' }}>
            <Terminal className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display font-900 text-2xl text-white">Panel Admin</h1>
          <p className="text-sm text-slate-400 mt-1">{checking ? 'Memeriksa...' : hasAdmin ? 'Masuk untuk mengelola toko' : 'Buat admin pertama untuk mulai'}</p>
        </div>
        <div className="panel rounded-2xl p-6">
          <form onSubmit={submit} className="space-y-4">
            {!hasAdmin && (
              <FieldA icon={User} label="Nama Admin" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nama" required />
            )}
            <FieldA icon={Mail} label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="admin@allv2store.com" required />
            <FieldA icon={Lock} label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" required />
            <button type="submit" disabled={loading || checking} className="btn-cyber w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> {hasAdmin ? 'Masuk' : 'Buat Admin'}</>}
            </button>
          </form>
        </div>
        <p className="text-center text-[11px] text-slate-500 mt-4">Area khusus pengelola. Akses tidak sah dilarang.</p>
      </div>
    </div>
  );
};

const FieldA = ({ icon: Icon, label, type = 'text', value, onChange, placeholder, required }) => (
  <div>
    <label className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-2 mt-1 px-3 py-2.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] focus-within:border-cyan-400/60 transition-colors">
      <Icon className="w-4 h-4 text-slate-400" />
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="bg-transparent outline-none w-full text-sm placeholder:text-slate-500" />
    </div>
  </div>
);

export default AdminAuth;
