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

// Imagen a mostrar: la del elemento activo (skill, curso...) tiene prioridad;
// si no hay, la de hover/toque o el logo por defecto
function resolveImage(activeImageId, isHovering) {
  if (activeImageId) {
    return particleImages.find((img) => img.id === activeImageId) ?? hoverImage;
  }
  return isHovering ? hoverImage : defaultImage;
}

export default function ParticleLogo({ activeImageId = null }) {
  const canvasHolderRef = useRef(null);
  const engineRef = useRef(null);
  const targetsCache = useRef(new Map());
  const requestRef = useRef(0);

  const [engineReady, setEngineReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { theme } = useTheme();
  const image = resolveImage(activeImageId, isHovering);

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
  }, []);

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
      if (targets) engine.setTarget(targets);
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
    let timer = setTimeout(() => (handle = idle(next)), 2500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelIdle(handle);
    };
  }, [engineReady, getTargets]);

  // ---------- Interacción ----------

  const handlePointerEnter = (e) => {
    if (e.pointerType === "mouse") setIsHovering(true);
  };

  const handlePointerMove = (e) => {
    engineRef.current?.movePointer(e.clientX, e.clientY);
  };

  const handlePointerDown = (e) => {
    const engine = engineRef.current;
    engine?.movePointer(e.clientX, e.clientY);
    engine?.pulse(e.clientX, e.clientY);
    // En táctil no existe hover: cada toque alterna entre logo y dragón
    if (e.pointerType !== "mouse") setIsHovering((value) => !value);
    setHasInteracted(true);
  };

  const handlePointerEnd = (e) => {
    if (e.pointerType !== "mouse") engineRef.current?.releasePointer();
  };

  const handlePointerLeave = (e) => {
    engineRef.current?.releasePointer();
    if (e.pointerType === "mouse") {
      setIsHovering(false);
      setHasInteracted(true);
    }
  };

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
      role="img"
      aria-label={`${image.name} — interactive particle logo`}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onPointerLeave={handlePointerLeave}
    >
      <div ref={canvasHolderRef} className="particle-canvas" />
      <p className={`particle-hint${hasInteracted ? " hidden" : ""}`} aria-hidden="true">
        <span className="particle-hint-mouse">Hover &amp; click</span>
        <span className="particle-hint-touch">Tap &amp; drag</span>
      </p>
    </div>
  );
}
