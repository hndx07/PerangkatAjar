/**
 * useWorkspace — satu-satunya sumber kebenaran (state) untuk alur terpadu ATP → Materi → RPP.
 *
 * Bagian atas hook ini adalah logika aplikasi RPP asli (data CP/ATP/RPP, identitas sekolah, editor,
 * penyimpanan otomatis di browser). Bagian bawah ("Alur terpadu") menambahkan:
 *   - langkah aktif (step) dan isian generator materi per unit,
 *   - pasangan unit ATP ↔ modul RPP,
 *   - penyimpanan tautan hasil materi ke Lampiran RPP.
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  DEFAULT_SCHOOL_IDENTITY,
  MAJOR_SAMPLES,
  MajorSample,
} from '../rpp/utils/sampleData';
import {
  ExcelRawRow,
  ExcelRppRawRow,
  ParsedExcelResult,
  SchoolIdentity,
  ModulAjarData,
  GeneratedPerangkatAjar,
} from '../rpp/types';
import {
  generatePerangkatAjar,
  generatePerangkatAjarFromRpp,
} from '../rpp/utils/atpAndModulGenerator';
import {
  downloadCpExcelTemplate,
  downloadRppExcelTemplate,
  exportAtpToExcel,
  exportRppToExcel,
} from '../rpp/utils/excelParser';
import { loadStored, saveStored, clearAllStored, getStoredSizeKb } from '../rpp/utils/persistence';
import type { PromptFormData } from '../materi/types';
import {
  EMPTY_MATERI,
  WORKFLOW_STEPS,
  type MateriLinks,
  type MateriState,
  type WorkflowStep,
  type WorkflowUnit,
} from './types';
import {
  applyLinks,
  applyLinksToRppRow,
  buildPrefill,
  buildUnits,
  composeForm,
  isMateriLinked,
  pickUnitFields,
  sanitizeMateri,
  splitPatch,
} from './bridge';

export type { DataMode, DocumentMode };

type DataMode = 'cp' | 'rpp';
type DocumentMode = 'atp_only' | 'modul_selected' | 'lampiran_selected' | 'modul_all' | 'both_separate';

const DOCUMENT_MODES: DocumentMode[] = ['atp_only', 'modul_selected', 'lampiran_selected', 'modul_all', 'both_separate'];

/** Bentuk data yang disimpan di browser (lihat utils/persistence.ts). */
interface StoredRows {
  rawRows: ExcelRawRow[];
  rppRows?: ExcelRppRawRow[];
  mode: DataMode;
}

interface StoredUi {
  documentMode: DocumentMode;
  selectedModulIndex: number;
  watermarkOpacity: number;
  step?: WorkflowStep;
}

function isPerangkatValid(p: unknown): p is GeneratedPerangkatAjar {
  const x = p as GeneratedPerangkatAjar | null;
  return !!x && Array.isArray(x.atpList) && Array.isArray(x.modulAjarList) && x.modulAjarList.length > 0;
}

/** Data awal bawaan aplikasi (dipakai saat belum ada data tersimpan, atau saat reset). */
function buildDefaultState() {
  const defaultRppRows = MAJOR_SAMPLES[0].rppRows;
  return {
    identity: DEFAULT_SCHOOL_IDENTITY,
    rawRows: MAJOR_SAMPLES[0].rows,
    rppRows: defaultRppRows,
    mode: (defaultRppRows ? 'rpp' : 'cp') as DataMode,
    customPerangkat: defaultRppRows
      ? generatePerangkatAjarFromRpp(defaultRppRows, DEFAULT_SCHOOL_IDENTITY)
      : null,
    customModulAjar: null as ModulAjarData | null,
    documentMode: 'atp_only' as DocumentMode,
    selectedModulIndex: 0,
    watermarkOpacity: 0.5,
    step: 'atp' as WorkflowStep,
    materi: EMPTY_MATERI as MateriState,
  };
}

