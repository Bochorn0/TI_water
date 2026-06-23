/** Max file size for mock local upload — MOCK-BACKEND: replace with API upload limits */
export const MAX_MENU_IMAGE_BYTES = 2 * 1024 * 1024;

export const ACCEPTED_MENU_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_MENU_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_MENU_IMAGE_TYPES)[number])) {
      reject(new Error('Formato no válido. Usa JPG, PNG o WebP.'));
      return;
    }
    if (file.size > MAX_MENU_IMAGE_BYTES) {
      reject(new Error('La imagen debe ser menor a 2 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('No se pudo leer la imagen'));
    };
    reader.onerror = () => reject(new Error('Error al cargar la imagen'));
    reader.readAsDataURL(file);
  });
}
