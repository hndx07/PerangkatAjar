import React from 'react';
import { unitStatus, type UnitStatus } from './bridge';
import type { MateriState, WorkflowUnit } from './types';

interface UnitPickerProps {
  units: WorkflowUnit[];
  materi: MateriState;
  activeIndex: number;
  onSelect: (index: number) => void;
}

const STATUS_LABEL: Record<UnitStatus, string> = {
  terhubung: 'Materi terhubung ke RPP',
  draf: 'Form materi sudah diisi, belum terhubung',
  kosong: 'Belum ada materi',
};

const STATUS_DOT: Record<UnitStatus, string> = {
  terhubung: 'bg-emerald-400',
  draf: 'bg-amber-300',
  kosong: 'bg-white',
};

export const UnitPicker: React.FC<UnitPickerProps> = ({ units, materi, activeIndex, onSelect }) => {
  return (
    <div role="tablist" aria-label="Pilih unit materi" className="flex flex-wrap gap-2">
      {units.map((u) => {
        const status = unitStatus(u, materi);
        const active = u.index === activeIndex;
        return (
          <button
            key={u.key + u.index}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(u.index)}
            title={`${u.judul} — ${STATUS_LABEL[status]}`}
            className={`neo-btn px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 max-w-full ${
              active ? 'bg-amber-300 text-black' : 'bg-white hover:bg-neutral-100 text-neutral-800'
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full border-2 border-black shrink-0 ${STATUS_DOT[status]}`}
              aria-hidden
            />
            <span className="text-[11px] font-black font-mono shrink-0">Unit {u.nomor}</span>
            <span className="text-xs font-semibold truncate max-w-[14rem]">{u.judul}</span>
            <span className="sr-only">{STATUS_LABEL[status]}</span>
          </button>
        );
      })}
    </div>
  );
};

export const UnitStatusLegend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-neutral-600">
    {(['kosong', 'draf', 'terhubung'] as UnitStatus[]).map((s) => (
      <span key={s} className="inline-flex items-center gap-1.5">
        <span className={`w-3 h-3 rounded-full border-2 border-black ${STATUS_DOT[s]}`} aria-hidden />
        {STATUS_LABEL[s]}
      </span>
    ))}
  </div>
);
