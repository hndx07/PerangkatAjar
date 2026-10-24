/**
 * Jembatan data antar tiga langkah:
 *   ATP  →  Materi (generator prompt slide)  →  RPP (lampiran tautan/embed materi)
 *
 * Semua fungsi di sini murni (tanpa state/React) agar mudah diuji dan dipakai ulang.
 */

import type { PromptFormData } from '../materi/types';
import { BLANK_FORM_DATA } from '../materi/data/presets';
import type {
  AlurTujuanPembelajaranItem,
  ExcelRppRawRow,
  ModulAjarData,
  SchoolIdentity,
} from '../rpp/types';
import type { MateriLinks, MateriState, WorkflowUnit } from './types';

// ---------------------------------------------------------------------------
// Nilai bawaan generator RPP yang BUKAN tautan sungguhan
// ---------------------------------------------------------------------------

/** Tautan contoh bawaan generator RPP untuk Bahan Bacaan bila guru belum mengisi. */
export const PLACEHOLDER_MATERI_LINK = 'https://guru.kemdikbud.go.id/';

function isPlaceholderLkpd(url: string | undefined): boolean {
  return !!url && url.includes('1sample-lkpd');
}

// ---------------------------------------------------------------------------
// Unit: pasangan ATP ↔ Modul RPP
// ---------------------------------------------------------------------------

