// ParticleLogo.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useTheme } from "../context/ThemeContext";
import { particleImages } from "../data/particleImages";
import "../styles/ParticleLogo.css";

const MAX_CANVAS_SIZE = 500;
const SAMPLE_STEP = 1;
const PARTICLE_SIZE = 2;
const FLOAT_AMPLITUDE = 0.5;
const FLOAT_SPEED = 0.4;
const LERP_SPEED = 0.18;
const PARTICLE_COUNT = 150000;

export default function ParticleLogo({ activeImageId = null }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const pointsRef = useRef(null);
  const particlesDataRef = useRef([]);
  const imageTargetsCache = useRef(new Map());
  const animationRef = useRef(null);
  const cameraRef = useRef(null);

  const [isHovering, setIsHovering] = useState(false);
  const [canvasSize, setCanvasSize] = useState(null);

  const { theme } = useTheme();

  // Desestructuramos rutas e ids; active puede cambiar sin forzar recreación
  const imagePaths = useMemo(() => {
    const defaultImg = particleImages[0];
    const hoverImg = particleImages[1];
    const activeImg = activeImageId
      ? particleImages.find((img) => img.id === activeImageId)
      : null;

    return {
      defaultPath: `${defaultImg.path}`,
      hoverPath: `${hoverImg.path}`,
      activePath: activeImg ? `${activeImg.path}` : `${hoverImg.path}`,
      defaultId: defaultImg.id,
      hoverId: hoverImg.id,
      activeId: activeImg?.id || hoverImg.id,
    };
    // deliberately NOT including activeImageId in deps that rebuild the scene
  }, [activeImageId]);

  const { defaultPath, hoverPath, activePath, defaultId, hoverId, activeId } =
    imagePaths;

  // Helper para cargar con cache (usa canvasSize pasado)
  const loadImageWithCache = async (path, id, w, h) => {
    if (!path || !id) return [];
    if (imageTargetsCache.current.has(id)) {
      return imageTargetsCache.current.get(id);
    }
    const targets = await loadImageTargets(path, w, h);
    imageTargetsCache.current.set(id, targets);
    return targets;
  };

  // Canvas responsive
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      const size = Math.min(w, h, MAX_CANVAS_SIZE);
      if (size > 0) setCanvasSize(size);
    };
    requestAnimationFrame(updateCanvasSize);
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // ---------- UseEffect principal: crea ESCENA una sola vez y carga default+hover ----------
  useEffect(() => {
    if (!containerRef.current || !defaultPath || !hoverPath || !canvasSize)
      return;

    // Setup básico
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = canvasSize;
    const height = canvasSize;
    const aspect = width / height;
    const frustum = 300;

    const camera = new THREE.OrthographicCamera(
      (frustum * aspect) / -2,
      (frustum * aspect) / 2,
      frustum / 2,
      frustum / -2,
      -1000,
      1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const container = containerRef.current;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const sprite = generateSprite();
    const particleColor = new THREE.Color(theme === "dark" ? 0xffffff : 0x000);

    // Cargar default y hover (no active)
    let mounted = true;
    Promise.all([
      loadImageWithCache(defaultPath, defaultId, canvasSize, canvasSize),
      loadImageWithCache(hoverPath, hoverId, canvasSize, canvasSize),
      // también pre-cargamos activePath pero no lo usamos para recrear la escena:
      loadImageWithCache(activePath, activeId, canvasSize, canvasSize),
    ])
      .then(([defaultT, hoverT, activeT]) => {
        if (!mounted) return;
        if (!defaultT.length || !hoverT.length) return;

        const particleCount = PARTICLE_COUNT; // Fijo para mejor rendimiento y consistencia

        const normalize = (arr, count) => {
          const out = [...arr];
          while (out.length < count) {
            out.push({ ...arr[Math.floor(Math.random() * arr.length)] });
          }
          return out;
        };

        const def = normalize(defaultT, particleCount);
        const hov = normalize(hoverT, particleCount);
        const act = normalize(activeT.length ? activeT : def, particleCount);

        // Geometría
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        particlesDataRef.current = [];

        for (let i = 0; i < particleCount; i++) {
          pos[i * 3] = def[i].x;
          pos[i * 3 + 1] = def[i].y;
          pos[i * 3 + 2] = def[i].z || 0;

          sizes[i] = PARTICLE_SIZE * (0.9 + Math.random() * 0.5);

          particlesDataRef.current.push({
            def: { x: def[i].x, y: def[i].y, z: def[i].z || 0 },
            hov: { x: hov[i].x, y: hov[i].y, z: hov[i].z || 0 },
            act: { x: act[i].x, y: act[i].y, z: act[i].z || 0 },
            floatOffset: Math.random() * 1000,
            speedFactor: 0.6 + Math.random() * 0.8,
          });
        }

        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

        const mat = new THREE.PointsMaterial({
          map: sprite,
          alphaTest: 0.01,
          transparent: true,
          depthWrite: false,
          size: PARTICLE_SIZE,
          sizeAttenuation: true,
          color: particleColor,
          opacity: 1.0,
        });

        mat.blending =
          theme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending;

        const points = new THREE.Points(geo, mat);
        points.userData = {
          isHovering: false,
          activeImageId: activeImageId,
        };

        pointsRef.current = points;
        scene.add(points);

        // Animación
        const animate = (now) => {
          const pts = pointsRef.current;
          if (!pts || !particlesDataRef.current.length) {
            animationRef.current = requestAnimationFrame(animate);
            return;
          }

          const arr = pts.geometry.attributes.position.array;
          const currentHover = pts.userData.isHovering;
          const currentActiveId = pts.userData.activeImageId;
          const useActive = currentActiveId && currentActiveId !== hoverId;
          const time = now / 1000;

          for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const p = particlesDataRef.current[i];

            const ft = time * FLOAT_SPEED * p.speedFactor + p.floatOffset;
            const fx = Math.cos(ft) * FLOAT_AMPLITUDE * 0.6;
            const fy = Math.sin(ft * 1.1) * FLOAT_AMPLITUDE;
            const fz = Math.sin(ft * 0.7) * (FLOAT_AMPLITUDE * 0.5);

            let target;
            if (useActive) {
              target = p.act;
            } else if (currentHover) {
              target = p.hov;
            } else {
              target = p.def;
            }

            const tx = target.x + fx;
            const ty = target.y + fy;
            const tz = (target.z || 0) + fz;

            // LERP sobre la posición actual de la geometría
            arr[i3] += (tx - arr[i3]) * LERP_SPEED;
            arr[i3 + 1] += (ty - arr[i3 + 1]) * LERP_SPEED;
            arr[i3 + 2] += (tz - arr[i3 + 2]) * LERP_SPEED;
          }

          pts.geometry.attributes.position.needsUpdate = true;
          renderer.render(scene, camera);
          animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
      })
      .catch((err) => {
        console.error("Error cargando imágenes:", err);
      });

    const handleResize = () => {
      if (!rendererRef.current) return;
      const size = canvasSize;
      rendererRef.current.setSize(size, size);
      if (cameraRef.current) {
        const aspectLocal = 1;
        const frustumLocal = 300;
        cameraRef.current.left = (frustumLocal * aspectLocal) / -2;
        cameraRef.current.right = (frustumLocal * aspectLocal) / 2;
        cameraRef.current.top = frustumLocal / 2;
        cameraRef.current.bottom = frustumLocal / -2;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (pointsRef.current) {
        scene.remove(pointsRef.current);
        if (pointsRef.current.geometry) pointsRef.current.geometry.dispose();
        if (pointsRef.current.material) {
          if (pointsRef.current.material.map)
            pointsRef.current.material.map.dispose();
          pointsRef.current.material.dispose();
        }
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement && container.contains(rendererRef.current.domElement))
          container.removeChild(rendererRef.current.domElement);
      }
    };
    // DEPENDENCIAS: no incluir activeImageId ni activePath para evitar reconstrucción al cambiar skill
  }, [theme, defaultPath, hoverPath, defaultId, hoverId, canvasSize]);

  // ---------- UseEffect para CUANDO cambia la imagen ACTIVA: solo actualizar 'act' targets ----------
  useEffect(() => {
    if (!canvasSize) return;
    // Si no hay partículas aún, las targets se aplicarán cuando se inicialice la escena
    const updateActiveTargets = async () => {
      if (!particlesDataRef.current || particlesDataRef.current.length === 0)
        return;

      const activeTargets = await loadImageWithCache(
        activePath,
        activeId,
        canvasSize,
        canvasSize
      );

      if (!activeTargets || activeTargets.length === 0) return;

      // Normalizar longitud al número de partículas
      const count = particlesDataRef.current.length;
      const norm = [...activeTargets];
      while (norm.length < count) {
        norm.push({ ...activeTargets[Math.floor(Math.random() * activeTargets.length)] });
      }

      // Actualizar solo los campos 'act' en particlesDataRef
      for (let i = 0; i < count; i++) {
        const a = norm[i];
        if (!particlesDataRef.current[i]) continue;
        particlesDataRef.current[i].act = { x: a.x, y: a.y, z: a.z || 0 };
      }

      // Actualizar flag en points para que el animate use la nueva activeId
      if (pointsRef.current) pointsRef.current.userData.activeImageId = activeImageId;
    };

    updateActiveTargets();
  }, [activeImageId, activePath, activeId, canvasSize]);

  // Actualizar hover/active flags en pointsRef (no reconstruye la escena)
  useEffect(() => {
    if (pointsRef.current) {
      pointsRef.current.userData.isHovering = isHovering;
      // activeImageId se actualiza en useEffect de arriba tras cargar targets,
      // pero también dejamos esta asignación por si cambia rápidamente
      pointsRef.current.userData.activeImageId = activeImageId;
    }
  }, [isHovering, activeImageId]);

  return (
    <div
      className="particle-logo-container"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div ref={containerRef} className="particle-canvas" />
    </div>
  );
}

