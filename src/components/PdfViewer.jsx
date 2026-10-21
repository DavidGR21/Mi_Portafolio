import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import CustomScrollbar from './CustomScrollbar';

GlobalWorkerOptions.workerSrc = workerUrl;

// Resolución máxima de renderizado (evita canvas enormes en pantallas de alta densidad)
const MAX_PIXEL_RATIO = 2;

/**
 * Visor de PDF propio: dibuja cada página en un canvas con pdf.js,
 * sin la barra de herramientas del visor del navegador, y usa la CustomScrollbar del portafolio.
 */
function PdfViewer({ src, title }) {
    const scrollRef = useRef(null);
    const pagesRef = useRef(null);
    const [status, setStatus] = useState('loading'); // loading | ready | error

    useEffect(() => {
        const container = pagesRef.current;
        let cancelled = false;
        const loadingTask = getDocument(src);

        const render = async () => {
            const pdf = await loadingTask.promise;
            // Ancho disponible para la página (sin el padding del contenedor)
            const styles = getComputedStyle(container);
            const width = container.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
            const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                if (cancelled) return;
                const page = await pdf.getPage(pageNumber);
                const baseViewport = page.getViewport({ scale: 1 });
                const viewport = page.getViewport({ scale: (width / baseViewport.width) * pixelRatio });

                const canvas = document.createElement('canvas');
                canvas.className = 'pdf-page';
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                canvas.setAttribute('aria-label', `${title} - page ${pageNumber}`);
                container.appendChild(canvas);

                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                // Se muestra en cuanto la primera página está lista
                if (!cancelled && pageNumber === 1) setStatus('ready');
            }
        };

        render().catch((error) => {
            if (!cancelled) {
                console.error('Error loading PDF:', error);
                setStatus('error');
            }
        });

        return () => {
            cancelled = true;
            loadingTask.destroy();
            container.replaceChildren();
        };
    }, [src, title]);

    const getScrollMetrics = () => {
        const el = scrollRef.current;
        return {
            position: el.scrollTop,
            max: el.scrollHeight - el.clientHeight,
            viewport: el.clientHeight,
            content: el.scrollHeight,
        };
    };

    const scrollViewerTo = (value) => {
        scrollRef.current.scrollTop = value;
    };

    return (
        <div className="pdf-viewer">
            <div className="pdf-scroll" ref={scrollRef}>
                <div className={`pdf-pages ${status === 'ready' ? 'is-ready' : ''}`} ref={pagesRef} />
            </div>

            {status === 'loading' && <div className="pdf-status">Loading certificate...</div>}
            {status === 'error' && (
                <div className="pdf-status">The certificate could not be loaded. Open it in a new tab.</div>
            )}

            <CustomScrollbar
                className="pdf-scrollbar"
                getMetrics={getScrollMetrics}
                scrollTo={scrollViewerTo}
            />
        </div>
    );
}

export default PdfViewer;
