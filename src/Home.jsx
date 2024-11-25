import React, { useState } from "react";
import "./Home.css";
import video from './assets/Presentacion.mp4';
import icono from './assets/icono.png';
import Info from './Info.jsx';
import Contact from './Contact.jsx';
import Works from './Works.jsx';
import Principal from './Principal.jsx';

function Home() {
    const [page, setPage] = useState("home");
    const [activePage, setActivePage] = useState("home");
    const [isAnimating, setIsAnimating] = useState(true); // Controla la visibilidad inicial del contenido principal

    const handleVideoEnd = () => {
        setIsAnimating(false); // Muestra el contenido principal al terminar el video
    };

    const changePage = (newPage) => {
        setPage(newPage);
        setActivePage(newPage);
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
            <div className="menu">
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

            {/* Contenido principal */}
            <div className={`content ${isAnimating ? "hidden" : "visible"}`}>
                {renderContent()}
            </div>
        </div>
    );
}

export default Home;
