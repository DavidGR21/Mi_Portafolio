import "./Works.css";
import { useState } from 'react';
import img1 from './assets/ProjectMascota.png';
import img2 from './assets/iBlog.jpg';
import img3 from './assets/gestorNotas.png';
import img4 from './assets/Ventas.png';


function Works() {
    const listworks = [
        { id: '01', nombre: "Mascota Virtual", url: img1, descripcion: "descripcion de la imagen 1", url_go: '' },
        { id: '02', nombre: "iBlog", url: img2, descripcion: "descripcion de la imagen 2", url_go: '' },
        { id: '03', nombre: "Gestor Notas", url: img3, descripcion: "descripcion de la imagen 3", url_go: '' },
        { id: '04', nombre: "App Venta", url: img4, descripcion: "descripcion de la imagen 4", url_go: '' },
        // Agrega más elementos si es necesario
    ];

    const [selectedImage, setSelectedImage] = useState('https://cdn.sanity.io/images/7b0p5ml9/production/28c54dc21c037d45d1aaf3cae45db267d1167e23-3830x2144.png?auto=format&q=80&w=1920');
    const [selectedName, setSelectedName] = useState('WORK1');
    const [selectedURL, setSelectedURL] = useState('');
    const [outgoingImage, setOutgoingImage] = useState(null);

    const handleMouseEnter = (url, nombre, url_go) => {
        if (selectedImage) {
            setOutgoingImage(selectedImage);
        }
        setTimeout(() => {
            setSelectedImage(url);
            setOutgoingImage(null);
            setSelectedName(nombre);
            setSelectedURL(url_go);
        }, 300);
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
                                <img
                                    className="img_Project"
                                    src={work.url}
                                    alt="Project Image"
                                />
                            </div>
                            <p className="name_Project">{work.nombre}</p>
                        </li>
                    ))}
                </ol>
            </div>
            <div className="container_Works">
                <h2 id="tituloW" className="titulo_Info">WORKS</h2>
                <p className="cant_Items">{listworks.length} ITEMS</p>
                <p className="name_Big">{selectedName}</p>
                <div className="container_Img_Big">
                    {outgoingImage && (
                        <img
                            src={outgoingImage}
                            alt="Outgoing Project"
                            className="outgoing"
                        />
                    )}
                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt="Selected Project"
                            className="incoming"
                        />
                    )}
                    <a href={selectedURL} className="button">
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