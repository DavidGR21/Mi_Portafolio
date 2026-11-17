import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, Code, Info, TriangleAlert, User, Users, X } from 'lucide-react';
import '../styles/Projects.css';
import { useTheme } from '../context/ThemeContext';
import { projectsData } from '../data/projectsData';
import AnimatedTitle from '../components/AnimatedTitle';
import ProjectPreview from '../components/ProjectPreview';
import CustomScrollbar from '../components/CustomScrollbar';
import MediaGallery from '../components/MediaGallery';
import MediaCarousel from '../components/MediaCarousel';

// Rutas de imágenes respetando el `base` de vite.config.js
const withBase = (path) => path && `${import.meta.env.BASE_URL}${path}`;
const projects = projectsData.map((project) => ({
    ...project,
    imageSrc: withBase(project.image),
    // Galería (capturas y videos): rutas completas
    media: (project.media ?? []).map((item) => ({
        ...item,
        src: withBase(item.src),
        thumb: withBase(item.thumb),
        poster: withBase(item.poster),
    })),
    // Lista plana de tecnologías (para el pie de la vista previa)
    tech: Object.values(project.stack).flat(),
}));
const previewImages = projects.map((project) => project.imageSrc);

const pad = (n) => String(n).padStart(2, '0');

// Un solo repositorio -> "Source code"; frontend y backend separados -> un enlace por cada uno
const getSourceLinks = (source) => {
    if (!source) return [];
    if (typeof source === 'string') return [{ label: 'Source code', url: source }];
    return [
        source.frontend && { label: 'Frontend', url: source.frontend },
        source.backend && { label: 'Backend', url: source.backend },
    ].filter(Boolean);
};

// Scroll suave con inercia solo en escritorio con mouse; en táctil se usa el scroll nativo
const DESKTOP_QUERY = '(min-width: 960px)';
const SMOOTH_SCROLL_QUERY = `${DESKTOP_QUERY} and (hover: hover)`;

const TABS = [
    { id: 'about', label: 'About' },
    { id: 'stack', label: 'Stack' },
    { id: 'notes', label: 'Notes' },
];

// Autoría: proyecto en solitario o en equipo (con enlace a cada colaborador)
function RoleCard({ role }) {
    const solo = role.type === 'solo';
    const Icon = solo ? User : Users;
    const collaborators = role.collaborators ?? [];
    return (
        <div className="role-card">
            <span className="role-icon"><Icon size={16} strokeWidth={1.8} /></span>
            <div className="role-text">
                <span className="role-label">{solo ? 'Solo project' : 'Team project'}</span>
                <span className="role-summary text-chivo">{role.summary}</span>
                {collaborators.length > 0 && (
                    <span className="role-collab">
                        With{' '}
                        {collaborators.map(({ name, url }, i) => (
                            <span key={name}>
                                {i > 0 && (i === collaborators.length - 1 ? ' & ' : ', ')}
                                <a href={url} target="_blank" rel="noopener noreferrer">{name}</a>
                            </span>
                        ))}
                    </span>
                )}
            </div>
        </div>
    );
}

// Descripción. Si no cabe en el hueco (pantallas pequeñas) se recorta y los puntos
// suspensivos pasan a ser un botón "… more" que abre el texto completo en un modal
function Description({ project }) {
    const textRef = useRef(null);
    const [clamped, setClamped] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const el = textRef.current;
        const check = () => setClamped(el.scrollHeight > el.clientHeight + 1);
        check();
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, [project.description]);

    useEffect(() => {
        if (!open) return undefined;
        const handleKey = (e) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open]);

    return (
        <div className="detail-desc-wrap">
            <p ref={textRef} className="detail-desc text-chivo">{project.description}</p>
            {clamped && (
                <button
                    type="button"
                    className="detail-more"
                    onClick={() => setOpen(true)}
                    aria-label={`Read the full description of ${project.title}`}
                >
                    … more
                </button>
            )}
            {/* Se monta dentro de #projects para heredar los colores del tema */}
            {open && createPortal(
                <div
                    className="desc-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${project.title} description`}
                    onClick={() => setOpen(false)}
                >
                    <div className="desc-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="desc-modal-close"
                            onClick={() => setOpen(false)}
                            aria-label="Close"
                            autoFocus
                        >
                            <X size={16} />
                        </button>
                        <span className="desc-modal-kicker">About</span>
                        <h3 className="desc-modal-title title-teko">{project.title}</h3>
                        <p className="desc-modal-text text-chivo">{project.description}</p>
                    </div>
                </div>,
                document.getElementById('projects'),
            )}
        </div>
    );
}

