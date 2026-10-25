import React, { useMemo, useState } from 'react';
import { ArrowLeft, Flame, RotateCcw } from 'lucide-react';
import type { PromptFormData } from '../../materi/types';
import { generatePromptInduk } from '../../materi/utils/promptGenerator';
import { PresetSelector } from '../../materi/components/PresetSelector';
import { SectionIdentitas } from '../../materi/components/SectionIdentitas';
import { SectionKelasAlur } from '../../materi/components/SectionKelasAlur';
import { SectionAktivitas } from '../../materi/components/SectionAktivitas';
import { SectionAsesmenOutput } from '../../materi/components/SectionAsesmenOutput';
import { SectionVisualCatatan } from '../../materi/components/SectionVisualCatatan';
import { PromptPreviewPanel } from '../../materi/components/PromptPreviewPanel';
import { AutofillModal } from '../../materi/components/AutofillModal';
import { UnitPicker, UnitStatusLegend } from '../UnitPicker';
import { LinkPanel } from '../LinkPanel';
import { readLinks } from '../bridge';
import type { Workspace } from '../useWorkspace';
import type { WorkflowUnit } from '../types';

const TABS = [
  { title: '1 & 2. Identitas & Tujuan', color: 'bg-[#FEF08A]' },
  { title: '3 & 4. Kondisi & Alur', color: 'bg-[#E0F2FE]' },
  { title: '5. Aktivitas & Media Materi', color: 'bg-[#FCE7F3]' },
  { title: '6 & 7. Asesmen, Media Soal & Output', color: 'bg-[#E9D5FF]' },
  { title: '8 & 9. Visual, Logo & Background', color: 'bg-[#DCFCE7]' },
];

