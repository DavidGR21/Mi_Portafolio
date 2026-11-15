// SkillKeyboard.jsx
// Skills como un teclado de keycaps 3D (three.js). Cada tecla es un <button>
// del DOM (rejilla, foco, tooltip e interacción); el canvas dibuja las teclas
// encima. La tecla seleccionada se queda hundida.
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { particleImages } from '../data/particleImages';
import { SkillKeyboardScene } from '../utils/skillKeyboardScene';
import '../styles/SkillKeyboard.css';

const logoPaths = new Map(particleImages.map((img) => [img.id, img.path]));

export default function SkillKeyboard({
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

  // Escena: se crea una vez; la posición de cada tecla sale de su botón
  useEffect(() => {
    const wrap = wrapRef.current;
    const holder = holderRef.current;
    if (!wrap || !holder) return;

    let scene;
    try {
      scene = new SkillKeyboardScene(
        holder,
        skills.map((skill) => logoPaths.get(skill.imageId)),
        { reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches }
      );
    } catch (err) {
      console.error('WebGL no disponible para el teclado de skills:', err);
      setFailed(true);
      return;
    }
    sceneRef.current = scene;

    const layout = () => {
      const slots = Array.from(wrap.querySelectorAll('.skill-key'), (key) => ({
        x: key.offsetLeft,
        y: key.offsetTop,
        width: key.offsetWidth,
        height: key.offsetHeight,
      }));
      scene.layout(wrap.offsetWidth, wrap.offsetHeight, slots);
    };
    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(wrap);

    // No gastar GPU cuando el teclado no está en pantalla
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

  return (
    <div ref={wrapRef} className={`skill-keyboard${failed ? ' no-webgl' : ''}`}>
      {skills.map((skill, index) => {
        const trigger = getTriggerProps(skill);
        const hoverIn = (e) => {
          trigger.onMouseEnter?.(e);
          sceneRef.current?.setHover(index);
        };
        const hoverOut = (e) => {
          trigger.onMouseLeave?.(e);
          sceneRef.current?.setHover(-1);
          sceneRef.current?.setDown(-1);
        };
        return (
          <button
            key={skill.imageId ?? index}
            type="button"
            className={`skill-key${index === selectedIndex ? ' is-selected' : ''}`}
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
            <span className="skill-key-tip" aria-hidden="true">{skill.name}</span>
          </button>
        );
      })}
      <div ref={holderRef} className="skill-keyboard-canvas" aria-hidden="true" />
    </div>
  );
}
