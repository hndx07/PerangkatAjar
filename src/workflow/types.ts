import type { PromptFormData } from '../materi/types';
import type { AlurTujuanPembelajaranItem, ModulAjarData } from '../rpp/types';

/** Tiga langkah alur kerja terpadu. */
export type WorkflowStep = 'atp' | 'materi' | 'rpp';

export const WORKFLOW_STEPS: WorkflowStep[] = ['atp', 'materi', 'rpp'];

/** Isian form generator prompt untuk satu unit materi. */
export interface MateriUnitState {
  /**
   * Hanya field khusus-unit (bukan field bersama sekolah/guru/visual).
   * Jika undefined, form menampilkan isian otomatis dari ATP.
   */
  form?: Partial<PromptFormData>;
  updatedAt: number;
}

export interface MateriState {
  /** Pengaturan yang berlaku untuk semua unit: tema visual, logo sekolah, pengaturan kuis, dsb. */
  shared: Partial<PromptFormData>;
  /** Isian per unit, kunci = judul materi yang dinormalisasi (lihat unitKeyOf). */
  units: Record<string, MateriUnitState>;
}

export const EMPTY_MATERI: MateriState = { shared: {}, units: {} };

/** Satu unit = satu materi = satu RPP, beserta butir-butir ATP yang menjadi turunannya. */
export interface WorkflowUnit {
  /** Nomor urut tampilan (1-based). */
  nomor: number;
  /** Indeks pada modulAjarList. */
  index: number;
  /** Kunci stabil untuk menyimpan isian materi. */
  key: string;
  judul: string;
  elemen: string;
  jp: string;
  modul: ModulAjarData;
  atpItems: AlurTujuanPembelajaranItem[];
}

/** Tautan hasil materi yang dihubungkan ke Lampiran RPP. */
export interface MateriLinks {
  tautanMateri: string;
  embedMateri: string;
  tautanLkpd: string;
  embedLkpd: string;
}
