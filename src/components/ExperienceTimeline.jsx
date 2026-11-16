// ExperienceTimeline.jsx
// Experiencia: una línea de carrera vertical. Cada trabajo es una estación de
// trabajo 3D hecha solo con CSS (mismo lenguaje que la escuela de Education y
// los diplomas de Courses): un monitor sobre una peana cuyo código se va
// "escribiendo", con un cubo flotante encima. Un pulso de luz recorre el riel
// que une los trabajos y el puesto actual ("Present") lleva una baliza LIVE.
// Basta con añadir elementos a aboutMeData.experience para que se encadenen solos.
import { useEffect, useRef } from 'react';
import '../styles/ExperienceTimeline.css';

const isCurrent = (period = '') => /present|actual|presente/i.test(period);

function Workstation({ live }) {
  return (
    <div className="exp3d-scene" aria-hidden="true">
      <div className="exp3d-model">
        <span className="exp3d-shadow" />

        {/* Peana */}
        <span className="exp3d-box exp3d-plinth">
          <span className="exp3d-face exp3d-face--left" />
          <span className="exp3d-face exp3d-face--right" />
          <span className="exp3d-face exp3d-face--top" />
          <span className="exp3d-face exp3d-face--front" />
        </span>

        {/* Pie del monitor */}
        <span className="exp3d-box exp3d-neck">
          <span className="exp3d-face exp3d-face--left" />
          <span className="exp3d-face exp3d-face--right" />
          <span className="exp3d-face exp3d-face--top" />
          <span className="exp3d-face exp3d-face--front" />
        </span>

        {/* Monitor con el código en pantalla */}
        <span className="exp3d-box exp3d-screen">
          <span className="exp3d-face exp3d-face--left" />
          <span className="exp3d-face exp3d-face--right" />
          <span className="exp3d-face exp3d-face--top" />
          <span className="exp3d-face exp3d-face--front">
            <span className="exp3d-code">
              <i style={{ '--n': 0 }} />
              <i style={{ '--n': 1 }} />
              <i style={{ '--n': 2 }} />
              <i style={{ '--n': 3 }} />
              <b className="exp3d-cursor" />
            </span>
            <span className="exp3d-scan" />
          </span>
        </span>

        {/* Cubo flotante: gira y se mece sobre el monitor */}
        <span className="exp3d-float">
          <span className="exp3d-cube">
            <span className="exp3d-cube-face exp3d-cube-face--f" />
            <span className="exp3d-cube-face exp3d-cube-face--b" />
            <span className="exp3d-cube-face exp3d-cube-face--l" />
            <span className="exp3d-cube-face exp3d-cube-face--r" />
            <span className="exp3d-cube-face exp3d-cube-face--t" />
            <span className="exp3d-cube-face exp3d-cube-face--d" />
          </span>
        </span>

        {live && <span className="exp3d-ring" />}
      </div>
    </div>
  );
}

export default function ExperienceTimeline({ items, getTriggerProps }) {
  // Las animaciones en bucle solo corren mientras la sección está a la vista
  const listRef = useRef(null);
  useEffect(() => {
    const list = listRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      list.classList.toggle('is-paused', !entry.isIntersecting);
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="exp3d-list is-paused" ref={listRef}>
      <span className="exp3d-rail" aria-hidden="true">
        <span className="exp3d-pulse-track">
          <span className="exp3d-pulse" />
        </span>
      </span>

      {items.map((exp, index) => {
        const live = isCurrent(exp.period);
        return (
          <div
            key={exp.id}
            className={`exp3d-row${live ? ' is-live' : ''}`}
            style={{ '--i': index }}
          >
            <Workstation live={live} />
            <div className="urban-card exp3d-card" {...getTriggerProps?.(exp)}>
              <div className="exp3d-card-head">
                <span className="exp3d-chip">{exp.period}</span>
                {live && (
                  <span className="exp3d-live text-chivo">
                    <span className="exp3d-live-dot"><span /></span>
                    Live
                  </span>
                )}
              </div>
              <h5 className="exp3d-title title-teko">{exp.title}</h5>
              <p className="exp3d-company text-chivo">{exp.company}</p>
              <p className="exp3d-desc">{exp.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
