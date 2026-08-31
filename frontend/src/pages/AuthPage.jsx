import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Gamepad2, Mail, Lock, User, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast({ title: 'Berhasil masuk', description: 'Selamat datang kembali!' });
      } else {
        await register(form.name, form.email, form.password);
        toast({ title: 'Akun dibuat', description: 'Selamat datang di Allv2Store!' });
      }
      navigate('/');
    } catch (err) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto grid place-items-center clip-corner animate-pulse-glow mb-3" style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>
            <Gamepad2 className="w-7 h-7 text-[#04121a]" />
          </div>
          <h1 className="font-display font-900 text-2xl text-white">{mode === 'login' ? 'Masuk Akun' : 'Buat Akun Baru'}</h1>
          <p className="text-sm text-slate-400 mt-1">{mode === 'login' ? 'Lanjutkan top up favoritmu.' : 'Daftar gratis, top up lebih cepat.'}</p>
        </div>

        <div className="panel rounded-2xl p-6">
          <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-lg bg-[#0b0e26]">
            {['login', 'register'].map((m) => (
              <button key={m} onClick={() => setMode(m)} className={`py-2 rounded-md text-sm font-head font-bold uppercase tracking-wider transition-colors ${mode === m ? 'text-[#04121a]' : 'text-slate-400'}`}
                style={mode === m ? { background: 'linear-gradient(100deg,#00e5ff,#4ff0ff)' } : {}}>
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <Field icon={User} label="Nama" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nama kamu" required />
            )}
            <Field icon={Mail} label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="email@contoh.com" required />
            <Field icon={Lock} label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="••••••••" required />
            <button type="submit" disabled={loading} className="btn-cyber w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> {mode === 'login' ? 'Masuk' : 'Daftar Sekarang'}</>}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">Dengan melanjutkan kamu menyetujui S&K Allv2Store. <Link to="/" className="text-cyan-300">Kembali</Link></p>
      </div>
    </div>
  );
};

const Field = ({ icon: Icon, label, type = 'text', value, onChange, placeholder, required }) => (
  <div>
    <label className="text-xs font-head font-semibold text-slate-300 uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-2 mt-1 px-3 py-2.5 rounded-lg bg-[#0b0e26] border border-[rgba(120,130,220,0.2)] focus-within:border-cyan-400/60 transition-colors">
      <Icon className="w-4 h-4 text-slate-400" />
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="bg-transparent outline-none w-full text-sm placeholder:text-slate-500" />
    </div>
  </div>
);

export default AuthPage;