// ---------- Helpers -----------------------------------------------------

function drawNormalizedImage(ctx, img, size = 130, padding = 20) {
  const canvasSize = size;
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  const maxDrawable = canvasSize - padding * 2;

  // Medidas reales de la imagen
  const iw = img.width;
  const ih = img.height;

  // Seleccionar escala que permita que entre COMPLETA
  const scale = Math.min(maxDrawable / iw, maxDrawable / ih);

  const drawW = iw * scale;
  const drawH = ih * scale;

  // Centrado perfecto
  const x = (canvasSize - drawW) / 2;
  const y = (canvasSize - drawH) / 2;

  ctx.drawImage(img, x, y, drawW, drawH);
}

function loadImageTargets(src, w, h) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, w, h);

      // 🔥 Normaliza la imagen (centrada + padding + no recortes)
      drawNormalizedImage(ctx, img, w, 20);

      const imgData = ctx.getImageData(0, 0, w, h).data;
      const targets = [];

      const alphaThreshold = 50;
      const brightnessThreshold = 740;

      for (let y = 0; y < h; y += SAMPLE_STEP) {
        for (let x = 0; x < w; x += SAMPLE_STEP) {
          const idx = (y * w + x) * 4;
          const a = imgData[idx + 3];
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];

          if (a > alphaThreshold && r + g + b < brightnessThreshold) {
            const cx = x - w / 2;
            const cy = -(y - h / 2);
            const scale = 1.1;
            const mappedX = cx * (300 / w) * scale;
            const mappedY = cy * (300 / h) * scale;
            targets.push({ x: mappedX, y: mappedY, z: 0 });
          }
        }
      }

      resolve(targets);
    };
    img.onerror = () => resolve([]);
  });
}


function generateSprite() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const grd = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.15, "rgba(255,255,255,0.9)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.65)");
  grd.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
