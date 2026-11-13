// particleEngine.js
// Motor de partículas sobre WebGL (three.js).
//
// Toda la animación por partícula (transición entre imágenes, flotación,
// repulsión del puntero y ondas de clic) se calcula en el vertex shader.
// La CPU solo actualiza unos pocos uniforms por frame; los buffers se tocan
// únicamente cuando cambia la imagen destino.

import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  DynamicDrawUsage,
  NormalBlending,
  Points,
  Scene,
  ShaderMaterial,
  Sphere,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from "three";

// --- Transición entre imágenes (compartido entre JS y GLSL) ---
const STAGGER = 0.55; // desfase entre partículas: no llegan todas a la vez
const SCATTER = 0.09; // desvío lateral a mitad de vuelo
const MORPH_DURATION = 1.0; // segundos
const ENTRY_DURATION = 1.7;

// --- Movimiento ---
const FLOAT_AMPLITUDE = 0.0035;
const FLOAT_SPEED = 0.45;
const MOUSE_RADIUS = 0.3;
const MOUSE_PUSH = 0.45; // < 0.5 para que las partículas no se crucen entre sí
const PULSE_COUNT = 3;
const PULSE_LIFE = 1.5;
const PULSE_SPEED = 1.35;
const PULSE_WIDTH = 0.14;
const PULSE_AMPLITUDE = 0.15;

// --- Tamaño / calidad ---
const SIZE_FACTOR = 2.3; // diámetro del punto respecto a la separación media
const MIN_POINT_SIZE = 1.8; // px de dispositivo
const MAX_POINT_SIZE = 9;
const DRAW_DENSITY = 0.5; // partículas por px² (de dispositivo) del lado menor
const MIN_DRAW_COUNT = 20000;
const SLOW_FRAME_MS = 26;
const SLOW_FRAMES_TO_DOWNGRADE = 90;
const MIN_QUALITY = 0.5;

const THEMES = {
  dark: { fg: [1, 1, 1], bg: [0.039, 0.039, 0.039], dark: 1 },
  light: { fg: [0.04, 0.04, 0.04], bg: [0.96, 0.96, 0.96], dark: 0 },
};

const glsl = (n) => n.toFixed(5);