/**
 * Membaca data editan yang tersimpan di browser. Setiap bagian divalidasi; bagian yang rusak
 * atau tidak ada diganti data awal sehingga aplikasi tidak pernah gagal dibuka karena data lama.
 */
function readInitialState() {
  const fallback = buildDefaultState();
  try {
    const storedIdentity = loadStored<SchoolIdentity>('identity');
    const identity: SchoolIdentity =
      storedIdentity && typeof storedIdentity === 'object'
        ? { ...DEFAULT_SCHOOL_IDENTITY, ...storedIdentity }
        : DEFAULT_SCHOOL_IDENTITY;

    const storedRows = loadStored<StoredRows>('rows');
    const hasRows = !!storedRows && Array.isArray(storedRows.rawRows);

    const ui = loadStored<StoredUi>('ui');
    const uiState = {
      documentMode:
        ui && DOCUMENT_MODES.includes(ui.documentMode) ? ui.documentMode : fallback.documentMode,
      selectedModulIndex:
        ui && Number.isInteger(ui.selectedModulIndex) && ui.selectedModulIndex >= 0
          ? ui.selectedModulIndex
          : fallback.selectedModulIndex,
      watermarkOpacity:
        ui && typeof ui.watermarkOpacity === 'number' && ui.watermarkOpacity >= 0 && ui.watermarkOpacity <= 1
          ? ui.watermarkOpacity
          : fallback.watermarkOpacity,
      step:
        ui && ui.step && WORKFLOW_STEPS.includes(ui.step) ? ui.step : fallback.step,
      materi: sanitizeMateri(loadStored<MateriState>('materi')),
    };

    if (!hasRows) {
      // Belum ada data tabel tersimpan: pakai data awal, tetapi tetap hormati identitas & tampilan tersimpan
      return {
        ...fallback,
        identity,
        customPerangkat: fallback.rppRows
          ? generatePerangkatAjarFromRpp(fallback.rppRows, identity)
          : null,
        ...uiState,
      };
    }

    const rppRows =
      Array.isArray(storedRows.rppRows) && storedRows.rppRows.length > 0 ? storedRows.rppRows : undefined;
    const mode: DataMode = storedRows.mode === 'cp' || !rppRows ? 'cp' : 'rpp';

    let customPerangkat: GeneratedPerangkatAjar | null = null;
    const storedPerangkat = loadStored<GeneratedPerangkatAjar>('perangkat');
    if (isPerangkatValid(storedPerangkat)) {
      customPerangkat = storedPerangkat;
    } else if (mode === 'rpp' && rppRows) {
      // Hasil editan tidak tersedia: susun ulang dari tabel RPP yang tersimpan
      customPerangkat = generatePerangkatAjarFromRpp(rppRows, identity);
    }

    const storedModul = loadStored<ModulAjarData>('modul');
    const customModulAjar =
      storedModul && typeof storedModul === 'object' && customPerangkat ? storedModul : null;

    return {
      identity,
      rawRows: storedRows.rawRows,
      rppRows,
      mode,
      customPerangkat,
      customModulAjar,
      ...uiState,
    };
  } catch {
    return fallback;
  }
}

