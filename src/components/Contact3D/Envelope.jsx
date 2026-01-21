import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function Envelope() {
    const envelopeRef = useRef()
    const flapRef = useRef()

    useFrame((state) => {
        const t = state.clock.elapsedTime

        // Animación suave del sobre completo
        if (envelopeRef.current) {
            envelopeRef.current.position.y = Math.sin(t * 0.9) * 0.2
            envelopeRef.current.rotation.z = Math.sin(t * 0.2) * 0.02
        }
    })

    return (
        <group ref={envelopeRef}>

            {/* Cuerpo principal del sobre */}
            <mesh position={[0, 2, 0]}
                scale={[1.5, 1.3, 1]}>
                <boxGeometry args={[3.5, 2.4, 0.1]} />
                <meshStandardMaterial
                    color="#ecddbb"
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>

            {/* Solapa superior (triángulo invertido) */}
            <mesh
                position={[0, 2.52, 0]}
                rotation={[Math.PI / 2, 0, Math.PI]}
                scale={[1.96, 1, 1]}
            >
                <coneGeometry args={[1.4, 2, 3]} />
                <meshStandardMaterial
                    color="#e2d4b2"
                    roughness={0.7}
                    metalness={0.1}
                />
            </mesh>


            {/* Sello o adhesivo */}
            <mesh position={[0, 1.5, 1]}>
                <circleGeometry args={[0.5, 32]} />
                <meshStandardMaterial
                    color="#e72914"
                    roughness={0.5}
                    metalness={0.15}
                    depthTest={false}
                />
            </mesh>

            {/* Dirección escrita en el sobre */}
            <group position={[-1.5, 1, 1]}>
                {[
                    { y: 0.25, w: 1.4 },
                    { y: 0.05, w: 1.2 },
                    { y: -0.15, w: 1.35 },
                    { y: -0.35, w: 0.9 },
                ].map((line, i) => (
                    <mesh key={i} position={[0, line.y, 0]}>
                        <planeGeometry args={[line.w, 0.05]} />
                        <meshStandardMaterial
                            color="#000000"
                            opacity={0.55}
                            transparent
                            roughness={1}
                        />
                    </mesh>
                ))}
            </group>


        </group>
    )
}

export default Envelope