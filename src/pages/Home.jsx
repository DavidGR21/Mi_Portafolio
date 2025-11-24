import { useState } from "react";
import IntroVideo from "../components/IntroVideo.jsx";
import AudioVisualizer from "../components/AudioVisualizer.jsx";
import Navbar from "../components/Navbar.jsx";
import AboutMe from "./AboutMe.jsx";
// Importa los demás componentes
import Projects from "./Projects.jsx";
import Contact from "./Contact.jsx";

export default function Home() {
    // const [videoFinished, setVideoFinished] = useState(false);
    const [activeSection, setActiveSection] = useState("about");
    // about | projects | contact

    // const handleVideoEnd = () => {
    //     setVideoFinished(true);
    // };

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
            <Navbar onNavigate={setActiveSection} />

            {/* IntroVideo antes de mostrar contenido */}
            {/* {!videoFinished && (
                <IntroVideo onVideoEnd={handleVideoEnd} />
            )} */}

            {/* El contenido solo aparece cuando el video terminó */}
            {/* {videoFinished && ( */}
            <main style={{ minHeight: "100vh" }}>
                {renderSection()}
            </main>
            {/* )} */}

            {/* Siempre activo */}
            <AudioVisualizer />
        </>
    );
}