/** Ringkasan ATP unit aktif: sumber isian otomatis form di bawahnya. */
const AtpSummary: React.FC<{ unit: WorkflowUnit; onReset: () => void }> = ({ unit, onReset }) => {
  const cp = unit.atpItems[0]?.capaianPembelajaran;
  return (
    <details open className="bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_#000] no-print">
      <summary className="cursor-pointer select-none px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <span className="font-display font-black text-sm text-neutral-900">
          Dasar dari ATP — Unit {unit.nomor}: {unit.judul}
        </span>
        <span className="text-[11px] font-mono font-bold bg-amber-100 border border-black rounded px-2 py-0.5">
          {unit.jp || 'JP belum diisi'}
          {unit.elemen ? ` · ${unit.elemen}` : ''}
        </span>
      </summary>
      <div className="px-4 pb-4 space-y-3 text-xs text-neutral-800">
        {cp && (
          <p>
            <span className="font-black">Capaian Pembelajaran: </span>
            {cp}
          </p>
        )}
        {unit.atpItems.length > 0 ? (
          <ul className="space-y-2">
            {unit.atpItems.map((a) => (
              <li key={a.id} className="border border-black rounded-lg p-2.5 bg-neutral-50">
                <span className="font-mono font-black bg-white border border-black rounded px-1.5 py-0.5 mr-2">
                  {a.kodeTp}
                </span>
                {a.tujuanPembelajaran}
                {a.alurTujuanPembelajaran && (
                  <p className="mt-1 text-neutral-600">
                    <span className="font-bold">Alur: </span>
                    {a.alurTujuanPembelajaran}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic text-neutral-500">Belum ada butir ATP untuk unit ini.</p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <p className="text-[11px] text-neutral-600 flex-1 min-w-[12rem]">
            Form di bawah terisi otomatis dari data ini. Anda bebas mengubahnya; perubahan tersimpan per unit.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="neo-btn px-3 py-1.5 bg-white hover:bg-amber-50 text-black rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Isi ulang dari ATP
          </button>
        </div>
      </div>
    </details>
  );
};

export const MateriStep: React.FC<{ ws: Workspace }> = ({ ws }) => {
  const { activeUnit, materiForm } = ws;

  const [copied, setCopied] = useState(false);
  const [includeSectionsBCD, setIncludeSectionsBCD] = useState(true);
  const [cleanUnusedLines, setCleanUnusedLines] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showAllSections, setShowAllSections] = useState(false);
  const [isAutofillOpen, setIsAutofillOpen] = useState(false);

  const generatedPrompt = useMemo(
    () => (materiForm ? generatePromptInduk(materiForm, { includeSectionsBCD, cleanUnusedLines }) : ''),
    [materiForm, includeSectionsBCD, cleanUnusedLines]
  );

  if (!activeUnit || !materiForm) {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <div className="bg-white border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_#000] p-6 text-center space-y-3">
          <h2 className="font-display font-black text-xl">Belum ada unit materi</h2>
          <p className="text-sm text-neutral-700">
            Unggah Excel CP/RPP atau pilih contoh data di Langkah 1 agar unit materi tersedia.
          </p>
          <button
            type="button"
            onClick={() => ws.goToStep('atp')}
            className="neo-btn px-4 py-2 bg-amber-300 text-black rounded-lg text-sm font-black inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Ke Langkah 1: ATP
          </button>
        </div>
      </main>
    );
  }

  const handleFieldChange = <K extends keyof PromptFormData>(field: K, value: PromptFormData[K]) => {
    ws.updateMateriForm({ [field]: value } as Partial<PromptFormData>);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      ws.showNotification('Prompt Induk berhasil disalin ke clipboard!');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      ws.showNotification('⚠️ Gagal menyalin otomatis. Pilih teks di panel prompt lalu salin manual.');
    }
  };

  const handleDownloadPrompt = () => {
    const mapel = (materiForm.mataPelajaran || 'MATERI').replace(/[^\p{L}\p{N}]+/gu, '-');
    const filename = `PROMPT-SLIDE-U${activeUnit.nomor}-${mapel}-${Date.now()}.md`;
    const blob = new Blob([generatedPrompt], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    ws.showNotification(`File ${filename} berhasil diunduh!`);
  };

  // Tautan tersimpan ikut menjadi bagian kunci agar panel tautan selalu sinkron dengan RPP
  const links = readLinks(activeUnit.modul);
  const linkPanelKey = [
    activeUnit.key,
    links.tautanMateri,
    links.embedMateri,
    links.tautanLkpd,
    links.embedLkpd,
  ].join('|');

  return (
    <div className="flex-1 flex flex-col vintage-dot-bg">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-5">
        {/* Banner langkah */}
        <section className="bg-rose-300 border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider border-2 border-black rounded bg-[#FEF08A] mb-2">
              <Flame className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
              Langkah 2 dari 3 · Materi
            </div>
            <h2 className="font-display font-black text-lg sm:text-xl text-black leading-tight">
              Buat prompt slide materi untuk setiap unit ATP
            </h2>
            <p className="text-xs text-neutral-900 font-medium mt-1">
              Pilih unit, periksa isian yang sudah terisi otomatis dari ATP, salin prompt ke AI, lalu hubungkan
              tautan hasilnya ke RPP di bagian paling bawah.
            </p>
          </div>
          <div className="shrink-0 bg-white border-2 border-black rounded-xl px-3 py-2 shadow-[2px_2px_0px_#000] text-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-600">Materi terhubung</div>
            <div className="font-display font-black text-xl tabular-nums">
              {ws.linkedCount}/{ws.units.length}
            </div>
          </div>
        </section>

        {/* Pemilih unit */}
        <section className="space-y-2 no-print" aria-label="Pilih unit">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display font-black text-sm text-neutral-900">Pilih unit materi</h3>
            <UnitStatusLegend />
          </div>
          <UnitPicker
            units={ws.units}
            materi={ws.materi}
            activeIndex={activeUnit.index}
            onSelect={(i) => ws.openUnit(i)}
          />
        </section>

        <AtpSummary unit={activeUnit} onReset={ws.resetMateriUnit} />

        <PresetSelector
          currentData={materiForm}
          onSelectPreset={ws.applyMateriPreset}
          onOpenAutofill={() => setIsAutofillOpen(true)}
        />

        {/* Editor form (kiri) & prompt langsung (kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white border-2 border-stone-900 rounded-lg neo-shadow-sm">
              <div className="flex flex-wrap gap-1">
                {TABS.map((tab, idx) => {
                  const isActive = !showAllSections && activeTab === idx;
                  return (
                    <button
                      key={tab.title}
                      type="button"
                      onClick={() => {
                        setShowAllSections(false);
                        setActiveTab(idx);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded border-2 border-stone-900 transition-all ${
                        isActive
                          ? `${tab.color} text-stone-900 neo-shadow-sm`
                          : 'bg-[#FAF7F2] text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {tab.title}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowAllSections(!showAllSections)}
                className={`px-3 py-1.5 text-xs font-bold rounded border-2 border-stone-900 transition-all ${
                  showAllSections ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
                }`}
              >
                {showAllSections ? 'Tampilkan Mode Tab' : 'Tampilkan Semua Bagian'}
              </button>
            </div>

            {showAllSections ? (
              <div className="space-y-6">
                <SectionIdentitas
                  data={materiForm}
                  onChange={handleFieldChange}
                  onOpenAutofill={() => setIsAutofillOpen(true)}
                />
                <SectionKelasAlur data={materiForm} onChange={handleFieldChange} />
                <SectionAktivitas data={materiForm} onChange={handleFieldChange} />
                <SectionAsesmenOutput data={materiForm} onChange={handleFieldChange} />
                <SectionVisualCatatan data={materiForm} onChange={handleFieldChange} />
              </div>
            ) : (
              <div>
                {activeTab === 0 && (
                  <SectionIdentitas
                    data={materiForm}
                    onChange={handleFieldChange}
                    onOpenAutofill={() => setIsAutofillOpen(true)}
                  />
                )}
                {activeTab === 1 && <SectionKelasAlur data={materiForm} onChange={handleFieldChange} />}
                {activeTab === 2 && <SectionAktivitas data={materiForm} onChange={handleFieldChange} />}
                {activeTab === 3 && <SectionAsesmenOutput data={materiForm} onChange={handleFieldChange} />}
                {activeTab === 4 && <SectionVisualCatatan data={materiForm} onChange={handleFieldChange} />}

                <div className="mt-6 flex items-center justify-between pt-4 border-t-2 border-stone-200">
                  <button
                    type="button"
                    disabled={activeTab === 0}
                    onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 text-xs font-bold border-2 border-stone-900 rounded bg-white hover:bg-stone-100 disabled:opacity-40 transition-colors"
                  >
                    ← Bagian Sebelumnya
                  </button>
                  <div className="text-xs font-mono font-bold text-stone-500">
                    Bagian {activeTab + 1} dari {TABS.length}
                  </div>
                  <button
                    type="button"
                    disabled={activeTab === TABS.length - 1}
                    onClick={() => setActiveTab((prev) => Math.min(TABS.length - 1, prev + 1))}
                    className="px-4 py-2 text-xs font-bold border-2 border-stone-900 rounded bg-[#FEF08A] hover:bg-[#fde047] disabled:opacity-40 neo-shadow-sm transition-all"
                  >
                    Lanjut Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <PromptPreviewPanel
              promptText={generatedPrompt}
              onCopy={handleCopyPrompt}
              copied={copied}
              onDownload={handleDownloadPrompt}
              includeSectionsBCD={includeSectionsBCD}
              onToggleBCD={setIncludeSectionsBCD}
              cleanUnusedLines={cleanUnusedLines}
              onToggleCleanLines={setCleanUnusedLines}
            />
          </div>
        </div>

        {/* Keluaran langkah ini → RPP */}
        <LinkPanel
          key={linkPanelKey}
          unit={activeUnit}
          onSave={ws.saveMateriLinks}
          onGoToRpp={() => ws.openUnit(activeUnit.index, 'rpp')}
        />
      </main>

      <AutofillModal
        isOpen={isAutofillOpen}
        onClose={() => setIsAutofillOpen(false)}
        onApply={ws.applyMateriPreset}
      />
    </div>
  );
};
