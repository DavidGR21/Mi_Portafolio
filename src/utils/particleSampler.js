// particleSampler.js
// Convierte una imagen en un conjunto de partículas (posición + color).
//
// A diferencia de un umbral binario (silueta plana), aquí cada píxel aporta:
//  - densidad: cuánta "tinta" tiene (alfa, oscuridad o color) + refuerzo en bordes
//  - color: el color real del píxel y qué tan "colorido" es (para adaptar los
//    tonos neutros al tema claro/oscuro en el shader)
//
// Las coordenadas quedan normalizadas en [-1, 1], independientes del tamaño del
// canvas, así que un cambio de tamaño de pantalla no obliga a recalcular nada.

const FIT = 0.84; // fracción del canvas que ocupa la imagen (deja margen para el movimiento)
const PROBE_SIZE = 256; // resolución de la pasada rápida para recortar márgenes vacíos
export const MAX_SOURCE_SIZE = 1280; // las imágenes mayores se reducen antes de analizarlas
const EDGE_BOOST = 1.5; // partículas extra en los contornos (más nitidez)
const MIN_ALPHA = 0.2;
const MIN_INK = 0.04; // por debajo de esto un tono neutro se considera "papel"

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

async function loadImage(src) {
  const img = new Image();
  img.decoding = "async";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
  // Decodificar fuera del hilo principal: algunas imágenes son de 3840x2160 y
  // decodificarlas al dibujarlas provocaría tirones en la animación
  if (img.decode) await img.decode().catch(() => {});

  // Reducir las imágenes enormes también fuera del hilo principal
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest > MAX_SOURCE_SIZE && window.createImageBitmap) {
    const k = MAX_SOURCE_SIZE / longest;
    try {
      return await createImageBitmap(img, {
        resizeWidth: Math.round(img.naturalWidth * k),
        resizeHeight: Math.round(img.naturalHeight * k),
        resizeQuality: "high",
      });
    } catch {
      // Navegador sin soporte de opciones: se usa la imagen original
    }
  }
  return img;
}

const sourceWidth = (source) => source.naturalWidth ?? source.width;
const sourceHeight = (source) => source.naturalHeight ?? source.height;

