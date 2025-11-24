import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import mobileVideo from "../assets/videos/intro-mobile.mp4";
import desktopVideo from "../assets/videos/intro-desktop.mp4";
import "../styles/IntroVideo.css";

export default function IntroVideo({ onVideoEnd }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Detecta si la pantalla es móvil con mejor compatibilidad
    const check = () => {
      const width = window.innerWidth || document.documentElement.clientWidth;
      setIsMobile(width <= 768);
    };

    check();
    
    // Escucha múltiples eventos para mejor detección en móviles
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);

    // Bloquea el scroll mientras el video se reproduce
    if (isAnimating) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
      document.body.style.overflow = "";
    };
  }, [isAnimating]);

  const handleVideoEnd = () => {
    setIsAnimating(false);
    document.body.style.overflow = "";
    // Notifica al componente padre que el video terminó
    if (onVideoEnd) {
      onVideoEnd();
    }
  };

  if (!isAnimating) return null;

  return (
    <>
      {/* Overlay para bloquear interacción */}
      <div className="intro-overlay" />
      <video
        autoPlay
        muted
        playsInline
        className="intro-video visible"
        onEnded={handleVideoEnd}
      >
        <source src={isMobile ? mobileVideo : desktopVideo} type="video/mp4" />
      </video>
    </>
  );
}

IntroVideo.propTypes = {
  onVideoEnd: PropTypes.func,
};
