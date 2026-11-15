// EducationCampus.jsx
// Educación: una pequeña escuela 3D junto a las entradas de formación, en
// formato compacto. La escuela es solo CSS (cajas con transform 3D), con el
// mismo lenguaje que la carpeta del CV: colores planos, bordes duros y sombra
// sólida. Al pasar el cursor por el bloque la escuela gira para enseñar su otro
// lado, se encienden las ventanas, se abren las puertas y ondea la bandera.
import '../styles/EducationCampus.css';

// Ventanas: cada <i> es una; --n escalona el encendido
const Windows = ({ count, from = 0 }) =>
  Array.from({ length: count }, (_, i) => <i key={i} style={{ '--n': from + i }} />);

function School() {
  return (
    <div className="school-scene" aria-hidden="true">
      <div className="school">
        {/* Parcela, con el camino hasta la puerta */}
        <span className="school-ground">
          <span className="school-path" />
        </span>

        {/* Edificio principal: dos alas con ventanas */}
        <span className="school-box school-main">
          <span className="school-face school-face--left"><Windows count={2} from={5} /></span>
          <span className="school-face school-face--right"><Windows count={2} from={5} /></span>
          <span className="school-face school-face--top" />
          <span className="school-face school-face--front">
            <span className="school-wing"><Windows count={3} /></span>
            <span className="school-wing"><Windows count={3} from={2} /></span>
          </span>
        </span>

        {/* Torre de entrada: tejado a dos aguas, bandera, reloj y puerta */}
        <span className="school-box school-tower">
          <span className="school-face school-face--left"><Windows count={1} from={4} /></span>
          <span className="school-face school-face--right"><Windows count={1} from={4} /></span>
          <span className="school-roof school-roof--left" />
          <span className="school-roof school-roof--right" />
          <span className="school-pole">
            <span className="school-flag" />
          </span>
          <span className="school-face school-face--front">
            <span className="school-gable" />
            <span className="school-clock" />
            <span className="school-door"><i /><i /></span>
          </span>
        </span>
      </div>
    </div>
  );
}

// "2022 - 2027" o "2026 - Present": sigue en curso si aún no ha llegado el año final
const isOngoing = (period = '') => {
  if (/present/i.test(period)) return true;
  const endYear = Number(period.match(/(\d{4})\s*$/)?.[1]);
  return endYear > new Date().getFullYear();
};

export default function EducationCampus({ items, getTriggerProps, activeId = null }) {
  const active = items.some((edu) => edu.imageId && edu.imageId === activeId);

  return (
    <div className={`edu-campus${active ? ' is-active' : ''}`}>
      <School />
      <div className="edu-list">
        {items.map((edu) => (
          <div key={edu.id} className="urban-card edu-entry" {...getTriggerProps?.(edu)}>
            <h5 className="edu-entry-degree title-teko">{edu.degree}</h5>
            <p className="edu-entry-school text-chivo">{edu.institution}</p>
            <div className="edu-entry-meta">
              <span className="edu-chip edu-chip--accent">{edu.period}</span>
              {isOngoing(edu.period) && <span className="edu-chip">In progress</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
