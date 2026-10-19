import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Envelope from './Envelope';
import ContactForm from './ContactForm';
import '../../styles/EnvelopeScene.css';

function EnvelopeScene() {
    const [envelopeState, setEnvelopeState] = useState('closed');
    const [showForm, setShowForm] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(''); // 'success' | 'error' | ''
    const closeEnvelopeRef = useRef();

    // Auto-ocultar toasts después de 4 segundos
    useEffect(() => {
        if (submitStatus) {
            const timer = setTimeout(() => {
                setSubmitStatus('');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [submitStatus]);

    const handleEnvelopeStateChange = (newState) => {
        setEnvelopeState(newState);
        if (newState === 'open') {
            setShowForm(true);
        } else if (newState === 'closed') {
            setShowForm(false);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        if (closeEnvelopeRef.current) {
            closeEnvelopeRef.current.closeEnvelope();
        }
    };

    const handleSubmitForm = (formData, status) => {
        console.log('Form submitted:', formData);
        // Mostrar el toast correspondiente
        setSubmitStatus(status);
        // Cerrar el formulario primero
        setShowForm(false);
        // Ejecutar animación de cierre y luego vuelo del sobre
        if (closeEnvelopeRef.current) {
            closeEnvelopeRef.current.closeEnvelope(() => {
                // Ejecutar flyAway cuando termine la animación de cierre
                if (closeEnvelopeRef.current) {
                    closeEnvelopeRef.current.flyAway();
                }
            });
        }
    };

    return (
        <div className="envelope-scene-container">
            <h1 className='contact-title'>CONTACT</h1>
            <Canvas className="envelope-canvas" dpr={[1, 2]}>
                {/* Cámara */}
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />

                {/* Luces: frontal + trasera para que ambas caras del sobre se vean bien al girar */}
                <ambientLight intensity={1.1} />
                <directionalLight position={[4, 6, 8]} intensity={1.6} />
                <directionalLight position={[-4, 3, -8]} intensity={1.2} />
                <pointLight position={[-8, -6, 4]} intensity={30} color="#4A90E2" />

                {/* Sobre 3D */}
                <Envelope 
                    onStateChange={handleEnvelopeStateChange}
                    onClose={closeEnvelopeRef}
                />
            </Canvas>
            {/* Texto de instrucción */}
            {envelopeState === 'closed' && (
                <div className="instruction-text">     
                Click on the envelope to send a message
                </div>
            )}

            {/* Formulario de contacto */}
            {showForm && (
                <ContactForm 
                    onCancel={handleCancelForm}
                    onSubmit={handleSubmitForm}
                />
            )}

            {/* Toasts de notificación */}
            {submitStatus === 'error' && (
                <div className="form-error-toast">
                    <span className="error-icon">⚠️</span>
                    <div className="error-content">
                        <strong>Error al enviar</strong>
                        <p>Por favor, intenta de nuevo.</p>
                    </div>
                </div>
            )}

            {submitStatus === 'success' && (
                <div className="form-success-toast">
                    <span className="success-icon">✓</span>
                    <div className="success-content">
                        <strong>¡Mensaje enviado!</strong>
                        <p>Gracias por contactarme.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EnvelopeScene;
