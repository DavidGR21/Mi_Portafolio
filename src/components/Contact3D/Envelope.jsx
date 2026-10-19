import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTheme } from '../../context/ThemeContext'

// Dimensiones del sobre (unidades three.js)
const WIDTH = 4.4
const HEIGHT = 2.8
const DEPTH = 0.06
const FLAP_LENGTH = HEIGHT * 0.58
const BASE_Y = 1.6

// Duraciones de las animaciones (segundos)
const OPEN_DURATION = 1.5
const CLOSE_DURATION = 1.1
const FLY_DURATION = 0.9

const PALETTES = {
    dark: {
        paper: '#f4f1ea',
        shade: '#ddd5c6',
        interior: '#b9b0a0',
        edge: '#d6cebf',
        accent: '#44b4b8',
        accentDark: '#021633',
        seal: '#b3201a',
        ink: '#1f2533',
        letter: '#ffffff',
    },
    light: {
        paper: '#ecd2b0',
        shade: '#d8b68c',
        interior: '#b38d63',
        edge: '#caa47a',
        accent: '#ff3c00',
        accentDark: '#5c0f0f',
        seal: '#a3170c',
        ink: '#3a2414',
        letter: '#fffaf2',
    },
}

const HANDWRITING = '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive'
const SANS = '"Segoe UI", system-ui, sans-serif'

// ---------- Utilidades de geometría ----------

const roundedRectShape = (w, h, r) => {
    const shape = new THREE.Shape()
    const x = -w / 2
    const y = -h / 2
    shape.moveTo(x + r, y)
    shape.lineTo(x + w - r, y)
    shape.quadraticCurveTo(x + w, y, x + w, y + r)
    shape.lineTo(x + w, y + h - r)
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    shape.lineTo(x + r, y + h)
    shape.quadraticCurveTo(x, y + h, x, y + h - r)
    shape.lineTo(x, y + r)
    shape.quadraticCurveTo(x, y, x + r, y)
    return shape
}

// ShapeGeometry usa las coordenadas como UV; las normalizamos a [0, 1]
const normalizeUV = (geometry, minX, minY, width, height) => {
    const pos = geometry.attributes.position
    const uv = geometry.attributes.uv
    for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, (pos.getX(i) - minX) / width, (pos.getY(i) - minY) / height)
    }
    uv.needsUpdate = true
    return geometry
}

// ---------- Utilidades de texturas (dibujadas en canvas) ----------

const createTexture = (width, height, draw) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    draw(canvas.getContext('2d'), width, height)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    return texture
}

const paperGrain = (ctx, w, h, color) => {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.05)'
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2)
    }
}

const fillPath = (ctx, points, fill) => {
    ctx.beginPath()
    points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
}

// Cara del sobre con la solapa: pliegues laterales, inferior e interior oscuro
const drawFlapSide = (c) => (ctx, w, h) => {
    paperGrain(ctx, w, h, c.paper)

    // Interior del sobre (solo visible cuando la solapa está abierta)
    const interior = ctx.createLinearGradient(0, 0, 0, h * 0.5)
    interior.addColorStop(0, c.interior)
    interior.addColorStop(1, c.shade)
    fillPath(ctx, [[0, 0], [w, 0], [w / 2, h * 0.5]], interior)

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.22)'
    ctx.shadowBlur = 14
    // Pliegues laterales
    fillPath(ctx, [[0, 0], [w * 0.5, h * 0.52], [0, h]], c.paper)
    fillPath(ctx, [[w, 0], [w * 0.5, h * 0.52], [w, h]], c.paper)
    // Pliegue inferior
    ctx.shadowOffsetY = -3
    fillPath(ctx, [[0, h], [w / 2, h * 0.42], [w, h]], c.paper)
    ctx.restore()

    ctx.strokeStyle = c.shade
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(w / 2, h * 0.42)
    ctx.lineTo(w, h)
    ctx.stroke()
}

const drawFlapOuter = (c) => (ctx, w, h) => {
    paperGrain(ctx, w, h, c.paper)
    const shading = ctx.createLinearGradient(0, 0, 0, h)
    shading.addColorStop(0, 'rgba(0,0,0,0.08)')
    shading.addColorStop(1, 'rgba(255,255,255,0.06)')
    ctx.fillStyle = shading
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = c.shade
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(w / 2, h)
    ctx.lineTo(w, 0)
    ctx.stroke()
}

