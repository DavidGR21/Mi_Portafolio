// AboutMe.jsx
import { useTheme } from '../context/ThemeContext';
import { useRef, useState } from 'react';
import ParticleLogo from '../components/ParticleLogo';
import { aboutMeData } from '../data/aboutMeData';
import { GraduationCap, Briefcase } from 'lucide-react';
import '../styles/AboutMe.css';

function AboutMe() {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const logoRef = useRef(null);
  const contentRef = useRef(null);
  const [activeSkillImage, setActiveSkillImage] = useState(null);

  const handleSkillHover = (skill) => {
    setActiveSkillImage(skill.imageId);
  };

  const handleSkillLeave = () => {
    setActiveSkillImage(null);
  };

  return (
    <section ref={sectionRef} className={`about-me ${theme}`} id="about">
      <div className="about-container">
        {/* Columna izquierda - Logo con Partículas */}
        <div ref={logoRef} className="about-left">
          <ParticleLogo activeImageId={activeSkillImage} />
        </div>

        {/* Columna derecha - Información */}
        <div className="about-right">
          <div ref={contentRef} className="about-content">
            <h2 className="about-title title-teko">ABOUT ME</h2>
            <img className='img-profile' src="src\assets\perfilPortafolio.jpg" alt="Perfil" />
            <h3 className="about-name text-rocksalt">{aboutMeData.name}</h3>
            <p className="about-role title-teko">{aboutMeData.role}</p>
            <p className="about-description text-chivo">{aboutMeData.description}</p>

            {/* Skills */}
            <div className="about-section">
              <h4 className="section-title title-teko">SKILLS</h4>
              <div className="skills-grid graffiti-tags">
                {aboutMeData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="skill-tag graffiti-item"
                    onMouseEnter={() => handleSkillHover(skill)}
                    onMouseLeave={handleSkillLeave}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Contenedor Grid para Educación y Experiencia lado a lado */}
            <div className="urban-grid-container">

              {/* Columna Educación */}
              <div className="about-section urban-column">
                <h4 className="section-title title-teko text-teal">EDUCATION</h4>
                <div className="urban-cards-wrapper">
                  {aboutMeData.education.map((edu) => (
                    <div key={edu.id} className="urban-card education-item"
                      onMouseEnter={() => handleSkillHover(edu)}
                      onMouseLeave={handleSkillLeave}>
                      {/* Caja para el icono */}
                      <div className="card-icon-box">
                        <GraduationCap size={28} strokeWidth={1.5} />
                      </div>
                      {/* Contenido de texto */}
                      <div className="card-content">
                        <h5 className="edu-degree card-title">{edu.degree}</h5>
                        <p className="edu-institution card-subtitle">{edu.institution}</p>
                        <span className="edu-period card-period">{edu.period}</span>
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
                      onMouseEnter={() => handleSkillHover(exp)}
                      onMouseLeave={handleSkillLeave}>
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
    </section>
  );
}

export default AboutMe;