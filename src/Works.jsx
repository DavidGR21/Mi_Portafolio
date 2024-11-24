import "./Works.css";
import { useState } from 'react';

function Works() {
    const listworks = [
        { id: '01', nombre: "Proyecto Mascota Virtual", url: "https://cdn.sanity.io/images/7b0p5ml9/production/28c54dc21c037d45d1aaf3cae45db267d1167e23-3830x2144.png?auto=format&q=80&w=1920", descripcion: "descripcion de la imagen 1", url_go: '' },
        { id: '02', nombre: "WORK2", url: "https://cdn.sanity.io/images/7b0p5ml9/production/6b5fe1f056531e95e933afe8e06555ad6f18e953-2000x2000.png?auto=format&q=80&w=1920", descripcion: "descripcion de la imagen 2", url_go: '' },
        { id: '03', nombre: "WORK3", url: "https://cdn.sanity.io/images/7b0p5ml9/production/28c54dc21c037d45d1aaf3cae45db267d1167e23-3830x2144.png?auto=format&q=80&w=1920", descripcion: "descripcion de la imagen 3", url_go: '' },
        { id: '04', nombre: "WORK4", url: "https://cdn.sanity.io/images/7b0p5ml9/production/28c54dc21c037d45d1aaf3cae45db267d1167e23-3830x2144.png?auto=format&q=80&w=1920", descripcion: "descripcion de la imagen 4", url_go: '' },
        // Agrega más elementos si es necesario
    ];

    const [selectedImage, setSelectedImage] = useState('https://cdn.sanity.io/images/7b0p5ml9/production/28c54dc21c037d45d1aaf3cae45db267d1167e23-3830x2144.png?auto=format&q=80&w=1920');
    const [selectedName, setSelectedName] = useState('WORK1');
    const [selectedURL, setSelectedURL] = useState('WORK1');

    const handleMouseEnter = (url, name, url_go) => {
        setSelectedImage(url);
        setSelectedName(name);
        setSelectedURL(url_go);
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
                                <img className="img_Project" src={work.url} alt="Project Image"
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
                <div className="container_Img_Big">
                    <p className="name_Big">{selectedName}</p>
                    <img src={selectedImage}></img>
                    <a className="urlGO" href={selectedURL}>GITHUB</a>
                </div>
            </div>
        </div>
    );
}

export default Works;