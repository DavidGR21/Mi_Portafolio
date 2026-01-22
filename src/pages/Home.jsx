import { useState, useEffect } from "react";
import IntroVideo from "../components/IntroVideo.jsx";
import AudioVisualizer from "../components/AudioVisualizer.jsx";
import Navbar from "../components/Navbar.jsx";
import CustomCursor from "../components/CustomCursor.jsx";
import AboutMe from "./AboutMe.jsx";
// Importa los demás componentes
import Projects from "./Projects.jsx";
import Contact from "./Contact.jsx";

export default function Home() {
    // const [videoFinished, setVideoFinished] = useState(false);
    const [activeSection, setActiveSection] = useState("about");
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [nextSection, setNextSection] = useState(null);
    // about | projects | contact

    // const handleVideoEnd = () => {
    //     setVideoFinished(true);
    // };

    useEffect(() => {
        if (nextSection && nextSection !== activeSection) {
            setIsTransitioning(true);
            const timer = setTimeout(() => {
                setActiveSection(nextSection);
                setIsTransitioning(false);
                setNextSection(null);
            }, 300); // Duración del fadeOut
            return () => clearTimeout(timer);
        }
    }, [nextSection, activeSection]);

    const handleNavigation = (section) => {
        if (section !== activeSection) {
            setNextSection(section);
        }
    };

    const renderSection = () => {
        switch (activeSection) {
            case "about":
                return <AboutMe />;
            case "projects":
                return <Projects />;
            case "contact":
                return <Contact />;
            default:
                return <AboutMe />;
        }
    };

    return (
        <>
            <CustomCursor />
            <Navbar onNavigate={handleNavigation} />

            {/* IntroVideo antes de mostrar contenido */}
            {/* {!videoFinished && (
                <IntroVideo onVideoEnd={handleVideoEnd} />
            )} */}

            {/* El contenido solo aparece cuando el video terminó */}
            {/* {videoFinished && ( */}
            <main>
                <div className={`section-container ${isTransitioning ? 'fade-out' : ''}`}>
                    {renderSection()}
                </div>
            </main>
            {/* )} */}

            {/* Siempre activo */}
            <AudioVisualizer />
        </>
    );
}
