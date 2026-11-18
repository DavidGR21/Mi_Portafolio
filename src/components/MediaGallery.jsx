import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { MEDIA_PLAY_EVENT, preloadGallery } from '../utils/mediaGallery';
import ThumbStrip from './ThumbStrip';
import '../styles/MediaGallery.css';

const pad = (n) => String(n).padStart(2, '0');

// m:ss
const formatTime = (s) => {
    if (!Number.isFinite(s)) return '0:00';
    const total = Math.floor(s);
    return `${Math.floor(total / 60)}:${pad(total % 60)}`;
};

// Controles propios en lugar de los nativos: los del navegador viven en un shadow DOM
// donde el cursor personalizado no sabe qué botón hay debajo. Con botones e inputs
// reales el efecto de hover se aplica solo sobre cada control.
function GalleryVideo({ item }) {
    const wrapRef = useRef(null);
    const videoRef = useRef(null);
    const [started, setStarted] = useState(false);
    const [paused, setPaused] = useState(true);
    const [current, setCurrent] = useState(0);
    const [duration, setDuration] = useState(0);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [fullscreen, setFullscreen] = useState(false);

    useEffect(() => {
        const handleChange = () => setFullscreen(document.fullscreenElement === wrapRef.current);
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

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

    const togglePlay = () => {
        const video = videoRef.current;
        if (video.paused || video.ended) video.play().catch(() => {});
        else video.pause();
    };

    const seek = (e) => {
        const time = Number(e.target.value);
        videoRef.current.currentTime = time;
        setCurrent(time);
    };

    const toggleMute = () => {
        const video = videoRef.current;
        video.muted = !video.muted;
        if (!video.muted && video.volume === 0) video.volume = 1;
    };

    const changeVolume = (e) => {
        const video = videoRef.current;
        video.volume = Number(e.target.value);
        video.muted = video.volume === 0;
    };

    const toggleFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else wrapRef.current.requestFullscreen?.().catch(() => {});
    };

    const syncVolume = () => {
        setMuted(videoRef.current.muted);
        setVolume(videoRef.current.volume);
        announce();
    };

    const progress = duration ? (current / duration) * 100 : 0;
    const volumeLevel = muted ? 0 : volume;

    return (
        <div ref={wrapRef} className={`gv${paused ? ' is-paused' : ''}${fullscreen ? ' is-fullscreen' : ''}`}>
            {/* "faststart" + preload=metadata: el póster aparece al instante y el video
                empieza a reproducirse mientras se sigue descargando */}
            <video
                ref={videoRef}
                className="gallery-media-el"
                src={item.src}
                poster={item.poster}
                preload="metadata"
                playsInline
                onClick={started ? togglePlay : start}
                onPlay={() => { setPaused(false); announce(); }}
                onPause={() => setPaused(true)}
                onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onDurationChange={(e) => setDuration(e.target.duration)}
                onVolumeChange={syncVolume}
            />
            {!started && (
                <button type="button" className="gallery-play" onClick={start} aria-label={`Play: ${item.caption}`}>
                    <Play size={22} strokeWidth={1.8} />
                </button>
            )}
            {started && (
                <div className="gv-controls">
                    <button type="button" className="gv-btn" onClick={togglePlay} aria-label={paused ? 'Play' : 'Pause'}>
                        {paused ? <Play size={15} /> : <Pause size={15} />}
                    </button>
                    <span className="gv-time">
                        {formatTime(current)} <span>/ {formatTime(duration)}</span>
                    </span>
                    <input
                        type="range"
                        className="gv-range gv-progress"
                        min="0"
                        max={duration || 0}
                        step="0.1"
                        value={current}
                        onChange={seek}
                        style={{ '--fill': `${progress}%` }}
                        aria-label="Seek"
                    />
                    <button type="button" className="gv-btn" onClick={toggleMute} aria-label={volumeLevel ? 'Mute' : 'Unmute'}>
                        {volumeLevel ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>
                    <input
                        type="range"
                        className="gv-range gv-volume"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volumeLevel}
                        onChange={changeVolume}
                        style={{ '--fill': `${volumeLevel * 100}%` }}
                        aria-label="Volume"
                    />
                    <button type="button" className="gv-btn" onClick={toggleFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
                        {fullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
                    </button>
                </div>
            )}
        </div>
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
            // Con el foco en los controles del video, las flechas son del video
            // (adelantar, volumen) y no cambian de captura
            if (e.target.closest?.('.gv-controls')) return;
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [go, onClose]);

    // Deslizar con el dedo en pantallas táctiles
    const handlePointerDown = (e) => {
        if (e.pointerType !== 'touch' || e.target.closest('.gv-controls')) return;
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
