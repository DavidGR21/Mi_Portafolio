// skillKeyboardScene.js
// Escena three.js de las skills: un teclado de keycaps 3D, una tecla por
// tecnología con su logo en la cara superior. La tecla se hunde al pulsarla y
// se queda aplastada mientras está seleccionada.
//
// La escena usa una cámara ortográfica en píxeles CSS y una proyección oblicua
// (la altura de cada tecla se dibuja desplazada hacia arriba): la base de cada
// tecla coincide con su botón del DOM (ver SkillKeyboard.jsx), que es quien
// define la rejilla y recibe la interacción.

import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

const MARGIN = 28; // px que el canvas sobresale de la rejilla
const OBLIQUE = 0.62; // px de pantalla que sube cada px de altura
const KEY_FILL = 0.96; // fracción de la celda que ocupa la base de la tecla
const KEY_HEIGHT = 0.3; // altura de la tecla respecto a su lado
const KEY_TOP = 0.8; // lado de la cara superior respecto a la base
const PLATE_PADDING = 12;
const PLATE_SHADOW = 6; // sombra dura desplazada, como las tarjetas de la página
const MAX_BLANKS = 12;

// Colores de la página en cada tema
const THEMES = {
  dark: {
    accent: "#44b4b8",
    side: "#b4babd",
    plate: "#151515",
    plateBorder: "#3a3a3a",
    blank: "#3d4446",
  },
  light: {
    accent: "#ff3c00",
    side: "#bdbdbd",
    plate: "#141414",
    plateBorder: "#000000",
    blank: "#454545",
  },
};

// --- Animación ---
const PRESS_SELECTED = 0.72; // cuánto se queda hundida la tecla seleccionada
const PRESS_HOVER = 0.1;
const PRESS_TRAVEL = 0.7; // fracción de la altura que pierde con press = 1
const SPRING = 520;
const DAMPING = 27;
const ENTER_TIME = 0.5;
const ENTER_STAGGER = 0.045;
const WAVE_PERIOD = 7; // s entre ondas decorativas

const TEX = 256;

const easeOutBack = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Contorno de un cuadrado redondeado centrado en el origen (sentido antihorario)
function roundedOutline(size, radius, segments) {
  const points = [];
  const half = size / 2 - radius;
  const corners = [[half, half, 0], [-half, half, 1], [-half, -half, 2], [half, -half, 3]];
  for (const [cx, cy, quadrant] of corners) {
    for (let s = 0; s <= segments; s++) {
      const angle = (quadrant + s / segments) * (Math.PI / 2);
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      points.push({ x: cx + nx * radius, y: cy + ny * radius, nx, ny });
    }
  }
  return points;
}

// Keycap: base de lado 1 en z = 0 y cara superior más pequeña en z = 1.
// Los lados llevan el sombreado en colores de vértice (iluminación fija, estilo
// ilustración); la cara superior va en otro grupo para llevar la textura.
function createKeyGeometry() {
  const base = roundedOutline(1, 0.13, 5);
  const top = roundedOutline(KEY_TOP, 0.12, 5);
  const n = base.length;

  const position = [];
  const color = [];
  const uv = [];
  const push = (x, y, z, shade, u = 0, v = 0) => {
    position.push(x, y, z);
    color.push(shade, shade, shade);
    uv.push(u, v);
  };
  // Luz desde arriba a la izquierda: el lado frontal queda en sombra
  const shadeOf = (p) => 0.7 + 0.3 * (p.nx * -0.45 + p.ny * 0.89);

  base.forEach((p) => push(p.x, p.y, 0, shadeOf(p) * 0.78));
  top.forEach((p, i) => push(p.x, p.y, 1, shadeOf(base[i])));
  top.forEach((p) => push(p.x, p.y, 1, 1, p.x / KEY_TOP + 0.5, p.y / KEY_TOP + 0.5));
  push(0, 0, 1, 1, 0.5, 0.5);

  const index = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    index.push(i, j, n + j, i, n + j, n + i);
  }
  const sideCount = index.length;
  for (let i = 0; i < n; i++) {
    index.push(2 * n + i, 2 * n + ((i + 1) % n), 3 * n);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(position), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(color), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  geometry.setIndex(index);
  geometry.addGroup(0, sideCount, 0);
  geometry.addGroup(sideCount, index.length - sideCount, 1);
  return geometry;
}

