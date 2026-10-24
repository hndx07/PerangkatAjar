import React from 'react';
import { School, ChevronRight } from 'lucide-react';
import type { Workspace } from './useWorkspace';
import type { WorkflowStep } from './types';
import { APP_NAME, SCHOOL_LOGO_URL, SCHOOL_SHORT } from './brand';

interface StepperProps {
  ws: Workspace;
}

interface StepDef {
  id: WorkflowStep;
  nomor: number;
  judul: string;
  deskripsi: string;
  warna: string;
}

const STEPS: StepDef[] = [
  { id: 'atp', nomor: 1, judul: 'ATP', deskripsi: 'Alur Tujuan Pembelajaran', warna: 'bg-amber-300' },
  { id: 'materi', nomor: 2, judul: 'Materi', deskripsi: 'Prompt slide materi ajar', warna: 'bg-rose-300' },
  { id: 'rpp', nomor: 3, judul: 'RPP', deskripsi: 'RPP Deep Learning + lampiran', warna: 'bg-emerald-300' },
];

export const Stepper: React.FC<StepperProps> = ({ ws }) => {
  const total = ws.units.length;

  const badgeFor = (id: WorkflowStep): string | null => {
    if (id === 'atp') return total > 0 ? `${total} unit` : null;
    if (id === 'materi') return total > 0 ? `${ws.linkedCount}/${total} terhubung` : null;
    return null;
  };

  return (
    <div className="sticky top-0 z-50 bg-[#FFFDF7] border-b-[3px] border-black shadow-[0_3px_0_0_#000] no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-amber-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] overflow-hidden">
            <img
              src={SCHOOL_LOGO_URL}
              alt="Logo SMK Muhammadiyah Bawang"
              className="w-7 h-7 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="hidden lg:block leading-tight">
            <div className="font-display font-black text-sm text-neutral-900">{APP_NAME}</div>
            <div className="text-[10px] font-semibold text-neutral-600">{SCHOOL_SHORT}</div>
          </div>
        </div>

        {/* Langkah */}
        <nav aria-label="Alur kerja" className="flex-1 flex items-center justify-center gap-1 sm:gap-2 min-w-0">
          {STEPS.map((s, i) => {
            const active = ws.step === s.id;
            const badge = badgeFor(s.id);
            return (
              <React.Fragment key={s.id}>
                {i > 0 && <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden />}
                <button
                  type="button"
                  onClick={() => ws.goToStep(s.id)}
                  aria-current={active ? 'step' : undefined}
                  title={`Langkah ${s.nomor}: ${s.deskripsi}`}
                  className={`neo-btn px-2 sm:px-3 py-1.5 rounded-xl flex items-center gap-2 min-w-0 ${
                    active ? `${s.warna} text-black` : 'bg-white hover:bg-neutral-100 text-neutral-800'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-xs font-black shrink-0 ${
                      active ? 'bg-white' : 'bg-neutral-100'
                    }`}
                  >
                    {s.nomor}
                  </span>
                  <span className="text-left leading-tight min-w-0">
                    <span className="block text-xs sm:text-sm font-black">{s.judul}</span>
                    {badge && (
                      <span className="hidden sm:block text-[10px] font-bold text-neutral-700 whitespace-nowrap">
                        {badge}
                      </span>
                    )}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Aksi bersama */}
        <button
          type="button"
          onClick={() => ws.setIsIdentityModalOpen(true)}
          className="neo-btn shrink-0 px-2.5 sm:px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-black rounded-lg text-xs font-bold flex items-center gap-1.5"
          title="Atur sekolah, guru, kepala sekolah, mapel, kelas, dan fase"
        >
          <School className="w-3.5 h-3.5 text-violet-700" />
          <span className="hidden sm:inline">Identitas</span>
        </button>
      </div>
    </div>
  );
};
