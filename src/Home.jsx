import React, { useState, useEffect } from "react";
import "./Home.css";
import video from "./assets/Presentacion.mp4";
import videoCelular from "./assets/IntroCelular.mp4";
import icono from "./assets/icono.png";
import Info from "./Info.jsx";
import Contact from "./Contact.jsx";
import Works from "./Works.jsx";
import Principal from "./Principal.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";

function Home() {
  const [page, setPage] = useState("home");
  const [activePage, setActivePage] = useState("home");
  const [isAnimating, setIsAnimating] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es móvil
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };

    checkMobile(); // Ejecuta la primera vez
    window.addEventListener("resize", checkMobile); // Detecta cambios de tamaño

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleVideoEnd = () => {
    setIsAnimating(false);
  };

  const changePage = (newPage) => {
    if (page === newPage) return;
    setIsFading(true);
    setMenuOpen(false);
    setTimeout(() => {
      setPage(newPage);
      setActivePage(newPage);
      setIsFading(false);
    }, 500);
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
          <h1>
            NERIS DAVID
            <br />
            GILER
          </h1>
          <p>
            DEVELOPER <br />
            FRONTEND <br />
            BACKEND <br />
            WEB & DESKTOP
            <br />© DAVID GILER
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
          src={isMobile ? videoCelular : video}
          autoPlay
          muted
          className="welcome-video"
          onEnded={handleVideoEnd}
        ></video>
      </div>

      {/* Contenido principal */}
      <div className={`content ${isFading ? "fade-out" : "fade-in"}`}>
        {renderContent()}
      </div>
    </div>
  );
}

export default Home;
