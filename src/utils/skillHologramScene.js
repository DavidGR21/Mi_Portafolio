// skillHologramScene.js
// Escena three.js de las skills: cada tecnología es un pequeño holograma, con
// un emisor en el suelo, un haz de luz tenue y su logo flotando encima.
//
// En reposo los hologramas son estáticos (el bucle de render se detiene: coste
// cero). Al pasar el cursor el holograma se enciende, recupera sus colores y
// gira en 3D sobre su eje vertical; el seleccionado se queda encendido girando
// despacio.
//
// Un único canvas cubre toda la rejilla. La cámara es ortográfica en píxeles
// CSS y cada botón del DOM (ver SkillHolograms.jsx) define la celda de su
// holograma y recibe la interacción. El giro y la perspectiva se calculan en el
// vertex shader, por holograma, así ninguno se deforma por estar lejos del
// centro del canvas.

import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Mesh,
  NormalBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

const MARGIN = 28; // px que el canvas sobresale de la rejilla

// --- Geometría del holograma (en fracciones del ancho de la celda) ---
const LOGO_QUAD = 1.06; // lado del plano del logo
const LOGO_FILL = 0.6; // parte de la textura que ocupa el logo (el resto es margen para el halo)
const LOGO_CENTER = 0.42; // altura del centro del logo desde el borde superior de la celda (× alto)
const LAYERS = 5; // capas apiladas en profundidad: dan volumen al girar
const DEPTH = 0.1; // grosor total del holograma
const FOCAL = 2.4; // distancia focal de la perspectiva propia de cada holograma
const PAD_Y = 0.13; // altura del emisor desde el borde inferior
const PAD_RX = 0.33;
const PAD_RY = 0.085;

// --- Animación ---
const SPIN_HOVER = 2.9; // rad/s
const SPIN_SELECTED = 1.1;
const SPIN_RETURN = 9; // rigidez del muelle que devuelve el logo de frente
const LIFT = 0.05; // cuánto se eleva el logo encendido
const ENTER_TIME = 0.5;
const ENTER_STAGGER = 0.045;

const TEX = 256;

// Colores (sRGB, tal cual llegan a pantalla) de cada tema
const THEMES = {
  dark: { accent: "#44b4b8", lo: "#3fa7ab", hi: "#d9fdff", dark: 1 },
  light: { accent: "#ff3c00", lo: "#c22e00", hi: "#ff7a45", dark: 0 },
};

