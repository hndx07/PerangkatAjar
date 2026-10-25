import React from 'react';
import { X, Check, School, User, Calendar, UploadCloud, Link2, Trash2 } from 'lucide-react';
import { SchoolIdentity } from '../types';
import {
  DEFAULT_SCHOOL_LOGO_URL,
  extractLogoSource,
  fileToLogoDataUrl,
} from '../utils/logo';

interface SchoolIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: SchoolIdentity;
  onSave: (updated: SchoolIdentity) => void;
}

type LogoMode = 'bawaan' | 'unggah' | 'url';

const inputCls = 'w-full px-3 py-2 border-2 border-black rounded-lg text-sm bg-white';
const smallInputCls = 'w-full px-2.5 py-1.5 border-2 border-black rounded-lg text-xs bg-white';

interface FieldProps {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  required?: boolean;
  small?: boolean;
  mono?: boolean;
  placeholder?: string;
  className?: string;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, required, small, mono, placeholder, className }) => (
  <div className={className}>
    <label className={`${small ? 'text-[11px]' : 'text-xs'} font-bold text-neutral-800 block mb-1`}>{label}</label>
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={`${small ? smallInputCls : inputCls} ${mono ? 'font-mono' : ''}`}
    />
  </div>
);

export const SchoolIdentityModal: React.FC<SchoolIdentityModalProps> = ({
  isOpen,
  onClose,
  identity,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<SchoolIdentity>(identity);
  const [logoText, setLogoText] = React.useState(identity.logoKode ?? '');
  const [uploaded, setUploaded] = React.useState(identity.logoSumber === 'unggah' ? identity.logoSekolah ?? '' : '');
  const [logoError, setLogoError] = React.useState('');
  const [logoBusy, setLogoBusy] = React.useState(false);
  const [previewBroken, setPreviewBroken] = React.useState(false);

  React.useEffect(() => {
    setFormData(identity);
    setLogoText(identity.logoKode ?? '');
    setUploaded(identity.logoSumber === 'unggah' ? identity.logoSekolah ?? '' : '');
    setLogoError('');
  }, [identity]);

  React.useEffect(() => {
    setPreviewBroken(false);
  }, [formData.logoSekolah]);

  if (!isOpen) return null;

  const set = <K extends keyof SchoolIdentity>(field: K, value: SchoolIdentity[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ---- Logo sekolah -------------------------------------------------------
  const mode: LogoMode = formData.logoSumber ?? (formData.logoSekolah ? 'url' : 'bawaan');

  const patchLogo = (patch: Partial<SchoolIdentity>) => setFormData((prev) => ({ ...prev, ...patch }));

  const chooseMode = (next: LogoMode) => {
    setLogoError('');
    if (next === 'bawaan') {
      patchLogo({ logoSumber: 'bawaan', logoSekolah: '', logoKode: '' });
    } else if (next === 'unggah') {
      patchLogo({ logoSumber: 'unggah', logoSekolah: uploaded, logoKode: '' });
    } else {
      const res = logoText.trim() ? extractLogoSource(logoText) : null;
      if (res && !res.ok) setLogoError(res.error);
      patchLogo({ logoSumber: 'url', logoSekolah: res && res.ok ? res.src : '', logoKode: logoText });
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLogoBusy(true);
    setLogoError('');
    try {
      const uri = await fileToLogoDataUrl(file);
      setUploaded(uri);
      patchLogo({ logoSumber: 'unggah', logoSekolah: uri, logoKode: '' });
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Gagal memproses gambar.');
    } finally {
      setLogoBusy(false);
    }
  };

  const handleLogoText = (value: string) => {
    setLogoText(value);
    if (!value.trim()) {
      setLogoError('');
      patchLogo({ logoSumber: 'url', logoSekolah: '', logoKode: '' });
      return;
    }
    const res = extractLogoSource(value);
    if (res.ok) {
      setLogoError('');
      patchLogo({ logoSumber: 'url', logoSekolah: res.src, logoKode: value });
    } else {
      setLogoError(res.error);
      patchLogo({ logoSumber: 'url', logoSekolah: '', logoKode: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let result = formData;
    if (mode === 'url' && logoText.trim() && !formData.logoSekolah) {
      setLogoError(logoError || 'Logo dari URL/kode embed belum terbaca. Perbaiki atau pilih logo bawaan.');
      return;
    }
    if (mode === 'unggah' && !formData.logoSekolah) {
      result = { ...formData, logoSumber: 'bawaan', logoKode: '' };
    }
    onSave(result);
    onClose();
  };

  const modeBtn = (value: LogoMode, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => chooseMode(value)}
      aria-pressed={mode === value}
      className={`neo-btn px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${
        mode === value ? 'bg-amber-300 text-black' : 'bg-white hover:bg-neutral-100 text-neutral-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const effectiveLogo = formData.logoSekolah || DEFAULT_SCHOOL_LOGO_URL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="bg-[#FFFDF7] neo-box-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-neutral-100 hover:bg-rose-100 border-2 border-black"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-black">
          <div className="w-8 h-8 rounded-lg bg-amber-400 border-2 border-black flex items-center justify-center">
            <School className="w-4 h-4 text-black" />
          </div>
          <div>
            <h3 className="font-display font-black text-xl text-neutral-900">
              Identitas Satuan Pendidikan & Guru
            </h3>
            <p className="text-xs text-neutral-600">
              Semua isian bisa diubah. Perubahan langsung dipakai di dokumen ATP, RPP, dan lampiran.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Satuan pendidikan */}
          <div className="p-3 bg-amber-50 border-2 border-black rounded-xl space-y-3">
            <Field
              label="Nama Satuan Pendidikan"
              value={formData.schoolName}
              onChange={(v) => set('schoolName', v)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Kabupaten / Kota" value={formData.kabupaten} onChange={(v) => set('kabupaten', v)} />
              <Field label="Provinsi" value={formData.provinsi} onChange={(v) => set('provinsi', v)} />
            </div>
          </div>

          {/* Logo sekolah */}
          <div className="p-3 bg-white border-2 border-black rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase text-neutral-700 tracking-wider">Logo Sekolah</h4>
              <span className="text-[10px] text-neutral-500">Dipakai di kop surat dan watermark dokumen</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-20 h-20 shrink-0 border-2 border-black rounded-lg bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={effectiveLogo}
                  alt="Pratinjau logo sekolah"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => setPreviewBroken(true)}
                />
              </div>
              <div className="text-[11px] text-neutral-600 leading-snug">
                {previewBroken ? (
                  <span className="font-bold text-red-700">
                    Gambar tidak dapat dimuat dari alamat ini. Dokumen akan memakai logo bawaan.
                  </span>
                ) : mode === 'bawaan' ? (
                  'Memakai logo bawaan.'
                ) : mode === 'unggah' ? (
                  'Logo unggahan Anda. Tersimpan di peramban ini (localStorage) dan tidak dikirim ke server.'
                ) : (
                  'Logo dari URL / kode embed.'
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {modeBtn('bawaan', 'Bawaan', <School className="w-3.5 h-3.5" />)}
              {modeBtn('unggah', 'Unggah', <UploadCloud className="w-3.5 h-3.5" />)}
              {modeBtn('url', 'URL / Embed', <Link2 className="w-3.5 h-3.5" />)}
            </div>

            {mode === 'unggah' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800 block" htmlFor="logo-file">
                  Pilih berkas gambar (PNG, JPG, WebP, GIF, SVG; maks. 5 MB)
                </label>
                <input
                  id="logo-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={handleFile}
                  disabled={logoBusy}
                  className="block w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:border-2 file:border-black file:rounded-lg file:bg-amber-300 file:text-xs file:font-bold file:cursor-pointer"
                />
                <p className="text-[11px] text-neutral-500">
                  {logoBusy ? 'Memproses gambar…' : 'Gambar otomatis diperkecil agar muat di penyimpanan peramban.'}
                </p>
              </div>
            )}

            {mode === 'url' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800 block" htmlFor="logo-kode">
                  URL gambar atau kode embed
                </label>
                <textarea
                  id="logo-kode"
                  rows={3}
                  value={logoText}
                  onChange={(e) => handleLogoText(e.target.value)}
                  placeholder={'https://contoh.com/logo.png\natau  <img src="https://contoh.com/logo.png">  atau  <svg>…</svg>'}
                  className="w-full px-2.5 py-1.5 border-2 border-black rounded-lg text-xs bg-white font-mono"
                  spellCheck={false}
                />
                <p className="text-[11px] text-neutral-500">
                  Dari kode embed hanya alamat gambar (atau SVG) yang diambil; iframe dan skrip tidak dipakai.
                </p>
              </div>
            )}

            {logoError && (
              <p role="alert" className="text-[11px] font-bold text-red-700">
                {logoError}
              </p>
            )}

            {mode !== 'bawaan' && (
              <button
                type="button"
                onClick={() => {
                  setLogoText('');
                  setUploaded('');
                  chooseMode('bawaan');
                }}
                className="neo-btn px-3 py-1.5 bg-white hover:bg-red-50 text-black rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-700" />
                Hapus & kembali ke logo bawaan
              </button>
            )}
          </div>

          {/* Mapel & kelas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">Kategori Mata Pelajaran</label>
              <select
                value={formData.kategoriMapel || 'kejuruan'}
                onChange={(e) => set('kategoriMapel', e.target.value as SchoolIdentity['kategoriMapel'])}
                className={inputCls}
              >
                <option value="kejuruan">Kejuruan (Produktif)</option>
                <option value="umum">Normatif-Adaptif (Mapel Umum)</option>
              </select>
            </div>
            <Field
              label="Program Keahlian"
              value={formData.programKeahlian}
              onChange={(v) => set('programKeahlian', v)}
            />
            <Field
              label="Konsentrasi Keahlian"
              value={formData.konsentrasiKeahlian}
              onChange={(v) => set('konsentrasiKeahlian', v)}
            />
          </div>

          <Field
            label="Mata Pelajaran"
            value={formData.mataPelajaran}
            onChange={(v) => set('mataPelajaran', v)}
            required
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">Fase</label>
              <select value={formData.fase} onChange={(e) => set('fase', e.target.value)} className={inputCls}>
                <option value="E">Fase E (Kelas X)</option>
                <option value="F">Fase F (Kelas XI/XII)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">Kelas</label>
              <select value={formData.kelas} onChange={(e) => set('kelas', e.target.value)} className={inputCls}>
                <option value="X">Kelas X</option>
                <option value="XI">Kelas XI</option>
                <option value="XII">Kelas XII</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-800 block mb-1">Semester</label>
              <select value={formData.semester} onChange={(e) => set('semester', e.target.value)} className={inputCls}>
                <option value="1 (Ganjil)">1 (Ganjil)</option>
                <option value="2 (Genap)">2 (Genap)</option>
              </select>
            </div>
            <Field
              label="Tahun Pelajaran"
              value={formData.tahunPelajaran}
              onChange={(v) => set('tahunPelajaran', v)}
              required
            />
          </div>

          {/* Pengampu */}
          <div className="pt-2 border-t border-black/20">
            <h4 className="text-xs font-black uppercase text-neutral-700 tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Data Pengampu & Pengesahan</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Nama Guru Pengampu"
                value={formData.namaGuru}
                onChange={(v) => set('namaGuru', v)}
                required
              />
              <Field label="NIP / NBM Guru" value={formData.nipGuru} onChange={(v) => set('nipGuru', v)} />
              <Field
                label="Nama Kepala Sekolah"
                value={formData.namaKepalaSekolah}
                onChange={(v) => set('namaKepalaSekolah', v)}
              />
              <Field
                label="NIP / NBM Kepala Sekolah"
                value={formData.nipKepalaSekolah}
                onChange={(v) => set('nipKepalaSekolah', v)}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Tanggal Penetapan Dokumen</span>
                </label>
                <input
                  type="text"
                  value={formData.tanggalPenyusunan ?? ''}
                  onChange={(e) => set('tanggalPenyusunan', e.target.value)}
                  placeholder="Misal: 15 Juli 2026"
                  className={inputCls}
                />
              </div>
              <Field
                label="Tempat Penetapan (tanda tangan)"
                value={formData.tempatPenyusunan ?? 'Bawang'}
                onChange={(v) => set('tempatPenyusunan', v)}
                placeholder="Misal: Bawang"
              />
            </div>
          </div>

          {/* Kop surat */}
          <div className="pt-2 border-t border-black/20">
            <h4 className="text-xs font-black uppercase text-neutral-700 tracking-wider mb-2 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5" />
              <span>Detail Kop Surat & Alamat Resmi</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                small
                label="Baris 1 Kop (Majelis/Yayasan)"
                value={formData.majelisLine1}
                onChange={(v) => set('majelisLine1', v)}
              />
              <Field
                small
                label="Baris 2 Kop (Daerah/Wilayah)"
                value={formData.majelisLine2}
                onChange={(v) => set('majelisLine2', v)}
              />
              <Field
                small
                label="Status Akreditasi"
                value={formData.statusAkreditasi}
                onChange={(v) => set('statusAkreditasi', v)}
              />
              <Field small label="Kode Pos" value={formData.kodePos} onChange={(v) => set('kodePos', v)} mono />
              <Field
                small
                label="Alamat Lengkap Sekolah"
                value={formData.alamatLengkap}
                onChange={(v) => set('alamatLengkap', v)}
                className="sm:col-span-2"
              />
              <Field small mono label="Email Resmi" value={formData.email} onChange={(v) => set('email', v)} />
              <Field small mono label="Website Resmi" value={formData.website} onChange={(v) => set('website', v)} />
              <Field small mono label="Telepon" value={formData.telepon} onChange={(v) => set('telepon', v)} />
              <Field small mono label="Fax" value={formData.fax} onChange={(v) => set('fax', v)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              className="neo-btn px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-black text-xs font-bold rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={logoBusy}
              className="neo-btn px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black text-xs font-black rounded-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Identitas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
