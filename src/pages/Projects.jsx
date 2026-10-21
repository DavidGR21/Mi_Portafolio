import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import '../styles/Projects.css';
import { useTheme } from '../context/ThemeContext';
import { projectsData } from '../data/projectsData';
import AnimatedTitle from '../components/AnimatedTitle';
import ProjectPreview from '../components/ProjectPreview';
import CustomScrollbar from '../components/CustomScrollbar';

// Rutas de imágenes respetando el `base` de vite.config.js
const projects = projectsData.map((project) => ({
    ...project,
    imageSrc: `${import.meta.env.BASE_URL}${project.image}`,
}));
const previewImages = projects.map((project) => project.imageSrc);

const pad = (n) => String(n).padStart(2, '0');

// Un solo repositorio -> "Source Code"; frontend y backend separados -> un enlace por cada uno
const getSourceLinks = (source) => {
    if (!source) return [];
    if (typeof source === 'string') return [{ label: 'Source Code', url: source }];
    return [
        source.frontend && { label: 'Source Code Frontend', url: source.frontend },
        source.backend && { label: 'Source Code Backend', url: source.backend },
    ].filter(Boolean);
};

// Scroll suave con inercia solo en escritorio con mouse; en táctil se usa el scroll nativo
const DESKTOP_QUERY = '(min-width: 960px)';
const SMOOTH_SCROLL_QUERY = `${DESKTOP_QUERY} and (hover: hover)`;

function ProjectInfo({ project }) {
    return (
        <>
            <p className="detail-desc text-chivo">{project.description}</p>
            <ul className="detail-tags">
                {project.tech.map((tech, i) => (
                    <li key={tech} className="detail-tag" style={{ '--i': i }}>{tech}</li>
                ))}
            </ul>
            <div className="detail-links">
                {project.demo && (
                    <a href={project.demo} target="_blank" rel="noopener noreferrer">
                        Live Demo <ArrowUpRight size={16} />
                    </a>
                )}
                {getSourceLinks(project.source).map(({ label, url }) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                        {label} <ArrowUpRight size={16} />
                    </a>
                ))}
            </div>
        </>
    );
}

