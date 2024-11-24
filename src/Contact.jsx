import React, { useState } from 'react';
import './Contact.css';

function Info() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('email', email);
        formData.append('name', name);
        formData.append('message', message);

        fetch('https://formspree.io/f/xldewwbl', {
            method: 'POST',
            body: formData,
        })
            .then(response => {
                if (!response.ok) {
                    // Si la respuesta no es OK (status no 2xx)
                    console.error('Error en la respuesta:', response.status);
                    alert('Hubo un error al enviar el mensaje');
                } else {
                    // Si la respuesta es exitosa (status 2xx)
                    return response.json(); // Suponiendo que la respuesta es JSON
                }
            })
            .then(data => {
                // Solo se ejecutará si la respuesta fue exitosa
                console.log('Respuesta exitosa:', data);
                alert('Mensaje enviado con éxito!');
            })
            .catch(error => {
                // Aquí manejamos cualquier error que pueda ocurrir
                console.error('Error al enviar el formulario:', error);
                alert('Hubo un error al enviar el mensaje');
            });
    };

    return (
        <div className="container_Contact">
            <h2 className="titulo_Info">CONTACT</h2>
            <form className="formContainer" onSubmit={handleSubmit}>
                <input
                    required
                    id="email"
                    placeholder="example@email.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="email">Email</label>
                <input
                    id="name"
                    required
                    placeholder="Your name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <label htmlFor="name">Name</label>
                <textarea
                    id="message"
                    required
                    placeholder="Write your message"
                    rows="5"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <label htmlFor="message">Message</label>
                <div className="social-buttons">
                    <button type="submit">SUBMIT</button>
                </div>
            </form>
        </div>
    );
}

export default Info;
