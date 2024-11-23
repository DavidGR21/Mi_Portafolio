import React, { useState } from "react";
import "./Home.css";
import icono from './assets/icono.png';

function Home() {
    const [page, setPage] = useState("home");
    const [activePage, setActivePage] = useState("home");

    const renderContent = () => {
        switch (page) {
            case "home":
                return <h2>Página Principal</h2>;
            case "works":
                return <h2>Trabajos</h2>;
            case "contact":
                return <h2>Contacto</h2>;
            case "info":
                return <h2>Info</h2>;
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
                    <li onClick={() => { setPage("home"); setActivePage("home") }} className={`menu-item ${activePage === "home" ? "active" : ""}`}>
                        <span>—</span>  HOME
                    </li>
                    <li onClick={() => { setPage("works"); setActivePage("works") }} className={`menu-item ${activePage === "works" ? "active" : ""}`}>
                        <span>—</span>WORKS
                    </li>
                    <li onClick={() => { setPage("contact"); setActivePage("contact") }} className={`menu-item ${activePage === "contact" ? "active" : ""}`}>
                        <span>—</span> CONTACT
                    </li>
                    <li onClick={() => { setPage("info"); setActivePage("info") }} className={`menu-item ${activePage === "info" ? "active" : ""}`}>
                        <span>—</span> INFO
                    </li>
                </ul>
                <div className="menu-footer">
                    <img src={icono} alt="Icono" />
                </div>
            </div>

            {/* Contenido principal */}
            <div className="content">
                {renderContent()}
            </div>
        </div>
    );
}

export default Home;