const hexToVec3 = (hex, out) => {
  const n = parseInt(hex.slice(1), 16);
  return out.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const glsl = (n) => n.toFixed(5);

// ---------- Shaders ----------

// Logo: LAYERS planos apilados que giran sobre el eje vertical con perspectiva
const logoVertex = /* glsl */ `
  attribute float aLayer; // -1..1: posición de la capa en profundidad

  uniform vec2 uCenter;
  uniform vec2 uScale; // tamaño (x, y) del plano en px
  uniform float uSize; // ancho de la celda en px
  uniform float uAngle;

  varying vec2 vUv;
  varying float vLayer;

  void main() {
    float c = cos(uAngle);
    float s = sin(uAngle);
    vec3 p = vec3(position.xy * uScale, aLayer * ${glsl(DEPTH / 2)} * uSize);

    // Giro sobre el eje vertical + perspectiva propia del holograma
    float x = p.x * c + p.z * s;
    float z = -p.x * s + p.z * c;
    float persp = 1.0 / (1.0 - z / (${glsl(FOCAL)} * uSize));

    // El reverso muestra el logo sin espejar: siempre se puede leer
    vUv = vec2(c < 0.0 ? 1.0 - uv.x : uv.x, uv.y);
    vLayer = aLayer;

    vec2 world = uCenter + vec2(x, p.y) * persp;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 0.0, 1.0);
  }
`;

const logoFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uAccent;
  uniform vec3 uLo;
  uniform vec3 uHi;
  uniform float uDark;
  uniform float uGlow; // 0 reposo → 1 encendido
  uniform float uAlpha; // aparición
  uniform float uAngle;
  uniform float uLine; // frecuencia de las líneas de barrido (por px de dispositivo)
  uniform float uPhase; // solo avanza mientras el holograma está encendido

  varying vec2 vUv;
  varying float vLayer;

  void main() {
    vec4 t = texture2D(uMap, vUv); // alfa premultiplicado
    float a = t.a;
    vec3 rgb = t.rgb / max(a, 0.001);
    float lum = dot(rgb, vec3(0.2126, 0.7152, 0.0722));

    // Versión monocroma (color del tema) con el sombreado del logo
    vec3 mono = mix(uLo, uHi, lum);

    // Líneas de barrido horizontales, en espacio de pantalla
    float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * uLine + uPhase * 5.0);
    float scanMod = mix(0.56 + 0.44 * scan, 0.82 + 0.18 * scan, uGlow);

    // Capas exteriores: "ecos" monocromos que solo se ven de perfil y dan
    // volumen al girar; de frente el logo queda nítido
    float ghost = step(0.01, abs(vLayer));
    if (ghost > 0.5) {
      float alpha = a * abs(sin(uAngle)) * (0.2 + 0.14 * uGlow) * scanMod * uAlpha;
      if (alpha < 0.004) discard;
      gl_FragColor = vec4(mix(uAccent, uHi, 0.25), alpha);
      return;
    }

    // Colores reales del logo; los tonos que no contrastan con el fondo
    // (muy oscuros en tema oscuro, muy claros en tema claro) se quedan monocromos
    float lost = mix(smoothstep(0.7, 0.92, lum), 1.0 - smoothstep(0.08, 0.3, lum), uDark);
    vec3 real = mix(rgb, mono, lost);
    vec3 col = mix(mono, real, 0.3 + 0.65 * uGlow);

    // Banda de luz que recorre el logo de abajo arriba mientras está encendido
    float sweep = exp(-pow((vUv.y - fract(uPhase * 0.55) * 1.6 + 0.3) * 7.0, 2.0));
    col += uHi * sweep * 0.45 * uGlow;

    float alpha = a * (0.74 + 0.26 * uGlow) * scanMod;

    // Halo: el alfa del logo desenfocado (mipmaps) con el color del tema
    vec2 edge = smoothstep(0.0, 0.14, vUv) * smoothstep(0.0, 0.14, 1.0 - vUv);
    float halo = texture2D(uMap, vUv, 3.6).a * edge.x * edge.y * (0.1 + 0.6 * uGlow)
      * mix(0.55, 1.0, uDark); // sobre fondo claro el halo se contiene: si no, emborrona

    float outAlpha = alpha + halo * (1.0 - alpha);
    if (outAlpha * uAlpha < 0.004) discard;
    vec3 outColor = (col * alpha + uAccent * halo * (1.0 - alpha)) / max(outAlpha, 0.001);
    gl_FragColor = vec4(outColor, outAlpha * uAlpha);
  }
`;

// Emisor: anillo elíptico en el suelo + haz de luz hacia el logo, dibujados de
// forma procedimental en un único plano que cubre la celda
const baseVertex = /* glsl */ `
  uniform vec2 uCenter;
  uniform vec2 uScale;

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * vec4(uCenter + position.xy * uScale, 0.0, 1.0);
  }
