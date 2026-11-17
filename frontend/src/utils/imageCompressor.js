/**
 * Nestora Client-Side Image Processing & Compression Engine
 *
 * Automatically resizes and compresses image files selected from the local computer/system
 * using HTML5 Canvas. Reduces multi-megabyte photos (3MB-10MB) to optimized web images (~80KB-160KB)
 * while preserving sharp visual fidelity. Prevents browser QuotaExceededError and HTTP 413 Payload Too Large.
 */

export const compressImageFile = (
  file,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82
) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not a valid image format.'));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read file from device storage.'));
    };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Could not process the selected image file.'));
      };

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional dimensions within max constraints
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
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
          return resolve(event.target.result); // Fallback to raw base64 if canvas unavailable
        }

        // Fill background with white to handle transparent PNGs converting to JPEG cleanly
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Export as optimized web JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Process multiple files in batch
 */
export const compressImageFiles = async (
  files,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82
) => {
  const results = [];
  for (const file of files) {
    if (file && file.type && file.type.startsWith('image/')) {
      try {
        const compressed = await compressImageFile(file, maxWidth, maxHeight, quality);
        results.push(compressed);
      } catch (err) {
        console.warn('Failed compressing file:', file.name, err.message);
      }
    }
  }
  return results;
};
