import React from 'react';
import { ArrowRight, Check, Layers, RotateCcw, Save, Table } from 'lucide-react';
import { HeaderNav } from '../../rpp/components/HeaderNav';
import { ExcelUploadZone } from '../../rpp/components/ExcelUploadZone';
import { PrintableDocument } from '../../rpp/components/PrintableDocument';
import type { Workspace } from '../useWorkspace';

/** Langkah 1: unggah/susun CP → ATP, tinjau & cetak ATP, lalu lanjut ke Materi. */
export const AtpStep: React.FC<{ ws: Workspace }> = ({ ws }) => {
  const unitCount = ws.units.length;

  return (
    <>
      <HeaderNav
        showBrand={false}
        identity={ws.identity}
        onOpenIdentityModal={() => ws.setIsIdentityModalOpen(true)}
        onOpenAiRefineModal={() => ws.setIsAiRefineModalOpen(true)}
        onOpenGuidelineModal={() => ws.setIsGuidelineModalOpen(true)}
        onDownloadCpTemplate={ws.handleDownloadCpTemplate}
        onDownloadRppTemplate={ws.handleDownloadRppTemplate}
        onExportAtp={ws.handleExportAtp}
        onExportRpp={ws.handleExportRpp}
        documentMode={ws.documentMode}
        setDocumentMode={ws.setDocumentMode}
        onOpenRppEditor={() => ws.handleOpenRppEditor('sintaks')}
        onOpenExcelGuideModal={() => ws.setIsExcelGuideModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        <div className="bg-amber-300 border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
              <Layers className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-neutral-800">
                Langkah 1 dari 3 · ATP
              </div>
              <h2 className="font-display font-black text-base sm:text-lg text-black leading-tight">
                Susun Alur Tujuan Pembelajaran (ATP)
              </h2>
              <p className="text-xs text-neutral-900 font-medium mt-0.5">
                Unggah Excel CP atau RPP Terintegrasi (atau pilih contoh). Setiap baris menjadi satu unit materi yang
                akan dilanjutkan ke Langkah 2 dan Langkah 3. Cetak ATP memakai kertas{' '}
                <strong>Landscape F4 (330 × 215 mm)</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
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
              <span>
                {ws.storageStatus === 'ok'
                  ? `Tersimpan otomatis di browser · ${ws.savedKb} KB`
                  : 'Penyimpanan browser bermasalah'}
              </span>
            </span>

            <button
              onClick={ws.handleResetStoredData}
              className="neo-btn px-3 py-1.5 bg-white hover:bg-red-50 text-black text-xs font-bold rounded-lg flex items-center gap-1.5"
              title="Hapus data tersimpan dan kembali ke data awal"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-700" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={() => {
                ws.setDocumentMode('atp_only');
                window.setTimeout(() => window.print(), 250);
              }}
              className="neo-btn px-3 py-1.5 bg-white hover:bg-neutral-50 text-black text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <Table className="w-3.5 h-3.5 text-emerald-700" />
              <span>Cetak ATP (F4)</span>
            </button>
          </div>
        </div>

        <ExcelUploadZone
          rawRows={ws.rawRows}
          rppRows={ws.rppRows}
          currentMode={ws.currentDataMode}
          onExcelUploaded={ws.handleExcelUploaded}
          onRawRowsUpdated={ws.handleRawRowsUpdated}
          onRppRowsUpdated={ws.handleRppRowsUpdated}
          onSelectSample={ws.handleSelectSample}
          currentSubject={ws.identity.mataPelajaran}
          onOpenExcelGuideModal={() => ws.setIsExcelGuideModalOpen(true)}
        />

        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3 no-print">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-black inline-block" />
              <h3 className="font-display font-black text-lg text-neutral-900">Tinjau ATP</h3>
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
        </div>

        {/* Lanjut ke Materi */}
        <section className="bg-white border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_#000] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-300 border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base leading-tight">
                ATP siap: {unitCount} unit materi
              </h3>
              <p className="text-xs text-neutral-700 font-medium mt-0.5">
                Lanjutkan ke Langkah 2 untuk membuat prompt slide materi. Formnya akan terisi otomatis dari ATP.
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
    </>
  );
};