// Zona de la imagen con contenido: muchos logos traen márgenes transparentes
// enormes y, sin recortarlos, se verían diminutos en la tecla
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

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function roundedRectGeometry(width, height, radius) {
  const shape = new Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return new ShapeGeometry(shape, 6);
}

export class SkillKeyboardScene {
  /** logos: ruta de la imagen de cada skill, en el mismo orden que los botones */
  constructor(container, logos, { reducedMotion = false } = {}) {
    this.container = container;
    this.reducedMotion = reducedMotion;

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.canvas = this.renderer.domElement;
    this.canvas.style.position = "absolute";
    container.appendChild(this.canvas);

    this.scene = new Scene();
    this.camera = new OrthographicCamera(0, 1, 0, -1, 0.1, 2000);
    this.camera.position.z = 1000;

    // Proyección oblicua: y' = y + OBLIQUE * z
    this.root = new Group();
    this.root.matrixAutoUpdate = false;
    this.root.matrix.set(1, 0, 0, 0, 0, 1, OBLIQUE, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    this.scene.add(this.root);

    // Placa del teclado: sombra dura del color del tema + borde + relleno
    const flat = () => new MeshBasicMaterial({ transparent: true, opacity: 0 });
    this.plateMaterials = { shadow: flat(), border: flat(), fill: flat() };
    this.plate = {
      shadow: new Mesh(new BufferGeometry(), this.plateMaterials.shadow),
      border: new Mesh(new BufferGeometry(), this.plateMaterials.border),
      fill: new Mesh(new BufferGeometry(), this.plateMaterials.fill),
    };
    this.plate.shadow.position.z = -3;
    this.plate.border.position.z = -2;
    this.plate.fill.position.z = -1;
    Object.values(this.plate).forEach((mesh) => {
      mesh.visible = false;
      this.root.add(mesh);
    });

    this.keyGeometry = createKeyGeometry();
    this.blankTopMaterial = new MeshBasicMaterial();
    this.blankSideMaterial = new MeshBasicMaterial({ vertexColors: true });

    this.theme = THEMES.dark;
    this.accentColor = new Color();
    this.sideColor = new Color();
    this.white = new Color(0xffffff);

    this.keys = logos.map((logo, index) => this.createKey(logo, index));
    this.blanks = [];

    // Estado
    this.hovered = -1;
    this.down = -1;
    this.selected = -1;
    this.time = 0;
    this.enterClock = -1; // < 0: todavía no ha entrado
    // Tiempos de la entrada; enter(duración) los ajusta para que la última
    // tecla termine justo al acabar esa duración
    this.enterDelay = 0.15;
    this.enterTime = ENTER_TIME;
    this.enterStagger = ENTER_STAGGER;
    this.plateTime = 0.35;
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

  createKey(logo, index) {
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = TEX;
    textureCanvas.height = TEX;
    const texture = new CanvasTexture(textureCanvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    const sideMaterial = new MeshBasicMaterial({ vertexColors: true });
    const topMaterial = new MeshBasicMaterial({ map: texture });
    const mesh = new Mesh(this.keyGeometry, [sideMaterial, topMaterial]);
    mesh.visible = false;
    this.root.add(mesh);

    const key = {
      index,
      mesh,
      texture,
      textureCanvas,
      sideMaterial,
      topMaterial,
      image: null,
      x: 0,
      y: 0,
      size: 1,
      placed: false,
      press: 0,
      velocity: 0,
      glow: 0,
      tint: 0,
    };
    this.paintTop(key);

    if (logo) {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        if (this.disposed) return;
        key.image = image;
        key.crop = findContentBox(image);
        this.paintTop(key);
        if (!this.running) this.render();
      };
      image.src = logo;
    }
    return key;
  }

  // Cara superior: keycap blanca con una ligera concavidad y el logo centrado
  paintTop(key) {
    const ctx = key.textureCanvas.getContext("2d");
    const edge = ctx.createLinearGradient(0, 0, 0, TEX);
    edge.addColorStop(0, "#f7f7f7");
    edge.addColorStop(1, "#d9d9d9");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, TEX, TEX);

    const dish = ctx.createLinearGradient(0, 0, 0, TEX);
    dish.addColorStop(0, "#ececec");
    dish.addColorStop(1, "#ffffff");
    ctx.fillStyle = dish;
    roundRectPath(ctx, 14, 12, TEX - 28, TEX - 28, 34);
    ctx.fill();

    if (key.image) {
      const { sx, sy, sw, sh } = key.crop;
      const box = TEX * 0.6;
      const aspect = sw / sh;
      const w = aspect >= 1 ? box : box * aspect;
      const h = aspect >= 1 ? box / aspect : box;
      ctx.drawImage(key.image, sx, sy, sw, sh, (TEX - w) / 2, (TEX - h) / 2 - 2, w, h);
    }
    key.texture.needsUpdate = true;
  }

  createBlank() {
    const mesh = new Mesh(this.keyGeometry, [this.blankSideMaterial, this.blankTopMaterial]);
    mesh.visible = false;
    this.root.add(mesh);
    return { mesh, x: 0, y: 0, size: 1, placed: false, index: 0 };
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

    this.keys.forEach((key, i) => {
      const slot = slots[i];
      key.placed = Boolean(slot);
      if (!slot) return;
      key.x = slot.x + slot.width / 2;
      key.y = -(slot.y + slot.height / 2);
      key.size = slot.width * KEY_FILL;
    });

    // Teclas en blanco para completar la última fila, como en un teclado real
    const first = slots[0];
    const columns = slots.filter((slot) => Math.abs(slot.y - first.y) < 1).length;
    const missing = Math.min(MAX_BLANKS, (columns - (slots.length % columns)) % columns);
    while (this.blanks.length < missing) this.blanks.push(this.createBlank());
    const last = slots[slots.length - 1];
    this.blanks.forEach((blank, i) => {
      blank.placed = i < missing;
      if (!blank.placed) {
        blank.mesh.visible = false;
        return;
      }
      const column = slots[columns - missing + i];
      blank.x = column.x + column.width / 2;
      blank.y = -(last.y + last.height / 2);
      blank.size = column.width * KEY_FILL;
      blank.index = slots.length + i;
    });

    // Placa que envuelve todas las teclas
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const slot of slots) {
      minX = Math.min(minX, slot.x);
      maxX = Math.max(maxX, slot.x + slot.width);
      minY = Math.min(minY, slot.y);
      maxY = Math.max(maxY, slot.y + slot.height);
    }
    const plateW = maxX - minX + PLATE_PADDING * 2;
    const plateH = maxY - minY + PLATE_PADDING * 2;
    const cx = (minX + maxX) / 2;
    const cy = -(minY + maxY) / 2;
    const setPlate = (mesh, w, h, radius, dx = 0, dy = 0) => {
      mesh.geometry.dispose();
      mesh.geometry = roundedRectGeometry(w, h, radius);
      mesh.position.x = cx + dx;
      mesh.position.y = cy + dy;
      mesh.visible = true;
    };
    setPlate(this.plate.shadow, plateW, plateH, 12, PLATE_SHADOW, -PLATE_SHADOW);
    setPlate(this.plate.border, plateW, plateH, 12);
    setPlate(this.plate.fill, plateW - 4, plateH - 4, 10);

    this.start();
    if (!this.running) this.render();
  }

