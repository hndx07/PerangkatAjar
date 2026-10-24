import React, { useState } from 'react';
import { Link2, ExternalLink, ArrowRight, X } from 'lucide-react';
import { makeIframeEmbed, normalizeUrl, readLinks } from './bridge';
import type { MateriLinks, WorkflowUnit } from './types';

interface LinkPanelProps {
  unit: WorkflowUnit;
  onSave: (index: number, links: MateriLinks) => void;
  onGoToRpp: () => void;
}

const inputCls =
  'w-full px-3 py-2 text-sm bg-white border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300';

/**
 * Panel keluaran Langkah 2. Guru menempelkan tautan (dan/atau kode embed) slide materi yang sudah
 * dibuat dari prompt; tombol simpan menuliskannya ke Lampiran 1 (Materi) dan Lampiran 2 (LKPD) RPP unit ini.
 *
 * Komponen ini di-remount (lewat `key`) setiap kali tautan tersimpan berubah, sehingga isian
 * selalu mengikuti kondisi RPP terbaru tanpa efek samping.
 */
export const LinkPanel: React.FC<LinkPanelProps> = ({ unit, onSave, onGoToRpp }) => {
  const saved = readLinks(unit.modul);
  const [draft, setDraft] = useState<MateriLinks>(saved);
  const [autoEmbed, setAutoEmbed] = useState(false);

  const set = <K extends keyof MateriLinks>(k: K, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const materiUrl = draft.tautanMateri.trim();
  const lkpdUrl = draft.tautanLkpd.trim();
  const materiInvalid = materiUrl !== '' && normalizeUrl(materiUrl) === null;
  const lkpdInvalid = lkpdUrl !== '' && normalizeUrl(lkpdUrl) === null;
  const hasError = materiInvalid || lkpdInvalid;

  const dirty =
    draft.tautanMateri !== saved.tautanMateri ||
    draft.embedMateri !== saved.embedMateri ||
    draft.tautanLkpd !== saved.tautanLkpd ||
    draft.embedLkpd !== saved.embedLkpd ||
    autoEmbed;

  const linked = !!(saved.tautanMateri.trim() || saved.embedMateri.trim());

  const handleSave = () => {
    if (hasError) return;
    const tautanMateri = normalizeUrl(materiUrl) ?? '';
    const tautanLkpd = normalizeUrl(lkpdUrl) ?? '';
    onSave(unit.index, {
      tautanMateri,
      embedMateri: autoEmbed && tautanMateri ? makeIframeEmbed(tautanMateri) : draft.embedMateri,
      tautanLkpd,
      embedLkpd: draft.embedLkpd,
    });
    setAutoEmbed(false);
  };

  const handleClear = () => {
    onSave(unit.index, { tautanMateri: '', embedMateri: '', tautanLkpd: '', embedLkpd: '' });
  };

  return (
    <section
      aria-labelledby="link-panel-title"
      className="bg-white border-[3px] border-black rounded-2xl shadow-[5px_5px_0px_#000] overflow-hidden no-print"
    >
      <div className="bg-emerald-300 border-b-[3px] border-black px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <Link2 className="w-5 h-5 text-emerald-800" />
          </div>
          <div>
            <h3 id="link-panel-title" className="font-display font-black text-base text-black leading-tight">
              Hubungkan hasil materi ke RPP — Unit {unit.nomor}
            </h3>
            <p className="text-[11px] font-semibold text-neutral-800">
              Tautan ini akan muncul otomatis di Lampiran RPP unit ini.
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 border-2 border-black rounded-lg text-[11px] font-black ${
            linked ? 'bg-white text-emerald-800' : 'bg-amber-100 text-neutral-800'
          }`}
        >
          {linked ? '✓ Terhubung ke RPP' : 'Belum terhubung'}
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <ol className="text-xs text-neutral-700 font-medium space-y-1 list-decimal pl-5">
          <li>Salin prompt induk di atas, tempel ke AI pilihan Anda, lalu minta hasilnya berupa satu file HTML.</li>
          <li>
            Terbitkan hasil HTML tersebut (mis. lewat Blogger, GitHub Pages, atau Cloudflare Pages) sampai
            mendapat tautan.
          </li>
          <li>Tempel tautannya di bawah ini, lalu simpan.</li>
        </ol>

        {/* Lampiran 1: Materi */}
        <div className="space-y-1.5">
          <label htmlFor="tautan-materi" className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
            Tautan slide materi <span className="font-mono text-[10px] text-neutral-500">(Lampiran 1)</span>
          </label>
          <input
            id="tautan-materi"
            type="url"
            inputMode="url"
            className={`${inputCls} ${materiInvalid ? 'border-red-600 bg-red-50' : ''}`}
            placeholder="https://contoh.com/materi-unit-1.html"
            value={draft.tautanMateri}
            onChange={(e) => set('tautanMateri', e.target.value)}
            aria-invalid={materiInvalid}
            aria-describedby={materiInvalid ? 'tautan-materi-err' : undefined}
          />
          {materiInvalid && (
            <p id="tautan-materi-err" className="text-[11px] font-bold text-red-700">
              Tautan tidak valid. Gunakan alamat yang diawali http:// atau https://.
            </p>
          )}
          <label className="flex items-center gap-2 text-[11px] font-semibold text-neutral-700 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={autoEmbed}
              onChange={(e) => setAutoEmbed(e.target.checked)}
              disabled={!materiUrl || materiInvalid}
              className="w-4 h-4 accent-black"
            />
            Tampilkan juga sebagai bingkai (iframe) di Lampiran RPP
          </label>
        </div>

        <details className="group border-2 border-black rounded-lg bg-neutral-50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-neutral-800 select-none">
            Kode embed materi (opsional, untuk pengguna lanjut)
          </summary>
          <div className="px-3 pb-3 space-y-1.5">
            <textarea
              rows={3}
              className={`${inputCls} font-mono text-xs`}
              placeholder='<iframe src="https://..." width="100%" height="480"></iframe>'
              value={draft.embedMateri}
              onChange={(e) => set('embedMateri', e.target.value)}
              aria-label="Kode embed materi"
            />
            <p className="text-[11px] text-neutral-600">
              Hanya tempel kode embed dari sumber yang Anda percaya; kode ini ditampilkan apa adanya di dokumen RPP.
            </p>
          </div>
        </details>

        {/* Lampiran 2: LKPD / Kuis */}
        <div className="space-y-1.5">
          <label htmlFor="tautan-lkpd" className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
            Tautan LKPD / kuis <span className="font-mono text-[10px] text-neutral-500">(Lampiran 2, opsional)</span>
          </label>
          <input
            id="tautan-lkpd"
            type="url"
            inputMode="url"
            className={`${inputCls} ${lkpdInvalid ? 'border-red-600 bg-red-50' : ''}`}
            placeholder="Kosongkan bila LKPD tidak diubah"
            value={draft.tautanLkpd}
            onChange={(e) => set('tautanLkpd', e.target.value)}
            aria-invalid={lkpdInvalid}
            aria-describedby={lkpdInvalid ? 'tautan-lkpd-err' : undefined}
          />
          {lkpdInvalid && (
            <p id="tautan-lkpd-err" className="text-[11px] font-bold text-red-700">
              Tautan tidak valid. Gunakan alamat yang diawali http:// atau https://.
            </p>
          )}
        </div>

        <details className="group border-2 border-black rounded-lg bg-neutral-50">
          <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-neutral-800 select-none">
            Kode embed LKPD (opsional)
          </summary>
          <div className="px-3 pb-3">
            <textarea
              rows={3}
              className={`${inputCls} font-mono text-xs`}
              placeholder='<iframe src="https://..." width="100%" height="480"></iframe>'
              value={draft.embedLkpd}
              onChange={(e) => set('embedLkpd', e.target.value)}
              aria-label="Kode embed LKPD"
            />
          </div>
        </details>

        {linked && saved.tautanMateri && (
          <a
            href={saved.tautanMateri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 underline break-all"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            Buka materi yang tersimpan
          </a>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={hasError || !dirty}
            className="neo-btn px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-lg text-xs font-black flex items-center gap-1.5"
          >
            <Link2 className="w-4 h-4" />
            Simpan &amp; hubungkan ke RPP
          </button>

          {linked && (
            <button
              type="button"
              onClick={handleClear}
              className="neo-btn px-3 py-2 bg-white hover:bg-red-50 text-black rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <X className="w-4 h-4 text-red-700" />
              Lepas tautan
            </button>
          )}

          <button
            type="button"
            onClick={onGoToRpp}
            className="neo-btn ml-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-amber-300 rounded-lg text-xs font-black flex items-center gap-1.5"
          >
            Lanjut ke RPP Unit {unit.nomor}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
