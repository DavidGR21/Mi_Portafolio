import { useEffect, useRef } from 'react';
import '../styles/CustomScrollbar.css';

const MIN_THUMB_HEIGHT = 32;

/**
 * Barra de scroll minimalista que se adapta al tema.
 * - getMetrics(): { position, max, viewport, content } del contenido que se desplaza
 * - scrollTo(value): mueve el contenido a esa posición
 * Se lee en cada frame, así sigue cualquier tipo de scroll (nativo, de ventana o con inercia).
 */
function CustomScrollbar({ getMetrics, scrollTo, className = '' }) {
    const trackRef = useRef(null);
    const thumbRef = useRef(null);
    const getMetricsRef = useRef(getMetrics);
    const scrollToRef = useRef(scrollTo);
    getMetricsRef.current = getMetrics;
    scrollToRef.current = scrollTo;

    useEffect(() => {
        const track = trackRef.current;
        const thumb = thumbRef.current;
        const state = { trackHeight: track.clientHeight, thumbHeight: 0, max: 0, hidden: null };

        const resizeObserver = new ResizeObserver(() => {
            state.trackHeight = track.clientHeight;
        });
        resizeObserver.observe(track);

        let frameId;
        const tick = () => {
            const { position, max, viewport, content } = getMetricsRef.current();
            state.max = max;

            const hidden = max <= 0;
            if (hidden !== state.hidden) {
                state.hidden = hidden;
                track.classList.toggle('is-hidden', hidden);
            }

            if (!hidden) {
                // Tamaño proporcional a la parte visible del contenido
                const thumbHeight = Math.max(state.trackHeight * (viewport / content), MIN_THUMB_HEIGHT);
                if (thumbHeight !== state.thumbHeight) {
                    state.thumbHeight = thumbHeight;
                    thumb.style.height = `${thumbHeight}px`;
                }
                const progress = Math.min(Math.max(position / max, 0), 1);
                thumb.style.transform = `translate3d(0, ${progress * (state.trackHeight - thumbHeight)}px, 0)`;
            }

            frameId = requestAnimationFrame(tick);
        };
        frameId = requestAnimationFrame(tick);

        // Arrastrar el thumb o hacer clic en la pista
        let drag = null;
        const handlePointerDown = (e) => {
            if (state.max <= 0) return;
            e.preventDefault();
            const travel = state.trackHeight - state.thumbHeight;
            let startPosition = getMetricsRef.current().position;
            if (e.target !== thumb) {
                const trackTop = track.getBoundingClientRect().top;
                startPosition = ((e.clientY - trackTop - state.thumbHeight / 2) / travel) * state.max;
                scrollToRef.current(startPosition);
            }
            drag = { startY: e.clientY, startPosition, travel };
            track.setPointerCapture(e.pointerId);
            track.classList.add('is-dragging');
        };
        const handlePointerMove = (e) => {
            if (!drag) return;
            const value = drag.startPosition + ((e.clientY - drag.startY) / drag.travel) * state.max;
            scrollToRef.current(Math.min(Math.max(value, 0), state.max));
        };
        const handlePointerUp = (e) => {
            if (!drag) return;
            drag = null;
            track.releasePointerCapture(e.pointerId);
            track.classList.remove('is-dragging');
        };

        track.addEventListener('pointerdown', handlePointerDown);
        track.addEventListener('pointermove', handlePointerMove);
        track.addEventListener('pointerup', handlePointerUp);
        track.addEventListener('pointercancel', handlePointerUp);

        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            track.removeEventListener('pointerdown', handlePointerDown);
            track.removeEventListener('pointermove', handlePointerMove);
            track.removeEventListener('pointerup', handlePointerUp);
            track.removeEventListener('pointercancel', handlePointerUp);
        };
    }, []);

    return (
        <div className={`custom-scrollbar ${className}`} ref={trackRef} aria-hidden="true">
            <div className="custom-scrollbar-thumb" ref={thumbRef} />
        </div>
    );
}

export default CustomScrollbar;
