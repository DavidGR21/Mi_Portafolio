import { useState } from 'react';
import emailjs from '@emailjs/browser';
import '../../styles/ContactForm.css';

function ContactForm({ onCancel, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(''); // 'success' | 'error' | ''

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('');

        try {
            // Configuración de EmailJS desde variables de entorno
            const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
            const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

            // Validar que las credenciales estén configuradas
            if (!serviceID || !templateID || !publicKey) {
                throw new Error('EmailJS no está configurado. Por favor, configura las variables de entorno.');
            }

            const templateParams = {
                from_name: formData.name,
                from_email: formData.email,
                message: formData.message,
                to_name: 'Tu Nombre', // Tu nombre o el destinatario
            };

            await emailjs.send(
                serviceID,
                templateID,
                templateParams,
                publicKey
            );

            setSubmitStatus('success');
            
            // Limpiar formulario
            setFormData({
                name: '',
                email: '',
                message: '',
            });

            // Llamar al callback de éxito y cerrar después de 2 segundos
            setTimeout(() => {
                onSubmit(formData);
            }, 2000);

        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
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
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="btn-send"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Enviando...' : submitStatus === 'success' ? '✓ Enviado' : 'Enviar'}
                        </button>
                    </div>
                    
                    {submitStatus === 'error' && (
                        <div className="form-error">
                            Error al enviar el mensaje. Por favor, intenta de nuevo.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default ContactForm;
