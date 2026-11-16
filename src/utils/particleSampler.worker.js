// particleSampler.worker.js
// Analiza las imágenes de partículas fuera del hilo principal: descargar,
// decodificar y repartir ~140 000 partículas tarda hasta 120 ms por imagen, y
// hacerlo en la página producía tirones (puntero y animaciones) justo después
// de la entrada. Aquí no bloquea nada.
import { MAX_SOURCE_SIZE, sampleSource } from "./particleSampler";

const createContext = (width, height) => {
  const ctx = new OffscreenCanvas(width, height).getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
};

async function loadBitmap(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  const blob = await response.blob();
  let bitmap = await createImageBitmap(blob);

  // Las imágenes enormes se reducen antes de analizarlas
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest > MAX_SOURCE_SIZE) {
    const k = MAX_SOURCE_SIZE / longest;
    const resized = await createImageBitmap(bitmap, {
      resizeWidth: Math.round(bitmap.width * k),
      resizeHeight: Math.round(bitmap.height * k),
      resizeQuality: "high",
    });
    bitmap.close();
    bitmap = resized;
  }
  return bitmap;
}

self.onmessage = async ({ data: { id, url, count } }) => {
  try {
    const bitmap = await loadBitmap(url);
    const result = sampleSource(bitmap, count, createContext);
    bitmap.close();
    if (!result) {
      self.postMessage({ id, result: null });
      return;
    }
    // Los buffers se transfieren (sin copia) al hilo principal
    self.postMessage({ id, result }, [result.positions.buffer, result.colors.buffer]);
  } catch (err) {
    self.postMessage({ id, error: String(err?.message ?? err) });
  }
};