function createContext(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

// Peso (0-1) de un píxel y cuán colorido es (0 = neutro, 1 = color pleno)
function analyzePixels(data, cells) {
  const weight = new Float32Array(cells);
  const colorful = new Float32Array(cells);
  const lum = new Float32Array(cells);

  for (let i = 0; i < cells; i++) {
    const o = i * 4;
    const alpha = data[o + 3] / 255;
    if (alpha < MIN_ALPHA) continue;

    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const ink = 1 - luminance;

    const c = smoothstep(0.1, 0.3, (max - min) / 255);
    const mono = ink < MIN_INK ? 0 : Math.pow(ink, 0.7);

    weight[i] = alpha * Math.max(c, mono);
    colorful[i] = c;
    lum[i] = luminance * alpha;
  }

  return { weight, colorful, lum };
}

// Caja que contiene el dibujo real (muchas imágenes traen márgenes transparentes enormes)
function findContentBox(img, makeContext) {
  const width = sourceWidth(img);
  const height = sourceHeight(img);
  const scale = Math.min(1, PROBE_SIZE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const ctx = makeContext(w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const { weight } = analyzePixels(ctx.getImageData(0, 0, w, h).data, w * h);

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (weight[y * w + x] > 0.08) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  // Un píxel de margen y de vuelta a coordenadas de la imagen original
  const sx = Math.max(0, (minX - 1) / scale);
  const sy = Math.max(0, (minY - 1) / scale);
  const ex = Math.min(width, (maxX + 2) / scale);
  const ey = Math.min(height, (maxY + 2) / scale);
  return { sx, sy, sw: ex - sx, sh: ey - sy };
}

/**
 * Genera `count` partículas a partir de una imagen ya cargada (<img> o
 * ImageBitmap). Es síncrona y pesada: se ejecuta en un Web Worker siempre que
 * se puede (ver sampleImage). `makeContext` crea el canvas 2D de trabajo
 * (OffscreenCanvas dentro del worker).
 * Devuelve null si la imagen no tiene contenido utilizable.
 *
 * positions: Int16Array normalizado (x, y) en [-1, 1]
 * colors:    Uint8Array (r, g, b, colorido)
 * spacing:   separación media entre partículas en zonas llenas (unidades normalizadas)
 */
export function sampleSource(img, count, makeContext = createContext) {
  const box = findContentBox(img, makeContext);
  if (!box) return null;

  // Rejilla de análisis proporcional al número de partículas
  const gridMax = Math.max(220, Math.min(440, Math.round(Math.sqrt(count) * 1.15)));
  const gridScale = gridMax / Math.max(box.sw, box.sh);
  const gw = Math.max(2, Math.round(box.sw * gridScale));
  const gh = Math.max(2, Math.round(box.sh * gridScale));
  const cells = gw * gh;

  const ctx = makeContext(gw, gh);
  ctx.drawImage(img, box.sx, box.sy, box.sw, box.sh, 0, 0, gw, gh);
  const data = ctx.getImageData(0, 0, gw, gh).data;
  const { weight, colorful, lum } = analyzePixels(data, cells);

  // Densidad = peso reforzado en los bordes (de forma y de tono)
  const density = new Float32Array(cells);
  let total = 0;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      const w = weight[i];
      if (w <= 0) continue;

      const l = x > 0 ? i - 1 : -1;
      const r = x < gw - 1 ? i + 1 : -1;
      const u = y > 0 ? i - gw : -1;
      const d = y < gh - 1 ? i + gw : -1;

      const wx = (r < 0 ? 0 : weight[r]) - (l < 0 ? 0 : weight[l]);
      const wy = (d < 0 ? 0 : weight[d]) - (u < 0 ? 0 : weight[u]);
      const lx = (r < 0 ? 0 : lum[r]) - (l < 0 ? 0 : lum[l]);
      const ly = (d < 0 ? 0 : lum[d]) - (u < 0 ? 0 : lum[u]);
      const edge = Math.min(1, (Math.hypot(wx, wy) + 0.6 * Math.hypot(lx, ly)) * 1.5);

      const value = w * (1 + EDGE_BOOST * edge);
      density[i] = value;
      total += value;
    }
  }
  if (total <= 0) return null;

  // Reparto estratificado: cada celda recibe partículas en proporción a su
  // densidad (mucho más uniforme y nítido que un muestreo puramente aleatorio)
  const capacity = Math.ceil(count * 1.1) + 64;
  const tmpX = new Float32Array(capacity);
  const tmpY = new Float32Array(capacity);
  const tmpCell = new Uint32Array(capacity);
  const perCell = count / total;
  let emitted = 0;

  for (let i = 0; i < cells && emitted < capacity; i++) {
    const value = density[i];
    if (value <= 0) continue;
    const expected = value * perCell;
    let n = Math.floor(expected);
    if (Math.random() < expected - n) n++;
    const cx = i % gw;
    const cy = (i - cx) / gw;
    for (let k = 0; k < n && emitted < capacity; k++) {
      tmpX[emitted] = cx + Math.random();
      tmpY[emitted] = cy + Math.random();
      tmpCell[emitted] = i;
      emitted++;
    }
  }
  if (emitted === 0) return null;

  // Orden aleatorio: cualquier prefijo del buffer es una muestra uniforme de la
  // imagen, lo que permite dibujar menos partículas sin perder la forma
  const order = new Uint32Array(emitted);
  for (let i = 0; i < emitted; i++) order[i] = i;
  for (let i = emitted - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }

  const positions = new Int16Array(count * 2);
  const colors = new Uint8Array(count * 4);
  const scale = (2 * FIT) / Math.max(gw, gh);

  for (let i = 0; i < count; i++) {
    let px;
    let py;
    let cell;
    if (i < emitted) {
      const j = order[i];
      px = tmpX[j];
      py = tmpY[j];
      cell = tmpCell[j];
    } else {
      // Faltaron partículas: se repite una celda al azar con otra posición interna
      cell = tmpCell[Math.floor(Math.random() * emitted)];
      const cx = cell % gw;
      px = cx + Math.random();
      py = (cell - cx) / gw + Math.random();
    }

    positions[i * 2] = Math.round((px - gw / 2) * scale * 32767);
    positions[i * 2 + 1] = Math.round((gh / 2 - py) * scale * 32767);

    const o = cell * 4;
    colors[i * 4] = data[o];
    colors[i * 4 + 1] = data[o + 1];
    colors[i * 4 + 2] = data[o + 2];
    colors[i * 4 + 3] = Math.round(colorful[cell] * 255);
  }

  return {
    count,
    positions,
    colors,
    spacing: Math.sqrt(total / count) * scale,
  };
}

// ---------- Web Worker ----------
// El análisis se hace en un worker para no bloquear la página. Si el navegador
// no lo permite (sin Worker u OffscreenCanvas) o el worker falla, se usa el
// hilo principal como antes.

let worker = null;
let workerBroken = false;
let requestId = 0;
const pending = new Map();

function failPending(error) {
  for (const { reject } of pending.values()) reject(error);
  pending.clear();
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./particleSampler.worker.js", import.meta.url), { type: "module" });
  worker.onmessage = ({ data: { id, result, error } }) => {
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id);
    if (error) request.reject(new Error(error));
    else request.resolve(result);
  };
  worker.onerror = () => {
    workerBroken = true;
    failPending(new Error("El worker de partículas no está disponible"));
  };
  return worker;
}

function sampleInWorker(src, count) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    pending.set(id, { resolve, reject });
    // En el worker las rutas relativas no se resuelven igual que en la página
    getWorker().postMessage({ id, url: new URL(src, document.baseURI).href, count });
  });
}

const canUseWorker = () =>
  !workerBroken && typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";

/** Genera `count` partículas a partir de la imagen `src` (ver sampleSource) */
export async function sampleImage(src, count) {
  if (canUseWorker()) {
    try {
      return await sampleInWorker(src, count);
    } catch {
      // Se reintenta en el hilo principal
    }
  }
  const img = await loadImage(src);
  return sampleSource(img, count);
}
