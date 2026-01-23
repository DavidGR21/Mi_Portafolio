import { useEffect, useState, useRef } from 'react';
import '../styles/CustomCursor.css';

function CustomCursor() {
    const [particles, setParticles] = useState([]);
    const [isHovering, setIsHovering] = useState(false);
    const [isDraggable, setIsDraggable] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const cursorRef = useRef(null);
    const ringRef = useRef(null);
    const particlesRef = useRef([]);
    const lastParticleTime = useRef(0);
    const MAX_PARTICLES = 30; // Limitar partículas activas
    const PARTICLE_INTERVAL = 10; // ms entre partículas

    useEffect(() => {
        // Detectar si es un dispositivo móvil o táctil
        const checkIfMobile = () => {
            return (
                'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            );
        };

        const mobile = checkIfMobile();
        setIsMobile(mobile);

        // Si es móvil, no iniciar los eventos del cursor
        if (mobile) return;

        let particleId = 0;
        let animationFrameId;

        const handleMouseMove = (e) => {
            // Actualizar posición del cursor directamente en el DOM (más eficiente)
            if (cursorRef.current) {
                cursorRef.current.style.left = `${e.clientX}px`;
                cursorRef.current.style.top = `${e.clientY}px`;
            }
            if (ringRef.current) {
                ringRef.current.style.left = `${e.clientX}px`;
                ringRef.current.style.top = `${e.clientY}px`;
            }

            // Detectar si está sobre un elemento clickeable o si el body tiene la clase hovering-envelope
            const target = e.target;
            const isClickable = target.closest('a, button, [role="button"], input, textarea, select, .clickable');
            const isHoveringEnvelope = document.body.classList.contains('hovering-envelope');
            
            // Verificar si está sobre el área del slider usando las coordenadas
            let isDraggableArea = false;
            const slider = document.querySelector('.banner .slider');
            if (slider && target.closest('.banner') && !target.closest('.pagination-controls, .pagination-btn, .pagination-info')) {
                const rect = slider.getBoundingClientRect();
                const paddingVertical = 30;
                const paddingHorizontal = 135; // Área extra horizontal
                isDraggableArea = (
                    e.clientX >= rect.left - paddingHorizontal &&
                    e.clientX <= rect.right + paddingHorizontal &&
                    e.clientY >= rect.top - paddingVertical &&
                    e.clientY <= rect.bottom + paddingVertical
                );
            }
            
            setIsHovering(!!isClickable || isHoveringEnvelope);
            setIsDraggable(isDraggableArea && !isClickable);

            // Crear nueva partícula con throttling
            const now = Date.now();
            if (now - lastParticleTime.current > PARTICLE_INTERVAL && particlesRef.current.length < MAX_PARTICLES) {
                lastParticleTime.current = now;
                
                const newParticle = {
                    id: particleId++,
                    x: e.clientX,
                    y: e.clientY,
                    size: Math.random() * 6 + 4,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5,
                    life: 1,
                };

                particlesRef.current.push(newParticle);
            }
        };

        const animate = () => {
            // Actualizar partículas
            particlesRef.current = particlesRef.current
                .map(particle => ({
                    ...particle,
                    x: particle.x + particle.vx,
                    y: particle.y + particle.vy,
                    life: particle.life - 0.04,
                }))
                .filter(particle => particle.life > 0);

            // Solo actualizar state si hay cambios significativos
            setParticles([...particlesRef.current]);

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // No renderizar el cursor en dispositivos móviles
    if (isMobile) return null;

    return (
        <>
            {/* Cursor principal */}
            <div
                ref={cursorRef}
                className={`custom-cursor ${isHovering ? 'hovering' : ''} ${isDraggable ? 'draggable' : ''}`}
            >
                {isDraggable && (
                    <div className="drag-arrows">
                        <span className="drag-arrow-left">←</span>
                        <span className="drag-arrow-right">→</span>
                    </div>
                )}
            </div>

            {/* Anillo exterior al hacer hover */}
            {isHovering && (
                <div
                    ref={ringRef}
                    className="cursor-ring"
                />
            )}

            {/* Partículas trail */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="cursor-particle"
                    style={{
                        left: `${particle.x}px`,
                        top: `${particle.y}px`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        opacity: particle.life,
                    }}
                />
            ))}
        </>
    );
}

export default CustomCursor;