const vertexShader = /* glsl */ `
  attribute vec2 aFrom;
  attribute vec4 aColorFrom;
  attribute vec4 aColorTo;
  attribute vec4 aSeed; // x: retraso, y: fase, z: tamaño/velocidad, w: ángulo

  uniform float uProgress;
  uniform float uTime;
  uniform float uPointSize;
  uniform float uFloat;
  uniform float uScatter;
  uniform float uOpacity;
  uniform float uDark;
  uniform float uMouseStrength;
  uniform vec2 uMouse;
  uniform vec2 uScale;
  uniform vec3 uFg;
  uniform vec3 uBg;
  uniform vec4 uPulses[${PULSE_COUNT}];

  varying vec3 vColor;
  varying float vAlpha;
  varying float vEdge;

  const float PI = 3.14159265;
  const float TAU = 6.2831853;

  void main() {
    // Progreso individual: cada partícula sale con un pequeño retraso
    float t = clamp(uProgress * ${glsl(1 + STAGGER)} - aSeed.x * ${glsl(STAGGER)}, 0.0, 1.0);
    float e = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(2.0 - 2.0 * t, 3.0) * 0.5;
    float arc = sin(t * PI);

    float ang = aSeed.w * TAU;
    vec2 p = mix(aFrom, position.xy, e);
    p += vec2(cos(ang), sin(ang)) * arc * uScatter * (0.35 + aSeed.z);

    // Flotación suave
    float ft = uTime * ${glsl(FLOAT_SPEED)} * (0.6 + aSeed.z * 0.8) + aSeed.y * 50.0;
    p += vec2(cos(ft) * 0.6, sin(ft * 1.1)) * uFloat;

    // Repulsión alrededor del puntero
    vec2 toMouse = p - uMouse;
    float md = length(toMouse);
    float mf = 1.0 - smoothstep(0.0, ${glsl(MOUSE_RADIUS)}, md);
    vec2 offset = (toMouse / (md + 0.0001)) * mf * mf * ${glsl(MOUSE_RADIUS * MOUSE_PUSH)} * uMouseStrength;

    // Ondas expansivas de clic / toque
    for (int i = 0; i < ${PULSE_COUNT}; i++) {
      vec4 pulse = uPulses[i];
      float age = uTime - pulse.z;
      if (age > 0.0 && age < ${glsl(PULSE_LIFE)}) {
        vec2 dir = p - pulse.xy;
        float dist = length(dir);
        float band = (dist - age * ${glsl(PULSE_SPEED)}) / ${glsl(PULSE_WIDTH)};
        float fade = 1.0 - age / ${glsl(PULSE_LIFE)};
        offset += (dir / (dist + 0.0001)) * exp(-band * band) * fade * fade * pulse.w * ${glsl(PULSE_AMPLITUDE)};
      }
    }
    p += offset;

    // Color: los tonos neutros (negros/grises) toman el color del tema y
    // conservan su sombreado; los píxeles con color conservan el suyo
    vec4 c = mix(aColorFrom, aColorTo, e);
    float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 mono = mix(uBg, uFg, clamp((1.0 - lum) * 1.15, 0.0, 1.0));
    vec3 col = c.rgb;
    // Contraste según el tema: aclarar los muy oscuros / oscurecer los muy claros
    col = mix(col, mix(col, vec3(1.0), 0.3), uDark * (1.0 - smoothstep(0.05, 0.3, lum)));
    col *= 1.0 - 0.3 * (1.0 - uDark) * smoothstep(0.55, 0.9, lum);
    vColor = mix(mono, col, c.a);

    vAlpha = uOpacity * (0.85 + 0.15 * aSeed.y) * (1.0 - 0.3 * arc);

    float size = uPointSize * (0.8 + 0.45 * aSeed.z);
    gl_PointSize = size;
    vEdge = clamp(1.0 - 2.5 / size, 0.4, 0.8); // ~1px de borde suavizado
    gl_Position = vec4(p * uScale, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vEdge;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = (1.0 - smoothstep(vEdge, 1.0, d)) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) * 0.5);
const toInt16 = (v) => Math.max(-32767, Math.min(32767, Math.round(v * 32767)));

/** Ajusta número de partículas y resolución a la capacidad del dispositivo */
export function detectQuality() {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const memory = navigator.deviceMemory ?? 8;
  const lowEnd = coarse || cores <= 4 || memory < 4;

  return {
    count: lowEnd ? 60000 : 140000,
    maxPixelRatio: lowEnd ? 1.5 : 2,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

export class ParticleEngine {
  constructor(container, { count, maxPixelRatio, reducedMotion }) {
    this.container = container;
    this.count = count;
    this.maxPixelRatio = maxPixelRatio;
    this.reducedMotion = reducedMotion;

    this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.canvas = this.renderer.domElement;
    container.appendChild(this.canvas);

    // Buffers: 12 bytes por partícula en total
    this.to = new Int16Array(count * 2);
    this.from = new Int16Array(count * 2);
    this.colorTo = new Uint8Array(count * 4);
    this.colorFrom = new Uint8Array(count * 4);
    this.seed = new Uint8Array(count * 4);
    for (let i = 0; i < this.seed.length; i++) this.seed[i] = Math.floor(Math.random() * 256);

    // Tabla de direcciones para replicar en JS el desvío del shader
    this.cosTable = new Float32Array(256);
    this.sinTable = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const angle = (i / 255) * Math.PI * 2;
      this.cosTable[i] = Math.cos(angle);
      this.sinTable[i] = Math.sin(angle);
    }

    const dynamic = (array, itemSize) => {
      const attribute = new BufferAttribute(array, itemSize, true);
      attribute.setUsage(DynamicDrawUsage);
      return attribute;
    };

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute("position", dynamic(this.to, 2));
    this.geometry.setAttribute("aFrom", dynamic(this.from, 2));
    this.geometry.setAttribute("aColorTo", dynamic(this.colorTo, 4));
    this.geometry.setAttribute("aColorFrom", dynamic(this.colorFrom, 4));
    this.geometry.setAttribute("aSeed", new BufferAttribute(this.seed, 4, true));
    this.geometry.setDrawRange(0, 0);
    // Las posiciones reales se calculan en el shader: se fija un volumen
    // envolvente para que three.js no intente deducirlo de los buffers
    this.geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), 2);

    this.pulses = Array.from({ length: PULSE_COUNT }, () => new Vector4(0, 0, -1000, 0));
    this.pulseIndex = 0;

    this.uniforms = {
      uProgress: { value: 1 },
      uTime: { value: 0 },
      uPointSize: { value: 2 },
      uFloat: { value: reducedMotion ? 0 : FLOAT_AMPLITUDE },
      uScatter: { value: reducedMotion ? 0 : SCATTER },
      uOpacity: { value: 0 },
      uDark: { value: 1 },
      uMouseStrength: { value: 0 },
      uMouse: { value: new Vector2(0, 0) },
      uScale: { value: new Vector2(1, 1) },
      uFg: { value: new Vector3(1, 1, 1) },
      uBg: { value: new Vector3(0, 0, 0) },
      uPulses: { value: this.pulses },
    };

    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: NormalBlending,
    });

    this.points = new Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.scene = new Scene();
    this.scene.add(this.points);
    this.camera = new Camera();

    // Estado
    this.progress = 1;
    this.duration = MORPH_DURATION;
    this.spacingFrom = 0.004;
    this.spacingTo = 0.004;
    this.hasTarget = false;
    this.time = 0;
    this.lastFrame = 0;
    this.visible = true;
    this.running = false;
    this.rafId = 0;
    this.minDimPx = 1;
    this.baseDrawCount = MIN_DRAW_COUNT;
    this.quality = 1;
    this.slowFrames = 0;
    this.frameMs = 16;
    this.warmup = 0;
    this.pointerActive = false;
    this.pointerTarget = new Vector2(0, 0);

    this.frame = this.frame.bind(this);
    this.onContextLost = (event) => event.preventDefault();
    this.canvas.addEventListener("webglcontextlost", this.onContextLost);

    this.setTheme("dark");
  }

  // ---------- Configuración ----------

  setSize(width, height) {
    if (width < 1 || height < 1) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);

    const minDim = Math.min(width, height);
    this.minDimPx = minDim * pixelRatio;
    this.uniforms.uScale.value.set(minDim / width, minDim / height);
    this.baseDrawCount = Math.max(
      Math.min(MIN_DRAW_COUNT, this.count),
      Math.min(this.count, Math.round(DRAW_DENSITY * this.minDimPx * this.minDimPx))
    );
    // Redibujar ya: cambiar el tamaño limpia el canvas y se vería un parpadeo
    if (this.hasTarget) this.draw();
  }

  setTheme(theme) {
    const palette = THEMES[theme] ?? THEMES.dark;
    this.uniforms.uFg.value.set(...palette.fg);
    this.uniforms.uBg.value.set(...palette.bg);
    this.uniforms.uDark.value = palette.dark;
    this.renderOnce();
  }

  setVisible(visible) {
    this.visible = visible;
    if (visible) this.start();
    else this.stop();
  }

  // ---------- Imagen destino ----------

  setTarget(target) {
    if (!target || target.count !== this.count) return;

    if (!this.hasTarget) {
      // Entrada: las partículas llegan desde una nube dispersa
      this.hasTarget = true;
      if (this.reducedMotion) {
        this.from.set(target.positions);
      } else {
        for (let i = 0; i < this.count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.25 + Math.sqrt(Math.random()) * 0.75;
          this.from[i * 2] = toInt16(Math.cos(angle) * radius);
          this.from[i * 2 + 1] = toInt16(Math.sin(angle) * radius);
        }
      }
      this.colorFrom.set(target.colors);
      this.spacingFrom = target.spacing;
      this.duration = ENTRY_DURATION;
    } else {
      this.bakeCurrentState();
      this.duration = MORPH_DURATION;
    }

    this.to.set(target.positions);
    this.colorTo.set(target.colors);
    this.spacingTo = target.spacing;
    this.progress = this.reducedMotion ? 1 : 0;

    const { position, aFrom, aColorTo, aColorFrom } = this.geometry.attributes;
    position.needsUpdate = true;
    aFrom.needsUpdate = true;
    aColorTo.needsUpdate = true;
    aColorFrom.needsUpdate = true;

    this.start();
  }

  // Congela el estado visible actual como punto de partida de la siguiente
  // transición (misma fórmula que el vertex shader), para poder interrumpir
  // una transición a medias sin saltos
  bakeCurrentState() {
    const { from, to, colorFrom, colorTo, seed, count } = this;
    this.spacingFrom = this.currentSpacing();

    if (this.progress >= 1) {
      from.set(to);
      colorFrom.set(colorTo);
      return;
    }

    const scatter = this.uniforms.uScatter.value / 255;
    const head = this.progress * (1 + STAGGER);
    for (let i = 0; i < count; i++) {
      const s = i * 4;
      const t = Math.max(0, Math.min(1, head - (seed[s] / 255) * STAGGER));
      if (t <= 0) continue;
      const e = easeInOutCubic(t);
      const push = Math.sin(t * Math.PI) * scatter * (0.35 * 255 + seed[s + 2]) * 32767;
      const dir = seed[s + 3];

      const p = i * 2;
      const x = from[p] + (to[p] - from[p]) * e + this.cosTable[dir] * push;
      const y = from[p + 1] + (to[p + 1] - from[p + 1]) * e + this.sinTable[dir] * push;
      from[p] = Math.max(-32767, Math.min(32767, Math.round(x)));
      from[p + 1] = Math.max(-32767, Math.min(32767, Math.round(y)));

      colorFrom[s] += (colorTo[s] - colorFrom[s]) * e;
      colorFrom[s + 1] += (colorTo[s + 1] - colorFrom[s + 1]) * e;
      colorFrom[s + 2] += (colorTo[s + 2] - colorFrom[s + 2]) * e;
      colorFrom[s + 3] += (colorTo[s + 3] - colorFrom[s + 3]) * e;
    }
  }

  currentSpacing() {
    const e = easeInOutCubic(this.progress);
    return this.spacingFrom + (this.spacingTo - this.spacingFrom) * e;
  }

  // ---------- Interacción ----------

  toLocal(clientX, clientY, out) {
    const { left, top, width, height } = this.canvas.getBoundingClientRect();
    const scale = this.uniforms.uScale.value;
    out.set(
      (((clientX - left) / width) * 2 - 1) / scale.x,
      -(((clientY - top) / height) * 2 - 1) / scale.y
    );
    return out;
  }

  movePointer(clientX, clientY) {
    if (this.reducedMotion) return;
    this.toLocal(clientX, clientY, this.pointerTarget);
    if (!this.pointerActive) {
      this.pointerActive = true;
      // Si el efecto estaba apagado, aparecer directamente bajo el puntero
      if (this.uniforms.uMouseStrength.value < 0.02) {
        this.uniforms.uMouse.value.copy(this.pointerTarget);
      }
    }
  }

  releasePointer() {
    this.pointerActive = false;
  }

  pulse(clientX, clientY) {
    if (this.reducedMotion) return;
    const pulse = this.pulses[this.pulseIndex];
    this.pulseIndex = (this.pulseIndex + 1) % PULSE_COUNT;
    const local = this.toLocal(clientX, clientY, new Vector2());
    pulse.set(local.x, local.y, this.time, 1);
  }

  // ---------- Bucle ----------

  start() {
    if (this.running || !this.visible || !this.hasTarget) return;
    this.running = true;
    this.lastFrame = 0;
    this.warmup = 0;
    this.slowFrames = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  frame(now) {
    if (!this.running) return;
    const elapsed = this.lastFrame ? now - this.lastFrame : 16.7;
    this.lastFrame = now;
    const dt = Math.min(elapsed, 50) / 1000;

    this.time += dt;
    this.progress = Math.min(1, this.progress + dt / this.duration);

    const u = this.uniforms;
    u.uTime.value = this.time;
    u.uProgress.value = this.progress;
    u.uOpacity.value = Math.min(1, u.uOpacity.value + dt / 0.6);

    // Puntero suavizado (independiente del framerate)
    const strengthTarget = this.pointerActive ? 1 : 0;
    u.uMouseStrength.value += (strengthTarget - u.uMouseStrength.value) * (1 - Math.exp(-dt * 7));
    u.uMouse.value.lerp(this.pointerTarget, 1 - Math.exp(-dt * 20));

    this.updateQuality(elapsed);
    this.draw();
    this.rafId = requestAnimationFrame(this.frame);
  }

  // Si el dispositivo no mantiene el ritmo, se dibujan menos partículas
  // (más grandes, para conservar la cobertura) en lugar de perder fluidez
  updateQuality(elapsed) {
    if (this.warmup < 60) {
      this.warmup++;
      return;
    }
    this.frameMs += (Math.min(elapsed, 100) - this.frameMs) * 0.1;
    if (this.frameMs > SLOW_FRAME_MS) this.slowFrames++;
    else this.slowFrames = Math.max(0, this.slowFrames - 2);

    if (this.slowFrames > SLOW_FRAMES_TO_DOWNGRADE && this.quality > MIN_QUALITY) {
      this.quality = Math.max(MIN_QUALITY, this.quality * 0.7);
      this.slowFrames = 0;
      this.frameMs = 16;
    }
  }

  draw() {
    const drawCount = Math.max(1, Math.floor(this.baseDrawCount * this.quality));
    this.geometry.setDrawRange(0, drawCount);

    const spacingPx = this.currentSpacing() * (this.minDimPx / 2) * Math.sqrt(this.count / drawCount);
    this.uniforms.uPointSize.value = Math.max(
      MIN_POINT_SIZE,
      Math.min(MAX_POINT_SIZE, spacingPx * SIZE_FACTOR)
    );

    this.renderer.render(this.scene, this.camera);
  }

  // Redibuja un frame aunque el bucle esté en pausa (p. ej. cambio de tema)
  renderOnce() {
    if (this.hasTarget && !this.running) this.draw();
  }

  dispose() {
    this.stop();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
