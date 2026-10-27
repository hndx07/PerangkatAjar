import React from 'react';
import { Check, Compass } from 'lucide-react';
import { useWorkspace } from './workflow/useWorkspace';
import { Stepper } from './workflow/Stepper';
import { AtpStep } from './workflow/steps/AtpStep';
import { MateriStep } from './workflow/steps/MateriStep';
import { RppStep } from './workflow/steps/RppStep';
import { SchoolIdentityModal } from './rpp/components/SchoolIdentityModal';
import { GuidelineModal } from './rpp/components/GuidelineModal';
import { AiRefineModal } from './rpp/components/AiRefineModal';
import { RppTableEditorModal } from './rpp/components/RppTableEditorModal';
import { ExcelGuideAndAiPromptModal } from './rpp/components/ExcelGuideAndAiPromptModal';
import { SCHOOL_SHORT } from './workflow/brand';

/**
 * Perangkat Ajar Terpadu — satu aplikasi dengan alur ATP → Materi → RPP.
 * Seluruh state hidup di useWorkspace; tiap langkah hanya menampilkan dan mengubahnya.
 */
export default function App() {
  const ws = useWorkspace();

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-neutral-900 flex flex-col font-sans">
      {/* Notifikasi */}
      {ws.notification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[60] max-w-[min(28rem,calc(100vw-3rem))] bg-neutral-900 text-white border-2 border-black px-4 py-2.5 rounded-xl shadow-[4px_4px_0px_#000] text-xs font-bold flex items-center gap-2 no-print"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{ws.notification}</span>
        </div>
      )}

      <Stepper ws={ws} />

      {ws.step === 'atp' && <AtpStep ws={ws} />}
      {ws.step === 'materi' && <MateriStep ws={ws} />}
      {ws.step === 'rpp' && <RppStep ws={ws} />}

      {/* Footer layar (tidak ikut tercetak) */}
      <footer className="bg-[#FFFDF7] border-t-2 border-black py-6 px-4 text-center mt-12 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
          <div className="flex items-center gap-2 font-bold text-neutral-800">
            <Compass className="w-4 h-4 text-amber-600" />
            <span>Deep Learning · Kurikulum Merdeka</span>
          </div>
          <div className="text-xs font-black text-neutral-900 bg-amber-200 border-2 border-black px-3.5 py-1 rounded-lg shadow-[2px_2px_0px_#000]">
            developed by @hndx07
          </div>
          <div className="text-[11px] text-neutral-500 font-medium">
            ATP → Materi → RPP · Deep Learning (Mindful · Meaningful · Joyful)
          </div>
        </div>
      </footer>

      {/* Modal bersama */}
      <SchoolIdentityModal
        isOpen={ws.isIdentityModalOpen}
        onClose={() => ws.setIsIdentityModalOpen(false)}
        identity={ws.identity}
        onSave={ws.handleSaveIdentity}
      />
      <GuidelineModal isOpen={ws.isGuidelineModalOpen} onClose={() => ws.setIsGuidelineModalOpen(false)} />
      <AiRefineModal
        isOpen={ws.isAiRefineModalOpen}
        onClose={() => ws.setIsAiRefineModalOpen(false)}
        modulAjar={ws.activeModulAjar}
        identity={ws.identity}
        onApplyEnrichment={ws.handleApplyEnrichment}
      />
      <RppTableEditorModal
        isOpen={ws.isRppEditorOpen}
        onClose={() => ws.setIsRppEditorOpen(false)}
        modulList={ws.currentModulAjarList}
        selectedModulIndex={ws.safeModulIndex}
        onSaveModul={ws.handleSaveModulFromEditor}
        identity={ws.identity}
        initialTab={ws.rppEditorInitialTab}
      />
      <ExcelGuideAndAiPromptModal
        isOpen={ws.isExcelGuideModalOpen}
        onClose={() => ws.setIsExcelGuideModalOpen(false)}
        identity={ws.identity}
      />
    </div>
  );
}
