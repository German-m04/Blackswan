import { auth } from '../firebase';

export type UploadedCarImages = {
  images: string[];
  uploadedPaths: string[];
};

async function authorizedPost<T>(url: string, body: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Iniciá sesión como administrador para guardar fotos.');

  const token = await user.getIdToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Falló el almacenamiento de imágenes.');
  }
  return result as T;
}

export async function uploadPendingCarImages(images: string[], carId?: string): Promise<UploadedCarImages> {
  const uploadedPaths: string[] = [];
  const finalImages: string[] = [];

  try {
    for (const image of images) {
      if (!image.startsWith('data:image/')) {
        finalImages.push(image);
        continue;
      }

      const result = await authorizedPost<{ path: string; url: string }>('/api/storage/upload', {
        dataUrl: image,
        carId
      });
      uploadedPaths.push(result.path);
      finalImages.push(result.url);
    }
    return { images: finalImages, uploadedPaths };
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await deleteUploadedCarImages(uploadedPaths).catch(() => undefined);
    }
    throw error;
  }
}

export async function deleteUploadedCarImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await authorizedPost('/api/storage/delete', { paths });
}

export function getSupabaseImagePath(url: string): string | null {
  const marker = '/storage/v1/object/public/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return null;

  const afterMarker = url.slice(markerIndex + marker.length);
  const slashIndex = afterMarker.indexOf('/');
  if (slashIndex === -1) return null;
  const path = decodeURIComponent(afterMarker.slice(slashIndex + 1));
  return path.startsWith('cars/') ? path : null;
}