/** Normalisasi judul materi menjadi kunci penyimpanan yang stabil terhadap urutan baris. */
export function unitKeyOf(judul: string, index: number): string {
  const k = (judul || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return k || `unit-${index + 1}`;
}

/** Tentukan butir ATP ini milik unit (indeks modul) yang mana. Mengembalikan -1 bila tidak bisa dipastikan. */
function unitIndexOfAtp(
  item: AlurTujuanPembelajaranItem,
  position: number,
  atpCount: number,
  modulCount: number
): number {
  // Mode Excel RPP Terintegrasi: atp-rpp-{nomorUnit}
  let m = /^atp-rpp-(\d+)$/.exec(item.id);
  if (m) return Number(m[1]) - 1;
  // Mode Excel CP: atp-{indeksBaris}-{1|2}
  m = /^atp-(\d+)-\d+$/.exec(item.id);
  if (m) return Number(m[1]);
  // Cadangan: jumlah sama → berurutan 1:1
  if (atpCount === modulCount) return position;
  return -1;
}

export function buildUnits(
  atpList: AlurTujuanPembelajaranItem[],
  modulList: ModulAjarData[]
): WorkflowUnit[] {
  const buckets: AlurTujuanPembelajaranItem[][] = modulList.map(() => []);

  atpList.forEach((item, position) => {
    let idx = unitIndexOfAtp(item, position, atpList.length, modulList.length);
    if (idx < 0 || idx >= modulList.length) {
      // Cocokkan lewat nama elemen; jika tetap gagal, taruh di unit terdekat.
      const byElemen = modulList.findIndex((m) => m.elemenTerkait && m.elemenTerkait === item.elemen);
      idx = byElemen >= 0 ? byElemen : Math.min(position, modulList.length - 1);
    }
    if (idx >= 0 && buckets[idx]) buckets[idx].push(item);
  });

  return modulList.map((modul, index) => ({
    nomor: index + 1,
    index,
    key: unitKeyOf(modul.judulMateri, index),
    judul: modul.judulMateri || `Unit ${index + 1}`,
    elemen: modul.elemenTerkait || '',
    jp: modul.alokasiWaktuMateri || '',
    modul,
    atpItems: buckets[index],
  }));
}

// ---------------------------------------------------------------------------
// Pembagian field form: bersama (semua unit) vs khusus-unit
// ---------------------------------------------------------------------------

/**
 * Field yang cukup diisi sekali dan berlaku untuk semua unit (identitas visual sekolah,
 * pengaturan pengiriman nilai, perangkat kelas). Sisanya disimpan per unit.
 */
export const SHARED_FIELDS: (keyof PromptFormData)[] = [
  'bahasaSlide',
  'bahasaInstruksiSiswa',
  'perangkat',
  'internet',
  'formatKeluaran',
  'modeKerja',
  'jumlahSlide',
  'temaVisual',
  'paletFont',
  'efekSlide',
  'logoGambar',
  'htmlLogoSekolah',
  'htmlBackgroundSekolah',
  'emojiIkon',
  'quizSettings',
];

const SHARED_SET = new Set<string>(SHARED_FIELDS as string[]);

export function splitPatch(patch: Partial<PromptFormData>): {
  shared: Partial<PromptFormData>;
  unit: Partial<PromptFormData>;
} {
  const shared: Record<string, unknown> = {};
  const unit: Record<string, unknown> = {};
  (Object.keys(patch) as (keyof PromptFormData)[]).forEach((k) => {
    if (patch[k] === undefined) return;
    (SHARED_SET.has(k as string) ? shared : unit)[k as string] = patch[k];
  });
  return { shared: shared as Partial<PromptFormData>, unit: unit as Partial<PromptFormData> };
}

/** Ambil hanya field khusus-unit dari sebuah form/patch. */
export function pickUnitFields(form: Partial<PromptFormData>): Partial<PromptFormData> {
  return splitPatch(form).unit;
}

// ---------------------------------------------------------------------------
// ATP → isian otomatis form Materi
// ---------------------------------------------------------------------------

const clean = (v: string | undefined | null): string => (v || '').replace(/\s+/g, ' ').trim();
const meaningful = (v: string | undefined | null): string => {
  const c = clean(v);
  return c === '-' ? '' : c;
};

function joinLines(parts: (string | false | undefined | null)[]): string {
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join('\n');
}

export function buildPrefill(
  unit: WorkflowUnit,
  identity: SchoolIdentity,
  rppRow?: ExcelRppRawRow
): Partial<PromptFormData> {
  const { modul, atpItems } = unit;
  const first = atpItems[0];

  const kelas = meaningful(identity.kelas);
  const fase = meaningful(identity.fase);
  const semester = meaningful(identity.semester);
  const jenjang = [
    kelas ? `Kelas ${kelas}` : '',
    fase ? `Fase ${fase}` : '',
    semester ? `Semester ${semester}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const sekolah = [identity.schoolName, identity.programKeahlian, identity.konsentrasiKeahlian]
    .map(meaningful)
    .filter(Boolean)
    .join(' — ');

  const cpTpAtp = joinLines([
    first?.capaianPembelajaran && `CP${unit.elemen ? ` (Elemen ${unit.elemen})` : ''}: ${clean(first.capaianPembelajaran)}`,
    ...atpItems.map((a) => `${a.kodeTp}: ${clean(a.tujuanPembelajaran)}`),
    ...atpItems.map((a) => `Alur ${a.kodeTp}: ${clean(a.alurTujuanPembelajaran)}`),
    `Lingkup materi: ${unit.judul}`,
  ]);

  const formatif = atpItems.map((a) => clean(a.asesmenRencana?.formatif)).filter(Boolean)[0];
  const sumatif = atpItems.map((a) => clean(a.asesmenRencana?.sumatif)).filter(Boolean)[0];
  const indikator =
    'buatkan indikator ketercapaian (KKTP) yang diturunkan dari TP/ATP di atas' +
    (formatif ? `; selaraskan dengan asesmen formatif: ${formatif}` : '') +
    (sumatif ? `; dan asesmen sumatif: ${sumatif}` : '');

  const kesiapan = modul.rppFormat?.perencanaanMendalam?.identifikasi?.kesiapanPesertaDidik;
  const pengetahuanAwal =
    clean(rppRow?.kesiapanPesertaDidik) ||
    joinLines([
      kesiapan?.minat && `Minat: ${clean(kesiapan.minat)}`,
      kesiapan?.caraBelajar && `Cara belajar: ${clean(kesiapan.caraBelajar)}`,
    ]);

  const prefill: Partial<PromptFormData> = {
    mataPelajaran: meaningful(identity.mataPelajaran),
    topikMateri: unit.judul,
    jenjangKelasFase: jenjang,
    sekolahJurusanKelompok: sekolah,
    durasi: meaningful(unit.jp) || BLANK_FORM_DATA.durasi,
    cpTpAtp,
    indikatorBerhasil: indikator,
    pengetahuanAwalSiswa: pengetahuanAwal,
  };

  const metode = clean(rppRow?.metodePembelajaran);
  if (metode) prefill.pendekatan = `${metode} dipadukan dengan Deep Learning (Mindful, Meaningful, Joyful)`;

  if (identity.kategoriMapel !== 'umum') {
    const bidang = meaningful(identity.konsentrasiKeahlian) || meaningful(identity.programKeahlian);
    if (bidang) prefill.konteksDekatSiswa = `Konteks dunia kerja/industri pada bidang ${bidang}`;
  }

  return prefill;
}

/**
 * Susun form akhir untuk sebuah unit. Urutan prioritas (yang belakang menang):
 *   form kosong < isian otomatis dari ATP < pengaturan bersama < isian tersimpan unit.
 */
export function composeForm(
  unit: WorkflowUnit,
  identity: SchoolIdentity,
  rppRow: ExcelRppRawRow | undefined,
  materi: MateriState
): PromptFormData {
  const prefill = buildPrefill(unit, identity, rppRow);
  const saved = materi.units[unit.key]?.form;
  const sharedQuiz = materi.shared.quizSettings;

  return {
    ...BLANK_FORM_DATA,
    ...prefill,
    ...materi.shared,
    ...saved,
    quizSettings: {
      ...BLANK_FORM_DATA.quizSettings,
      namaGuru: identity.namaGuru || '',
      ...(sharedQuiz || {}),
    },
  };
}

// ---------------------------------------------------------------------------
// Tautan hasil materi → Lampiran RPP
// ---------------------------------------------------------------------------

/** Validasi tautan: hanya http/https. Mengembalikan teks tautan yang sudah dirapikan, atau null bila tidak valid. */
export function normalizeUrl(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.') && u.hostname !== 'localhost') return null;
    return withScheme;
  } catch {
    return null;
  }
}

function escapeAttr(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Buat kode embed iframe dari sebuah tautan (untuk ditampilkan langsung di Lampiran RPP). */
export function makeIframeEmbed(url: string): string {
  const safe = normalizeUrl(url);
  if (!safe) return '';
  return `<iframe src="${escapeAttr(safe)}" width="100%" height="480" style="border:0" loading="lazy" allowfullscreen></iframe>`;
}

/** Baca tautan yang saat ini tersimpan di Lampiran RPP sebuah modul (nilai contoh dianggap kosong). */
export function readLinks(modul: ModulAjarData): MateriLinks {
  const lampiran = modul.rppFormat?.lampiran;
  const tautanMateri = lampiran?.bahanBacaan?.tautan ?? '';
  const tautanLkpd = lampiran?.lkpd?.tautan ?? '';
  return {
    tautanMateri: tautanMateri === PLACEHOLDER_MATERI_LINK ? '' : tautanMateri,
    embedMateri: lampiran?.bahanBacaan?.embedCode ?? '',
    tautanLkpd: isPlaceholderLkpd(tautanLkpd) ? '' : tautanLkpd,
    embedLkpd: lampiran?.lkpd?.embedCode ?? '',
  };
}

/** Apakah materi unit ini sudah dihubungkan (ada tautan atau embed sungguhan)? */
export function isMateriLinked(modul: ModulAjarData): boolean {
  const l = readLinks(modul);
  return !!(l.tautanMateri.trim() || l.embedMateri.trim());
}

/**
 * Tulis tautan ke Lampiran RPP.
 * - Lampiran 1 (Materi): ditulis persis seperti diisi (kosong = hapus).
 * - Lampiran 2 (LKPD): hanya diubah bila diisi, supaya LKPD dari Excel/Editor tidak terhapus.
 */
export function applyLinks(modul: ModulAjarData, links: MateriLinks): ModulAjarData {
  const lampiran = modul.rppFormat.lampiran;
  return {
    ...modul,
    rppFormat: {
      ...modul.rppFormat,
      lampiran: {
        ...lampiran,
        bahanBacaan: {
          ...lampiran.bahanBacaan,
          tautan: links.tautanMateri.trim(),
          embedCode: links.embedMateri.trim(),
        },
        lkpd: {
          ...lampiran.lkpd,
          tautan: links.tautanLkpd.trim() || lampiran.lkpd.tautan,
          embedCode: links.embedLkpd.trim() || lampiran.lkpd.embedCode,
        },
      },
    },
  };
}

/** Samakan baris Excel RPP Terintegrasi dengan tautan baru, agar Ekspor/Impor Excel tetap konsisten. */
export function applyLinksToRppRow(row: ExcelRppRawRow, links: MateriLinks): ExcelRppRawRow {
  return {
    ...row,
    tautanMateri: links.tautanMateri.trim(),
    embedMateri: links.embedMateri.trim(),
    tautanLkpd: links.tautanLkpd.trim() || row.tautanLkpd,
    embedLkpd: links.embedLkpd.trim() || row.embedLkpd,
  };
}

// ---------------------------------------------------------------------------
// Status unit (dipakai penanda di Stepper & pemilih unit)
// ---------------------------------------------------------------------------

export type UnitStatus = 'terhubung' | 'draf' | 'kosong';

export function unitStatus(unit: WorkflowUnit, materi: MateriState): UnitStatus {
  if (isMateriLinked(unit.modul)) return 'terhubung';
  if (materi.units[unit.key]?.form) return 'draf';
  return 'kosong';
}

/** Rapikan state materi hasil baca penyimpanan agar bentuknya selalu valid. */
export function sanitizeMateri(raw: unknown): MateriState {
  const r = raw as Partial<MateriState> | null;
  const shared = r && typeof r.shared === 'object' && r.shared ? (r.shared as MateriState['shared']) : {};
  const units: MateriState['units'] = {};
  if (r && typeof r.units === 'object' && r.units) {
    Object.entries(r.units).forEach(([k, v]) => {
      if (v && typeof v === 'object') units[k] = v as MateriState['units'][string];
    });
  }
  return { shared, units };
}
