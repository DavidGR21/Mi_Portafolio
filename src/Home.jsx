import React, { useState } from "react";
import "./Home.css";
import icono from './assets/icono.png';
import Info from './Info.jsx';
import Contact from './Contact.jsx';
import Works from './Works.jsx';
import Principal from './Principal.jsx';

function Home() {
    const [page, setPage] = useState("home");
    const [activePage, setActivePage] = useState("home");
    const [isFading, setIsFading] = useState(false); // Nuevo estado para manejar la animación

    const changePage = (newPage) => {
        setIsFading(true); // Comienza la animación de desvanecimiento
        setTimeout(() => {
            setPage(newPage); // Cambia la página después de la animación de salida
            setActivePage(newPage); // Cambia el estado de la página activa
            setIsFading(false); // Reinicia la animación para la nueva página
        }, 500); // Duración del desvanecimiento
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
                return <h2>Página Principal</h2>;
        }
    };

    return (
        <div className="container">
            {/* Menú fijo a la izquierda */}
            <div className="menu">
                <div className="menu-header">
                    <h1>NERIS DAVID<br />GILER</h1>
                    <p>
                        DESARROLLADOR <br />
                        FRONTEND <br />
                        BACKEND <br />
                        WEB Y ESCRITORIO<br />
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

            {/* Contenido principal con animación */}
            <div className={`content ${isFading ? "fade-out" : "fade-in"}`}>
                {renderContent()}
            </div>
        </div>
    );
}

export default Home;