function Projects() {
    const { theme } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const activeProject = projects[activeIndex];

    // La vista previa WebGL solo se monta en pantallas anchas (en móvil está oculta)
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
    useEffect(() => {
        const query = window.matchMedia(DESKTOP_QUERY);
        const handleChange = (e) => setIsDesktop(e.matches);
        query.addEventListener('change', handleChange);
        return () => query.removeEventListener('change', handleChange);
    }, []);

    const listWrapRef = useRef(null);
    const listRef = useRef(null);
    const previewTiltRef = useRef(null);
    const scrollRef = useRef({ current: 0, target: 0, max: 0 });
    const velocityRef = useRef(0); // Compartido con el shader de la vista previa
    const mouseRef = useRef({ x: 0, y: 0, tiltX: 0, tiltY: 0 });

    const isSmoothScroll = () => window.matchMedia(SMOOTH_SCROLL_QUERY).matches;

    // Métricas para la barra de scroll: transform en escritorio, scroll nativo en táctil
    const getScrollMetrics = () => {
        const wrap = listWrapRef.current;
        const scroll = scrollRef.current;
        return {
            position: isSmoothScroll() ? scroll.current : wrap.scrollTop,
            max: scroll.max,
            viewport: wrap.clientHeight,
            content: listRef.current.scrollHeight,
        };
    };

    const scrollListTo = (value) => {
        if (isSmoothScroll()) scrollRef.current.target = value;
        else listWrapRef.current.scrollTop = value;
    };

    useEffect(() => {
        const wrap = listWrapRef.current;
        const list = listRef.current;
        const scroll = scrollRef.current;
        const mouse = mouseRef.current;
        const smoothQuery = window.matchMedia(SMOOTH_SCROLL_QUERY);
        const clampTarget = (value) => Math.min(Math.max(value, 0), scroll.max);

        const measure = () => {
            scroll.max = Math.max(0, list.scrollHeight - wrap.clientHeight);
            scroll.target = clampTarget(scroll.target);
        };

        // La rueda del mouse mueve la lista desde cualquier parte de la pantalla
        const handleWheel = (e) => {
            if (!smoothQuery.matches || e.ctrlKey) return;
            e.preventDefault();
            scroll.target = clampTarget(scroll.target + e.deltaY);
        };

        const handlePointerMove = (e) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        };

        let frameId;
        const tick = () => {
            if (smoothQuery.matches) {
                const previous = scroll.current;
                scroll.current += (scroll.target - scroll.current) * 0.09;
                const velocity = scroll.current - previous;
                velocityRef.current = velocity;
                // La lista se inclina según la velocidad del scroll
                const skew = Math.min(Math.max(velocity * 0.08, -4), 4);
                list.style.transform = `translate3d(0, ${-scroll.current}px, 0) skewY(${skew}deg)`;
            } else {
                velocityRef.current = 0;
                list.style.transform = '';
            }

            // La vista previa se inclina siguiendo al mouse
            mouse.tiltX += (mouse.x - mouse.tiltX) * 0.06;
            mouse.tiltY += (mouse.y - mouse.tiltY) * 0.06;
            if (previewTiltRef.current) {
                previewTiltRef.current.style.transform =
                    `rotateY(${-8 + mouse.tiltX * 8}deg) rotateX(${mouse.tiltY * -5}deg)`;
            }

            frameId = requestAnimationFrame(tick);
        };

        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(wrap);
        resizeObserver.observe(list);
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('pointermove', handlePointerMove);
        frameId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('pointermove', handlePointerMove);
        };
    }, []);

    // Con teclado: mantener visible el proyecto enfocado dentro del scroll suave
    const handleFocus = (index, e) => {
        setActiveIndex(index);
        if (!window.matchMedia(SMOOTH_SCROLL_QUERY).matches) return;

        const wrap = listWrapRef.current;
        const scroll = scrollRef.current;
        const item = e.currentTarget.closest('.project-item');
        wrap.scrollTop = 0; // el foco puede desplazar el contenedor; el scroll lo controla el transform
        const top = item.offsetTop;
        const bottom = top + item.offsetHeight;
        if (top < scroll.target || bottom > scroll.target + wrap.clientHeight) {
            scroll.target = Math.min(Math.max(top - wrap.clientHeight / 3, 0), scroll.max);
        }
    };

    return (
        <section id="projects" className={`projects ${theme}`}>
            <aside className="projects-sidebar">
                <header className="projects-header">
                    <h1 className="projects-title title-teko">PROJECTS</h1>
                    <span className="projects-count">{pad(projects.length)} Items</span>
                </header>

                <div className="projects-list-area">
                    <div className="projects-list-wrap" ref={listWrapRef}>
                        <ol className="projects-list" ref={listRef}>
                            {projects.map((project, index) => {
                                const isSelected = index === activeIndex;
                                return (
                                    <li
                                        key={project.id}
                                        className={`project-item ${isSelected ? 'is-selected' : ''}`}
                                        style={{ '--i': index }}
                                    >
                                        <button
                                            type="button"
                                            className="project-item-trigger"
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onFocus={(e) => handleFocus(index, e)}
                                            onClick={() => setActiveIndex(index)}
                                            aria-pressed={isSelected}
                                        >
                                            <div className="project-row">
                                                <span className="project-index">#{pad(index + 1)}</span>
                                                <div className="project-thumb">
                                                    <img src={project.imageSrc} alt={project.title} loading="lazy" />
                                                </div>
                                            </div>
                                            <h3 className="project-item-title title-teko">{project.title}</h3>
                                        </button>

                                        {/* En móvil la información se despliega dentro de la lista */}
                                        {isSelected && (
                                            <div className="project-item-details">
                                                <ProjectInfo project={project} />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </div>

                    {/* Barra de scroll personalizada (sincronizada con el contenido) */}
                    <CustomScrollbar
                        className="projects-scrollbar"
                        getMetrics={getScrollMetrics}
                        scrollTo={scrollListTo}
                    />
                </div>
            </aside>

            <div className="projects-stage">
                <div className="project-detail" key={activeProject.id}>
                    <span className="detail-index">
                        #{pad(activeIndex + 1)} <span>/ {pad(projects.length)}</span>
                    </span>
                    <AnimatedTitle text={activeProject.title} className="detail-title title-teko" />
                    <ProjectInfo project={activeProject} />
                </div>

                <div className="project-preview">
                    <div className="preview-tilt" ref={previewTiltRef}>
                        <div className="preview-frame">
                            {isDesktop && (
                                <ProjectPreview
                                    images={previewImages}
                                    activeIndex={activeIndex}
                                    velocityRef={velocityRef}
                                />
                            )}
                            <span className="preview-dot dot1" />
                            <span className="preview-dot dot2" />
                            <span className="preview-dot dot3" />
                            <span className="preview-dot dot4" />
                        </div>
                        <div className="preview-caption">
                            <span>FIG. {pad(activeIndex + 1)}</span>
                            <span>{activeProject.tech.slice(0, 3).join(' · ')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Projects;