  setTheme(theme) {
    this.theme = THEMES[theme] ?? THEMES.dark;
    const { accent, side, plate, plateBorder, blank } = this.theme;
    this.accentColor.set(accent);
    this.sideColor.set(side);
    this.plateMaterials.shadow.color.set(accent);
    this.plateMaterials.border.color.set(plateBorder);
    this.plateMaterials.fill.color.set(plate);
    this.blankTopMaterial.color.set(blank);
    this.blankSideMaterial.color.set(blank);
    if (!this.running) this.render();
  }

  setVisible(visible) {
    this.visible = visible;
    if (visible) this.start();
    else this.stop();
  }

  // ---------- Interacción ----------

  /**
   * Lanza la animación de aparición del teclado. Con `duration` (s) toda la
   * entrada (placa y teclas) termina exactamente en ese tiempo
   */
  enter(duration) {
    if (this.enterClock >= 0) return;
    if (duration > 0) {
      const lastIndex = Math.max(1, this.keys.length + this.blanks.filter((b) => b.placed).length - 1);
      this.plateTime = duration * 0.3;
      this.enterDelay = duration * 0.1;
      this.enterTime = duration * 0.4;
      this.enterStagger = (duration - this.enterDelay - this.enterTime) / lastIndex;
    }
    this.enterClock = 0;
  }