// Forro interior de la solapa con patrón de rayas
const drawFlapLining = (c) => (ctx, w, h) => {
    ctx.fillStyle = c.accentDark
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = c.accent
    ctx.globalAlpha = 0.55
    ctx.lineWidth = 10
    for (let x = -h; x < w + h; x += 46) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + h, h)
        ctx.stroke()
    }
    ctx.globalAlpha = 1
}

// Cara de la dirección: borde "airmail", estampilla, matasellos y destinatario
const drawAddressSide = (c) => (ctx, w, h) => {
    paperGrain(ctx, w, h, c.paper)

    // Borde de correo aéreo
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, w, h)
    ctx.rect(18, 18, w - 36, h - 36)
    ctx.clip('evenodd')
    const stripes = [c.accent, c.paper, c.seal, c.paper]
    for (let x = -h, i = 0; x < w + h; x += 34, i++) {
        fillPath(ctx, [[x, 0], [x + 34, 0], [x + 34 - h, h], [x - h, h]], stripes[i % stripes.length])
    }
    ctx.restore()

    // Estampilla con borde perforado
    const sx = w - 200
    const sy = 52
    const sw = 140
    const sh = 168
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.25)'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(sx, sy, sw, sh)
    ctx.restore()
    ctx.fillStyle = c.paper
    for (let x = sx; x <= sx + sw; x += 14) {
        ctx.beginPath(); ctx.arc(x, sy, 5, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(x, sy + sh, 5, 0, Math.PI * 2); ctx.fill()
    }
    for (let y = sy; y <= sy + sh; y += 14) {
        ctx.beginPath(); ctx.arc(sx, y, 5, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(sx + sw, y, 5, 0, Math.PI * 2); ctx.fill()
    }
    const inner = ctx.createLinearGradient(0, sy, 0, sy + sh)
    inner.addColorStop(0, c.accent)
    inner.addColorStop(1, c.accentDark)
    ctx.fillStyle = inner
    ctx.fillRect(sx + 14, sy + 14, sw - 28, sh - 52)
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath(); ctx.arc(sx + sw / 2, sy + 60, 20, 0, Math.PI * 2); ctx.fill()
    fillPath(ctx, [[sx + 14, sy + sh - 38], [sx + 55, sy + 80], [sx + 80, sy + 110], [sx + 100, sy + 90], [sx + sw - 14, sy + sh - 38]], 'rgba(255,255,255,0.35)')
    ctx.fillStyle = c.ink
    ctx.font = `bold 20px ${SANS}`
    ctx.textAlign = 'center'
    ctx.fillText('CORREO', sx + sw / 2, sy + sh - 14)

    // Matasellos
    ctx.strokeStyle = c.ink
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 4
    const px = w - 290
    const py = 150
    ctx.beginPath(); ctx.arc(px, py, 70, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(px, py, 58, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = c.ink
    ctx.font = `bold 22px ${SANS}`
    ctx.fillText('CONTACT', px, py - 4)
    ctx.font = `18px ${SANS}`
    ctx.fillText('PORTFOLIO', px, py + 22)
    for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        for (let x = 0; x <= 260; x += 4) {
            const y = py - 36 + i * 24 + Math.sin(x / 18) * 7
            x === 0 ? ctx.moveTo(px - 80 - x, y) : ctx.lineTo(px - 80 - x, y)
        }
        ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Remitente
    ctx.textAlign = 'left'
    ctx.fillStyle = c.ink
    ctx.globalAlpha = 0.7
    ctx.font = `italic 30px ${HANDWRITING}`
    ctx.fillText('From: you, with a message ✦', 60, 90)
    ctx.globalAlpha = 1

    // Destinatario
    const ax = w * 0.36
    const ay = h * 0.56
    ctx.globalAlpha = 0.6
    ctx.font = `26px ${SANS}`
    ctx.fillText('For:', ax, ay - 70)
    ctx.globalAlpha = 1
    ctx.font = `64px ${HANDWRITING}`
    ctx.fillText('David Giler', ax, ay)
    ctx.font = `30px ${SANS}`
    ctx.fillText('Full Stack Developer', ax, ay + 66)
    ctx.fillText('Web Portfolio', ax, ay + 116)
    ctx.strokeStyle = c.ink
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 2
    ;[ay + 14, ay + 80, ay + 130].forEach((y) => {
        ctx.beginPath(); ctx.moveTo(ax, y); ctx.lineTo(w - 90, y); ctx.stroke()
    })
    ctx.globalAlpha = 1
}

const drawLetter = (c) => (ctx, w, h) => {
    paperGrain(ctx, w, h, c.letter)
    ctx.fillStyle = c.accent
    ctx.fillRect(0, 0, w, 56)
    ctx.fillStyle = c.ink
    ctx.font = `68px ${HANDWRITING}`
    ctx.fillText('¡Hello!', 70, 160)
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'
    ctx.lineWidth = 3
    for (let y = 220; y < h - 90; y += 52) {
        ctx.beginPath(); ctx.moveTo(70, y); ctx.lineTo(w - 70, y); ctx.stroke()
    }
    ctx.font = `44px ${HANDWRITING}`
    ctx.textAlign = 'right'
    ctx.fillText('— your message', w - 80, h - 40)
}

// Relieve del sello de lacre (fondo transparente)
const drawSealEmboss = (ctx, w, h) => {
    const cx = w / 2
    const cy = h / 2
    ctx.lineWidth = 6
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'
    ctx.beginPath(); ctx.arc(cx + 2, cy + 2, w * 0.4, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.beginPath(); ctx.arc(cx - 2, cy - 2, w * 0.4, 0, Math.PI * 2); ctx.stroke()
    ctx.font = `bold ${w * 0.38}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(0,0,0,0.32)'
    ctx.fillText('DG', cx + 3, cy + 4)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillText('DG', cx - 2, cy - 1)
}

// ---------- Utilidades de animación ----------

const clamp01 = (v) => Math.min(Math.max(v, 0), 1)
const segment = (p, start, end) => clamp01((p - start) / (end - start))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const { damp } = THREE.MathUtils

function Envelope({ onStateChange, onClose }) {
    const { theme } = useTheme()
    const colors = PALETTES[theme] ?? PALETTES.dark

    const followRef = useRef()   // Sigue al mouse (posición y rotación)
    const bodyRef = useRef()     // Vuelo y escala
    const flapRef = useRef()
    const letterRef = useRef()

    // Estado de la animación en refs para no re-renderizar en cada frame
    // 'closed' | 'opening' | 'open' | 'closing' | 'flyingAway' | 'returning'
    const stateRef = useRef('closed')
    const progressRef = useRef(0)
    const flyRef = useRef(0)
    const hoverRef = useRef(false)
    const closeCallbackRef = useRef(null)
    const mouseRef = useRef({ x: 0, y: 0, vx: 0 })
    const onStateChangeRef = useRef(onStateChange)
    onStateChangeRef.current = onStateChange

    const setEnvelopeState = (newState) => {
        stateRef.current = newState
        onStateChangeRef.current?.(newState)
    }

    // ---------- Geometrías (no dependen del tema) ----------
    const geometries = useMemo(() => {
        const bodyShape = roundedRectShape(WIDTH, HEIGHT, 0.08)
        const body = new THREE.ExtrudeGeometry(bodyShape, { depth: DEPTH, bevelEnabled: false, curveSegments: 6 })
        body.translate(0, 0, -DEPTH / 2)

        const face = normalizeUV(new THREE.ShapeGeometry(bodyShape, 6), -WIDTH / 2, -HEIGHT / 2, WIDTH, HEIGHT)

        const flapShape = new THREE.Shape()
        flapShape.moveTo(-WIDTH / 2, 0)
        flapShape.lineTo(-0.28, -FLAP_LENGTH + 0.14)
        flapShape.quadraticCurveTo(0, -FLAP_LENGTH - 0.02, 0.28, -FLAP_LENGTH + 0.14)
        flapShape.lineTo(WIDTH / 2, 0)
        flapShape.closePath()
        const flap = normalizeUV(new THREE.ShapeGeometry(flapShape, 12), -WIDTH / 2, -FLAP_LENGTH, WIDTH, FLAP_LENGTH)

        const letter = new THREE.PlaneGeometry(WIDTH * 0.9, HEIGHT * 0.86)
        const seal = new THREE.CylinderGeometry(0.3, 0.34, 0.07, 48)
        const sealTop = new THREE.CircleGeometry(0.28, 48)

        return { body, face, flap, letter, seal, sealTop }
    }, [])

    // ---------- Texturas (se regeneran al cambiar el tema) ----------
    const textures = useMemo(() => {
        const texW = 1024
        return {
            flapSide: createTexture(texW, Math.round(texW * HEIGHT / WIDTH), drawFlapSide(colors)),
            address: createTexture(texW, Math.round(texW * HEIGHT / WIDTH), drawAddressSide(colors)),
            flapOuter: createTexture(texW, Math.round(texW * FLAP_LENGTH / WIDTH), drawFlapOuter(colors)),
            flapLining: createTexture(texW, Math.round(texW * FLAP_LENGTH / WIDTH), drawFlapLining(colors)),
            letter: createTexture(texW, Math.round(texW * 0.86 * HEIGHT / (0.9 * WIDTH)), drawLetter(colors)),
            sealEmboss: createTexture(256, 256, drawSealEmboss),
        }
    }, [colors])

    useEffect(() => () => Object.values(textures).forEach((t) => t.dispose()), [textures])
    useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries])

    // Posición del mouse en toda la ventana, normalizada a [-1, 1]
    useEffect(() => {
        const handlePointerMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1
            mouseRef.current.vx = x - mouseRef.current.x
            mouseRef.current.x = x
            mouseRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
        }
        window.addEventListener('pointermove', handlePointerMove)
        return () => window.removeEventListener('pointermove', handlePointerMove)
    }, [])

    // Exponer las funciones al componente padre
    useEffect(() => {
        if (!onClose) return
        onClose.current = {
            // Animación inversa: guardar la carta y cerrar la solapa
            closeEnvelope: (onCloseComplete) => {
                if (stateRef.current !== 'open') return
                closeCallbackRef.current = onCloseComplete ?? null
                setEnvelopeState('closing')
            },
            // Hacer volar el sobre (después de enviar)
            flyAway: () => {
                if (stateRef.current !== 'closed') return
                flyRef.current = 0
                setEnvelopeState('flyingAway')
            },
        }
    })

    useFrame((state, delta) => {
        const follow = followRef.current
        const body = bodyRef.current
        if (!follow || !body) return

        const dt = Math.min(delta, 0.05)
        const t = state.clock.elapsedTime
        const mouse = mouseRef.current
        const current = stateRef.current

        // ----- Progreso de apertura / cierre -----
        if (current === 'opening') {
            progressRef.current = Math.min(progressRef.current + dt / OPEN_DURATION, 1)
            if (progressRef.current === 1) setEnvelopeState('open')
        } else if (current === 'closing') {
            progressRef.current = Math.max(progressRef.current - dt / CLOSE_DURATION, 0)
            if (progressRef.current === 0) {
                setEnvelopeState('closed')
                const callback = closeCallbackRef.current
                closeCallbackRef.current = null
                callback?.()
            }
        }

        const p = progressRef.current
        const flapOpen = easeInOut(segment(p, 0, 0.35))
        const letterSlide = easeInOut(segment(p, 0.3, 0.7))
        const letterForward = easeInOut(segment(p, 0.65, 1))

        // La solapa gira sobre su bisagra superior y queda inclinada hacia atrás
        flapRef.current.rotation.x = -flapOpen * Math.PI * 1.1

        const letter = letterRef.current
        letter.visible = p > 0.28
        letter.position.set(0, -0.05 + letterSlide * HEIGHT * 0.78 - letterForward * HEIGHT * 0.55, letterForward * 1.6)
        letter.scale.setScalar(1 + letterForward * 0.25)

        // ----- Seguimiento del mouse (solo con el sobre cerrado) -----
        const isIdle = current === 'closed'
        const mx = isIdle ? mouse.x : 0
        const my = isIdle ? mouse.y : 0
        mouse.vx = damp(mouse.vx, 0, 6, dt)

        follow.rotation.y = damp(follow.rotation.y, mx * Math.PI, 3.5, dt)
        follow.rotation.x = damp(follow.rotation.x, -my * 0.5, 3.5, dt)
        follow.rotation.z = damp(follow.rotation.z, -mouse.vx * 4 + Math.sin(t * 0.4) * 0.02, 4, dt)
        follow.position.x = damp(follow.position.x, mx * 0.7, 3, dt)
        follow.position.y = damp(follow.position.y, BASE_Y + my * 0.35 + (isIdle ? Math.sin(t * 0.9) * 0.12 : 0), 3, dt)

        // ----- Vuelo, reaparición y hover -----
        if (current === 'flyingAway') {
            flyRef.current = Math.min(flyRef.current + dt / FLY_DURATION, 1)
            const f = flyRef.current
            body.position.set(f * f * f * 22, f * 1.2, 0)
            body.rotation.z = -f * 0.35
            if (f === 1) {
                body.position.set(0, 0, 0)
                body.rotation.z = 0
                body.scale.setScalar(0.01)
                stateRef.current = 'returning'
            }
        } else {
            const targetScale = hoverRef.current && isIdle ? 1.05 : 1
            const scale = damp(body.scale.x, targetScale, current === 'returning' ? 5 : 8, dt)
            body.scale.setScalar(scale)
            if (current === 'returning' && scale > 0.98) setEnvelopeState('closed')
        }
    })

    const handleClick = (e) => {
        e.stopPropagation()
        if (stateRef.current !== 'closed') return
        setEnvelopeState('opening')
    }

    const handlePointerOver = () => {
        hoverRef.current = true
        document.body.classList.add('hovering-envelope')
    }

    const handlePointerOut = () => {
        hoverRef.current = false
        document.body.classList.remove('hovering-envelope')
    }

    const paperProps = { roughness: 0.85, metalness: 0 }

    return (
        <group ref={followRef} position={[0, BASE_Y, 0]}>
            <group
                ref={bodyRef}
                onClick={handleClick}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
            >
                {/* Cuerpo con canto redondeado */}
                <mesh geometry={geometries.body}>
                    <meshStandardMaterial color={colors.edge} {...paperProps} />
                </mesh>

                {/* Cara frontal: pliegues del sobre */}
                <mesh geometry={geometries.face} position={[0, 0, DEPTH / 2 + 0.002]}>
                    <meshStandardMaterial map={textures.flapSide} {...paperProps} />
                </mesh>

                {/* Cara trasera: dirección, estampilla y matasellos */}
                <mesh geometry={geometries.face} position={[0, 0, -DEPTH / 2 - 0.002]} rotation={[0, Math.PI, 0]}>
                    <meshStandardMaterial map={textures.address} {...paperProps} />
                </mesh>

                {/* Solapa con bisagra en el borde superior */}
                <group ref={flapRef} position={[0, HEIGHT / 2 - 0.01, DEPTH / 2 + 0.006]}>
                    <mesh geometry={geometries.flap} position={[0, 0, 0.002]}>
                        <meshStandardMaterial map={textures.flapOuter} {...paperProps} />
                    </mesh>
                    <mesh geometry={geometries.flap} rotation={[0, Math.PI, 0]}>
                        <meshStandardMaterial map={textures.flapLining} {...paperProps} />
                    </mesh>

                    {/* Sello de lacre */}
                    <group position={[0, -FLAP_LENGTH + 0.36, 0.004]}>
                        <mesh geometry={geometries.seal} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.035]}>
                            <meshStandardMaterial color={colors.seal} roughness={0.35} metalness={0.15} />
                        </mesh>
                        <mesh geometry={geometries.sealTop} position={[0, 0, 0.072]}>
                            <meshStandardMaterial map={textures.sealEmboss} transparent roughness={0.35} metalness={0.15} />
                        </mesh>
                    </group>
                </group>

                {/* Carta que sale del sobre */}
                <group ref={letterRef} visible={false}>
                    <mesh geometry={geometries.letter}>
                        <meshStandardMaterial map={textures.letter} roughness={0.9} />
                    </mesh>
                    <mesh geometry={geometries.letter} rotation={[0, Math.PI, 0]}>
                        <meshStandardMaterial color={colors.letter} roughness={0.9} />
                    </mesh>
                </group>
            </group>
        </group>
    )
}

export default Envelope
