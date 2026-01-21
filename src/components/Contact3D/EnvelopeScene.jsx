import { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Envelope from './Envelope';
import ContactForm from './ContactForm';
import '../../styles/EnvelopeScene.css';

function EnvelopeScene() {
    const [envelopeState, setEnvelopeState] = useState('closed');
    const [showForm, setShowForm] = useState(false);
    const closeEnvelopeRef = useRef();

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
            closeEnvelopeRef.current();
        }
    };

    const handleSubmitForm = (formData) => {
        console.log('Form submitted:', formData);
        // Aquí puedes agregar la lógica para enviar el email
        // Por ejemplo, usando EmailJS
    };

    return (
        <div className="envelope-scene-container">
            <h1 className='contact-title'>CONTACT</h1>
            <Canvas shadows className="envelope-canvas">
                {/* Cámara */}
                <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />

                {/* Luces */}
                <ambientLight intensity={0.6} />
                <spotLight
                    position={[10, 10, 10]}
                    angle={0.3}
                    penumbra={1}
                    intensity={1.2}
                    castShadow
                />
                <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4A90E2" />

                {/* Sobre 3D */}
                <Envelope 
                    onStateChange={handleEnvelopeStateChange}
                    onClose={closeEnvelopeRef}
                />
            </Canvas>
            {/* Texto de instrucción */}
            {envelopeState === 'closed' && (
                <div className="instruction-text">
                    Haz clic en el sobre para enviar un mensaje
                </div>
            )}

            {/* Formulario de contacto */}
            {showForm && (
                <ContactForm 
                    onCancel={handleCancelForm}
                    onSubmit={handleSubmitForm}
                />
            )}
        </div>
    );
}

export default EnvelopeScene;