  setHover(index) {
    this.hovered = index;
  }

  setDown(index) {
    this.down = index;
  }

  setSelected(index) {
    this.selected = index;
  }

  // ---------- Bucle ----------

  start() {
    if (this.running || !this.visible || !this.width) return;
    this.running = true;
    this.lastFrame = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  // Coloca una tecla: base fija en su celda, altura según cuánto está hundida
  placeKey(mesh, x, y, size, press, enterT) {
    const enter = this.reducedMotion ? enterT : Math.max(0.001, easeOutBack(enterT));
    const height = size * KEY_HEIGHT * Math.max(0.1, 1 - PRESS_TRAVEL * press) * enter;
    // Se baja media altura (en pantalla) para que la tecla quede centrada en su celda
    mesh.position.set(x, y - (size * KEY_HEIGHT * OBLIQUE) / 2, 0);
    mesh.scale.set(size * enter, size * enter, height);
  }

  frame(now) {
    if (!this.running) return;
    const dt = Math.min(this.lastFrame ? now - this.lastFrame : 16.7, 34) / 1000;
    this.lastFrame = now;
    this.time += dt;
    if (this.enterClock >= 0) this.enterClock += dt;

    const entered = this.enterClock >= 0;
    const enterOf = (index) =>
      this.reducedMotion
        ? (entered ? 1 : 0)
        : clamp01((this.enterClock - this.enterDelay - index * this.enterStagger) / this.enterTime);

    // La placa aparece primero
    const plateOpacity = this.reducedMotion ? (entered ? 1 : 0) : clamp01(this.enterClock / this.plateTime);
    Object.values(this.plateMaterials).forEach((material) => {
      material.opacity = plateOpacity;
    });

    // Onda decorativa que recorre el teclado de vez en cuando
    const waveActive = !this.reducedMotion && this.enterClock > 2.5;
    const wavePos = ((this.time % WAVE_PERIOD) - 0.4) * 900;

    const ease = 1 - Math.exp(-dt * 14);
    for (const key of this.keys) {
      const enterT = enterOf(key.index);
      key.mesh.visible = key.placed && enterT > 0;
      if (!key.mesh.visible) continue;

      const isSelected = key.index === this.selected;
      const isHovered = key.index === this.hovered;
      let target = 0;
      if (key.index === this.down) target = 1;
      else if (isSelected) target = PRESS_SELECTED;
      else if (isHovered) target = PRESS_HOVER;
      if (waveActive && target === 0) {
        const d = (key.x - key.y - wavePos) / 70;
        target = 0.3 * Math.exp(-d * d);
      }

      if (this.reducedMotion) {
        key.press = target;
      } else {
        // Muelle con un poco de rebote: sensación de tecla mecánica
        key.velocity += ((target - key.press) * SPRING - key.velocity * DAMPING) * dt;
        key.press += key.velocity * dt;
      }

      key.glow += ((isSelected || isHovered ? 1 : 0) - key.glow) * ease;
      key.tint += ((isSelected ? 1 : 0) - key.tint) * ease;
      key.sideMaterial.color.copy(this.sideColor).lerp(this.accentColor, key.glow);
      key.topMaterial.color.copy(this.white).lerp(this.accentColor, key.tint * 0.3);

      this.placeKey(key.mesh, key.x, key.y, key.size, key.press, enterT);
    }

    for (const blank of this.blanks) {
      if (!blank.placed) continue;
      const enterT = enterOf(blank.index);
      blank.mesh.visible = enterT > 0;
      if (blank.mesh.visible) this.placeKey(blank.mesh, blank.x, blank.y, blank.size, 0, enterT);
    }

    this.render();
    this.rafId = requestAnimationFrame(this.frame);
  }

  render() {
    if (!this.width || this.disposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    this.stop();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.keys.forEach((key) => {
      key.texture.dispose();
      key.sideMaterial.dispose();
      key.topMaterial.dispose();
    });
    Object.values(this.plate).forEach((mesh) => mesh.geometry.dispose());
    Object.values(this.plateMaterials).forEach((material) => material.dispose());
    this.keyGeometry.dispose();
    this.blankTopMaterial.dispose();
    this.blankSideMaterial.dispose();
    this.renderer.dispose();
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}
