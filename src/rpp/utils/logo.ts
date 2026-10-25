/**
 * Logo sekolah: logo bawaan, penguraian URL / kode embed, dan kompres gambar unggahan.
 * Semua hasil berupa SATU alamat gambar (URL http/https atau data URI) yang aman dipakai pada <img>;
 * kode HTML dari pengguna tidak pernah dirender langsung.
 */

export const DEFAULT_SCHOOL_LOGO_URL =
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgzWdtCjCcX2chJuhLX_26N5MmkVK-1SkyO7kgXznQQJPQa6_TB_EJzD1WWpztg7yX9RBRE7rGn0t2Z3FdG06mwwT6pQix8t6vnlcOBm_EgGl9z0jeJemJkppP0KIIjkXGksQvaCLh2dz-gOF6a2H213VQBL6Am8Elhmd76OOnphogk-EoTTbkYbg0TQJhv/s512/34690.png';

export const DEFAULT_WATERMARK_URL =
  'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh14eQT9MWn4-D1hdb8FisPsg0qK1iIvxXbMg0RGCvXFzUVWUt_KTiOWcEBzrJYxqALWV7_RPeowvTNfbyw-tbCeDb40lvY5jm_lWN5_jjeZko2SF82_wLRcW2-rBs6fWcauvugbRXBRODAeDb0FBkV81rSrgh6stKQG9ZWf5MU3qxTwiqdSEO9AaJ1EbUX/s480/44857.png';

/** Batas panjang data URI yang disimpan di localStorage (sekitar 220 KB data gambar). */
export const MAX_LOGO_DATA_URI_CHARS = 300000;

const ALLOWED_DATA_URI = /^data:image\/(png|jpe?g|gif|webp|svg\+xml)[;,]/i;

export type LogoParse = { ok: true; src: string } | { ok: false; error: string };

const fail = (error: string): LogoParse => ({ ok: false, error });

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

/** Periksa satu alamat gambar: URL http/https atau data URI gambar. */
export function validateLogoSrc(input: string): LogoParse {
  const s = (input || '').trim();
  if (!s) return fail('Alamat gambar kosong.');

  if (/^data:/i.test(s)) {
    if (!ALLOWED_DATA_URI.test(s)) {
      return fail('Format data gambar tidak didukung. Gunakan PNG, JPG, GIF, WebP, atau SVG.');
    }
    if (s.length > MAX_LOGO_DATA_URI_CHARS) {
      return fail('Gambar terlalu besar (maksimal sekitar 220 KB). Perkecil gambarnya atau gunakan URL.');
    }
    return { ok: true, src: s };
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : s.startsWith('//') ? `https:${s}` : `https://${s}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return fail('Hanya alamat http:// atau https:// yang diizinkan.');
    }
    if (!u.hostname.includes('.') && u.hostname !== 'localhost') {
      return fail('Alamat gambar tidak valid.');
    }
    return { ok: true, src: withScheme };
  } catch {
    return fail('Alamat gambar tidak valid.');
  }
}

/**
 * Terima URL gambar, data URI, kode <img src="...">, atau kode <svg>...</svg> lalu kembalikan
 * satu alamat gambar yang aman. Kode iframe/skrip ditolak dengan pesan yang jelas.
 */
export function extractLogoSource(raw: string): LogoParse {
  const t = (raw || '').trim();
  if (!t) return fail('Masukkan URL gambar atau kode embed.');

  if (t.startsWith('<')) {
    const img = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(t);
    if (img) return validateLogoSrc(decodeEntities(img[1] ?? img[2] ?? img[3] ?? ''));

    const svg = /<svg[\s\S]*<\/svg>/i.exec(t);
    if (svg) {
      if (/<script|\son[a-z]+\s*=|<foreignObject/i.test(svg[0])) {
        return fail('Kode SVG berisi skrip atau elemen terlarang dan tidak diizinkan.');
      }
      return validateLogoSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg[0])}`);
    }

    if (/<iframe/i.test(t)) {
      return fail('Kode iframe tidak bisa dipakai sebagai logo. Gunakan alamat gambar langsung atau kode <img>.');
    }
    return fail('Kode embed tidak memuat gambar. Gunakan <img src="..."> atau <svg>.');
  }

  return validateLogoSrc(t);
}

// ---------------------------------------------------------------------------
// Unggah berkas -> data URI yang sudah diperkecil (khusus peramban)
// ---------------------------------------------------------------------------

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Berkas tidak dapat dibaca.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Berkas bukan gambar yang valid.'));
    img.src = src;
  });
}

/**
 * Ubah berkas gambar menjadi data URI berukuran kecil: sisi terpanjang dibatasi (bawaan 480 px),
 * transparansi dipertahankan (PNG), dan bila masih besar dicoba WebP lalu diperkecil bertahap.
 * SVG disimpan apa adanya setelah diperiksa.
 */
export async function fileToLogoDataUrl(file: File, maxDim = 480): Promise<string> {
  if (!/^image\//i.test(file.type)) {
    throw new Error('Berkas harus berupa gambar (PNG, JPG, WebP, GIF, atau SVG).');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran berkas maksimal 5 MB.');
  }

  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    const res = extractLogoSource(text.includes('<svg') ? text.slice(text.indexOf('<svg')) : text);
    if (!res.ok) throw new Error(res.error);
    return res.src;
  }

  const img = await loadImage(await readAsDataUrl(file));
  const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1;

  let dim = maxDim;
  for (let attempt = 0; attempt !== 4; attempt++) {
    const scale = Math.min(1, dim / longest);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Peramban tidak mendukung pemrosesan gambar.');
    ctx.drawImage(img, 0, 0, w, h);

    for (const [type, quality] of [['image/png', undefined], ['image/webp', 0.9]] as const) {
      const uri = canvas.toDataURL(type, quality);
      if (uri.startsWith(`data:${type}`) && uri.length <= MAX_LOGO_DATA_URI_CHARS) return uri;
    }
    dim = Math.round(dim * 0.75);
  }
  throw new Error('Gambar masih terlalu besar setelah diperkecil. Gunakan gambar yang lebih sederhana atau gunakan URL.');
}
