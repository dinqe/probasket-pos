/**
 * Compress an image file to a max width/height and convert to Base64 JPEG.
 * Helps fit custom product photos into the localStorage size limit.
 * 
 * @param {File} file The uploaded file object
 * @param {number} maxWidth Maximum width in pixels
 * @param {number} maxHeight Maximum height in pixels
 * @param {number} quality JPEG compression quality (0.0 to 1.0)
 * @returns {Promise<string>} Base64 Data URL of compressed image
 */
export const compressImage = (file, maxWidth = 128, maxHeight = 128, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    // Basic file type validation
    if (!file.type.startsWith('image/')) {
      reject(new Error('Uploaded file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2D canvas context.'));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed jpeg base64
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