export function useWorkspace() {
  // Data awal dibaca sekali dari penyimpanan browser (localStorage), sehingga hasil editan tetap ada setelah refresh
  const [initial] = useState(readInitialState);

  // Langkah aktif (ATP → Materi → RPP) dan isian generator materi per unit
  const [step, setStep] = useState<WorkflowStep>(initial.step);
  const [materi, setMateri] = useState<MateriState>(initial.materi);

  const [identity, setIdentity] = useState<SchoolIdentity>(initial.identity);
  const [rawRows, setRawRows] = useState<ExcelRawRow[]>(initial.rawRows);
  const [rppRows, setRppRows] = useState<ExcelRppRawRow[] | undefined>(initial.rppRows);
  const [currentDataMode, setCurrentDataMode] = useState<DataMode>(initial.mode);
  
  // Custom generated package when RPP format or specific edits are loaded
  const [customPerangkat, setCustomPerangkat] = useState<GeneratedPerangkatAjar | null>(initial.customPerangkat);

  const [customModulAjar, setCustomModulAjar] = useState<ModulAjarData | null>(initial.customModulAjar);

  // Document separation modes:
  // - 'atp_only': Dokumen ATP saja (terpisah)
  // - 'modul_selected': Dokumen Modul Ajar terpilih (dipilah per materi)
  // - 'lampiran_selected': Dokumen Lampiran & LKPD terpilih
  // - 'modul_all': Semua Modul Ajar terpisah berurutan
  // - 'both_separate': Keduanya dengan pemisah halaman
  const [documentMode, setDocumentMode] = useState<DocumentMode>(initial.documentMode);
  const [selectedModulIndex, setSelectedModulIndex] = useState<number>(initial.selectedModulIndex);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(initial.watermarkOpacity);

  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [isAiRefineModalOpen, setIsAiRefineModalOpen] = useState(false);
  const [isRppEditorOpen, setIsRppEditorOpen] = useState(false);
  const [isExcelGuideModalOpen, setIsExcelGuideModalOpen] = useState(false);
  const [rppEditorInitialTab, setRppEditorInitialTab] = useState<'desain' | 'sintaks' | 'eksplorasi' | 'asesmen' | 'lampiran'>('sintaks');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // Penyimpanan otomatis ke browser (localStorage)
  // ---------------------------------------------------------------------------
  const [storageStatus, setStorageStatus] = useState<'ok' | 'quota' | 'unavailable' | 'error'>('ok');
  const [savedKb, setSavedKb] = useState<number>(() => getStoredSizeKb());
  const storageWarnedRef = useRef(false);

  // Selalu menunjuk ke kondisi data terbaru, agar penyimpanan saat menutup/refresh halaman tidak memakai data lama
  const snapshotRef = useRef({
    step,
    materi,
    identity,
    rawRows,
    rppRows,
    currentDataMode,
    customPerangkat,
    customModulAjar,
    documentMode,
    selectedModulIndex,
    watermarkOpacity,
  });
  snapshotRef.current = {
    step,
    materi,
    identity,
    rawRows,
    rppRows,
    currentDataMode,
    customPerangkat,
    customModulAjar,
    documentMode,
    selectedModulIndex,
    watermarkOpacity,
  };

  const persistNow = useCallback(() => {
    const snap = snapshotRef.current;
    const results = [
      saveStored('identity', snap.identity),
      saveStored<StoredRows>('rows', {
        rawRows: snap.rawRows,
        rppRows: snap.rppRows,
        mode: snap.currentDataMode,
      }),
      saveStored('perangkat', snap.customPerangkat),
      saveStored('modul', snap.customModulAjar),
      saveStored('materi', snap.materi),
      saveStored<StoredUi>('ui', {
        step: snap.step,
        documentMode: snap.documentMode,
        selectedModulIndex: snap.selectedModulIndex,
        watermarkOpacity: snap.watermarkOpacity,
      }),
    ];

    const failure = results.find((r) => !r.ok);
    if (failure && !failure.ok) {
      setStorageStatus(failure.reason);
      if (!storageWarnedRef.current) {
        storageWarnedRef.current = true;
        showNotification(
          failure.reason === 'quota'
            ? '⚠️ Data terlalu besar untuk disimpan otomatis di browser. Gunakan Ekspor Excel agar hasil editan tidak hilang.'
            : failure.reason === 'unavailable'
              ? '⚠️ Penyimpanan browser tidak tersedia (mode privat atau diblokir). Hasil editan akan hilang saat refresh, gunakan Ekspor Excel.'
              : '⚠️ Gagal menyimpan otomatis di browser. Gunakan Ekspor Excel agar hasil editan tidak hilang.'
        );
      }
    } else {
      storageWarnedRef.current = false;
      setStorageStatus('ok');
      setSavedKb(getStoredSizeKb());
    }
  }, []);

  // Simpan setiap ada perubahan data (ditunda sebentar agar tidak menulis berulang saat mengetik/menggeser slider)
  useEffect(() => {
    const timer = window.setTimeout(persistNow, 500);
    return () => window.clearTimeout(timer);
  }, [
    identity,
    rawRows,
    rppRows,
    currentDataMode,
    customPerangkat,
    customModulAjar,
    documentMode,
    selectedModulIndex,
    watermarkOpacity,
    step,
    materi,
    persistNow,
  ]);

  // Simpan seketika saat halaman di-refresh, ditutup, atau tab disembunyikan, supaya perubahan terakhir tidak hilang
  useEffect(() => {
    const flush = () => persistNow();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') persistNow();
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [persistNow]);

  // Hapus data tersimpan dan kembali ke data awal aplikasi
  const handleResetStoredData = () => {
    const confirmed = window.confirm(
      'Hapus semua hasil editan yang tersimpan di browser dan kembali ke data awal?\n\nTindakan ini tidak dapat dibatalkan. Ekspor ke Excel terlebih dahulu jika data masih diperlukan.'
    );
    if (!confirmed) return;
    clearAllStored();
    const fresh = buildDefaultState();
    setIdentity(fresh.identity);
    setRawRows(fresh.rawRows);
    setRppRows(fresh.rppRows);
    setCurrentDataMode(fresh.mode);
    setCustomPerangkat(fresh.customPerangkat);
    setCustomModulAjar(fresh.customModulAjar);
    setDocumentMode(fresh.documentMode);
    setSelectedModulIndex(fresh.selectedModulIndex);
    setWatermarkOpacity(fresh.watermarkOpacity);
    setStep(fresh.step);
    setMateri(fresh.materi);
    showNotification('Data tersimpan dihapus. Aplikasi kembali ke data awal.');
  };

  // Base generation from rows & identity
  const activePerangkat = useMemo(() => {
    if (customPerangkat) {
      return customPerangkat;
    }
    return generatePerangkatAjar(rawRows, identity);
  }, [customPerangkat, rawRows, identity]);

  const currentAtpList = activePerangkat.atpList;
  const currentModulAjarList = activePerangkat.modulAjarList;

  // Active Modul Ajar for the selected index
  const safeModulIndex = Math.min(selectedModulIndex, Math.max(0, currentModulAjarList.length - 1));
  const activeModulAjar = customModulAjar || currentModulAjarList[safeModulIndex] || currentModulAjarList[0];

  // Handle uploaded result from Excel file (either CP or RPP format)
  const handleExcelUploaded = (result: ParsedExcelResult) => {
    const updatedIdentity: SchoolIdentity = {
      ...identity,
      mataPelajaran: result.detectedSubject || identity.mataPelajaran,
      kelas: result.detectedClass || identity.kelas,
      fase: result.detectedPhase || identity.fase,
      kategoriMapel: result.detectedCategory || identity.kategoriMapel,
    };
    setIdentity(updatedIdentity);
    setRawRows(result.cpRows);
    setCustomModulAjar(null);
    setSelectedModulIndex(0);

    if (result.fileType === 'rpp' && result.rppRows && result.rppRows.length > 0) {
      setRppRows(result.rppRows);
      setCurrentDataMode('rpp');
      const gen = generatePerangkatAjarFromRpp(result.rppRows, updatedIdentity);
      setCustomPerangkat(gen);
      showNotification(
        `✨ Berhasil memproses Format Excel RPP Terintegrasi (${result.rppRows.length} Unit). Semua kolom CP, ATP, Metode, Sintaks Pembelajaran, dan Asesmen terhubung langsung!`
      );
    } else {
      setRppRows(undefined);
      setCurrentDataMode('cp');
      setCustomPerangkat(null);
      showNotification(
        `✨ Berhasil memproses Format Excel CP (${result.cpRows.length} Baris). Matriks ATP dan draf RPP Deep Learning telah dibuat otomatis.`
      );
    }
  };

  // Handle manual edits to CP rows
  const handleRawRowsUpdated = (newRows: ExcelRawRow[]) => {
    setRawRows(newRows);
    setCustomPerangkat(null);
    setCurrentDataMode('cp');
    setCustomModulAjar(null);
    showNotification(`Tabel CP diperbarui (${newRows.length} baris). Matriks ATP dan RPP disinkronkan ulang.`);
  };

  // Handle manual edits to integrated RPP rows
  const handleRppRowsUpdated = (newRppRows: ExcelRppRawRow[]) => {
    setRppRows(newRppRows);
    const gen = generatePerangkatAjarFromRpp(newRppRows, identity);
    setCustomPerangkat(gen);
    setCurrentDataMode('rpp');
    setCustomModulAjar(null);
    showNotification(`Tabel RPP Terintegrasi diperbarui (${newRppRows.length} unit). Seluruh dokumen langsung berubah.`);
  };

  // Handle selecting a sample major
  const handleSelectSample = (sample: MajorSample) => {
    const updatedIdentity: SchoolIdentity = {
      ...identity,
      kategoriMapel: sample.kategoriMapel,
      programKeahlian: sample.programKeahlian,
      konsentrasiKeahlian: sample.konsentrasiKeahlian,
      mataPelajaran: sample.mataPelajaran,
      fase: sample.fase,
      kelas: sample.kelas,
      semester: sample.semester,
    };

    setIdentity(updatedIdentity);
    setRawRows(sample.rows);
    setCustomModulAjar(null);
    setSelectedModulIndex(0);

    if (sample.rppRows && sample.rppRows.length > 0) {
      setRppRows(sample.rppRows);
      setCurrentDataMode('rpp');
      const gen = generatePerangkatAjarFromRpp(sample.rppRows, updatedIdentity);
      setCustomPerangkat(gen);
      showNotification(`Memuat data ${sample.name} dalam Format RPP Terintegrasi.`);
    } else {
      setRppRows(undefined);
      setCurrentDataMode('cp');
      setCustomPerangkat(null);
      showNotification(`Memuat data ${sample.name} dalam Format ATP (Alur Tujuan Pembelajaran).`);
    }
  };

  // Handle identity update
  const handleSaveIdentity = (updated: SchoolIdentity) => {
    setIdentity(updated);
    if (customPerangkat && rppRows) {
      const regenerated = generatePerangkatAjarFromRpp(rppRows, updated);
      setCustomPerangkat(regenerated);
    }
    if (customModulAjar) {
      setCustomModulAjar({
        ...customModulAjar,
        identity: updated,
      });
    }
    showNotification('Identitas satuan pendidikan dan guru pengampu berhasil disimpan.');
  };

  // Handle AI enrichment applied
  const handleApplyEnrichment = (enriched: ModulAjarData) => {
    setCustomModulAjar(enriched);
    showNotification(`Pengayaan Deep Learning berhasil diterapkan pada Modul: ${enriched.judulMateri}.`);
  };

  // Downloads
  const handleDownloadCpTemplate = (type?: 'kejuruan' | 'umum' | 'blank') => {
    downloadCpExcelTemplate(type || (identity.kategoriMapel === 'umum' ? 'umum' : 'kejuruan'));
    showNotification('Template Excel CP resmi SMK Muhammadiyah Bawang berhasil diunduh.');
  };

  const handleDownloadRppTemplate = (type?: 'kejuruan' | 'umum' | 'blank') => {
    downloadRppExcelTemplate(type || (identity.kategoriMapel === 'umum' ? 'umum' : 'kejuruan'));
    showNotification('Template Excel RPP Terintegrasi (Semua Kolom) berhasil diunduh.');
  };

  // Exports
  const handleExportAtp = () => {
    exportAtpToExcel(currentAtpList, identity);
    showNotification('Matriks spreadsheet ATP berhasil diekspor (.xlsx).');
  };

  const handleExportRpp = () => {
    exportRppToExcel(currentModulAjarList, identity, currentAtpList);
    showNotification('Seluruh unit RPP Deep Learning berhasil diekspor ke spreadsheet Excel terintegrasi (.xlsx).');
  };

  // Table & Syntax Editor Handlers
  const handleOpenRppEditor = (initialTab: 'desain' | 'sintaks' | 'eksplorasi' | 'asesmen' | 'lampiran' = 'sintaks') => {
    setRppEditorInitialTab(initialTab);
    setIsRppEditorOpen(true);
  };

  const handleSaveModulFromEditor = (updatedModul: ModulAjarData, index: number) => {
    const newModulList = [...currentModulAjarList];
    newModulList[index] = updatedModul;
    setCustomPerangkat({
      identity,
      atpList: currentAtpList,
      modulAjarList: newModulList,
      createdAt: new Date().toISOString(),
    });
    setCustomModulAjar(null);
    showNotification(`💾 Perubahan RPP & Lampiran Unit ${index + 1} berhasil disimpan dan diterapkan.`);
  };

  // ---------------------------------------------------------------------------
  // Alur terpadu: ATP → Materi → RPP
  // ---------------------------------------------------------------------------

  // Satu unit = satu materi = satu RPP, lengkap dengan butir ATP turunannya
  const units = useMemo(
    () => buildUnits(currentAtpList, currentModulAjarList),
    [currentAtpList, currentModulAjarList]
  );
  const activeUnit: WorkflowUnit | undefined = units[safeModulIndex] ?? units[0];

  // Form generator prompt untuk unit aktif (isian otomatis dari ATP + pengaturan bersama + editan tersimpan)
  const materiForm = useMemo<PromptFormData | null>(
    () =>
      activeUnit ? composeForm(activeUnit, identity, rppRows?.[activeUnit.index], materi) : null,
    [activeUnit, identity, rppRows, materi]
  );

  const linkedCount = useMemo(() => units.filter((u) => isMateriLinked(u.modul)).length, [units]);

  // Atur dokumen yang tampil sesuai langkah: Langkah 1 = ATP saja, Langkah 3 = RPP per unit
  useEffect(() => {
    if (step === 'atp') {
      setDocumentMode('atp_only');
    } else if (step === 'rpp') {
      setDocumentMode((prev) => (prev === 'atp_only' ? 'modul_selected' : prev));
    }
  }, [step]);

  const goToStep = (next: WorkflowStep) => {
    setStep(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Pilih unit aktif (berlaku untuk ketiga langkah), opsional sekaligus pindah langkah. */
  const openUnit = (index: number, next?: WorkflowStep) => {
    setSelectedModulIndex(index);
    if (next) goToStep(next);
  };

  /** Ubah isian form materi unit aktif. Field bersama masuk pengaturan bersama, sisanya khusus unit. */
  const updateMateriForm = (patch: Partial<PromptFormData>) => {
    if (!activeUnit || !materiForm) return;
    const { shared, unit } = splitPatch(patch);
    setMateri((prev) => {
      const next: MateriState = { shared: prev.shared, units: prev.units };

      if (Object.keys(shared).length > 0) {
        const mergedShared: Partial<PromptFormData> = { ...prev.shared, ...shared };
        if (shared.quizSettings) {
          mergedShared.quizSettings = { ...materiForm.quizSettings, ...shared.quizSettings };
        }
        next.shared = mergedShared;
      }

      if (Object.keys(unit).length > 0) {
        // Pertama kali diubah: mulai dari isian otomatis ATP supaya tidak ada field yang hilang
        const base =
          prev.units[activeUnit.key]?.form ??
          pickUnitFields(buildPrefill(activeUnit, identity, rppRows?.[activeUnit.index]));
        next.units = {
          ...prev.units,
          [activeUnit.key]: { form: { ...base, ...unit }, updatedAt: Date.now() },
        };
      }
      return next;
    });
  };

  const applyMateriPreset = (presetData: Partial<PromptFormData>) => {
    updateMateriForm(presetData);
    showNotification('Template materi ajar berhasil diterapkan!');
  };

  /** Buang editan manual unit aktif dan isi ulang dari ATP (pengaturan bersama tidak berubah). */
  const resetMateriUnit = () => {
    if (!activeUnit) return;
    const ok = window.confirm(
      `Isi ulang form materi Unit ${activeUnit.nomor} dari ATP?\n\nEditan manual pada unit ini akan dihapus. Pengaturan bersama (logo, tema visual, pengaturan kuis) tetap dipertahankan.`
    );
    if (!ok) return;
    setMateri((prev) => {
      const nextUnits = { ...prev.units };
      delete nextUnits[activeUnit.key];
      return { ...prev, units: nextUnits };
    });
    showNotification(`Form materi Unit ${activeUnit.nomor} diisi ulang dari ATP.`);
  };

  /** Hubungkan hasil materi (tautan/embed) ke Lampiran RPP unit tertentu. */
  const saveMateriLinks = (index: number, links: MateriLinks) => {
    const target = currentModulAjarList[index];
    if (!target) return;

    const nextList = [...currentModulAjarList];
    nextList[index] = applyLinks(target, links);
    setCustomPerangkat({
      identity,
      atpList: currentAtpList,
      modulAjarList: nextList,
      createdAt: new Date().toISOString(),
    });

    // Samakan juga baris Excel RPP Terintegrasi agar Ekspor/Impor Excel tidak kehilangan tautan
    if (rppRows && rppRows[index]) {
      const nextRows = [...rppRows];
      nextRows[index] = applyLinksToRppRow(rppRows[index], links);
      setRppRows(nextRows);
    }

    const hasLink = !!(links.tautanMateri.trim() || links.embedMateri.trim());
    showNotification(
      hasLink
        ? `🔗 Materi Unit ${index + 1} terhubung ke Lampiran RPP.`
        : `Tautan materi Unit ${index + 1} dikosongkan dari Lampiran RPP.`
    );
  };

  return {
    // alur
    step,
    goToStep,
    openUnit,
    units,
    activeUnit,
    linkedCount,

    // materi
    materi,
    materiForm,
    updateMateriForm,
    applyMateriPreset,
    resetMateriUnit,
    saveMateriLinks,

    // data utama
    identity,
    rawRows,
    rppRows,
    currentDataMode,
    currentAtpList,
    currentModulAjarList,
    activeModulAjar,
    safeModulIndex,
    setSelectedModulIndex,

    // dokumen
    documentMode,
    setDocumentMode,
    watermarkOpacity,
    setWatermarkOpacity,

    // modal
    isIdentityModalOpen,
    setIsIdentityModalOpen,
    isGuidelineModalOpen,
    setIsGuidelineModalOpen,
    isAiRefineModalOpen,
    setIsAiRefineModalOpen,
    isRppEditorOpen,
    setIsRppEditorOpen,
    isExcelGuideModalOpen,
    setIsExcelGuideModalOpen,
    rppEditorInitialTab,

    // notifikasi & penyimpanan
    notification,
    showNotification,
    storageStatus,
    savedKb,

    // handler RPP asli
    handleExcelUploaded,
    handleRawRowsUpdated,
    handleRppRowsUpdated,
    handleSelectSample,
    handleSaveIdentity,
    handleApplyEnrichment,
    handleDownloadCpTemplate,
    handleDownloadRppTemplate,
    handleExportAtp,
    handleExportRpp,
    handleOpenRppEditor,
    handleSaveModulFromEditor,
    handleResetStoredData,
  };
}

/** Tipe nilai kembalian useWorkspace, dipakai komponen langkah. */
export type Workspace = ReturnType<typeof useWorkspace>;