`;

const baseFragment = /* glsl */ `
  uniform vec3 uAccent;
  uniform vec3 uHi;
  uniform float uGlow;
  uniform float uAlpha;
  uniform float uAspect; // alto / ancho de la celda
  uniform float uPx; // 1 px expresado en anchos de celda
  uniform float uBeamTop; // altura a la que se desvanece el haz
  uniform float uDark;

  varying vec2 vUv;

  void main() {
    // Coordenadas en anchos de celda, origen abajo en el centro
    vec2 p = vec2(vUv.x - 0.5, vUv.y * uAspect);
    vec2 q = (p - vec2(0.0, ${glsl(PAD_Y)})) / vec2(${glsl(PAD_RX)}, ${glsl(PAD_RY)});
    float d = length(q);
    float aa = uPx / ${glsl(PAD_RY)} * 1.2;

    // Anillo exterior, anillo interior fino y brillo del emisor
    float ring = 1.0 - smoothstep(0.0, aa, abs(d - 0.92) - 0.05);
    float inner = 1.0 - smoothstep(0.0, aa, abs(d - 0.52) - 0.025);
    float core = 1.0 - smoothstep(0.0, 0.85, d);

    // Haz: nace del disco y se abre y desvanece hacia el logo
    float t = clamp((p.y - ${glsl(PAD_Y)}) / (uBeamTop - ${glsl(PAD_Y)}), 0.0, 1.0);
    float halfWidth = mix(${glsl(PAD_RX * 0.96)}, ${glsl(PAD_RX * 1.25)}, t);
    float across = 1.0 - smoothstep(halfWidth * 0.35, halfWidth, abs(p.x));
    float below = p.y < ${glsl(PAD_Y)} ? 1.0 - smoothstep(1.0 - aa, 1.0, d) : 1.0;
    float beam = across * below * pow(1.0 - t, 1.4);

    float alpha =
      ring * (0.6 + 0.4 * uGlow) +
      inner * (0.28 + 0.4 * uGlow) +
      core * (0.16 + 0.34 * uGlow) +
      beam * (0.1 + 0.26 * uGlow) * mix(0.65, 1.0, uDark);
    alpha = min(alpha, 1.0) * uAlpha;
    if (alpha < 0.004) discard;

    vec3 col = mix(uAccent, uHi, (ring * 0.5 + core * 0.4) * uGlow);
    gl_FragColor = vec4(col, alpha);
  }
