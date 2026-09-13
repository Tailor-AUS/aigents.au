import QRCode from 'qrcode';

/**
 * Generate a high-resolution QR Code Data URI for a target portal URL.
 * @param {string} url - The target URL (e.g. https://slug.aigents.au)
 * @returns {Promise<string>} Data URI string (image/png)
 */
export async function generateQrCodeDataUri(url) {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    width: 240
  });
}
