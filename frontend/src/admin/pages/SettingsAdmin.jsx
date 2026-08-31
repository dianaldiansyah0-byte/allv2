import React, { useEffect, useState } from 'react';
import { Settings, Loader2, Save, KeyRound, ShieldCheck, Percent, Palette, Image as ImageIcon, Share2, Info } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { PageTitle, Field, SelectField, ToggleRow } from '../ui';
import ImagePicker from '../ImagePicker';
import { useToast } from '../../hooks/use-toast';

const SettingsAdmin = () => {
  const { getSettings, updateSettings, admin, changeCreds } = useAdmin();
  const { toast } = useToast();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cred, setCred] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });
  const [savingCred, setSavingCred] = useState(false);

  useEffect(() => { getSettings().then(setS).catch(() => {}); }, []);
  useEffect(() => { if (admin) setCred((c) => ({ ...c, name: admin.name, email: admin.email })); }, [admin]);

  const save = async (msg = 'Perubahan langsung tampil di situs.') => {
    setSaving(true);
    try { const d = await updateSettings(s); setS(d); toast({ title: 'Pengaturan disimpan', description: msg }); }
    catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveCred = async () => {
    if (!cred.currentPassword) { toast({ title: 'Isi password saat ini', variant: 'destructive' }); return; }
    setSavingCred(true);
    try {
      await changeCreds({ name: cred.name, email: cred.email, currentPassword: cred.currentPassword, newPassword: cred.newPassword || undefined });
      toast({ title: 'Kredensial diperbarui', description: 'Email/password admin berhasil diubah.' });
      setCred((c) => ({ ...c, currentPassword: '', newPassword: '' }));
    } catch (e) { toast({ title: 'Gagal', description: e?.response?.data?.detail || 'Error', variant: 'destructive' }); }
    finally { setSavingCred(false); }
  };

  if (!s) return <div className="grid place-items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-400" /></div>;

  const SaveBtn = ({ label = 'Simpan' }) => (
    <button onClick={() => save()} disabled={saving} className="btn-cyber text-sm ml-auto" data-testid="settings-save-btn">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {label}</>}</button>
  );

  return (
    <div>
      <PageTitle icon={Settings} title="Pengaturan Situs" desc="Identitas toko, logo, kontak, dan konfigurasi operasional." />

      {/* Branding & logo */}
      <div className="panel rounded-xl p-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-cyan-300" />
          <h2 className="font-head font-bold text-white text-lg">Logo & Branding</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 items-start">
          <ImagePicker label="Logo Situs" value={s.logoUrl} onChange={(v) => setS({ ...s, logoUrl: v })}
            recommended={{ w: 240, h: 64 }} mode="contain" aspect="aspect-[4/1]" testId="logo-picker"
            note="PNG transparan, tinggi ideal 64px. Tampil di navbar & footer." />
          <div className="max-w-[220px]">
            <ImagePicker label="Favicon" value={s.faviconUrl} onChange={(v) => setS({ ...s, faviconUrl: v })}
              recommended={{ w: 64, h: 64 }} mode="cover" aspect="aspect-square" testId="favicon-picker"
              note="Ikon tab browser, persegi 64×64px." />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <Field label="Nama Situs" value={s.siteName} onChange={(v) => setS({ ...s, siteName: v })} />
          <Field label="Tagline" value={s.tagline} onChange={(v) => setS({ ...s, tagline: v })} />
          <Field label="Tinggi Logo di Navbar (px)" type="number" value={s.logoWidth ?? 36} onChange={(v) => setS({ ...s, logoWidth: v })} />
          <Field label="WhatsApp Admin" value={s.whatsapp} onChange={(v) => setS({ ...s, whatsapp: v })} placeholder="6281234567890" />
        </div>
        <div className="flex mt-4"><SaveBtn label="Simpan Branding" /></div>
      </div>

      {/* Informasi situs */}
      <div className="panel rounded-xl p-6 max-w-4xl mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-cyan-300" />
          <h2 className="font-head font-bold text-white text-lg">Informasi & Pengumuman</h2>
        </div>
        <div className="space-y-4">
          <Field label="Pengumuman (tampil di atas beranda)" textarea value={s.announcement} onChange={(v) => setS({ ...s, announcement: v })} placeholder="Contoh: Promo QRIS hemat 5% sampai akhir bulan!" />
          <Field label="Tentang Toko (footer)" textarea value={s.footerAbout} onChange={(v) => setS({ ...s, footerAbout: v })} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Jam Layanan" value={s.supportHours} onChange={(v) => setS({ ...s, supportHours: v })} placeholder="Support 24 jam setiap hari" />
            <Field label="Catatan Footer / Copyright" value={s.footerNote} onChange={(v) => setS({ ...s, footerNote: v })} />
          </div>
        </div>
        <div className="flex mt-4"><SaveBtn label="Simpan Informasi" /></div>
      </div>

      {/* Sosial media */}
      <div className="panel rounded-xl p-6 max-w-4xl mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-cyan-300" />
          <h2 className="font-head font-bold text-white text-lg">Media Sosial</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Instagram (URL)" value={s.socialInstagram} onChange={(v) => setS({ ...s, socialInstagram: v })} placeholder="https://instagram.com/..." />
          <Field label="Telegram (URL)" value={s.socialTelegram} onChange={(v) => setS({ ...s, socialTelegram: v })} placeholder="https://t.me/..." />
          <Field label="Facebook (URL)" value={s.socialFacebook} onChange={(v) => setS({ ...s, socialFacebook: v })} placeholder="https://facebook.com/..." />
        </div>
        <div className="flex mt-4"><SaveBtn label="Simpan Sosial" /></div>
      </div>

      {/* Tampilan */}
      <div className="panel rounded-xl p-6 max-w-4xl mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-cyan-300" />
          <h2 className="font-head font-bold text-white text-lg">Tampilan & Operasional</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Warna Primer" value={s.primaryColor} onChange={(v) => setS({ ...s, primaryColor: v })} />
          <Field label="Warna Aksen" value={s.accentColor} onChange={(v) => setS({ ...s, accentColor: v })} />
          <Field label="Durasi Flash Sale (jam)" type="number" value={s.flashSaleHours} onChange={(v) => setS({ ...s, flashSaleHours: v })} />
          <div className="flex items-end pb-2"><div className="w-full">
            <ToggleRow label="Izinkan konfirmasi bayar manual (uji coba)" checked={s.allowManualPay !== false} onChange={(v) => setS({ ...s, allowManualPay: v })} />
          </div></div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <div className="flex items-center gap-2"><span className="text-xs text-slate-400">Preview:</span><span className="w-6 h-6 rounded" style={{ background: s.primaryColor }} /><span className="w-6 h-6 rounded" style={{ background: s.accentColor }} /></div>
          <SaveBtn label="Simpan Tampilan" />
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Matikan konfirmasi manual bila situs sudah live agar semua pembayaran wajib lewat Midtrans.</p>
      </div>

      {/* Margin */}
      <div className="panel rounded-xl p-6 max-w-4xl mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-cyan-300" />
          <h2 className="font-head font-bold text-white text-lg">Margin Harga (Digiflazz)</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">Markup otomatis dari harga modal Digiflazz ke harga jual saat Auto-Map SKU dijalankan.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <SelectField label="Tipe Markup" value={s.markupType || 'percent'} onChange={(v) => setS({ ...s, markupType: v })} options={[{ value: 'percent', label: 'Persentase (%)' }, { value: 'fixed', label: 'Nominal Tetap (Rp)' }]} />
          <Field label={(s.markupType || 'percent') === 'percent' ? 'Markup (%)' : 'Markup (Rp)'} type="number" value={s.markupValue ?? 10} onChange={(v) => setS({ ...s, markupValue: v })} />
          <Field label="Pembulatan ke (Rp)" type="number" value={s.roundTo ?? 500} onChange={(v) => setS({ ...s, roundTo: v })} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <p className="text-[11px] text-slate-500">Contoh: modal Rp 9.000 + 10% = Rp 9.900 → dibulatkan ke Rp 10.000.</p>
          <SaveBtn label="Simpan Margin" />
        </div>
      </div>

      {/* Kredensial admin */}
      <div className="panel rounded-xl p-6 max-w-4xl mt-6 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-cyan-300" />
          <h2 className="font-head font-bold text-white text-lg">Ganti Kredensial Admin</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nama" value={cred.name} onChange={(v) => setCred({ ...cred, name: v })} />
          <Field label="Email" type="email" value={cred.email} onChange={(v) => setCred({ ...cred, email: v })} />
          <Field label="Password Saat Ini" type="password" value={cred.currentPassword} onChange={(v) => setCred({ ...cred, currentPassword: v })} placeholder="Wajib untuk konfirmasi" />
          <Field label="Password Baru (opsional)" type="password" value={cred.newPassword} onChange={(v) => setCred({ ...cred, newPassword: v })} placeholder="Kosongkan jika tidak diubah" />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <p className="text-[11px] text-slate-500 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Password saat ini wajib diisi untuk menyimpan perubahan.</p>
          <button onClick={saveCred} disabled={savingCred} className="btn-cyber text-sm ml-auto">{savingCred ? <Loader2 className="w-4 h-4 animate-spin" /> : <><KeyRound className="w-4 h-4" /> Perbarui</>}</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsAdmin;
