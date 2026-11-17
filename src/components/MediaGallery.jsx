import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { MEDIA_PLAY_EVENT, preloadGallery } from '../utils/mediaGallery';
import ThumbStrip from './ThumbStrip';
import '../styles/MediaGallery.css';

const pad = (n) => String(n).padStart(2, '0');

function GalleryVideo({ item }) {
    const videoRef = useRef(null);
    const [started, setStarted] = useState(false);

    // Si empieza a sonar la música, se pausa el video
    useEffect(() => {
        const handleOtherMedia = (e) => {
            if (e.detail?.source !== 'gallery') videoRef.current?.pause();
        };
        window.addEventListener(MEDIA_PLAY_EVENT, handleOtherMedia);
        return () => window.removeEventListener(MEDIA_PLAY_EVENT, handleOtherMedia);
    }, []);

    const announce = () => {
        const video = videoRef.current;
        if (video && !video.paused && !video.muted) {
            window.dispatchEvent(new CustomEvent(MEDIA_PLAY_EVENT, { detail: { source: 'gallery' } }));
        }
    };

    const start = () => {
        setStarted(true);
        videoRef.current.play().catch(() => {});
    };

    return (
        <>
            {/* "faststart" + preload=metadata: el póster aparece al instante y el video
                empieza a reproducirse mientras se sigue descargando */}
            <video
                ref={videoRef}
                className="gallery-media-el"
                src={item.src}
                poster={item.poster}
                preload="metadata"
                playsInline
                controls={started}
                onPlay={announce}
                onVolumeChange={announce}
            />
            {!started && (
                <button type="button" className="gallery-play" onClick={start} aria-label={`Play: ${item.caption}`}>
                    <Play size={22} strokeWidth={1.8} />
                </button>
            )}
        </>
    );
}

// Visor de capturas y videos de un proyecto. Se renderiza dentro de #projects
// para heredar los colores del tema y deja libre la zona del reproductor de música.
// startIndex: se abre en la imagen que se estaba viendo en el carrusel
function MediaGallery({ project, startIndex = 0, onClose }) {
    const media = project.media;
    const [index, setIndex] = useState(startIndex);
    const [direction, setDirection] = useState(1);
    const swipeRef = useRef(null);
    const item = media[index];

    const go = useCallback((step) => {
        setDirection(step);
        setIndex((i) => (i + step + media.length) % media.length);
    }, [media.length]);

    const select = (i) => {
        setDirection(i >= index ? 1 : -1);
        setIndex(i);
    };

    // Imágenes grandes precargadas: al cambiar de diapositiva aparecen sin espera
    useEffect(() => {
        preloadGallery(media);
    }, [media]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            // Con el foco en el video, las flechas adelantan/retroceden el video
            if (e.target.tagName === 'VIDEO') return;
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [go, onClose]);

    // Deslizar con el dedo en pantallas táctiles
    const handlePointerDown = (e) => {
        if (e.pointerType !== 'touch' || e.target.tagName === 'VIDEO') return;
        swipeRef.current = e.clientX;
    };
    const handlePointerUp = (e) => {
        if (swipeRef.current === null) return;
        const dx = e.clientX - swipeRef.current;
        swipeRef.current = null;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    };

    return (
        <div
            className="gallery-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} gallery`}
            onClick={onClose}
        >
            <div className="gallery-card" onClick={(e) => e.stopPropagation()}>
                <header className="gallery-head">
                    <div className="gallery-heading">
                        <span className="gallery-kicker">Gallery</span>
                        <h3 className="gallery-title title-teko">{project.title}</h3>
                    </div>
                    <button type="button" className="gallery-btn gallery-close" onClick={onClose} aria-label="Close" autoFocus>
                        <X size={16} />
                    </button>
                </header>

                <div
                    className="gallery-stage"
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={() => { swipeRef.current = null; }}
                >
                    <div key={index} className="gallery-media" style={{ '--dir': direction }}>
                        {item.type === 'video'
                            ? <GalleryVideo item={item} />
                            : <img className="gallery-media-el" src={item.src} alt={item.caption} decoding="async" draggable="false" />}
                    </div>

                    {media.length > 1 && (
                        <>
                            <button type="button" className="gallery-btn gallery-nav is-prev" onClick={() => go(-1)} aria-label="Previous">
                                <ChevronLeft size={18} />
                            </button>
                            <button type="button" className="gallery-btn gallery-nav is-next" onClick={() => go(1)} aria-label="Next">
                                <ChevronRight size={18} />
                            </button>
                        </>
                    )}

                    <span className="gallery-corner c1" />
                    <span className="gallery-corner c2" />
                    <span className="gallery-corner c3" />
                    <span className="gallery-corner c4" />
                </div>

                <div className="gallery-meta">
                    <span key={index} className="gallery-caption text-chivo">{item.caption}</span>
                    <span className="gallery-count">
                        {pad(index + 1)} <span>/ {pad(media.length)}</span>
                    </span>
                </div>

                <ThumbStrip media={media} index={index} onSelect={select} className="gallery-strip" />
            </div>
        </div>
    );
}

export default MediaGallery;
