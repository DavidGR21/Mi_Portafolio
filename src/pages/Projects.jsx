import { useRef, useState, useEffect } from 'react';
import '../styles/Projects.css';
import { useTheme } from '../context/ThemeContext';
import { projectsData } from '../data/projectsData';
import { SkipBack, SkipForward } from 'lucide-react';
import AnimatedTitle from '../components/AnimatedTitle';

function Projects() {
    const { theme } = useTheme();
    const [rotation, setRotation] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [activeProjectIndex, setActiveProjectIndex] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const lastX = useRef(0);
    const velocity = useRef(0);
    const lastTime = useRef(Date.now());
    const animationFrame = useRef(null);

    const ITEMS_PER_PAGE = 5;
    const totalPages = Math.ceil(projectsData.length / ITEMS_PER_PAGE);
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentProjects = projectsData.slice(startIndex, endIndex);

    // Calcular qué proyecto está al frente basado en la rotación
    useEffect(() => {
        const count = currentProjects.length;
        const anglePerItem = 360 / count;

        const normalizedRotation = ((-rotation % 360) + 360) % 360;

        const index = Math.floor(
            (normalizedRotation + anglePerItem / 2) / anglePerItem
        ) % count;

        setActiveProjectIndex(index);
    }, [rotation, currentProjects.length]);

    // Resetear rotación y índice al cambiar de página
    useEffect(() => {
        setRotation(0);
        setActiveProjectIndex(0);
    }, [currentPage]);


    const handleMouseDown = (e) => {
        setIsDragging(true);
        lastX.current = e.clientX || e.touches?.[0]?.clientX;
        lastTime.current = Date.now();
        velocity.current = 0;
        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const currentX = e.clientX || e.touches?.[0]?.clientX;
        const currentTime = Date.now();
        const deltaX = currentX - lastX.current;
        const deltaTime = currentTime - lastTime.current;

        // Calcular velocidad para inercia
        if (deltaTime > 0) {
            velocity.current = deltaX / deltaTime;
        }

        setRotation(prev => prev + deltaX * 0.5);

        lastX.current = currentX;
        lastTime.current = currentTime;
    };

    const handleTouchStart = (e) => {
        handleMouseDown(e);
    };

    const handleTouchMove = (e) => {
        handleMouseMove(e);
    };

    const handleTouchEnd = () => {
        handleMouseUp();
    };

    const handleMouseUp = () => {
        setIsDragging(false);

        // Aplicar inercia
        const animate = () => {
            if (Math.abs(velocity.current) > 0.01) {
                setRotation(prev => prev + velocity.current * 10);
                velocity.current *= 0.95; // Fricción
                animationFrame.current = requestAnimationFrame(animate);
            }
        };

        if (Math.abs(velocity.current) > 0.1) {
            animate();
        }
    };

    useEffect(() => {
        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, []);

    // Asegurar que activeProject siempre exista
    const activeProject = currentProjects[activeProjectIndex] || currentProjects[0];

    const handlePrevPage = () => {
        if (currentPage > 0) {
            // Cancelar cualquier animación en curso
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
            velocity.current = 0;
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            // Cancelar cualquier animación en curso
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
            velocity.current = 0;
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <section id="projects" className={`projects ${theme}`}>
            <div className="projects-title title-teko">PROJECTS</div>
            <div
                className="banner"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className="slider"
                    style={{
                        "--quantity": currentProjects.length,
                        transform: `rotateY(${rotation}deg)`
                    }}
                >
                    {currentProjects.map((project, index) => (
                        <div className="item" key={project.id} style={{ "--position": index }}>
                            <img src={project.image} alt={project.title} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Controles de paginación */}
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button
                        className="pagination-btn"
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                    >
                        <SkipBack />
                    </button>
                    <span className="pagination-info text-chivo">
                        {currentPage + 1} / {totalPages}
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages - 1}
                    >
                        <SkipForward />
                    </button>
                </div>
            )}

            {/* Info del proyecto activo */}
            <div className="container-info" key={`${currentPage}-${activeProjectIndex}`}>
                <div className="project-card">
                    <AnimatedTitle text={activeProject.title} className="title-teko" />
                    <p className="text-chivo">{activeProject.description}</p>
                    <div className="tech-tags">
                        {activeProject.tech.map((tech, index) => (
                            <span key={index} className="tech-tag text-chivo">{tech}</span>
                        ))}
                    </div>
                    <div className="project-links">
                        <a href={activeProject.demo} target="_blank" rel="noopener noreferrer" className="text-chivo">Live Demo</a>
                        <a href={activeProject.source} target="_blank" rel="noopener noreferrer" className="text-chivo">Source Code</a>
                    </div>
                </div>
            </div>
        </section >
    );
}

export default Projects;