// CourseCertificates.jsx
// Cursos: cada certificado es una fila con un pequeño diploma 3D (solo CSS,
// mismo lenguaje que la escuela de Education) y su tarjeta compacta. Las filas
// se van alternando: el diploma cae a la izquierda, luego a la derecha, etc.,
// así que basta con añadir cursos en aboutMeData para que se entrelacen solos.
//
// En lugar de un botón "View certificate", la tarjeta termina en un resguardo
// tipo ticket con un ojo cerrado que se abre al pasar el cursor: un clic en la
// tarjeta (o en el resguardo) abre el visor del PDF.
import '../styles/CourseCertificates.css';

// Diploma enmarcado sobre una peana, con su sello y sus cintas
function Diploma() {
  return (
    <div className="cert-scene" aria-hidden="true">
      <div className="cert-model">
        <span className="cert-shadow" />

        <span className="cert-box cert-plinth">
          <span className="cert-face cert-face--left" />
          <span className="cert-face cert-face--right" />
          <span className="cert-face cert-face--top" />
          <span className="cert-face cert-face--front" />
        </span>

        <span className="cert-box cert-plaque">
          <span className="cert-face cert-face--left" />
          <span className="cert-face cert-face--right" />
          <span className="cert-face cert-face--top" />
          <span className="cert-face cert-face--front">
            {/* Hoja: título, renglones y firma (--n escalona el encendido) */}
            <span className="cert-paper">
              <span className="cert-head" />
              <i style={{ '--n': 0 }} />
              <i style={{ '--n': 1 }} />
              <i style={{ '--n': 2 }} />
              <span className="cert-sign" />
              <span className="cert-shine" />
            </span>
            <span className="cert-seal">
              <span className="cert-seal-disc" />
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}

// Ojo: el párpado superior está volteado sobre el inferior (cerrado) y se
// levanta al abrirse, dejando ver la pupila
const ViewEye = () => (
  <svg className="cert-eye" viewBox="0 0 24 24" aria-hidden="true">
    <path className="cert-eye-lashes" d="M6.5 18.5 5 21M12 20v3M17.5 18.5 19 21" />
    <path d="M2 12Q12 22 22 12" />
    <path className="cert-eye-lid" d="M2 12Q12 2 22 12" />
    <circle className="cert-eye-pupil" cx="12" cy="12" r="3" />
  </svg>
);

export default function CourseCertificates({ courses, getTriggerProps, onOpen, activeCourse = null }) {
  return (
    <div className="cert-list">
      {courses.map((course, index) => {
        const open = () => onOpen?.(course);
        return (
          <div
            key={course.id}
            className={`cert-row${index % 2 ? ' cert-row--flip' : ''}${course === activeCourse ? ' is-active' : ''}`}
            style={{ '--i': index }}
          >
            <Diploma />
            <div className="urban-card cert-card" {...getTriggerProps?.(course)} onClick={open}>
              <div className="cert-card-body">
                <h5 className="cert-card-title title-teko">{course.title}</h5>
                <p className="cert-card-provider text-chivo">{course.provider}</p>
                <span className="cert-chip">{course.period}</span>
              </div>
              <button
                type="button"
                className="cert-stub"
                aria-label={`View certificate: ${course.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
              >
                <ViewEye />
                <span className="cert-stub-label title-teko">View</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
