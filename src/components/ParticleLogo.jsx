// ParticleLogo.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  particleImages,
  DEFAULT_IMAGE_INDEX,
  HOVER_IMAGE_INDEX,
} from "../data/particleImages";
import { ParticleEngine, detectQuality } from "../utils/particleEngine";
import { sampleImage } from "../utils/particleSampler";
import "../styles/ParticleLogo.css";

const defaultImage = particleImages[DEFAULT_IMAGE_INDEX];
const hoverImage = particleImages[HOVER_IMAGE_INDEX];

const findImage = (id) => particleImages.find((img) => img.id === id);

// Duración de la entrada (s). El resto de la página anima en paralelo
// (onEntryStart) y termina a la vez que las partículas
export const ENTRY_DURATION_S = 1;
// Si el navegador no logra completar la entrada, la página aparece igualmente
const ENTRY_FALLBACK_MS = 5000;
// Al salir de un elemento se espera un instante antes de volver al logo: si el
// puntero pasa directo a otro elemento, no hay un viaje intermedio al logo
const RELEASE_DELAY_MS = 70;

// Imagen a mostrar, por prioridad: elemento bajo el puntero (skill, curso,
// foto...), la imagen fijada con clic y, por último, el logo por defecto
function resolveImage(activeImageId, pinnedImageId) {
  if (activeImageId) return findImage(activeImageId) ?? hoverImage;
  if (pinnedImageId) return findImage(pinnedImageId) ?? defaultImage;
  return defaultImage;
}

export default function ParticleLogo({
  activeImageId = null,
  pinnedImageId = null,
  onEntryStart,
  onEntered,
}) {
  const canvasHolderRef = useRef(null);
  const engineRef = useRef(null);
  const targetsCache = useRef(new Map());
  const requestRef = useRef(0);
  const onEnteredRef = useRef(onEntered);
  onEnteredRef.current = onEntered;
  const onEntryStartRef = useRef(onEntryStart);
  onEntryStartRef.current = onEntryStart;

  const [engineReady, setEngineReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // Mientras las partículas forman el logo se ignoran los hovers/clics de la
  // página: cambiar de imagen a mitad de la entrada la rompía
  const [entryDone, setEntryDone] = useState(false);

  const { theme } = useTheme();
  const wanted = entryDone ? resolveImage(activeImageId, pinnedImageId) : defaultImage;
  const [image, setImage] = useState(wanted);

  // Entrar a un elemento cambia la imagen al instante; salir de él espera un
  // momento por si el puntero pasa directamente a otro elemento
  useEffect(() => {
    if (wanted.id === image.id) return;
    if (activeImageId) {
      setImage(wanted);
      return;
    }
    const timer = setTimeout(() => setImage(wanted), RELEASE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [wanted, image.id, activeImageId]);

  // Avisar a la página cuando las partículas terminaron de formarse
  const finishEntry = useCallback(() => {
    setEntryDone(true);
    onEnteredRef.current?.();
  }, []);

  // Sin WebGL o si la entrada no llega a arrancar, la página aparece igualmente
  useEffect(() => {
    if (entryDone) return;
    if (failed) {
      onEntryStartRef.current?.(0);
      finishEntry();
      return;
    }
    const timer = setTimeout(() => {
      onEntryStartRef.current?.(0);
      finishEntry();
    }, ENTRY_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [failed, entryDone, finishEntry]);

  // Partículas de una imagen, calculadas una sola vez y reutilizadas
  const getTargets = useCallback((img, count) => {
    const key = `${img.id}:${count}`;
    const cache = targetsCache.current;
    if (!cache.has(key)) {
      cache.set(
        key,
        sampleImage(img.path, count).catch((err) => {
          console.error("Error cargando imagen de partículas:", err);
          cache.delete(key);
          return null;
        })
      );
    }
    return cache.get(key);
  }, []);

  // Motor WebGL: se crea una sola vez; tamaño, tema e imagen se actualizan
  // sin reconstruir la escena
  useEffect(() => {
    const holder = canvasHolderRef.current;
    if (!holder) return;

    let engine;
    try {
      engine = new ParticleEngine(holder, detectQuality());
    } catch (err) {
      console.error("WebGL no disponible para el logo de partículas:", err);
      setFailed(true);
      return;
    }
    engine.onEntryStart = (duration) => onEntryStartRef.current?.(duration);
    engine.onEntryComplete = finishEntry;
    engineRef.current = engine;
    setEngineReady(true);

    const resizeObserver = new ResizeObserver(([entry]) => {
      engine.setSize(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(holder);

    // No gastar GPU cuando el logo no está en pantalla
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      engine.setVisible(entry.isIntersecting);
    });
    intersectionObserver.observe(holder);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      engine.dispose();
      engineRef.current = null;
      setEngineReady(false);
    };
  }, [finishEntry]);

  useEffect(() => {
    if (engineReady) engineRef.current?.setTheme(theme);
  }, [theme, engineReady]);

  // Cambio de imagen: solo se aplica la petición más reciente
  useEffect(() => {
    const engine = engineRef.current;
    if (!engineReady || !engine) return;

    const request = ++requestRef.current;
    getTargets(image, engine.count).then((targets) => {
      if (request !== requestRef.current || engineRef.current !== engine) return;
      if (!targets) return;
      // Solo la 1.ª llamada usa la duración de entrada
      engine.setTarget(targets, ENTRY_DURATION_S);
    });
  }, [image, engineReady, getTargets]);

  // Precarga en segundo plano del resto de imágenes, de una en una, para que
  // el primer hover sobre cada skill responda al instante
  useEffect(() => {
    const engine = engineRef.current;
    if (!engineReady || !engine) return;

    let cancelled = false;
    let handle = 0;
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 200));
    const cancelIdle = window.cancelIdleCallback ?? clearTimeout;
    const queue = [hoverImage, ...particleImages];

    const next = () => {
      if (cancelled) return;
      const img = queue.shift();
      if (!img) return;
      getTargets(img, engine.count).then(() => {
        if (!cancelled) timer = setTimeout(() => (handle = idle(next)), 150);
      });
    };
    // Esperar a que termine la animación de entrada para no restarle fluidez
    let timer = setTimeout(() => (handle = idle(next)), ENTRY_DURATION_S * 1000 + 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelIdle(handle);
    };
  }, [engineReady, getTargets]);

  // ---------- Interacción ----------

  const handlePointerMove = (e) => {
    engineRef.current?.movePointer(e.clientX, e.clientY);
  };

  const handlePointerDown = (e) => {
    const engine = engineRef.current;
    engine?.movePointer(e.clientX, e.clientY);
    engine?.pulse(e.clientX, e.clientY);
  };

  const handlePointerEnd = (e) => {
    if (e.pointerType !== "mouse") engineRef.current?.releasePointer();
  };

  const handlePointerLeave = () => engineRef.current?.releasePointer();

  if (failed) {
    return (
      <div className="particle-logo-container">
        <img
          className="particle-fallback"
          src={defaultImage.path}
          alt={defaultImage.name}
        />
      </div>
    );
  }

  return (
    <div
      className="particle-logo-container"
      data-particle-trigger
      role="img"
      aria-label={`${image.name} — interactive particle logo`}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerLeave}
    >
      <div ref={canvasHolderRef} className="particle-canvas" />
      <p className="particle-hint" aria-hidden="true">
        <span className="particle-hint-mouse">Hover &amp; click</span>
        <span className="particle-hint-touch">Tap &amp; drag</span>
      </p>
    </div>
  );
}
