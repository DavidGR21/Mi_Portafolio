import { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import '../styles/ThumbStrip.css';

// Tira horizontal de miniaturas (carrusel de la vista previa y galería ampliada).
// La activa se mantiene centrada, los bordes se desvanecen solo donde quedan
// miniaturas ocultas y la rueda vertical del mouse la desplaza en horizontal.
function ThumbStrip({ media, index, onSelect, className = '' }) {
    const stripRef = useRef(null);

    // Centrar la activa sin mover la página (scrollIntoView desplazaría a los padres)
    useEffect(() => {
        const strip = stripRef.current;
        const thumb = strip?.children[index];
        if (!thumb) return;
        strip.scrollTo({
            left: thumb.offsetLeft - strip.clientWidth / 2 + thumb.offsetWidth / 2,
            behavior: 'smooth',
        });
    }, [index]);

    useEffect(() => {
        const strip = stripRef.current;
        const updateEdges = () => {
            const max = strip.scrollWidth - strip.clientWidth;
            strip.classList.toggle('has-more-left', strip.scrollLeft > 2);
            strip.classList.toggle('has-more-right', strip.scrollLeft < max - 2);
        };
        const handleWheel = (e) => {
            if (strip.scrollWidth <= strip.clientWidth) return;
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            // La rueda mueve la tira y no la lista de proyectos de detrás
            e.preventDefault();
            e.stopPropagation();
            strip.scrollLeft += e.deltaY;
        };
        updateEdges();
        const observer = new ResizeObserver(updateEdges);
        observer.observe(strip);
        strip.addEventListener('scroll', updateEdges, { passive: true });
        strip.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            observer.disconnect();
            strip.removeEventListener('scroll', updateEdges);
            strip.removeEventListener('wheel', handleWheel);
        };
    }, []);

    return (
        <div className={`thumb-strip ${className}`} ref={stripRef} role="tablist" aria-label="Media">
            {media.map((item, i) => (
                <button
                    key={item.src}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={item.caption}
                    className={`thumb-strip-item${i === index ? ' is-active' : ''}`}
                    onClick={() => onSelect(i)}
                >
                    <img src={item.thumb} alt="" decoding="async" draggable="false" />
                    {item.type === 'video' && (
                        <span className="thumb-strip-badge"><Play size={9} strokeWidth={2.6} /></span>
                    )}
                </button>
            ))}
        </div>
    );
}

export default ThumbStrip;
