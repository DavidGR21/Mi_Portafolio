import React, { useState } from "react";
import "./Home.css";
import video from './assets/Presentacion.mp4';
import icono from './assets/icono.png';
import Info from './Info.jsx';
import Contact from './Contact.jsx';
import Works from './Works.jsx';
import Principal from './Principal.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

function Home() {
    const [page, setPage] = useState("home");
    const [activePage, setActivePage] = useState("home");
    const [isAnimating, setIsAnimating] = useState(true); // Para controlar el video inicial
    const [isFading, setIsFading] = useState(false); // Para manejar fade-in y fade-out
    const [menuOpen, setMenuOpen] = useState(false);

    const handleVideoEnd = () => {
        setIsAnimating(false); // Muestra el contenido principal al terminar el video
    };

    const changePage = (newPage) => {
        if (page === newPage) return; // Si la página es la misma, no hace nada

        setIsFading(true); // Activa el efecto de fade-out
        setTimeout(() => {
            setPage(newPage); // Cambia el contenido después de la animación
            setActivePage(newPage);
            setIsFading(false); // Activa el efecto de fade-in
        }, 500); // Duración de la animación
    };

    const renderContent = () => {
        switch (page) {
            case "home":
                return <Principal />;
            case "works":
                return <Works />;
            case "contact":
                return <Contact />;
            case "info":
                return <Info />;
            default:
                return <Principal />;
        }
    };

    return (
        <div className="container">
            <button
                className={`menu-toggle ${menuOpen ? "show" : ""}`}
                onClick={() => setMenuOpen(!menuOpen)}
            >
                <FontAwesomeIcon icon={menuOpen ? faArrowLeft : faArrowRight} />
            </button>

            <div className={`menu ${menuOpen ? "show" : ""}`}>
                <div className="menu-header">
                    <h1>NERIS DAVID<br />GILER</h1>
                    <p>
                        DEVELOPER <br />
                        FRONTEND <br />
                        BACKEND <br />
                        WEB & DESKTOP<br />
                        © DAVID GILER
                    </p>
                </div>
                <ul className="menu-list">
                    <li
                        onClick={() => changePage("home")}
                        className={`menu-item ${activePage === "home" ? "active" : ""}`}
                    >
                        <span>—</span> HOME
                    </li>
                    <li
                        onClick={() => changePage("works")}
                        className={`menu-item ${activePage === "works" ? "active" : ""}`}
                    >
                        <span>—</span> WORKS
                    </li>
                    <li
                        onClick={() => changePage("contact")}
                        className={`menu-item ${activePage === "contact" ? "active" : ""}`}
                    >
                        <span>—</span> CONTACT
                    </li>
                    <li
                        onClick={() => changePage("info")}
                        className={`menu-item ${activePage === "info" ? "active" : ""}`}
                    >
                        <span>—</span> INFO
                    </li>
                </ul>
                <div className="menu-footer">
                    <img src={icono} alt="Icono" />
                </div>
            </div>

            {/* Pantalla de bienvenida con animación */}
            <div className={`welcome-message ${isAnimating ? "visible" : "hidden"}`}>
                <video
                    src={video}
                    autoPlay
                    muted
                    className="welcome-video"
                    onEnded={handleVideoEnd}
                ></video>
            </div>

            {/* Contenido principal con animaciones de fade-in y fade-out */}
            <div className={`content ${isFading ? "fade-out" : "fade-in"}`}>
                {renderContent()}
            </div>
        </div>
    );
}

export default Home;