`;

// ---------- Utilidades ----------

// LAYERS planos unitarios apilados. Las capas exteriores van primero y la
// central la última, para que el logo nítido se pinte encima de sus "ecos"
function createLogoGeometry() {
  const order = [];
  for (let i = 0; i < LAYERS; i++) {
    const layer = (i / (LAYERS - 1)) * 2 - 1;
    if (Math.abs(layer) > 0.01) order.push(layer);
  }
  order.push(0);

  const position = [];
  const uv = [];
  const layerAttr = [];
  const index = [];
  order.forEach((layer, i) => {
    const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
    for (const [x, y] of corners) {
      position.push(x, y, 0);
      uv.push(x + 0.5, y + 0.5);
      layerAttr.push(layer);
    }
    const o = i * 4;
    index.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(position), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  geometry.setAttribute("aLayer", new BufferAttribute(new Float32Array(layerAttr), 1));
  geometry.setIndex(index);
  return geometry;
}

// Zona de la imagen con contenido: muchos logos traen márgenes transparentes
// enormes y, sin recortarlos, se verían diminutos
function findContentBox(image) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const full = { sx: 0, sy: 0, sw: width, sh: height };
  const scale = Math.min(1, 200 / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, w, h);
  let data;
  try {
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return full;
  }

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return full;

  const sx = Math.max(0, (minX - 1) / scale);
  const sy = Math.max(0, (minY - 1) / scale);
  const ex = Math.min(width, (maxX + 2) / scale);
  const ey = Math.min(height, (maxY + 2) / scale);
  return { sx, sy, sw: ex - sx, sh: ey - sy };
}

export class SkillHologramScene {
  /** logos: ruta de la imagen de cada skill, en el mismo orden que los botones */
  constructor(container, logos, { reducedMotion = false } = {}) {
    this.container = container;
    this.reducedMotion = reducedMotion;

    this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.canvas = this.renderer.domElement;
    this.canvas.style.position = "absolute";
    container.appendChild(this.canvas);

    this.scene = new Scene();
    this.camera = new OrthographicCamera(0, 1, 0, -1, 0.1, 2000);
    this.camera.position.z = 1000;

    // Uniforms compartidos por todos los hologramas (tema y resolución)
    this.shared = {
      uAccent: { value: new Vector3() },
      uLo: { value: new Vector3() },
      uHi: { value: new Vector3() },
      uDark: { value: 1 },
      uLine: { value: 2 },
    };

    this.logoGeometry = createLogoGeometry();
    this.baseGeometry = new PlaneGeometry(1, 1);
    this.holograms = logos.map((logo, index) => this.createHologram(logo, index));

    // Estado
    this.hovered = -1;
    this.down = -1;
    this.selected = -1;
    this.enterClock = -1; // < 0: todavía no ha entrado
    // Tiempos de la entrada; enter(duración) los ajusta para que el último
    // holograma termine justo al acabar esa duración
    this.enterDelay = 0.15;
    this.enterTime = ENTER_TIME;
    this.enterStagger = ENTER_STAGGER;
    this.width = 0;
    this.height = 0;
    this.visible = true;
    this.running = false;
    this.rafId = 0;
    this.lastFrame = 0;
    this.disposed = false;

    this.frame = this.frame.bind(this);
    this.onContextLost = (event) => event.preventDefault();
    this.canvas.addEventListener("webglcontextlost", this.onContextLost);

    this.setTheme("dark");
  }

  // ---------- Construcción ----------

  createHologram(logo, index) {
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = TEX;
    textureCanvas.height = TEX;
    const texture = new CanvasTexture(textureCanvas);
    texture.premultiplyAlpha = true;

    const material = (vertexShader, fragmentShader, uniforms) =>
      new ShaderMaterial({
        uniforms: { ...this.shared, ...uniforms },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: NormalBlending,
        side: DoubleSide, // al girar, el logo se ve también por detrás
      });

    const baseMaterial = material(baseVertex, baseFragment, {
      uCenter: { value: new Vector2() },
      uScale: { value: new Vector2(1, 1) },
      uGlow: { value: 0 },
      uAlpha: { value: 0 },
      uAspect: { value: 1 },
      uPx: { value: 0.02 },
      uBeamTop: { value: 0.6 },
    });
    const logoMaterial = material(logoVertex, logoFragment, {
      uMap: { value: texture },
      uCenter: { value: new Vector2() },
      uScale: { value: new Vector2(1, 1) },
      uSize: { value: 1 },
      uAngle: { value: 0 },
      uGlow: { value: 0 },
      uAlpha: { value: 0 },
      uPhase: { value: index * 0.37 },
    });

    const base = new Mesh(this.baseGeometry, baseMaterial);
    const mesh = new Mesh(this.logoGeometry, logoMaterial);
    // Los vértices se colocan en el shader: three.js no puede deducir su volumen
    base.frustumCulled = false;
    mesh.frustumCulled = false;
    base.renderOrder = 0;
    mesh.renderOrder = 1;
    base.visible = false;
    mesh.visible = false;
    this.scene.add(base, mesh);

    const hologram = {
      index,
      base,
      mesh,
      texture,
      textureCanvas,
      baseUniforms: baseMaterial.uniforms,
      logoUniforms: logoMaterial.uniforms,
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      placed: false,
      glow: 0,
      press: 0,
      angle: 0,
      spin: 0, // velocidad angular
      restAngle: 0, // ángulo (de frente) al que vuelve al apagarse
      wasActive: false,
    };

    if (logo) {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (this.disposed) return;
        this.paintLogo(hologram, image);
        if (!this.running) this.render();
      };
      image.src = logo;
    }
    return hologram;
  }

  // Logo recortado y centrado, con margen alrededor para el halo
  paintLogo(hologram, image) {
    const ctx = hologram.textureCanvas.getContext("2d");
    const { sx, sy, sw, sh } = findContentBox(image);
    const aspect = sw / sh;
    // Los logos muy alargados (wordmarks) se dejan crecer algo más: si no,
    // quedarían diminutos al lado de los cuadrados
    const stretch = Math.min(1.3, Math.pow(Math.max(aspect, 1 / aspect), 0.35));
    const box = TEX * LOGO_FILL * stretch;
    const w = aspect >= 1 ? box : box * aspect;
    const h = aspect >= 1 ? box / aspect : box;
    ctx.clearRect(0, 0, TEX, TEX);
    ctx.drawImage(image, sx, sy, sw, sh, (TEX - w) / 2, (TEX - h) / 2, w, h);
    hologram.texture.needsUpdate = true;
  }

  // ---------- Configuración ----------

  /** slots: [{ x, y, width, height }] de cada botón, en px relativos al contenedor */
  layout(width, height, slots) {
    if (width < 1 || height < 1 || !slots.length) return;
    this.width = width;
    this.height = height;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const canvasW = width + MARGIN * 2;
    const canvasH = height + MARGIN * 2;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(canvasW, canvasH, false);
    const style = this.canvas.style;
    style.width = `${canvasW}px`;
    style.height = `${canvasH}px`;
    style.left = `${-MARGIN}px`;
    style.top = `${-MARGIN}px`;

    // Mundo en px CSS con el origen en la esquina superior izquierda de la rejilla
    this.camera.left = -MARGIN;
    this.camera.right = width + MARGIN;
    this.camera.top = MARGIN;
    this.camera.bottom = -(height + MARGIN);
    this.camera.updateProjectionMatrix();

    // Una línea de barrido cada 3 px CSS
    this.shared.uLine.value = (Math.PI * 2) / (3 * pixelRatio);

    this.holograms.forEach((hologram, i) => {
      const slot = slots[i];
      hologram.placed = Boolean(slot);
      if (!slot) return;
      hologram.x = slot.x + slot.width / 2;
      hologram.y = -(slot.y + slot.height / 2);
      hologram.width = slot.width;
      hologram.height = slot.height;

      const aspect = slot.height / slot.width;
      const base = hologram.baseUniforms;
      base.uCenter.value.set(hologram.x, hologram.y);
      base.uScale.value.set(slot.width, slot.height);
      base.uAspect.value = aspect;
      base.uPx.value = 1 / slot.width;
      base.uBeamTop.value = aspect * (1 - LOGO_CENTER) + 0.12;
      hologram.logoUniforms.uSize.value = slot.width;
    });

    this.update(0);
    this.render();
    this.start();
  }

  setTheme(theme) {
    const palette = THEMES[theme] ?? THEMES.dark;
    hexToVec3(palette.accent, this.shared.uAccent.value);
    hexToVec3(palette.lo, this.shared.uLo.value);
    hexToVec3(palette.hi, this.shared.uHi.value);
    this.shared.uDark.value = palette.dark;
    if (!this.running) this.render();
  }

  setVisible(visible) {
    this.visible = visible;
    if (visible) this.start();
    else this.stop();
  }

  // ---------- Interacción ----------

  /**
   * Lanza la animación de aparición. Con `duration` (s) toda la entrada
   * termina exactamente en ese tiempo
   */
  enter(duration) {
    if (this.enterClock >= 0) return;
    if (duration > 0) {
      const lastIndex = Math.max(1, this.holograms.length - 1);
      this.enterDelay = duration * 0.1;
      this.enterTime = duration * 0.45;
      this.enterStagger = (duration - this.enterDelay - this.enterTime) / lastIndex;
    }
    this.enterClock = 0;
    this.start();
  }

  setHover(index) {
    this.hovered = index;
    this.start();
  }

  setDown(index) {
    this.down = index;
    this.start();
  }

  setSelected(index) {
    this.selected = index;
    this.start();
  }

  // ---------- Bucle ----------

  start() {
    if (this.running || !this.visible || !this.width || this.disposed) return;
    this.running = true;
    this.lastFrame = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min(this.lastFrame ? now - this.lastFrame : 16.7, 34) / 1000;
    this.lastFrame = now;

    const animating = this.update(dt);
    this.render();

    // En reposo no queda nada que animar: se detiene el bucle hasta la
    // siguiente interacción
    if (animating) {
      this.rafId = requestAnimationFrame(this.frame);
    } else {
      this.running = false;
    }
  }

  // Avanza la animación y actualiza los uniforms. Devuelve si queda algo en movimiento
  update(dt) {
    if (this.enterClock >= 0) this.enterClock += dt;
    const entered = this.enterClock >= 0;
    const still = this.reducedMotion;
    const ease = still ? 1 : 1 - Math.exp(-dt * 10);
    let animating = false;

    for (const h of this.holograms) {
      const enterT = !entered
        ? 0
        : still
          ? 1
          : clamp01((this.enterClock - this.enterDelay - h.index * this.enterStagger) / this.enterTime);
      const show = h.placed && enterT > 0;
      h.base.visible = show;
      h.mesh.visible = show;
      if (entered && enterT < 1) animating = true;
      if (!show) continue;

      const isHovered = h.index === this.hovered;
      const isSelected = h.index === this.selected;
      const active = isHovered || isSelected;

      // Brillo y pulsación
      const glowTarget = isHovered ? 1 : isSelected ? 0.8 : 0;
      const pressTarget = h.index === this.down ? 1 : 0;
      h.glow += (glowTarget - h.glow) * ease;
      h.press += (pressTarget - h.press) * (still ? 1 : 1 - Math.exp(-dt * 22));
      if (Math.abs(glowTarget - h.glow) < 0.002) h.glow = glowTarget;
      if (Math.abs(pressTarget - h.press) < 0.002) h.press = pressTarget;
      if (h.glow !== glowTarget || h.press !== pressTarget) animating = true;

      // Giro: encendido da vueltas; al apagarse termina la media vuelta en
      // curso y se queda de frente (el reverso se ve igual que el anverso)
      if (!still) {
        if (active) {
          const speed = isHovered ? SPIN_HOVER : SPIN_SELECTED;
          h.spin += (speed - h.spin) * (1 - Math.exp(-dt * 5));
          h.angle += h.spin * dt;
          animating = true;
        } else if (h.angle !== 0) {
          if (h.wasActive) h.restAngle = Math.ceil((h.angle + 0.5) / Math.PI) * Math.PI;
          const pull = (h.restAngle - h.angle) * SPIN_RETURN * SPIN_RETURN;
          h.spin += (pull - h.spin * SPIN_RETURN * 2) * dt;
          h.angle += h.spin * dt;
          if (Math.abs(h.restAngle - h.angle) < 0.002 && Math.abs(h.spin) < 0.02) {
            h.angle = 0;
            h.spin = 0;
          } else {
            animating = true;
          }
        }
        h.wasActive = active;
      }

      // Las líneas de barrido solo se mueven mientras está encendido
      h.logoUniforms.uPhase.value += dt * h.glow;

      // Aparición: primero el emisor; luego el logo se "enciende" desde una
      // línea horizontal que se abre
      const boot = clamp01((enterT - 0.3) / 0.7);
      const open = easeOutCubic(boot);
      const size = h.width * LOGO_QUAD * (1 + 0.06 * h.glow - 0.08 * h.press);
      const lift = h.width * LIFT * h.glow;

      const logo = h.logoUniforms;
      logo.uCenter.value.set(h.x, h.y + h.height * (0.5 - LOGO_CENTER) + lift);
      logo.uScale.value.set(size * (1 + 0.35 * (1 - open)), size * Math.max(0.02, open));
      logo.uAngle.value = h.angle;
      logo.uGlow.value = h.glow;
      logo.uAlpha.value = clamp01(boot * 2);

      h.baseUniforms.uGlow.value = h.glow;
      h.baseUniforms.uAlpha.value = clamp01(enterT * 2.5);
    }

    return animating;
  }

  render() {
    if (!this.width || this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.holograms.forEach((hologram) => {
      hologram.texture.dispose();
      hologram.base.material.dispose();
      hologram.mesh.material.dispose();
    });
    this.logoGeometry.dispose();
    this.baseGeometry.dispose();
    this.renderer.dispose();
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
