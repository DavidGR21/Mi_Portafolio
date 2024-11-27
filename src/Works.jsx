import "./Works.css";
import { useState } from "react";
import img1 from "./assets/ProjectMascota.png";
import img2 from "./assets/iBlog.jpg";
import img3 from "./assets/gestorNotas.png";
import img4 from "./assets/Ventas.png";
import img5 from "./assets/NFC.png";
import img6 from "./assets/campaña.png";
import img7 from "./assets/Educativa.png";
import Work_Detail from './WorkDetalle.jsx';

function Works() {
    const listworks = [
        {
            id: "01", nombre: "Virtual Pets", url: img1,
            descripcion: (
                <>
                    Virtual pet project, using JAVA, with storage in plain text files, with the possibility of feeding, playing and cleaning the pet.<br />
                    File saving system, and a mini achievement system for leveling up.
                </>
            ),
            src: "https://skillicons.dev/icons?i=java&perline=8",
            url_go: "https://github.com/DavidGR21/MascotaVirtualJAVA"
        },
        {
            id: "02", nombre: "iBlog", url: img2,
            descripcion: (
                <>
                    Blog project, with the possibility of creating, editing and deleting posts, as well as commenting on other people's posts.<br />
                    We use React, JavaScript, Node.js, and AWS for storage.<br />
                    Colabored:
                    <a className="colaboradores" href="https://xxxmichael.github.io/Portafolio/" target="_blank" rel="noopener noreferrer">
                        {" "}Michael Chavez
                    </a>.
                </>
            ),
            src: "https://skillicons.dev/icons?i=vite,html,css,javascript,aws,nodejs,npm,mysql&perline=9",
            url_go: "https://github.com/xxxMichael/iBlog"
        },
        {
            id: "03", nombre: "Tesis Manager", url: img3,
            descripcion: (
                <>
                    Project to manage student theses.<br />
                    Allows uploading reviews, grades and recommendations for students, as well as the review percentage.<br />
                    We use Vite, Mysql and nodejs for interaction between them.<br />
                    Colabored:
                    <a className="colaboradores" href="https://melaniealban.github.io/" target="_blank" rel="noopener noreferrer">
                        {" "}Melanie Alban,{" "}
                    </a>.
                    <a className="colaboradores" href="https://alisonmsalas.github.io/" target="_blank" rel="noopener noreferrer">
                        Alison Salas{" "}
                    </a>.
                </>
            ),
            src: "https://skillicons.dev/icons?i=vite,html,css,javascript,nodejs,npm,mysql&perline=8",
            url_go: "https://github.com/DavidGR21/Proyecto_Agiles"
        },
        {
            id: "04", nombre: "Sales App", url: img4,
            descripcion: (
                <>
                    Sales manager project, we implemented a system that recognized roles, to block options to people who do not have the appropriate role.<br />
                    The creation of a simple Kardex was implemented for the management of purchases, sales and returns.<br />
                    Made with Java and connection to a MySql database.<br />
                </>
            ),
            src: "https://skillicons.dev/icons?i=java,mysql&perline=8",
            url_go: "https://github.com/DavidGR21/App-de-Ventas"
        },
        {
            id: "05", nombre: "NFC detector", url: img5,
            descripcion: (
                <>
                    Project to record attendance using NFC chips.<br />
                    HTML, CSS and JavaScript were used for the web design.<br />
                    For NFC operation we used Python.<br />
                    Colabored:
                    <a className="colaboradores" href="https://xxxmichael.github.io/Portafolio/" target="_blank" rel="noopener noreferrer">
                        {" "}Michael Chavez
                    </a>.
                </>
            ),
            src: "https://skillicons.dev/icons?i=python,html,css,javascript&perline=9",
            url_go: "https://github.com/xxxMichael/Nfc-detector"
        },
        {
            id: "06", nombre: "Political Campaign", url: img6,
            descripcion: (
                <>
                    Project that shows proposals, events and candidates of a political campaign,
                    as well as a voting system.<br />
                    We use vite with html and css for the frontend design.<br />
                    We use MySql to store data, and php for the interaction between the database and the frontend.<br />
                    Colabored:
                    <a className="colaboradores" href="https://xxxmichael.github.io/Portafolio/" target="_blank" rel="noopener noreferrer">
                        {" "}Michael Chavez,
                    </a>.
                    <a className="colaboradores" href="https://ismaelsailema20.github.io/portafolio-personal/" target="_blank" rel="noopener noreferrer">
                        {" "}Ismael Sailema,
                    </a>.
                    <a className="colaboradores" href="https://reclax.github.io/" target="_blank" rel="noopener noreferrer">
                        {" "}Marco Serrano,
                    </a>. <br />
                    <a className="colaboradores" href="https://github.com/0AalL" target="_blank" rel="noopener noreferrer">
                        {" "}Cristhian Sanchez
                    </a>.
                </>
            ),
            src: "https://skillicons.dev/icons?i=vite,html,css,javascript,mysql,php&perline=9",
            url_go: "https://github.com/IsmaelSailema20/PaginaWebCandidata"
        },
        {
            id: "07", nombre: "Education platform", url: img7,
            descripcion: (
                <>
                    Platform for the review and assignment of work by teachers to students.<br />
                    Possibility of making notifications about work, registrations for subjects and courses, and creation of new courses or subjects.<br />
                    Made with html, css, javascript, database in MySql and for interaction the use of PHP.<br />
                    Colabored:
                    <a className="colaboradores" href="https://xxxmichael.github.io/Portafolio/" target="_blank" rel="noopener noreferrer">
                        {" "}Michael Chavez
                    </a>.
                </>
            ),
            src: "https://skillicons.dev/icons?i=html,css,javascript,mysql,php&perline=9",
            url_go: "https://github.com/xxxMichael/Plataforma-Educativa?tab=readme-ov-file"
        },
    ];

    const [selectedImage, setSelectedImage] = useState(img1);
    const [animationClass, setAnimationClass] = useState("");
    const [selectedName, setSelectedName] = useState("Virtual Pets");
    const [animatedName, setAnimatedName] = useState("Virtual Pets");
    const [selectedURL, setSelectedURL] = useState("https://github.com/DavidGR21/MascotaVirtualJAVA");
    const [isAnimating, setIsAnimating] = useState(false); // Nuevo estado para manejar la animación
    const [isAnimatingButton, setIsAnimatingButton] = useState(false); // Estado para animar el botón
    const [showWorkDetail, setShowWorkDetail] = useState(false);
    const [selectedWork, setSelectedWork] = useState(null);

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

    const handleProjectClick = (work) => {
        setFadeAnimation(true); // Activa la animación
        setTimeout(() => {
            setSelectedWork(work); // Cambia al nuevo proyecto
            setShowWorkDetail(true); // Muestra el detalle
            setFadeAnimation(false); // Desactiva la animación
        }, 500); // Duración de la animación (coherente con el CSS)
    };

    const [fadeAnimation, setFadeAnimation] = useState(false);

    return (
        <div className="container_G_Works">
            <div className="container_List_Works">
                <ol>
                    {listworks.map((work) => (
                        <li
                            key={work.id}
                            className="work-item"
                            onMouseEnter={() => handleMouseEnter(work.url, work.nombre, work.url_go)}
                            onClick={() => handleProjectClick(work)}
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
                {showWorkDetail ? (
                    <div className={`work-detail-container ${fadeAnimation ? 'fade-out' : 'fade-in'}`}>
                        <Work_Detail
                            work={selectedWork}
                            onBack={() => {
                                setFadeAnimation(true); // Activa la animación al salir
                                setTimeout(() => {
                                    setShowWorkDetail(false); // Oculta el detalle después de la animación
                                    setFadeAnimation(false); // Resetea el estado
                                }, 500); // Duración de la animación
                            }}
                        />
                    </div>
                ) : (
                    <>
                        <h2 id="tituloW" className="titulo_Info">WORKS</h2>
                        <p className="cant_Items">{listworks.length} ITEMS</p>
                        <p className="name_Big">{animatedName}</p>
                        <div className="container_Img_Big">
                            <img src={selectedImage} alt="Selected Project" className={`big-image ${animationClass}`} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
export default Works;

