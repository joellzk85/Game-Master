/**
 * Compresses and resizes an image file or base64 string on the client side using HTML5 Canvas.
 * This prevents network timeouts and ensures fast, reliable uploads.
 */
export async function compressBannerImage(
  fileOrDataUrl: File | string,
  maxWidth = 1400,
  maxHeight = 800,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    let sourceDataUrl = "";

    const processImage = (src: string) => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate new dimensions while preserving aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(src);
            return;
          }

          // Fill background with dark tint to avoid transparent holes
          ctx.fillStyle = "#14110F";
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with optimal compression
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } catch (err) {
          console.warn("Canvas compression fallback:", err);
          resolve(src);
        }
      };

      img.onerror = () => {
        reject(new Error("Unable to load image for processing."));
      };

      img.src = src;
    };

    if (typeof fileOrDataUrl === "string") {
      processImage(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        sourceDataUrl = e.target?.result as string;
        processImage(sourceDataUrl);
      };
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
