// CvDossier.jsx
// Hoja de vida presentada como un expediente: una carpeta de la que asoma la
// hoja. Al pasar el cursor (o al enfocar un botón) la carpeta se abre y la hoja
// sale un poco más; un clic en la carpeta abre el visor de PDF.
// Todo es CSS: la hoja es una miniatura esquemática, no se carga el PDF hasta
// que se pide la vista previa.
import { Eye, Download } from 'lucide-react';
import '../styles/CvDossier.css';

// Bloques de la miniatura: cada uno es un título de sección y sus renglones
const SHEET_BLOCKS = [3, 4, 2, 3];

export default function CvDossier({ cv, onPreview }) {
  // Ruta respetando el `base` de vite.config.js
  const fileUrl = `${import.meta.env.BASE_URL}${cv.file}`;

  return (
    <div className="cv-dossier">
      <button
        type="button"
        className="cv-folder"
        onClick={onPreview}
        aria-label={`Preview ${cv.title}`}
      >
        <span className="cv-folder-back" aria-hidden="true" />

        <span className="cv-sheet" aria-hidden="true">
          <span className="cv-sheet-name">DAVID GILER</span>
          <span className="cv-sheet-role" />
          {SHEET_BLOCKS.map((lines, block) => (
            <span key={block} className="cv-sheet-block">
              <span className="cv-sheet-heading" />
              {Array.from({ length: lines }, (_, line) => (
                <span key={line} className="cv-sheet-line" />
              ))}
            </span>
          ))}
        </span>

        <span className="cv-folder-front" aria-hidden="true">
          <span className="cv-folder-label title-teko">CV</span>
          <span className="cv-folder-badge">PDF</span>
        </span>
      </button>

      <div className="cv-info">
        <h5 className="cv-title title-teko">{cv.title}</h5>
        <p className="cv-subtitle text-chivo">{cv.subtitle}</p>
        <ul className="cv-tags">
          {cv.tags.map((tag) => (
            <li key={tag} className="cv-tag">{tag}</li>
          ))}
        </ul>
        <div className="cv-actions">
          <button type="button" className="cv-btn cv-btn--primary" onClick={onPreview}>
            <Eye size={16} /> Preview
          </button>
          <a className="cv-btn" href={fileUrl} download={cv.downloadName}>
            <Download size={16} /> Download
          </a>
        </div>
      </div>
    </div>
  );
}
