/**
 * Utility to compress base64 image strings to lightweight JPEGs
 * to avoid exceeding browser localStorage 5MB quota.
 */
export async function compressImageBase64(
  base64Str: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.65
): Promise<string> {
  // SVG or non-data URL images don't need canvas downscaling
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return base64Str;
  }
  if (base64Str.startsWith('data:image/svg+xml')) {
    return base64Str;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = () => {
      resolve(base64Str);
    };

    img.src = base64Str;
  });
}
