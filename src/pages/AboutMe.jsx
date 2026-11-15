// AboutMe.jsx
import { useTheme } from '../context/ThemeContext';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import ParticleLogo, { ENTRY_DURATION_S } from '../components/ParticleLogo';
import CustomScrollbar from '../components/CustomScrollbar';
import SkillHolograms from '../components/SkillHolograms';
import CvDossier from '../components/CvDossier';
import { aboutMeData } from '../data/aboutMeData';
import EducationCampus from '../components/EducationCampus';
import { Briefcase, Award, FileText } from 'lucide-react';
import '../styles/AboutMe.css';

// Carga diferida: pdf.js solo se descarga al abrir un certificado
const CertificateModal = lazy(() => import('../components/CertificateModal'));

function AboutMe() {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const logoRef = useRef(null);
  const contentRef = useRef(null);
  const [activeSkillImage, setActiveSkillImage] = useState(null);
  const [pinnedImage, setPinnedImage] = useState(null);
  const [activeCertificate, setActiveCertificate] = useState(null);
  const closeCertificate = useCallback(() => setActiveCertificate(null), []);
  // La hoja de vida se previsualiza con el mismo visor que los certificados
  const openCv = useCallback(() => {
    const { title, subtitle, file, downloadName } = aboutMeData.cv;
    setActiveCertificate({ title, provider: subtitle, certificate: file, downloadName, label: 'Resume' });
  }, []);
  // El contenido anima a la vez que las partículas forman el logo y termina
  // justo cuando ellas terminan (enterDuration = duración de la entrada)
  const [entered, setEntered] = useState(false);
  const [enterDuration, setEnterDuration] = useState(ENTRY_DURATION_S);
  const enterStartedRef = useRef(false);
  const handleEntryStart = useCallback((duration) => {
    if (enterStartedRef.current) return;
    enterStartedRef.current = true;
    // duration 0 = sin animación de partículas (reduced motion / sin WebGL)
    setEnterDuration(duration > 0 ? duration : ENTRY_DURATION_S);
    setEntered(true);
  }, []);

  // Barra de scroll personalizada para la página: se oculta la nativa mientras se ve esta sección
  useEffect(() => {
    document.documentElement.classList.add('has-custom-scrollbar');
    return () => document.documentElement.classList.remove('has-custom-scrollbar');
  }, []);

  const getPageScrollMetrics = () => {
    const root = document.documentElement;
    return {
      position: window.scrollY,
      max: root.scrollHeight - window.innerHeight,
      viewport: window.innerHeight,
      content: root.scrollHeight,
    };
  };

  const scrollPageTo = (value) => window.scrollTo(0, value);

  // Un clic en cualquier elemento con efecto hover (o en el propio logo) fija su
  // imagen; un clic en cualquier otro sitio vuelve al logo inicial
  useEffect(() => {
    const unpinOnOutsideClick = (e) => {
      if (e.target.closest('[data-particle-trigger], .certificate-modal')) return;
      setPinnedImage(null);
    };
    document.addEventListener('click', unpinOnOutsideClick);
    return () => document.removeEventListener('click', unpinOnOutsideClick);
  }, []);

  // Props comunes de los elementos que muestran su imagen al pasar el cursor
  const particleTrigger = (item) => ({
    'data-particle-trigger': true,
    onMouseEnter: () => handleSkillHover(item),
    onMouseLeave: handleSkillLeave,
    onClick: () => setPinnedImage(item.imageId),
  });

  // Hologramas de skills: un clic selecciona la skill; otro clic la suelta
  const toggleSkill = (skill) => {
    setPinnedImage((current) => (current === skill.imageId ? null : skill.imageId));
  };

  const handleSkillHover = (skill) => {
    setActiveSkillImage(skill.imageId);
  };

  const handleSkillLeave = () => {
    setActiveSkillImage(null);
  };

  return (
    <section
      ref={sectionRef}
      className={`about-me ${theme}${entered ? ' entered' : ''}`}
      style={{ '--enter-dur': `${enterDuration}s` }}
      id="about"
    >
      <CustomScrollbar
        className="page-scrollbar"
        getMetrics={getPageScrollMetrics}
        scrollTo={scrollPageTo}
      />
      <div className="about-container">
        {/* Columna izquierda - Logo con Partículas */}
        <div ref={logoRef} className="about-left">
          <ParticleLogo
            activeImageId={activeSkillImage}
            pinnedImageId={pinnedImage}
            onEntryStart={handleEntryStart}
          />
        </div>

        {/* Columna derecha - Información */}
        <div className="about-right">
          <div ref={contentRef} className="about-content">
            <h2 className="about-title title-teko">ABOUT ME</h2>
            <img className='img-profile clickable' {...particleTrigger({ imageId: 'dragon' })} src="assets/perfilPortafolio.jpg" alt="Perfil" />
            <h3 className="about-name text-rocksalt">{aboutMeData.name}</h3>
            <p className="about-role title-teko">{aboutMeData.role}</p>
            <p className="about-description text-chivo">{aboutMeData.description}</p>

            {/* Hoja de vida */}
            <div className="about-section">
              <h4 className="section-title title-teko">RESUME</h4>
              <CvDossier cv={aboutMeData.cv} onPreview={openCv} />
            </div>

            {/* Skills */}
            <div className="about-section">
              <h4 className="section-title title-teko">SKILLS</h4>
              <SkillHolograms
                skills={aboutMeData.skills}
                getTriggerProps={particleTrigger}
                selectedId={pinnedImage}
                onToggle={toggleSkill}
                entered={entered}
                enterDuration={enterDuration}
              />
            </div>

            {/* Contenedor Grid para Educación y Experiencia lado a lado */}
            <div className="urban-grid-container">

              {/* Columna Educación */}
              <div className="about-section urban-column">
                <h4 className="section-title title-teko text-teal">EDUCATION</h4>
                <EducationCampus
                  items={aboutMeData.education}
                  getTriggerProps={particleTrigger}
                  activeId={pinnedImage}
                />
              </div>

              {/* Columna Cursos */}
              <div className="about-section urban-column">
                <h4 className="section-title title-teko text-teal">COURSES</h4>
                <div className="urban-cards-wrapper">
                  {aboutMeData.courses.map((course) => (
                    <div key={course.id} className="urban-card course-item"
                      {...particleTrigger(course)}
                      onClick={() => {
                        setPinnedImage(course.imageId);
                        setActiveCertificate(course);
                      }}>
                      {/* Caja para el icono */}
                      <div className="card-icon-box">
                        <Award size={28} strokeWidth={1.5} />
                      </div>
                      {/* Contenido de texto */}
                      <div className="card-content">
                        <h5 className="course-title card-title">{course.title}</h5>
                        <p className="course-provider card-subtitle">{course.provider}</p>
                        <span className="course-period card-period">{course.period}</span>
                        <button
                          className="certificate-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPinnedImage(course.imageId);
                            setActiveCertificate(course);
                          }}
                        >
                          <FileText size={16} /> View certificate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Columna Experiencia */}
              <div className="about-section urban-column">
                <h4 className="section-title title-teko text-teal">EXPERIENCE</h4>
                <div className="urban-cards-wrapper">
                  {aboutMeData.experience.map((exp) => (
                    <div key={exp.id} className="urban-card experience-item"
                      {...particleTrigger(exp)}>
                      {/* Caja para el icono */}
                      <div className="card-icon-box">
                        <Briefcase size={28} strokeWidth={1.5} />
                      </div>
                      {/* Contenido de texto */}
                      <div className="card-content">
                        <h5 className="exp-title card-title">{exp.title}</h5>
                        <p className="exp-company card-subtitle">{exp.company}</p>
                        <span className="exp-period card-period">{exp.period}</span>
                        <p className="exp-description card-description">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeCertificate && (
        <Suspense fallback={null}>
          <CertificateModal
            course={activeCertificate}
            theme={theme}
            onClose={closeCertificate}
          />
        </Suspense>
      )}
    </section>
  );
}

export default AboutMe;