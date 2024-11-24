import "./Works.css";
import { useState } from "react";
import img1 from "./assets/ProjectMascota.png";
import img2 from "./assets/iBlog.jpg";
import img3 from "./assets/gestorNotas.png";
import img4 from "./assets/Ventas.png";
import img5 from "./assets/NFC.png";

function Works() {
    const listworks = [
        { id: "01", nombre: "Virtual Pets", url: img1, descripcion: "descripcion de la imagen 1", url_go: "https://github.com/DavidGR21/MascotaVirtualJAVA" },
        { id: "02", nombre: "iBlog", url: img2, descripcion: "descripcion de la imagen 2", url_go: "https://github.com/xxxMichael/iBlog" },
        { id: "03", nombre: "Notes Manager", url: img3, descripcion: "descripcion de la imagen 3", url_go: "https://github.com/DavidGR21/Proyecto_Agiles" },
        { id: "04", nombre: "Sales App", url: img4, descripcion: "descripcion de la imagen 4", url_go: "https://github.com/DavidGR21/App-de-Ventas" },
        { id: "05", nombre: "NFC detector", url: img5, descripcion: "descripcion de la imagen 5", url_go: "https://github.com/xxxMichael/Nfc-detector" },
    ];

    const [selectedImage, setSelectedImage] = useState(img1);
    const [animationClass, setAnimationClass] = useState("");
    const [selectedName, setSelectedName] = useState("Virtual Pets");
    const [animatedName, setAnimatedName] = useState("Virtual Pets");
    const [selectedURL, setSelectedURL] = useState("https://github.com/DavidGR21/MascotaVirtualJAVA");
    const [isAnimating, setIsAnimating] = useState(false); // Nuevo estado para manejar la animación
    const [isAnimatingButton, setIsAnimatingButton] = useState(false); // Estado para animar el botón

    const handleMouseEnter = (url, nombre, url_go) => {
        if (nombre === selectedName || isAnimating) return;

        // Animación de la imagen y el botón
        setAnimationClass("fade-out"); // Salida de la imagen actual
        setIsAnimatingButton(true); // Animación de salida del botón

        animateTitle(nombre);

        setTimeout(() => {
            setSelectedImage(url); // Cambiar la imagen después de la salida
            setSelectedName(nombre); // Cambiar el nombre
            setSelectedURL(url_go); // Cambiar el enlace
            setAnimationClass("fade-in"); // Entrada de la nueva imagen

            // Animación de entrada del botón
            setIsAnimatingButton(false);
        }, 200); // Duración de la animación de salida
    };

    const animateTitle = (newName) => {
        const originalName = [...newName]; // Dividir el nuevo nombre en caracteres
        let iterations = 0;
        const interval = setInterval(() => {
            // Actualizar cada letra con un número aleatorio, mantener los espacios
            const updatedName = originalName.map((char) => {
                if (char === " ") return " "; // Mantener los espacios
                if (Math.random() > 0.5 || iterations < originalName.length) {
                    return Math.floor(Math.random() * 10).toString(); // Reemplazar con un número
                }
                return char; // Devolver la letra original
            });
            setAnimatedName(updatedName.join("")); // Actualizar el título con números aleatorios

            iterations++;
            if (iterations > 4) {
                clearInterval(interval); // Detener la animación
                setAnimatedName(newName); // Establecer el nuevo nombre
                setSelectedName(newName); // Actualizar el estado final del título
            }
        }, 100); // Tiempo entre cambios
    };

    return (
        <div className="container_G_Works">
            <div className="container_List_Works">
                <ol>
                    {listworks.map((work) => (
                        <li
                            key={work.id}
                            className="work-item"
                            onMouseEnter={() => handleMouseEnter(work.url, work.nombre, work.url_go)}
                        >
                            <div className="cont_Project">
                                <p className="etiqueta">#{work.id}</p>
                                <img className="img_Project" src={work.url} alt="Project Image" />
                            </div>
                            <p className="name_Project">{work.nombre}</p>
                        </li>
                    ))}
                </ol>
            </div>
            <div className="container_Works">
                <h2 id="tituloW" className="titulo_Info">WORKS</h2>
                <p className="cant_Items">{listworks.length} ITEMS</p>
                <p className="name_Big">{animatedName}</p>
                <div className="container_Img_Big">
                    <img src={selectedImage} alt="Selected Project" className={`big-image ${animationClass}`} />
                    <a
                        href={selectedURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`button ${isAnimatingButton ? 'fade-out' : 'fade-in'}`}
                    >
                        <span className="bracket left">❴</span>
                        <span className="text">Code</span>
                        <span className="bracket right">❵</span>
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Works;