// Media stored in the library is referenced as "/api/media/<id>" so it keeps
// working if the backend host changes. External URLs are passed through.
export const imgUrl = (u) => {
  if (!u) return '';
  if (u.startsWith('/api/')) return `${process.env.REACT_APP_BACKEND_URL}${u}`;
  return u;
};

/** Resize + compress an image file in the browser before upload. */
export const resizeImageFile = (file, { maxW = 1600, maxH = 1600, mode = 'contain', quality = 0.88 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file) { reject(new Error('File kosong')); return; }
    if (file.type === 'image/svg+xml' || file.type === 'image/x-icon') {
      const r = new FileReader();
      r.onload = () => resolve({ dataUrl: r.result, width: null, height: null });
      r.onerror = () => reject(new Error('Gagal membaca file'));
      r.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let tw = img.width; let th = img.height;
        if (mode === 'cover') {
          tw = maxW; th = maxH;
        } else {
          const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
          tw = Math.round(img.width * ratio); th = Math.round(img.height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = tw; canvas.height = th;
        const ctx = canvas.getContext('2d');
        if (mode === 'cover') {
          const scale = Math.max(tw / img.width, th / img.height);
          const sw = tw / scale; const sh = th / scale;
          const sx = (img.width - sw) / 2; const sy = (img.height - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
        } else {
          ctx.drawImage(img, 0, 0, tw, th);
        }
        const hasAlpha = file.type === 'image/png' || file.type === 'image/webp';
        const out = canvas.toDataURL(hasAlpha ? 'image/png' : 'image/jpeg', quality);
        resolve({ dataUrl: out, width: tw, height: th });
      };
      img.onerror = () => reject(new Error('File bukan gambar yang valid'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