// Información del proyecto en tres secciones (About / Stack / Notes).
// Los tres paneles ocupan siempre el mismo hueco, así que ni las pestañas ni los
// enlaces cambian de sitio al cambiar de sección o de proyecto.
function ProjectInfo({ project }) {
    const [tab, setTab] = useState('about');
    const { practices = [], notes = [] } = project;
    const groups = Object.entries(project.stack);
    const sourceLinks = getSourceLinks(project.source);
    const hasWarning = notes.some((note) => note.type === 'warning');

    const paneProps = (id) => ({
        className: `detail-pane${tab === id ? ' is-active' : ''}`,
        role: 'tabpanel',
        'aria-hidden': tab !== id,
        inert: tab !== id ? '' : undefined,
    });

    return (
        <>
            <div className="detail-tabs" role="tablist">
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={tab === id}
                        className={`detail-tab${tab === id ? ' is-active' : ''}`}
                        onClick={() => setTab(id)}
                    >
                        {label}
                        {id === 'notes' && hasWarning && (
                            <span className="detail-tab-alert" aria-label="Has important notes" />
                        )}
                    </button>
                ))}
            </div>

            <div className="detail-panels">
                <div {...paneProps('about')}>
                    <Description project={project} />
                    <RoleCard role={project.role} />
                </div>

                <div {...paneProps('stack')}>
                    {groups.map(([group, items]) => (
                        <div key={group} className="stack-group">
                            <span className="stack-group-label">{group}</span>
                            <ul className="stack-chips">
                                {items.map((tech) => (
                                    <li key={tech} className="stack-chip">{tech}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div {...paneProps('notes')}>
                    {practices.length > 0 && (
                        <div className="stack-group">
                            <span className="stack-group-label">Methodologies &amp; patterns</span>
                            <ul className="stack-chips">
                                {practices.map((practice) => (
                                    <li key={practice} className="stack-chip">{practice}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {notes.length > 0 && (
                        <ul className="detail-notes">
                            {notes.map((note) => (
                                <li key={note.text} className={`detail-note is-${note.type}`}>
                                    {note.type === 'warning'
                                        ? <TriangleAlert size={14} strokeWidth={2} />
                                        : <Info size={14} strokeWidth={2} />}
                                    <span className="text-chivo">{note.text}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {practices.length === 0 && notes.length === 0 && (
                        <p className="detail-desc text-chivo">No extra notes for this project.</p>
                    )}
                </div>
            </div>

            <div className="detail-links">
                {project.demo && (
                    <a
                        className="detail-link detail-link--demo"
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className="detail-link-dot" />
                        Live demo
                        <ArrowUpRight size={13} />
                    </a>
                )}
                {sourceLinks.map(({ label, url }) => (
                    <a
                        key={url}
                        className="detail-link"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Code size={13} strokeWidth={2} />
                        {label}
                        <ArrowUpRight size={13} />
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

    // Galería ampliada abierta: { project, index } (null = cerrada).
    // Al cerrar, el foco vuelve a quien la abrió
    const [gallery, setGallery] = useState(null);
    const galleryOpenerRef = useRef(null);
    const openGallery = (project, index = 0) => {
        galleryOpenerRef.current = document.activeElement;
        setGallery({ project, index });
    };
    const closeGallery = useCallback(() => {
        setGallery(null);
        galleryOpenerRef.current?.focus?.({ preventScroll: true });
    }, []);

    // Los proyectos con capturas o video muestran el carrusel en lugar de la imagen WebGL
    const hasMedia = activeProject.media.length > 0;

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
            // Dentro de la galería la rueda no mueve la lista de detrás
            if (e.target.closest?.('.gallery-modal')) return;
            const pane = e.target.closest?.('.detail-pane, .desc-modal-card');
            if (pane && pane.scrollHeight > pane.clientHeight + 1) return;
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
                                        className={`project-item ${isSelected ? 'is-selected' : ''} ${project.media.length ? 'has-media' : ''}`}
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
                                                {/* En móvil el carrusel ocupa el lugar de la miniatura */}
                                                {!isDesktop && project.media.length > 0 && (
                                                    <MediaCarousel
                                                        media={project.media}
                                                        paused={!!gallery}
                                                        onOpen={(i) => openGallery(project, i)}
                                                        className="is-inline"
                                                    />
                                                )}
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
                                    activeIndex={hasMedia ? -1 : activeIndex}
                                    velocityRef={velocityRef}
                                />
                            )}
                            {isDesktop && hasMedia && (
                                <MediaCarousel
                                    key={activeProject.id}
                                    media={activeProject.media}
                                    paused={!!gallery}
                                    onOpen={(i) => openGallery(activeProject, i)}
                                    className="is-framed"
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

            {gallery && (
                <MediaGallery project={gallery.project} startIndex={gallery.index} onClose={closeGallery} />
            )}
        </section>
    );
}

export default Projects;
