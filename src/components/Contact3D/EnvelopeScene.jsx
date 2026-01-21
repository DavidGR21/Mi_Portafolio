import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import Envelope from './Envelope';
import '../../styles/EnvelopeScene.css';

function EnvelopeScene() {
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
                <Envelope />
            </Canvas>
            {/* Texto de instrucción */}
            <div className="instruction-text">
                Haz clic en el sobre para enviar un mensaje
            </div>
        </div>
    );
}

export default EnvelopeScene;
