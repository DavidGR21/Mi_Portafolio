import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Duraciones de las transiciones (segundos)
const ENTER_DURATION = 1.6;
const LEAVE_DURATION = 0.9;

// Progreso por fila: la imagen se arma de abajo hacia arriba con una onda horizontal
const PROGRESS_GLSL = `
float rowProgress(vec2 uv) {
  return pow(uv.y, 1.6) + 0.06 * sin(uv.x * 6.2832 + 1.2);
}
`;

const vertexShader = `
uniform float uIn;
uniform float uOut;

varying vec2 vUv;
${PROGRESS_GLSL}
void main() {
  vUv = uv;
  vec3 pos = position;

  float p = rowProgress(uv);
  float aIn = clamp(uIn * 2.2 - p, 0.0, 1.0);
  float aOut = 1.0 - clamp(uOut * 2.2 - p, 0.0, 1.0);

  // Las filas llegan desde el fondo y se hunden al salir
  pos.z -= pow(1.0 - aIn, 3.0) * 6.0;
  pos.z -= pow(1.0 - aOut, 3.0) * 6.0;
  pos.x += pow(1.0 - aIn, 2.0) * 0.15 * sin(uv.y * 3.1416);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uIn;
uniform float uOut;
uniform float uVelocity;

varying vec2 vUv;

#define TAU 6.283185307179586
${PROGRESS_GLSL}
float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;

  float p = rowProgress(uv);
  float aIn = clamp(uIn * 2.2 - p, 0.0, 1.0);
  float aOut = 1.0 - clamp(uOut * 2.2 - p, 0.0, 1.0);
  float unsettled = 1.0 - aIn;

  // Ruido de píxeles mientras la fila no se ha asentado
  vec2 seed = gl_FragCoord.xy + floor(uTime * 24.0);
  float r1 = random(seed);
  float r2 = random(seed + 97.0);
  uv += r1 * vec2(cos(r2 * TAU), sin(r2 * TAU)) * 0.08 * unsettled;

  // Ondulación según la velocidad del scroll de la lista
  uv.x += sin(uv.y * 18.0 + uTime * 4.0) * uVelocity * 0.004;

  // Separación RGB
  float split = 0.04 * unsettled + abs(uVelocity) * 0.002;
  float r = texture2D(uTexture, uv + vec2(0.0, split)).r;
  float g = texture2D(uTexture, uv).g;
  float b = texture2D(uTexture, uv - vec2(0.0, split)).b;
  vec3 color = vec3(r, g, b);

  // De gris a color al terminar de entrar
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, pow(aIn, 3.0));

  // Líneas de escaneo sutiles
  color *= 0.95 + 0.05 * sin(gl_FragCoord.y * 1.5);

  gl_FragColor = vec4(color, aIn * aOut);
}
`;

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function ImagePlane({ texture, isActive, velocityRef }) {
    const meshRef = useRef();
    const animRef = useRef({ inStart: null, outStart: null });
    const { viewport } = useThree();

    const material = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uTime: { value: 0 },
            uIn: { value: 0 },
            uOut: { value: 0 },
            uVelocity: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
    }), [texture]);

    useEffect(() => () => material.dispose(), [material]);

    useEffect(() => {
        const now = performance.now() / 1000;
        if (isActive) {
            animRef.current = { inStart: now, outStart: null };
        } else if (animRef.current.inStart !== null) {
            animRef.current.outStart = now;
        }
    }, [isActive]);

    // Ajustar la imagen al marco (92%) manteniendo su proporción
    const { image } = texture;
    const aspect = image.width / image.height;
    const maxW = viewport.width * 0.92;
    const maxH = viewport.height * 0.92;
    const [w, h] = aspect > maxW / maxH ? [maxW, maxW / aspect] : [maxH * aspect, maxH];

    useFrame((_, delta) => {
        const now = performance.now() / 1000;
        const { inStart, outStart } = animRef.current;
        const uniforms = material.uniforms;

        uniforms.uIn.value = inStart === null ? 0 : easeOutQuad(clamp01((now - inStart) / ENTER_DURATION));
        uniforms.uOut.value = outStart === null ? 0 : easeOutCubic(clamp01((now - outStart) / LEAVE_DURATION));
        uniforms.uTime.value = now;
        uniforms.uVelocity.value = THREE.MathUtils.damp(
            uniforms.uVelocity.value,
            THREE.MathUtils.clamp(velocityRef.current, -30, 30),
            6,
            delta
        );

        meshRef.current.visible = uniforms.uIn.value > 0 && uniforms.uOut.value < 1;
    });

    return (
        <mesh ref={meshRef} scale={[w, h, 1]} material={material} visible={false}>
            <planeGeometry args={[1, 1, 32, 32]} />
        </mesh>
    );
}

function ImagePlanes({ images, activeIndex, velocityRef }) {
    const textures = useTexture(images, (loaded) => {
        // El shader escribe el color tal cual: no convertir el espacio de color
        [].concat(loaded).forEach((texture) => {
            texture.colorSpace = THREE.NoColorSpace;
            texture.needsUpdate = true;
        });
    });

    return textures.map((texture, index) => (
        <ImagePlane
            key={images[index]}
            texture={texture}
            isActive={index === activeIndex}
            velocityRef={velocityRef}
        />
    ));
}

function ProjectPreview({ images, activeIndex, velocityRef }) {
    return (
        <Canvas
            className="preview-canvas"
            flat
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: false }}
            camera={{ position: [0, 0, 5], fov: 50 }}
        >
            <Suspense fallback={null}>
                <ImagePlanes images={images} activeIndex={activeIndex} velocityRef={velocityRef} />
            </Suspense>
        </Canvas>
    );
}

export default ProjectPreview;
