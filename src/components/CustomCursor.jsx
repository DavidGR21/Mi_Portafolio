import { useEffect, useState, useRef } from 'react';
import '../styles/CustomCursor.css';

// Factor de suavizado (0-1, a mayor valor sigue más rápido al mouse)
const DOT_SMOOTHING = 0.45;
const RING_SMOOTHING = 0.16;
const MAX_PARTICLES = 60;
const PARTICLE_SPACING = 7; // px de recorrido entre partículas
const CLICKABLE_SELECTOR = 'a, button, [role="button"], input, textarea, select, .clickable';

// Colores del trail según tema [inicio, fin]
const TRAIL_COLORS = {
    dark: ['255, 60, 0', '255, 150, 40'],
    light: ['8, 145, 178', '99, 102, 241'],
};

// Interpolación independiente del framerate
const smooth = (factor, dt) => 1 - Math.pow(1 - factor, dt / 16.67);

function CustomCursor() {
    const [isDraggable, setIsDraggable] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const mobile =
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        setIsMobile(mobile);
        if (mobile) return;

        const dot = dotRef.current;
        const ring = ringRef.current;
        const canvas = canvasRef.current;
        if (!dot || !ring || !canvas) return;
        const ctx = canvas.getContext('2d');

        // Posición real del mouse, y posiciones suavizadas del punto y el anillo
        const mouse = { x: -100, y: -100 };
        const dotPos = { x: -100, y: -100 };
        const ringPos = { x: -100, y: -100 };
        const lastSpawn = { x: null, y: null };
        let particles = [];
        let started = false;
        let hovering = false;
        let draggable = false;
        let animationFrameId;
        let lastTime = performance.now();

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resizeCanvas();

        const spawnParticle = (x, y) => {
            if (particles.length >= MAX_PARTICLES) particles.shift();
            particles.push({
                x,
                y,
                size: Math.random() * 5 + 5,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                life: 1,
            });
        };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;

            // La primera vez, colocar todo en la posición del mouse (evita "volar" desde la esquina)
            if (!started) {
                started = true;
                dotPos.x = ringPos.x = lastSpawn.x = mouse.x;
                dotPos.y = ringPos.y = lastSpawn.y = mouse.y;
                dot.classList.add('visible');
                ring.classList.add('visible');
            }

            const target = e.target;
            const isClickable = !!target.closest(CLICKABLE_SELECTOR);
            const isHoveringEnvelope = document.body.classList.contains('hovering-envelope');

            // Área del slider donde se puede arrastrar
            let isDraggableArea = false;
            const slider = document.querySelector('.banner .slider');
            if (slider && target.closest('.banner') && !target.closest('.pagination-controls, .pagination-btn, .pagination-info')) {
                const rect = slider.getBoundingClientRect();
                const paddingVertical = 30;
                const paddingHorizontal = 135;
                isDraggableArea =
                    e.clientX >= rect.left - paddingHorizontal &&
                    e.clientX <= rect.right + paddingHorizontal &&
                    e.clientY >= rect.top - paddingVertical &&
                    e.clientY <= rect.bottom + paddingVertical;
            }

            // Solo tocar el DOM / React cuando el estado realmente cambia
            const nextHovering = isClickable || isHoveringEnvelope;
            if (nextHovering !== hovering) {
                hovering = nextHovering;
                dot.classList.toggle('hovering', hovering);
                ring.classList.toggle('hovering', hovering);
            }

            const nextDraggable = isDraggableArea && !isClickable;
            if (nextDraggable !== draggable) {
                draggable = nextDraggable;
                setIsDraggable(draggable);
                dot.classList.toggle('draggable', draggable);
                ring.classList.toggle('draggable', draggable);
            }
        };

        const handleMouseDown = () => {
            dot.classList.add('pressed');
            ring.classList.add('pressed');
        };
        const handleMouseUp = () => {
            dot.classList.remove('pressed');
            ring.classList.remove('pressed');
        };
        const handleLeave = () => {
            dot.classList.remove('visible');
            ring.classList.remove('visible');
            started = false;
            lastSpawn.x = lastSpawn.y = null;
        };

        const animate = (now) => {
            const dt = Math.min(now - lastTime, 64);
            lastTime = now;

            // Seguir al mouse con suavizado
            const kDot = smooth(DOT_SMOOTHING, dt);
            const kRing = smooth(RING_SMOOTHING, dt);
            dotPos.x += (mouse.x - dotPos.x) * kDot;
            dotPos.y += (mouse.y - dotPos.y) * kDot;
            ringPos.x += (mouse.x - ringPos.x) * kRing;
            ringPos.y += (mouse.y - ringPos.y) * kRing;

            dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`;
            ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;

            // Partículas a lo largo del recorrido del punto (trail continuo)
            if (started && lastSpawn.x !== null) {
                const dx = dotPos.x - lastSpawn.x;
                const dy = dotPos.y - lastSpawn.y;
                const dist = Math.hypot(dx, dy);
                if (dist >= PARTICLE_SPACING) {
                    const steps = Math.min(Math.floor(dist / PARTICLE_SPACING), 8);
                    for (let i = 1; i <= steps; i++) {
                        const t = i / steps;
                        spawnParticle(lastSpawn.x + dx * t, lastSpawn.y + dy * t);
                    }
                    lastSpawn.x = dotPos.x;
                    lastSpawn.y = dotPos.y;
                }
            }

            // Dibujar trail en canvas (sin re-renders de React)
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            if (particles.length) {
                const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
                const [c1, c2] = TRAIL_COLORS[theme];
                const decay = 0.045 * (dt / 16.67);
                ctx.globalCompositeOperation = theme === 'dark' ? 'lighter' : 'source-over';

                particles = particles.filter((p) => p.life > 0);
                for (const p of particles) {
                    p.x += p.vx * (dt / 16.67);
                    p.y += p.vy * (dt / 16.67);
                    p.life -= decay;
                    if (p.life <= 0) continue;

                    const r = p.size * (0.4 + p.life * 0.6);
                    const color = p.life > 0.5 ? c1 : c2;
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
                    gradient.addColorStop(0, `rgba(${color}, ${p.life * (theme === 'light' ? 0.95 : 0.9)})`);
                    gradient.addColorStop(1, `rgba(${color}, 0)`);
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('resize', resizeCanvas);
        document.documentElement.addEventListener('mouseleave', handleLeave);
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('resize', resizeCanvas);
            document.documentElement.removeEventListener('mouseleave', handleLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // No renderizar el cursor en dispositivos móviles
    if (isMobile) return null;

    return (
        <>
            {/* Trail de partículas */}
            <canvas ref={canvasRef} className="cursor-trail" />

            {/* Anillo exterior (siempre visible, sigue con más inercia) */}
            <div ref={ringRef} className="cursor-ring" />

            {/* Cursor principal */}
            <div ref={dotRef} className="custom-cursor">
                {isDraggable && (
                    <div className="drag-arrows">
                        <span className="drag-arrow-left">←</span>
                        <span className="drag-arrow-right">→</span>
                    </div>
                )}
            </div>
        </>
    );
}

export default CustomCursor;
