export async function compactImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const picture = new Image();
    await new Promise<void>((resolve, reject) => {
      picture.onload = () => resolve();
      picture.onerror = () => reject(new Error('图片无法读取，请选择其他图片。'));
      picture.src = url;
    });
    let ratio = Math.min(1, 1280 / Math.max(picture.naturalWidth, picture.naturalHeight));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('当前浏览器无法处理图片，请更换浏览器重试。');
    for (let resize = 0; resize < 4; resize++) {
      canvas.width = Math.max(1, Math.round(picture.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(picture.naturalHeight * ratio));
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(picture, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.86, 0.72, 0.58, 0.44]) {
        const result = canvas.toDataURL('image/jpeg', quality);
        if (result.length * 0.75 <= 600 * 1024) return result;
      }
      ratio *= 0.75;
    }
    throw new Error('图片压缩后仍过大，请裁剪或选择较小的图片。');
  } finally {
    URL.revokeObjectURL(url);
  }
}
