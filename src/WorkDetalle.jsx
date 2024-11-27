import React from 'react';
import './WorkDetalle.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

function Work_Detail({ work, onBack }) {

    return (
        <div className="works_Detail">
            <h2 className='nombre_Detail'>{work.nombre}</h2>
            <a className='referencia_Git' href={work.url_go} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faGithub} /> CODE
            </a>
            <p className='description_Detail' >
                {work.descripcion}
            </p>
            <img className='skills_Detail' src={work.src} alt="Skills" />
            <div className='div_Img'>
                <img className='img_Detail' src={work.url} alt={work.nombre} />
            </div>
            <button className='regreso' onClick={onBack}>BACK TO INDEX</button>
        </div>
    );
}

export default Work_Detail;