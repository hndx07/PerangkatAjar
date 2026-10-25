import React from 'react';
import { ExternalLink, FileSpreadsheet, FileText, Link2, RotateCcw, Save, Sparkles } from 'lucide-react';
import { DocumentTabs } from '../../rpp/components/DocumentTabs';
import { PrintableDocument } from '../../rpp/components/PrintableDocument';
import { UnitPicker } from '../UnitPicker';
import { isMateriLinked, readLinks } from '../bridge';
import type { Workspace } from '../useWorkspace';

/** Langkah 3: tinjau, sunting, dan cetak RPP Deep Learning lengkap dengan lampiran materi dari Langkah 2. */
export const RppStep: React.FC<{ ws: Workspace }> = ({ ws }) => {
  const unit = ws.activeUnit;
  const linked = unit ? isMateriLinked(unit.modul) : false;
  const links = unit ? readLinks(unit.modul) : null;

  const printLabel =
    ws.documentMode === 'atp_only'
      ? 'Cetak ATP (F4)'
      : ws.documentMode === 'modul_selected'
        ? `Cetak RPP Unit ${ws.safeModulIndex + 1} (F4)`
        : ws.documentMode === 'lampiran_selected'
          ? `Cetak Lampiran Unit ${ws.safeModulIndex + 1} (F4)`
          : 'Cetak Dokumen (F4)';

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 space-y-4">
      {/* Judul langkah + aksi (satu baris, tanpa tombol ganda) */}
      <div className="bg-emerald-300 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 no-print">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
            <FileText className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-neutral-800">
              Langkah 3 dari 3 · RPP
            </div>
            <h2 className="font-display font-black text-base sm:text-lg text-black leading-tight">
              RPP Deep Learning &amp; lampiran
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2.5 py-1.5 border-2 border-black rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
              ws.storageStatus === 'ok' ? 'bg-white text-black' : 'bg-red-200 text-black'
            }`}
            title="Hasil editan disimpan otomatis di browser ini."
          >
            <Save className="w-3.5 h-3.5" />
            <span>{ws.storageStatus === 'ok' ? `Tersimpan · ${ws.savedKb} KB` : 'Penyimpanan bermasalah'}</span>
          </span>
          <button
            type="button"
            onClick={() => ws.setIsAiRefineModalOpen(true)}
            className="neo-btn px-3 py-1.5 bg-white hover:bg-neutral-50 text-black text-xs font-bold rounded-lg flex items-center gap-1.5"
            title="Kustomisasi & perkaya RPP dengan AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-700" />
            <span>AI Refiner</span>
          </button>
          <button
            type="button"
            onClick={ws.handleExportRpp}
            className="neo-btn px-3 py-1.5 bg-white hover:bg-neutral-50 text-black text-xs font-bold rounded-lg flex items-center gap-1.5"
            title="Ekspor seluruh RPP ke Excel terintegrasi"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ekspor RPP</span>
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
            onClick={() => window.print()}
            className="neo-btn px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 text-xs font-black rounded-lg flex items-center gap-1.5"
            title="Cetak dokumen yang sedang tampil: Landscape F4 (330 × 215 mm)"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>{printLabel}</span>
          </button>
        </div>
      </div>

      {/* Pemilih unit (satu-satunya) + status materi */}
      <section className="space-y-3 no-print" aria-label="Unit dan status materi">
        <UnitPicker
          units={ws.units}
          materi={ws.materi}
          activeIndex={ws.safeModulIndex}
          onSelect={(i) => ws.openUnit(i)}
        />

        {unit && (
          <div
            className={`border-2 border-black rounded-xl p-3 shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              linked ? 'bg-emerald-50' : 'bg-amber-50'
            }`}
          >
            <div className="text-xs text-neutral-800 min-w-0">
              {linked ? (
                <>
                  <span className="font-black">✓ Materi Unit {unit.nomor} sudah terhubung.</span>{' '}
                  {links?.tautanMateri && (
                    <a
                      href={links.tautanMateri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 underline font-mono break-all"
                    >
                      {links.tautanMateri}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </>
              ) : (
                <span>
                  <span className="font-black">Materi Unit {unit.nomor} belum terhubung.</span> Lampiran 1 masih
                  kosong.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => ws.openUnit(unit.index, 'materi')}
              className="neo-btn shrink-0 px-3 py-1.5 bg-rose-300 hover:bg-rose-200 text-black rounded-lg text-xs font-black flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5" />
              {linked ? 'Ubah materi unit ini' : 'Buat materi unit ini'}
            </button>
          </div>
        )}
      </section>

      {/* Dokumen siap cetak */}
      <section aria-label="Dokumen siap cetak">
        <DocumentTabs
          documentMode={ws.documentMode}
          setDocumentMode={ws.setDocumentMode}
          modulAjarList={ws.currentModulAjarList}
          selectedModulIndex={ws.safeModulIndex}
          setSelectedModulIndex={ws.setSelectedModulIndex}
          watermarkOpacity={ws.watermarkOpacity}
          setWatermarkOpacity={ws.setWatermarkOpacity}
          onOpenRppEditor={ws.handleOpenRppEditor}
          hideUnitSelector
        />

        <PrintableDocument
          identity={ws.identity}
          atpList={ws.currentAtpList}
          modulAjarList={ws.currentModulAjarList}
          selectedModulIndex={ws.safeModulIndex}
          documentMode={ws.documentMode}
          watermarkOpacity={ws.watermarkOpacity}
          onOpenRppEditor={ws.handleOpenRppEditor}
        />
      </section>
    </main>
  );
};
