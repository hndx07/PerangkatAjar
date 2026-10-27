import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  Layers,
  Table,
  CheckCircle2,
  ExternalLink,
  Code2,
  HelpCircle,
  Download,
  Info,
} from 'lucide-react';
import { SchoolIdentity } from '../types';
import { downloadAtpExcelTemplate, downloadRppExcelTemplate } from '../utils/excelParser';

interface ExcelGuideAndAiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Tidak dipakai lagi: isian prompt dikosongkan agar bisa dipakai guru dan sekolah mana pun. */
  identity?: SchoolIdentity;
}

export const ExcelGuideAndAiPromptModal: React.FC<ExcelGuideAndAiPromptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'alur' | 'prompt' | 'skema'>('alur');
  const [activePromptType, setActivePromptType] = useState<'atp' | 'rpp'>('atp');
  // Semua isian dikosongkan secara bawaan; bagian yang kosong tampil sebagai [ ] di prompt
  const [selectedJurusan, setSelectedJurusan] = useState<string>('');
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [selectedFase, setSelectedFase] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [topikMateri, setTopikMateri] = useState<string>('');
  const [pendekatanBelajar, setPendekatanBelajar] = useState<string>('');
  const [metodeBelajar, setMetodeBelajar] = useState<string>('');
  const [cpAtp, setCpAtp] = useState<string>('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2500);
  };

  /** Isian kosong tampil sebagai "[ ]" agar bisa diisi langsung di chat AI. */
  const isi = (v: string): string => (v.trim() ? v.trim() : ' ');
  const faseKelasSemester = [selectedFase, selectedKelas, selectedSemester].some((v) => v.trim())
    ? [selectedFase, selectedKelas, selectedSemester].map((v) => v.trim() || '…').join(' • ')
    : ' ';

  // Bagian 1 prompt: nilai yang sudah diketahui dari identitas/pilihan diisikan, sisanya tetap [ ] untuk diisi guru
  const bagian1Rpp = `* Mata pelajaran: [${isi(selectedMapel)}]
* Topik / materi pokok: [${isi(topikMateri)}]
* Elemen CP: [ ]
* Jurusan / konteks murid: [${isi(selectedJurusan)}]
Fase • Kelas • Semester: [${faseKelasSemester}]
Alokasi waktu: [2 JP; 1 JP = 45 menit]
Jumlah unit (1 unit = 1 baris RPP): [1]

Opsional (kosongkan bila tidak ada, nanti disusun otomatis):
CP / ATP resmi (tempel): [${isi(cpAtp)}]
Dimensi Profil Lulusan: [ ]
Pendekatan belajar: [${isi(pendekatanBelajar)}]
Model / metode belajar: [${isi(metodeBelajar)}]
Kemitraan DUDI & orang tua: [ ]
Tautan materi / LKPD (URL): [ ]
Catatan khusus / materi sumber: [ ]`;

  // Prompt RPP Deep Learning: mengisi Template RPP Terintegrasi (nama kolom sama dengan header template)
  const generatedRppPrompt = `PERAN
Kamu asisten penyusun perangkat ajar Kurikulum Merdeka (Pembelajaran Mendalam / Deep Learning) untuk guru SMK. Tugasmu: mengisi template Excel RPP yang saya lampirkan sampai lengkap, lalu menyerahkan file .xlsx hasilnya.

══════ BAGIAN 1 — ISI BAGIAN INI SAJA ══════
(Ganti teks di dalam [ ]. Tanda * wajib diisi. Sisanya sudah ada isi bawaan atau boleh kosong.)

${bagian1Rpp}

══════ BAGIAN 2 — TETAP, JANGAN DIUBAH ══════

A. CARA KERJA
1. Buka template Excel terlampir. Cari kolom berdasarkan TEKS HEADER di baris 5, bukan huruf kolom.
2. Jangan ubah baris 1–5, nama sheet, maupun header. Baris 6 adalah contoh: timpa dengan unit 1. Unit berikutnya di baris 7 dst.
3. Tulis dalam Bahasa Indonesia, sebut "murid". Alur: Memahami → Mengaplikasi → Merefleksi, dengan suasana Mindful, Meaningful, Joyful.
4. Semua kolom harus selaras dengan Bagian 1 dan saling nyambung: TP ↔ kegiatan ↔ asesmen.

B. ISI PER KOLOM (header → isi)
- No / Unit: nomor urut (angka).
- Elemen: dari Bagian 1.
- CP: dari Bagian 1 (CP / ATP yang saya tempel). Jika kosong, pakai CP resmi fase dan elemen tersebut (cari di web bila bisa), beri komentar sel "verifikasi".
- ATP / TP: 3 TP bertingkat, bernomor, berlabel (Memahami), (Mengaplikasi), (Merefleksi), kata kerja operasional, berkonteks jurusan. Jika Bagian 1 memuat ATP / TP, susun 3 TP itu dari ATP tersebut tanpa mengubah maknanya.
- Tahapan Alur: Tahap 1–3 beserta menitnya (total = alokasi waktu).
- Lingkup Materi Pokok: topik dan sub-topik.
- Alokasi Waktu (JP): angka saja. Fase: huruf. Kelas: angka Romawi. Semester: "1 (Ganjil)" atau "2 (Genap)".
- Lintas Disiplin Ilmu: kaitan dengan program keahlian / mapel lain.
- Kesiapan Peserta Didik: minat dan gaya belajar sebagai perkiraan, tanpa persentase karangan.
- Karakteristik Materi: konseptual / prosedural / aplikatif.
- Dimensi Profil Lulusan: 3–4 dimensi dari 8 ini: Keimanan dan Ketakwaan, Kewargaan, Penalaran Kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, Komunikasi.
- Metode & Model: sesuai Bagian 1 (tulis pendekatan belajar lalu metode / model belajar), atau pilih yang paling cocok.
- Kemitraan Industri & Orang Tua: sesuai Bagian 1. Jangan mengarang nama mitra.
- Lingkungan Belajar: fisik dan virtual.
- Pemanfaatan Digital: alat yang nyata dan bisa dipakai guru.
- Sintaks Pendahuluan (Mindful): 4–5 langkah bernomor: salam dan doa, cek kehadiran dan kesiapan, pertanyaan pemantik, tujuan dan alur.
- Sintaks Inti 1 (Memahami & Eksplorasi): 3–5 langkah bernomor, dengan contoh konkret dari jurusan.
- Sintaks Inti 2 (Mengaplikasi & Merefleksi): 3–4 langkah bernomor, aktivitas menyenangkan (game, simulasi, proyek, roleplay) plus umpan balik teman.
- Sintaks Penutup: Refleksi 3-2-1 (3 hal dipelajari, 2 hal menarik/sulit, 1 hal ingin diperbaiki), Kaizen, dan kesimpulan guru.
- Asesmen Awal (Diagnostik): pertanyaan atau kuis singkat pemetaan kesiapan.
- Asesmen Proses (Formatif): instrumen dan indikator. Jika berupa kuis, tulis soal lengkap dengan opsi, kunci, dan pembahasan singkat.
- Asesmen Akhir (Sumatif): produk atau unjuk kerja, dinilai dengan KKTP 3 level: Berkembang, Cakap, Mahir.
- Pengayaan dan Remedial: dua kelompok, disesuaikan dengan level KKTP.
- Tabel Hasil Eksplorasi: format wajib
  Judul :: Kolom1 | Kolom2 :: Data1a | Data1b ; Data2a | Data2b
  Satu tabel, 2 kolom, 4–6 baris berisi inti materi (istilah, ungkapan, rumus, atau langkah). Isi data tidak boleh mengandung "::", "|", atau ";".
- Tautan Materi dan Tautan LKPD: URL persis dari Bagian 1. Jika tidak ada, kosongkan.
- Kode Embed Materi dan Kode Embed LKPD: hanya bila ada URL, gunakan <iframe src="URL" width="100%" height="480" style="border:0" allowfullscreen></iframe>. Jika tidak ada URL, kosongkan.
- Kode Embed Rubrik: satu tabel HTML, CSS inline, tanpa script dan tanpa gambar luar, memuat 3 level KKTP dan kriterianya, selaras dengan Asesmen Akhir.

C. ATURAN FORMAT
- Butir dalam satu sel ditulis bernomor "1. 2. 3." dipisah baris baru, bukan titik koma.
- Tiap sel maksimal 32.000 karakter. Isi sel tidak boleh diawali "=", "+", atau "-".
- Semua sel rata atas dan wrap text, header dibuat tebal, jenis font tidak diubah.

D. ATURAN KEJUJURAN
- Jangan mengarang URL, nama mitra, data murid, atau nama guru.
- Kolom yang tidak bisa diisi dari Bagian 1: kosongkan, beri warna kuning (FFFF00) dan komentar sel "isi manual".
- Kolom hasil susunan atau asumsi (Kesiapan, Lintas Disiplin, Kemitraan, Pengayaan/Remedial) beri komentar sel "disusun otomatis, mohon dicek".

E. PEMERIKSAAN & SERAH TERIMA
1. Sebelum menyerahkan, baca ulang file: semua kolom terisi (kecuali yang kuning), tidak ada sisa isi contoh lama, format Tabel Hasil Eksplorasi benar.
2. Simpan sebagai RPP_[Mapel]_[Topik singkat].xlsx.
3. Balas maksimal 5 baris: asumsi yang kamu buat dan sel kuning yang perlu saya isi.`;

  // Prompt ATP: struktur sama dengan prompt RPP, mengisi Template ATP (11 kolom pertama template RPP)
  const generatedAtpPrompt = `PERAN
Kamu asisten penyusun Alur Tujuan Pembelajaran (ATP) Kurikulum Merdeka untuk guru SMK. Tugasmu: mengisi template Excel ATP yang saya lampirkan sampai lengkap, lalu menyerahkan file .xlsx hasilnya.

══════ BAGIAN 1 — ISI BAGIAN INI SAJA ══════
(Ganti teks di dalam [ ]. Tanda * wajib diisi. Sisanya sudah ada isi bawaan atau boleh kosong.)

* Mata pelajaran: [${isi(selectedMapel)}]
* Elemen CP yang disusun: [semua elemen pada CP resmi, atau tulis elemen tertentu]
* Jurusan / konteks murid: [${isi(selectedJurusan)}]
Fase • Kelas • Semester: [${faseKelasSemester}]
Alokasi waktu per unit: [ ]
Jumlah unit (1 unit = 1 baris ATP): [ ]

Opsional (kosongkan bila tidak ada, nanti disusun otomatis):
CP / ATP resmi (tempel): [${isi(cpAtp)}]
Topik / lingkup materi yang diinginkan: [${isi(topikMateri)}]
Pendekatan belajar: [${isi(pendekatanBelajar)}]
Model / metode belajar: [${isi(metodeBelajar)}]
Catatan khusus / materi sumber: [ ]

══════ BAGIAN 2 — TETAP, JANGAN DIUBAH ══════

A. CARA KERJA
1. Buka template Excel terlampir. Cari kolom berdasarkan TEKS HEADER di baris 5, bukan huruf kolom.
2. Jangan ubah baris 1–5, nama sheet, maupun header. Baris 6 adalah contoh: timpa dengan unit 1. Unit berikutnya di baris 7 dst.
3. Tulis dalam Bahasa Indonesia, sebut "murid". Alur: Memahami → Mengaplikasi → Merefleksi.
4. Semua kolom harus selaras dengan Bagian 1 dan saling nyambung: CP ↔ TP ↔ Tahapan Alur ↔ Lingkup Materi.
5. Aplikasi membaca tiap nomor pada kolom ATP / TP sebagai satu baris ATP, dan tiap Tahap pada kolom Tahapan Alur dipasangkan dengan TP yang bernomor sama.

B. ISI PER KOLOM (header → isi)
- No / Unit: nomor urut (angka).
- Elemen: nama elemen resmi dari CP.
- CP: teks CP resmi untuk elemen itu secara utuh, dari Bagian 1 (CP / ATP yang saya tempel). Jika kosong, pakai CP resmi fase dan elemen tersebut (cari di web bila bisa), beri komentar sel "verifikasi".
- ATP / TP: 3 TP bertingkat, bernomor, berlabel (Memahami), (Mengaplikasi), (Merefleksi), kata kerja operasional, berkonteks jurusan. Tiap TP satu kalimat: Kompetensi + Konten. Jika Bagian 1 memuat ATP / TP, susun dari ATP tersebut tanpa mengubah maknanya.
- Tahapan Alur: Tahap 1–3 beserta menitnya, sejajar dengan TP bernomor sama (total menit = alokasi waktu). Contoh: "Tahap 1 (30 menit): ... Tahap 2 (60 menit): ... Tahap 3 (30 menit): ...".
- Lingkup Materi Pokok: topik dan sub-topik konkret yang dipelajari.
- Alokasi Waktu (JP): angka saja. Fase: huruf. Kelas: angka Romawi. Semester: "1 (Ganjil)" atau "2 (Genap)".
- Lintas Disiplin Ilmu: kaitan dengan program keahlian / mapel lain.

C. ATURAN FORMAT
- Butir dalam satu sel ditulis bernomor "1. 2. 3." dipisah baris baru, bukan titik koma.
- Tiap sel maksimal 32.000 karakter. Isi sel tidak boleh diawali "=", "+", atau "-".
- Semua sel rata atas dan wrap text, header dibuat tebal, jenis font tidak diubah.

D. ATURAN KEJUJURAN
- Jangan mengarang URL, nama mitra, data murid, atau nama guru.
- Kolom yang tidak bisa diisi dari Bagian 1: kosongkan, beri warna kuning (FFFF00) dan komentar sel "isi manual".
- Kolom hasil susunan atau asumsi (Lintas Disiplin, Alokasi Waktu) beri komentar sel "disusun otomatis, mohon dicek".

E. PEMERIKSAAN & SERAH TERIMA
1. Sebelum menyerahkan, baca ulang file: semua kolom terisi (kecuali yang kuning), tidak ada sisa isi contoh lama, TP bernomor dan sejajar dengan Tahap.
2. Simpan sebagai ATP_[Mapel]_[Fase-Kelas].xlsx.
3. Balas maksimal 5 baris: asumsi yang kamu buat dan sel kuning yang perlu saya isi.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs no-print">
      <div className="bg-[#FFFDF7] neo-box-lg max-w-5xl w-full h-[92vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-150 border-[3px] border-black shadow-[8px_8px_0px_#000]">
        
        {/* Top Header */}
        <div className="p-4 border-b-2 border-black bg-emerald-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <FileSpreadsheet className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg sm:text-xl text-neutral-900 leading-tight">
                Panduan Skema Excel & Generator Prompt AI (Siap Upload)
              </h3>
              <p className="text-xs text-neutral-700">
                Alur Resmi Penyiapan Dokumen: <strong>Lampiran CP ➔ Matriks ATP ➔ Modul RPP Deep Learning (.xlsx)</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-100 hover:bg-rose-100 border-2 border-black transition-all"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-neutral-100 border-b border-black/40 p-2 sm:px-4 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('alur')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all border ${
                activeTab === 'alur'
                  ? 'bg-amber-300 text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              1. Rekomendasi Alur 2-Tahap (CP ➔ ATP ➔ RPP)
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all border ${
                activeTab === 'prompt'
                  ? 'bg-emerald-300 text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              2. Generator Prompt AI (Salin ke Gemini/ChatGPT)
            </button>
            <button
              onClick={() => setActiveTab('skema')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all border ${
                activeTab === 'skema'
                  ? 'bg-blue-300 text-black border-2 border-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              3. Kamus Skema Kolom Excel Persis
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadAtpExcelTemplate('kejuruan')}
              className="neo-btn px-2.5 py-1 bg-amber-200 text-black text-xs font-bold rounded-lg border border-black flex items-center gap-1"
              title="Unduh Template Excel ATP (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-amber-900" />
              <span>Template ATP (.xlsx)</span>
            </button>
            <button
              onClick={() => downloadRppExcelTemplate('kejuruan')}
              className="neo-btn px-2.5 py-1 bg-emerald-300 text-black text-xs font-bold rounded-lg border border-black flex items-center gap-1"
              title="Unduh Template Excel RPP (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-950" />
              <span>Template RPP (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF8F5]">

          {/* TAB 1: ALUR DUA TAHAP BERBASIS REGULASI */}
          {activeTab === 'alur' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Highlight Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-100 via-orange-50 to-emerald-100 border-2 border-black rounded-2xl shadow-[4px_4px_0px_#000]">
                <h4 className="font-display font-black text-base text-neutral-900 mb-1 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-800" />
                  <span>Alur Resmi Kurikulum Merdeka</span>
                </h4>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  Agar hasil file Excel dapat <strong>100% sama persis dan langsung dikenali oleh sistem aplikasi ini</strong> tanpa error, siapkan dokumen melalui 2 tahap berurutan berikut:
                </p>
              </div>

              {/* 2-Tahap Visual Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* TAHAP 1: CP ➔ ATP */}
                <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_#000] flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-black border border-black text-xs font-black uppercase">
                        Tahap 1
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500 font-bold">Dasar Regulasi BSKAP 032</span>
                    </div>

                    <h5 className="font-display font-black text-base text-neutral-900">
                      Lampiran CP ➔ File Excel ATP (.xlsx)
                    </h5>

                    <p className="text-xs text-neutral-700 leading-relaxed">
                      Siapkan dokumen <strong>Lampiran Capaian Pembelajaran (CP)</strong> resmi Kemendikdasmen (BSKAP 032/H/KR/2024) sesuai bidang keahlian/jurusan Anda.
                    </p>

                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs space-y-1.5 text-neutral-800">
                      <div className="font-bold text-amber-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-700" />
                        <span>Langkah Eksekusi dengan AI:</span>
                      </div>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px] text-neutral-700">
                        <li>Buka tab <strong>"2. Generator Prompt AI"</strong> di atas.</li>
                        <li>Isi data pelajaran Anda (semua opsional), lalu klik <strong>"Salin Prompt AI Ini"</strong>.</li>
                        <li>Buka Gemini (gemini.google.com) atau ChatGPT, tempel prompt tersebut.</li>
                        <li>Lampirkan <strong>Template ATP (.xlsx)</strong> dari Langkah 1 ke chat AI bersama prompt, lalu AI mengisinya (11 kolom).</li>
                        <li>Unduh file <strong>.xlsx</strong> hasil AI.</li>
                        <li>Upload ke aplikasi ini ➔ Dokumen ATP langsung tersusun!</li>
                      </ol>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900">Hasil: Dokumen ATP</span>
                    <button
                      onClick={() => {
                        setActiveTab('prompt');
                        setActivePromptType('atp');
                      }}
                      className="neo-btn px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black rounded-lg border border-black flex items-center gap-1 shadow-[2px_2px_0px_#000]"
                    >
                      <span>Buka Prompt ATP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* TAHAP 2: ATP ➔ RPP DEEP LEARNING */}
                <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_#000] flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-black border border-black text-xs font-black uppercase">
                        Tahap 2
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500 font-bold">Deep Learning & PjBL/PBL</span>
                    </div>

                    <h5 className="font-display font-black text-base text-neutral-900">
                      Dokumen ATP ➔ File Excel RPP Terintegrasi (.xlsx)
                    </h5>

                    <p className="text-xs text-neutral-700 leading-relaxed">
                      Gunakan baris-baris <strong>ATP yang telah dihasilkan pada Tahap 1</strong> untuk menghasilkan dokumen RPP Deep Learning terintegrasi lengkap.
                    </p>

                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs space-y-1.5 text-neutral-800">
                      <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Langkah Eksekusi dengan AI:</span>
                      </div>
                      <ol className="list-decimal pl-4 space-y-1 text-[11px] text-neutral-700">
                        <li>Buka tab <strong>"2. Generator Prompt AI"</strong>, pilih sub-tab <strong>"Prompt RPP Deep Learning"</strong>.</li>
                        <li>Salin prompt, isi Bagian 1 (topik, elemen CP, jumlah unit), lalu tempel ke Gemini / ChatGPT / Claude bersama <strong>Template RPP (.xlsx)</strong>.</li>
                        <li>AI mengisi template komprehensif 32 kolom (Mindful, Meaningful, Joyful, Tabel Hasil Eksplorasi, Tautan &amp; Embed).</li>
                        <li>Unduh file <strong>.xlsx</strong> hasil AI.</li>
                        <li>Upload ke aplikasi ini ➔ Seluruh unit RPP langsung terdistribusi terpisah dengan Lembar Pengesahan dan Lampiran siap cetak!</li>
                      </ol>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900">Hasil: RPP Siap Cetak F4</span>
                    <button
                      onClick={() => {
                        setActiveTab('prompt');
                        setActivePromptType('rpp');
                      }}
                      className="neo-btn px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black rounded-lg border border-black flex items-center gap-1 shadow-[2px_2px_0px_#000]"
                    >
                      <span>Buka Prompt RPP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Fitur Khusus: Tabel Eksplorasi & Lampiran Embed */}
              <div className="p-4 bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000] space-y-3">
                <h5 className="font-display font-black text-sm text-neutral-900 flex items-center gap-2">
                  <Table className="w-4 h-4 text-purple-700" />
                  <span>Dukungan Penuh: Tabel Hasil Eksplorasi & Lampiran Embed Digital</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                    <strong className="text-purple-950 block font-bold">1. Tabel Hasil Eksplorasi dalam RPP:</strong>
                    <p className="text-neutral-700 text-[11px] leading-relaxed">
                      Dapat diisi melalui Excel dengan kolom <em>Tabel Hasil Eksplorasi</em>, atau diubah kapan saja secara manual melalui <strong>Editor RPP</strong> langsung di aplikasi.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                    <strong className="text-blue-950 block font-bold">2. Tautan & Kode Embed Lampiran:</strong>
                    <p className="text-neutral-700 text-[11px] leading-relaxed">
                      Materi dan LKPD mendukung kolom tautan URL (yang dapat dibuka via klik hyperlink di PDF siap cetak) serta kolom kode embed HTML (&lt;iframe&gt;) untuk tampilan interaktif.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: GENERATOR PROMPT AI */}
          {activeTab === 'prompt' && (
            <div className="space-y-5 max-w-4xl mx-auto">
              
              {/* Isian prompt: semua kolom kosong dan opsional */}
              <div className="p-4 bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000] space-y-3">
                <div className="pb-2 border-b border-neutral-200">
                  <h4 className="font-display font-black text-sm text-neutral-900">Isian untuk prompt AI</h4>
                  <p className="text-[11px] text-neutral-600">
                    Semua kolom opsional. Kolom yang dikosongkan tetap berupa [ ] di prompt dan bisa Anda isi langsung
                    di chat AI.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label htmlFor="pr-mapel" className="font-bold text-neutral-700 block mb-0.5 text-[11px]">Mata Pelajaran</label>
                    <input id="pr-mapel" type="text" value={selectedMapel} onChange={(e) => setSelectedMapel(e.target.value)} className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs bg-white font-medium" />
                  </div>
                  <div>
                    <label htmlFor="pr-jurusan" className="font-bold text-neutral-700 block mb-0.5 text-[11px]">Jurusan / Konsentrasi (bila ada)</label>
                    <input id="pr-jurusan" type="text" value={selectedJurusan} onChange={(e) => setSelectedJurusan(e.target.value)} className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs bg-white font-medium" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label htmlFor="pr-fase" className="font-bold text-neutral-700 block mb-0.5 text-[11px]">Fase</label>
                    <input id="pr-fase" type="text" value={selectedFase} onChange={(e) => setSelectedFase(e.target.value)} className="w-full px-2 py-1.5 border border-black rounded-lg text-xs bg-white text-center font-bold" />
                  </div>
                  <div>
                    <label htmlFor="pr-kelas" className="font-bold text-neutral-700 block mb-0.5 text-[11px]">Kelas</label>
                    <input id="pr-kelas" type="text" value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)} className="w-full px-2 py-1.5 border border-black rounded-lg text-xs bg-white text-center font-bold" />
                  </div>
                  <div>
                    <label htmlFor="pr-semester" className="font-bold text-neutral-700 block mb-0.5 text-[11px]">Semester</label>
                    <input id="pr-semester" type="text" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="w-full px-2 py-1.5 border border-black rounded-lg text-xs bg-white text-center font-bold" />
                  </div>
                </div>

                <div className="text-xs">
                  <label htmlFor="pr-topik" className="font-bold text-neutral-700 block mb-0.5 text-[11px]">Materi Pelajaran / Topik Pokok</label>
                  <input id="pr-topik" type="text" value={topikMateri} onChange={(e) => setTopikMateri(e.target.value)} className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs bg-white font-medium" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label htmlFor="pr-pendekatan" className="font-bold text-neutral-700 block mb-0.5 text-[11px]">Pendekatan Belajar</label>
                    <input id="pr-pendekatan" type="text" value={pendekatanBelajar} onChange={(e) => setPendekatanBelajar(e.target.value)} className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs bg-white font-medium" />
                  </div>
                  <div>
                    <label htmlFor="pr-metode" className="font-bold text-neutral-700 block mb-0.5 text-[11px]">Metode / Model Belajar</label>
                    <input id="pr-metode" type="text" value={metodeBelajar} onChange={(e) => setMetodeBelajar(e.target.value)} className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs bg-white font-medium" />
                  </div>
                </div>

                <div className="text-xs">
                  <label htmlFor="pr-cpatp" className="font-bold text-neutral-700 block mb-0.5 text-[11px]">CP / ATP (opsional)</label>
                  <textarea
                    id="pr-cpatp"
                    rows={4}
                    value={cpAtp}
                    onChange={(e) => setCpAtp(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs bg-white font-medium"
                  />
                </div>
              </div>

              {/* Sub-Tabs: Prompt ATP vs Prompt RPP */}
              <div className="flex items-center gap-2 border-b-2 border-black pb-1">
                <button
                  onClick={() => setActivePromptType('atp')}
                  className={`px-4 py-2 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 border-t-2 border-x-2 ${
                    activePromptType === 'atp'
                      ? 'bg-amber-300 text-black border-black shadow-[2px_-2px_0px_#000]'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-900" />
                  <span>A. Prompt AI untuk Generate Matriks ATP (.xlsx)</span>
                </button>
                <button
                  onClick={() => setActivePromptType('rpp')}
                  className={`px-4 py-2 rounded-t-xl text-xs font-black transition-all flex items-center gap-1.5 border-t-2 border-x-2 ${
                    activePromptType === 'rpp'
                      ? 'bg-emerald-300 text-black border-black shadow-[2px_-2px_0px_#000]'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-950" />
                  <span>B. Prompt AI untuk Generate RPP Deep Learning (.xlsx)</span>
                </button>
              </div>

              {/* Prompt Card Box */}
              <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[4px_4px_0px_#000]">
                <div className="p-3 bg-neutral-100 border-b border-black flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-mono text-xs font-bold text-neutral-800">
                      {activePromptType === 'atp'
                        ? 'Prompt AI: Alur Tujuan Pembelajaran (ATP)'
                        : 'Prompt AI: RPP Deep Learning Terintegrasi'}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      handleCopy(
                        activePromptType === 'atp' ? generatedAtpPrompt : generatedRppPrompt,
                        activePromptType
                      )
                    }
                    className="neo-btn px-4 py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-[2px_2px_0px_#404040]"
                  >
                    {copiedType === activePromptType ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Prompt Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-400" />
                        <span>Salin Prompt AI Ini</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-neutral-50/80 font-mono text-xs text-neutral-800 max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed border-b border-black/10">
                  {activePromptType === 'atp' ? generatedAtpPrompt : generatedRppPrompt}
                </div>

                {/* Practical Copy-Paste Guide to Excel */}
                <div className="p-3.5 bg-amber-50 border-t border-amber-300 flex items-start gap-2.5 text-xs text-amber-950">
                  <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="block font-bold">Cara Memasukkan Hasil Jawaban AI ke Microsoft Excel / Google Sheets:</strong>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-neutral-700">
                      <li>Unduh <strong>Template ATP</strong> atau <strong>Template RPP</strong> dari panel "Sumber data ATP" di Langkah 1.</li>
                      <li>Buka <strong>Gemini</strong> (atau ChatGPT / Claude), tempel prompt di atas, lalu <strong>lampirkan file template</strong>. Jika Anda punya teks CP sendiri, tempel di Bagian 1.</li>
                      <li>Isi bagian bertanda <strong>[ ]</strong> di Bagian 1 sebelum mengirim.</li>
                      <li>Unduh file <strong>.xlsx</strong> hasil AI. Sel berwarna <strong>kuning</strong> perlu Anda isi manual.</li>
                      <li>Upload file tersebut ke aplikasi ini di Langkah 1 ➔ Dokumen ATP dan RPP langsung tersaji!</li>
                    </ol>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SPESIFIKASI SKEMA KOLOM EXCEL */}
          {activeTab === 'skema' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Skema 1: Format Kolom ATP */}
              <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-black inline-block"></span>
                    <h5 className="font-display font-black text-sm uppercase text-neutral-900">
                      Format 1: Skema Kolom File Excel ATP (Alur Tujuan Pembelajaran)
                    </h5>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
                    11 Kolom Standar
                  </span>
                </div>

                <div className="border border-black overflow-x-auto rounded-lg">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-amber-100 border-b border-black font-bold text-neutral-900">
                        <th className="p-2 border-r border-black w-12 text-center">No</th>
                        <th className="p-2 border-r border-black w-40 text-left">Nama Kolom Excel</th>
                        <th className="p-2 border-r border-black w-24 text-center">Sifat</th>
                        <th className="p-2 text-left">Deskripsi & Contoh Isian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 text-[11px]">
                      <tr>
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">1</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">No / Unit</td>
                        <td className="p-2 border-r border-neutral-300 text-center text-emerald-700 font-bold">Wajib</td>
                        <td className="p-2">Nomor urut elemen (1, 2, 3...)</td>
                      </tr>
                      <tr className="bg-neutral-50/50">
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">2</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">Elemen</td>
                        <td className="p-2 border-r border-neutral-300 text-center text-emerald-700 font-bold">Wajib</td>
                        <td className="p-2">Nama elemen resmi CP (contoh: Praktikum Akuntansi Perusahaan Jasa dan Dagang)</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">3</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">CP</td>
                        <td className="p-2 border-r border-neutral-300 text-center text-emerald-700 font-bold">Wajib</td>
                        <td className="p-2">Paragraf CP resmi BSKAP No 032/H/KR/2024</td>
                      </tr>
                      <tr className="bg-neutral-50/50">
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">4</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">ATP / TP</td>
                        <td className="p-2 border-r border-neutral-300 text-center text-neutral-600">Opsional</td>
                        <td className="p-2">3 TP bertingkat, bernomor: 1. ... (Memahami) 2. ... (Mengaplikasi) 3. ... (Merefleksi). Tiap nomor menjadi satu baris ATP</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">5</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">Tahapan Alur</td>
                        <td className="p-2 border-r border-neutral-300 text-center text-neutral-600">Opsional</td>
                        <td className="p-2">Tahap 1–3 beserta menitnya (Tahap 1 (30 menit): ...), sejajar dengan TP bernomor sama</td>
                      </tr>
                      <tr className="bg-neutral-50/50">
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">6</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">Lingkup Materi Pokok</td>
                        <td className="p-2 border-r border-neutral-300 text-center text-emerald-700 font-bold">Wajib</td>
                        <td className="p-2">Judul lingkup materi pokok yang akan menjadi unit RPP terpisah</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">7</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">Alokasi Waktu (JP)</td>
                        <td className="p-2 border-r border-neutral-300 text-center text-emerald-700 font-bold">Wajib</td>
                        <td className="p-2">Jumlah jam pelajaran angka (contoh: 24 atau 18)</td>
                      </tr>
                      <tr className="bg-neutral-50/50">
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">8-10</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">Fase, Kelas, Semester</td>
                        <td className="p-2 border-r border-neutral-300 text-center text-neutral-600">Opsional</td>
                        <td className="p-2">Contoh: F, XI, 1 (Ganjil)</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">11</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">Lintas Disiplin Ilmu</td>
                        <td className="p-2 border-r border-neutral-300 text-center text-neutral-600">Opsional</td>
                        <td className="p-2">Keterkaitan dengan disiplin ilmu lainnya</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Skema 2: Format Kolom RPP Terintegrasi */}
              <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border border-black inline-block"></span>
                    <h5 className="font-display font-black text-sm uppercase text-neutral-900">
                      Format 2: Skema Kolom File Excel RPP Terintegrasi Lengkap
                    </h5>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Semua Kolom Deep Learning
                  </span>
                </div>

                <div className="border border-black overflow-x-auto rounded-lg">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-emerald-100 border-b border-black font-bold text-neutral-900">
                        <th className="p-2 border-r border-black w-12 text-center">No</th>
                        <th className="p-2 border-r border-black w-48 text-left">Nama Kolom Excel</th>
                        <th className="p-2 text-left">Keterangan Khusus & Format Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 text-[11px]">
                      <tr>
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">1-11</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold">No s.d. Lintas Disiplin Ilmu</td>
                        <td className="p-2">Sama dengan skema ATP di atas (identitas dasar unit pembelajaran)</td>
                      </tr>
                      <tr className="bg-neutral-50/50">
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">12-14</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold">Kesiapan Peserta Didik, Karakteristik Materi, Dimensi Profil Lulusan</td>
                        <td className="p-2">Minat &amp; gaya belajar sebagai perkiraan (tanpa persentase), sifat materi konseptual/prosedural/aplikatif, dan 3–4 dari 8 Dimensi Profil Lulusan</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">15-18</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold">Metode &amp; Model, Kemitraan Industri &amp; Orang Tua, Lingkungan Belajar, Pemanfaatan Digital</td>
                        <td className="p-2">Model (PBL / PjBL); Kemitraan: <code>Mitra DUDI: ... Peran Ortu: ...</code> (tanpa nama karangan); Lingkungan: <code>Ruang Fisik: ... Ruang Virtual: ...</code>; Digital: alat yang nyata</td>
                      </tr>
                      <tr className="bg-amber-50">
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">19-22</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-amber-900">Sintaks Pembelajaran Deep Learning</td>
                        <td className="p-2">
                          <strong>Sintaks Pendahuluan (Mindful)</strong> (langkah bernomor 1. 2. 3.), <strong>Sintaks Inti 1</strong> (Memahami &amp; Eksplorasi), <strong>Sintaks Inti 2</strong> (Mengaplikasi &amp; Merefleksi), <strong>Sintaks Penutup</strong> (Refleksi 3-2-1, Kaizen, kesimpulan)
                        </td>
                      </tr>
                      <tr className="bg-purple-50">
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">27</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-purple-900">Tabel Hasil Eksplorasi</td>
                        <td className="p-2">
                          Format: <code>Judul Tabel :: Kolom1 | Kolom2 :: baris1_k1 | baris1_k2 ; baris2_k1 | baris2_k2</code><br />
                          Dapat diubah secara dinamis melalui upload Excel maupun diedit manual di aplikasi.
                        </td>
                      </tr>
                      <tr className="bg-neutral-50/50">
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">23-26</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold">Asesmen Awal, Proses, Akhir, Pengayaan dan Remedial</td>
                        <td className="p-2">Diagnostik kesiapan, formatif (kuis lengkap dengan kunci), sumatif dengan KKTP 3 level (Berkembang, Cakap, Mahir), serta dua kelompok pengayaan dan remedial</td>
                      </tr>
                      <tr className="bg-blue-50">
                        <td className="p-2 border-r border-neutral-300 text-center font-bold">28-32</td>
                        <td className="p-2 border-r border-neutral-300 font-mono font-bold text-blue-900">Tautan &amp; Kode Embed (Materi, LKPD, Rubrik)</td>
                        <td className="p-2">
                          <strong>Tautan Materi & Tautan LKPD</strong>: URL yang aktif dibuka via hyperlink di PDF.<br />
                          <strong>Kode Embed Materi &amp; LKPD</strong>: tag HTML &lt;iframe&gt; (hanya bila ada URL). <strong>Kode Embed Rubrik</strong>: satu tabel HTML dengan CSS inline.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-neutral-100 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] font-mono text-neutral-600 flex items-center gap-1.5">
            <span>developed by @hndx07</span>
          </div>

          <button
            onClick={onClose}
            className="neo-btn px-5 py-1.5 bg-neutral-900 text-white font-bold text-xs rounded-xl"
          >
            Selesai Membaca & Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
