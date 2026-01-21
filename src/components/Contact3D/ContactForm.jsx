import { useState } from 'react';
import '../../styles/ContactForm.css';

function ContactForm({ onCancel, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="contact-form-overlay" onClick={onCancel}>
            <div className="contact-form-container" onClick={(e) => e.stopPropagation()}>
                <h2 className="form-title">ENVIAME UN MENSAJE</h2>
                
                <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-group">
                        <label htmlFor="name">Nombre</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Tu nombre"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Mensaje</label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            placeholder="Escribe tu mensaje aquí..."
                            rows={5}
                        />
                    </div>

                    <div className="form-buttons">
                        <button 
                            type="button" 
                            onClick={onCancel}
                            className="btn-cancel"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="btn-send"
                        >
                            Enviar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ContactForm;
