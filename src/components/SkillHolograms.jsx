// SkillHolograms.jsx
// Skills como pequeños hologramas (three.js). Cada skill es un <button> del
// DOM (rejilla, foco, tooltip e interacción); el canvas dibuja los hologramas
// encima. En reposo son estáticos; al pasar el cursor se encienden y giran en
// 3D, y el seleccionado se queda encendido.
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { particleImages } from '../data/particleImages';
import { SkillHologramScene } from '../utils/skillHologramScene';
import '../styles/SkillHolograms.css';

const logoPaths = new Map(particleImages.map((img) => [img.id, img.path]));

export default function SkillHolograms({
  skills,
  getTriggerProps,
  selectedId = null,
  onToggle,
  entered = false,
  enterDuration,
}) {
  const wrapRef = useRef(null);
  const holderRef = useRef(null);
  const sceneRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const { theme } = useTheme();

  const selectedIndex = skills.findIndex((skill) => skill.imageId === selectedId);

  // Escena: se crea una vez; la posición de cada holograma sale de su botón
  useEffect(() => {
    const wrap = wrapRef.current;
    const holder = holderRef.current;
    if (!wrap || !holder) return;

    let scene;
    try {
      scene = new SkillHologramScene(
        holder,
        skills.map((skill) => logoPaths.get(skill.imageId)),
        { reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches }
      );
    } catch (err) {
      console.error('WebGL no disponible para los hologramas de skills:', err);
      setFailed(true);
      return;
    }
    sceneRef.current = scene;

    const layout = () => {
      const slots = Array.from(wrap.querySelectorAll('.skill-holo'), (key) => ({
        x: key.offsetLeft,
        y: key.offsetTop,
        width: key.offsetWidth,
        height: key.offsetHeight,
      }));
      scene.layout(wrap.offsetWidth, wrap.offsetHeight, slots);
    };
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(wrap);

    // No gastar GPU cuando los hologramas no están en pantalla
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      scene.setVisible(entry.isIntersecting);
    });
    intersectionObserver.observe(wrap);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      scene.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (entered) sceneRef.current?.enter(enterDuration);
  }, [entered, enterDuration]);

  useEffect(() => {
    sceneRef.current?.setSelected(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    const onThemePointerOut = (e) => {
      if (!e.target.closest?.('.theme-toggle')) return;
      if (e.relatedTarget?.closest?.('.theme-toggle, .skill-holo')) return;
      sceneRef.current?.setHover(-1);
      sceneRef.current?.setDown(-1);
    };
    document.addEventListener('pointerout', onThemePointerOut);
    return () => document.removeEventListener('pointerout', onThemePointerOut);
  }, []);

  return (
    <div ref={wrapRef} className={`skill-holograms${failed ? ' no-webgl' : ''}`}>
      {skills.map((skill, index) => {
        const trigger = getTriggerProps(skill);
        const hoverIn = (e) => {
          trigger.onMouseEnter?.(e);
          sceneRef.current?.setHover(index);
        };
        const hoverOut = (e) => {
          // Cambiar claro/oscuro no debe contar como salir del holograma
          if (e.relatedTarget?.closest?.('.theme-toggle')) return;
          trigger.onMouseLeave?.(e);
          sceneRef.current?.setHover(-1);
          sceneRef.current?.setDown(-1);
        };
        return (
          <button
            key={skill.imageId ?? index}
            type="button"
            className={`skill-holo${index === selectedIndex ? ' is-selected' : ''}`}
            aria-label={skill.name}
            aria-pressed={index === selectedIndex}
            {...trigger}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
            onFocus={hoverIn}
            onBlur={hoverOut}
            onPointerDown={() => sceneRef.current?.setDown(index)}
            onPointerUp={() => sceneRef.current?.setDown(-1)}
            onClick={() => onToggle?.(skill)}
          >
            {failed && logoPaths.get(skill.imageId) && (
              <img src={logoPaths.get(skill.imageId)} alt="" loading="lazy" />
            )}
            <span className="skill-holo-tip" aria-hidden="true">{skill.name}</span>
          </button>
        );
      })}
      <div ref={holderRef} className="skill-holograms-canvas" aria-hidden="true" />
    </div>
  );
}
