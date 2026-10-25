import React, { useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, FileSpreadsheet, Layers, RotateCcw, Save, Table } from 'lucide-react';
import { ExcelUploadZone } from '../../rpp/components/ExcelUploadZone';
import { PrintableDocument } from '../../rpp/components/PrintableDocument';
import type { Workspace } from '../useWorkspace';

/** Langkah 1: sumber data CP/RPP → ATP. Dokumen siap cetak langsung tampil; sumber data bisa dibuka bila perlu. */
export const AtpStep: React.FC<{ ws: Workspace }> = ({ ws }) => {
  const unitCount = ws.units.length;
  const [sourceOpen, setSourceOpen] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  // Setelah data berubah: tutup panel sumber data dan bawa pengguna ke dokumen yang baru
  const showDocument = () => {
    setSourceOpen(false);
    window.setTimeout(() => docRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const handlePrint = () => {
    ws.setDocumentMode('atp_only');
    window.setTimeout(() => window.print(), 250);
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 space-y-5">
      {/* Judul langkah + aksi (satu baris, tanpa tombol ganda) */}
      <div className="bg-amber-300 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 no-print">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
            <Layers className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-neutral-800">
              Langkah 1 dari 3 · ATP
            </div>
            <h2 className="font-display font-black text-base sm:text-lg text-black leading-tight">
              Alur Tujuan Pembelajaran (ATP)
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1.5 border-2 border-black rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
              ws.storageStatus === 'ok' ? 'bg-emerald-200 text-black' : 'bg-red-200 text-black'
            }`}
            title={
              ws.storageStatus === 'ok'
                ? 'Hasil editan disimpan otomatis di browser ini dan tetap ada setelah refresh.'
                : 'Penyimpanan otomatis di browser bermasalah. Gunakan Ekspor Excel untuk mengamankan data.'
            }
          >
            <Save className="w-3.5 h-3.5" />
            <span>{ws.storageStatus === 'ok' ? `Tersimpan · ${ws.savedKb} KB` : 'Penyimpanan bermasalah'}</span>
          </span>
          <button
            type="button"
            onClick={() => ws.setIsGuidelineModalOpen(true)}
            className="neo-btn px-3 py-1.5 bg-white hover:bg-neutral-50 text-black text-xs font-bold rounded-lg flex items-center gap-1.5"
            title="Panduan Regulasi Kurikulum Merdeka & Deep Learning"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-700" />
            <span>Regulasi</span>
          </button>
          <button
            type="button"
            onClick={ws.handleExportAtp}
            className="neo-btn px-3 py-1.5 bg-white hover:bg-neutral-50 text-black text-xs font-bold rounded-lg flex items-center gap-1.5"
            title="Ekspor matriks ATP ke spreadsheet Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor ATP</span>
          </button>
          <button
            type="button"
            onClick={ws.handleResetStoredData}
            className="neo-btn px-3 py-1.5 bg-white hover:bg-red-50 text-black text-xs font-bold rounded-lg flex items-center gap-1.5"
            title="Hapus data tersimpan dan kembali ke data awal"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-700" />
            <span>Reset Data</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="neo-btn px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 text-xs font-black rounded-lg flex items-center gap-1.5"
            title="Cetak ATP: Landscape F4 (330 × 215 mm)"
          >
            <Table className="w-3.5 h-3.5 text-amber-400" />
            <span>Cetak ATP (F4)</span>
          </button>
        </div>
      </div>

      {/* Sumber data: terlipat agar dokumen langsung terlihat */}
      <details
        open={sourceOpen}
        onToggle={(e) => setSourceOpen((e.currentTarget as HTMLDetailsElement).open)}
        className="bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000] no-print"
      >
        <summary className="cursor-pointer select-none px-4 py-3 flex flex-wrap items-center justify-between gap-2 list-none">
          <span className="flex items-center gap-2 font-display font-black text-sm text-neutral-900">
            <ChevronRight className={`w-4 h-4 transition-transform ${sourceOpen ? 'rotate-90' : ''}`} />
            Sumber data ATP
          </span>
          <span className="text-[11px] font-bold bg-amber-100 border border-black rounded px-2 py-0.5">
            {unitCount} unit · {ws.currentDataMode === 'rpp' ? 'Excel RPP Terintegrasi' : 'Excel CP'} · klik untuk unggah
            Excel, pilih contoh, atau unduh template
          </span>
        </summary>
        <div className="px-3 sm:px-4 pb-4">
          <ExcelUploadZone
            rawRows={ws.rawRows}
            rppRows={ws.rppRows}
            currentMode={ws.currentDataMode}
            onExcelUploaded={(result) => {
              ws.handleExcelUploaded(result);
              showDocument();
            }}
            onRawRowsUpdated={ws.handleRawRowsUpdated}
            onRppRowsUpdated={ws.handleRppRowsUpdated}
            onSelectSample={(sample) => {
              ws.handleSelectSample(sample);
              showDocument();
            }}
            currentSubject={ws.identity.mataPelajaran}
            onOpenExcelGuideModal={() => ws.setIsExcelGuideModalOpen(true)}
          />
        </div>
      </details>

      {/* Dokumen siap cetak */}
      <section ref={docRef} aria-labelledby="dokumen-atp" className="scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 no-print">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 border border-black inline-block" />
            <h3 id="dokumen-atp" className="font-display font-black text-lg text-neutral-900">
              Dokumen siap cetak · ATP
            </h3>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-neutral-700">
            Watermark: {Math.round(ws.watermarkOpacity * 100)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={ws.watermarkOpacity}
              onChange={(e) => ws.setWatermarkOpacity(Number(e.target.value))}
              className="w-28 accent-black"
              aria-label="Kepekatan watermark"
            />
          </label>
        </div>

        <PrintableDocument
          identity={ws.identity}
          atpList={ws.currentAtpList}
          modulAjarList={ws.currentModulAjarList}
          selectedModulIndex={ws.safeModulIndex}
          documentMode="atp_only"
          watermarkOpacity={ws.watermarkOpacity}
          onOpenRppEditor={ws.handleOpenRppEditor}
        />
      </section>

      {/* Satu-satunya tombol lanjut */}
      <section className="bg-white border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_#000] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-300 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-black text-base leading-tight">ATP siap: {unitCount} unit materi</h3>
            <p className="text-xs text-neutral-700 font-medium mt-0.5">
              Lanjut ke Langkah 2; formnya terisi otomatis dari ATP ini.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => ws.goToStep('materi')}
          disabled={unitCount === 0}
          className="neo-btn px-5 py-2.5 bg-rose-300 hover:bg-rose-200 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-xl text-sm font-black flex items-center gap-2 shrink-0"
        >
          Lanjut ke Materi
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </main>
  );
};
