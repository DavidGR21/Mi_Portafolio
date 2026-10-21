import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink } from 'lucide-react';
import PdfViewer from './PdfViewer';
import '../styles/CertificateModal.css';

/**
 * Visor de certificados en PDF.
 * Se renderiza en un portal sobre el body; se cierra con Escape o clic fuera.
 */
function CertificateModal({ course, theme, onClose }) {
    // Ruta respetando el `base` de vite.config.js
    const certificateUrl = `${import.meta.env.BASE_URL}${course.certificate}`;

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    return createPortal(
        <div className={`certificate-overlay ${theme}`} onClick={onClose}>
            <div
                className="certificate-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`Certificate: ${course.title}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="certificate-header">
                    <div>
                        <h5 className="certificate-title">{course.title}</h5>
                        <p className="certificate-provider">{course.provider}</p>
                    </div>
                    <div className="certificate-actions">
                        <a
                            className="certificate-btn"
                            href={certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in new tab"
                        >
                            <ExternalLink size={20} />
                        </a>
                        <button className="certificate-btn" onClick={onClose} title="Close">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <PdfViewer src={certificateUrl} title={course.title} />
            </div>
        </div>,
        document.body
    );
}

export default CertificateModal;
