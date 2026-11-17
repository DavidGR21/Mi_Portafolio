import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import ThumbStrip from './ThumbStrip';
import { preloadGallery } from '../utils/mediaGallery';
import '../styles/MediaCarousel.css';

// Tiempo que se muestra cada captura antes de pasar a la siguiente
const IMAGE_DURATION = 5000;

const pad = (n) => String(n).padStart(2, '0');
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Diapositiva: imagen, o el video en silencio (como el trailer de una tienda de juegos)
function Slide({ item, active, paused, onEnded, progressRef }) {
    const videoRef = useRef(null);

    // Pausa el video cuando se abre la galería ampliada
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !active) return;
        if (paused) video.pause();
        else video.play().catch(() => {});
    }, [paused, active]);

    if (item.type !== 'video' || !active) {
        // La diapositiva saliente de un video se queda en su póster
        return (
            <img
                className="mc-media"
                src={item.type === 'video' ? item.poster : item.src}
                alt={active ? item.caption : ''}
                decoding="async"
                draggable="false"
            />
        );
    }

    // El progreso del video se pinta directamente (sin re-render en cada fotograma)
    const handleTimeUpdate = (e) => {
        const { currentTime, duration } = e.currentTarget;
        if (progressRef.current && duration) {
            progressRef.current.style.transform = `scaleX(${currentTime / duration})`;
        }
    };

    return (
        <video
            ref={videoRef}
            className="mc-media"
            src={item.src}
            poster={item.poster}
            muted
            playsInline
            autoPlay={!paused}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onEnded={onEnded}
        />
    );
}

// Carrusel de capturas y videos de un proyecto: visor grande, barra de progreso
// y tira de miniaturas. Avanza solo (se detiene al pasar el mouse) y al hacer clic
// abre la galería ampliada en la misma diapositiva.
function MediaCarousel({ media, paused = false, onOpen, className = '' }) {
    const [index, setIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(null);
    const [hovered, setHovered] = useState(false);
    const [autoplay] = useState(() => media.length > 1 && !prefersReducedMotion());
    const progressRef = useRef(null);
    const swipeRef = useRef({ x: null, swiped: false });
    const item = media[index];

    // La diapositiva anterior se mantiene debajo mientras entra la nueva
    const goTo = useCallback((next) => {
        if (next === index) return;
        setPrevIndex(index);
        setIndex(next);
    }, [index]);

    const step = useCallback((dir) => {
        goTo((index + dir + media.length) % media.length);
    }, [goTo, index, media.length]);

    // Las capturas grandes pesan pocos KB: se precargan todas al entrar al proyecto
    useEffect(() => {
        preloadGallery(media);
    }, [media]);

    // Al cambiar de diapositiva la barra de progreso empieza de cero
    useEffect(() => {
        if (progressRef.current) progressRef.current.style.transform = '';
    }, [index]);

    const handleEnded = () => {
        if (autoplay) step(1);
    };

    // Deslizar con el dedo; un deslizamiento no cuenta como clic
    const handlePointerDown = (e) => {
        swipeRef.current = { x: e.pointerType === 'touch' ? e.clientX : null, swiped: false };
    };
    const handlePointerUp = (e) => {
        const { x } = swipeRef.current;
        if (x === null) return;
        const dx = e.clientX - x;
        if (Math.abs(dx) > 40) {
            swipeRef.current.swiped = true;
            step(dx < 0 ? 1 : -1);
        }
    };
    const handleClick = () => {
        if (swipeRef.current.swiped) return;
        onOpen(index);
    };

    const timerPaused = paused || hovered;

    return (
        <div
            className={`media-carousel ${className}`}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            <button
                type="button"
                className="mc-viewer"
                onClick={handleClick}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                aria-label={`Open gallery: ${item.caption}`}
            >
                {prevIndex !== null && prevIndex !== index && (
                    <div key={`prev-${prevIndex}`} className="mc-slide is-prev" aria-hidden="true">
                        <Slide item={media[prevIndex]} active={false} />
                    </div>
                )}
                <div key={index} className={`mc-slide is-current${prevIndex !== null ? ' is-wipe' : ''}`}>
                    <Slide
                        item={item}
                        active
                        paused={paused}
                        onEnded={handleEnded}
                        progressRef={progressRef}
                    />
                </div>

                {item.type === 'video' && (
                    <span className="mc-tag">
                        <span className="mc-tag-dot" />
                        Trailer
                    </span>
                )}
                <span className="mc-expand" aria-hidden="true">
                    <Maximize2 size={13} strokeWidth={2} />
                </span>
            </button>

            {/* Progreso: en las capturas lo marca una animación CSS (que se pausa sola
                con el mouse encima); en el video, su tiempo de reproducción */}
            <div className="mc-progress" aria-hidden="true">
                {item.type === 'video' ? (
                    <span ref={progressRef} className="mc-progress-bar is-video" />
                ) : autoplay ? (
                    <span
                        key={index}
                        className="mc-progress-bar is-timed"
                        style={{
                            animationDuration: `${IMAGE_DURATION}ms`,
                            animationPlayState: timerPaused ? 'paused' : 'running',
                        }}
                        onAnimationEnd={() => step(1)}
                    />
                ) : null}
            </div>

            <div className="mc-meta">
                <span className="mc-count">
                    {pad(index + 1)} <span>/ {pad(media.length)}</span>
                </span>
                <span key={index} className="mc-caption">{item.caption}</span>
                <button type="button" className="mc-open" onClick={() => onOpen(index)}>
                    Gallery
                    <Maximize2 size={11} strokeWidth={2.2} />
                </button>
            </div>

            <ThumbStrip media={media} index={index} onSelect={goTo} className="mc-strip" />
        </div>
    );
}

export default MediaCarousel;
