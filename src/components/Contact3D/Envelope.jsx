import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTheme } from '../../context/ThemeContext'



function Envelope({ onStateChange, onClose }) {
    const { theme } = useTheme()
    const envelopeRef = useRef()
    const flapRef = useRef()
    const sealRef = useRef()
    const currentTimeRef = useRef(0) // Tiempo actual continuo para la animación

    // Colores según el tema
    const envelopeColors = theme === 'dark' 
        ? { 
            body: '#ffffff',      // Turquesa vibrante
            flap: '#ddd6d6',      // Turquesa más oscuro
            seal: '#e72914',      // Rojo del sello
            paper: '#f5f5f5'      // Papel blanco
          }
        : { 
            body: '#e8c39e',      // Naranja vibrante
            flap: '#e2b07f',      // Naranja más oscuro
            seal: '#c41e0a',      // Rojo más oscuro
            paper: '#ffffff'      // Papel blanco puro
          }

    const [envelopeState, setEnvelopeState] = useState('closed') // 'closed', 'opening', 'open', 'closing', 'flyingAway'
    const [sealOpacity, setSealOpacity] = useState(1)
    const [flapOpacity, setFlapOpacity] = useState(1)
    const [paperPosition, setPaperPosition] = useState(1.5) // Posición Y de la carta (posición final)
    const [paperScale, setPaperScale] = useState(0.1) // Escala de la carta (inicia pequeña)
    const [paperVisible, setPaperVisible] = useState(false) // Visibilidad del papel
    const [envelopeOpacity, setEnvelopeOpacity] = useState(1) // Opacidad del sobre completo
    const [flyingXPosition, setFlyingXPosition] = useState(0) // Posición X durante el vuelo
    const [envelopeScale, setEnvelopeScale] = useState(1) // Escala del sobre durante animaciones

    // Función para cerrar el sobre (animación inversa)
    const closeEnvelope = (onCloseComplete) => {
        if (envelopeState === 'open') {
            setEnvelopeState('closing')
            onStateChange?.('closing')

            // Fase 1: Encoger la carta
            const paperShrinkInterval = setInterval(() => {
                setPaperScale(prev => {
                    const newScale = prev - 0.04
                    if (newScale <= 0.1) {
                        clearInterval(paperShrinkInterval)
                        setPaperVisible(false)
                        return 0.1
                    }
                    return newScale
                })
            }, 16)

            // Fase 2: Aparecer el sello y la solapa después de que se encoja la carta
            setTimeout(() => {
                const appearInterval = setInterval(() => {
                    setSealOpacity(prev => {
                        const newOpacity = prev + 0.05
                        if (newOpacity >= 1) {
                            return 1
                        }
                        return newOpacity
                    })
                    setFlapOpacity(prev => {
                        const newOpacity = prev + 0.05
                        if (newOpacity >= 1) {
                            clearInterval(appearInterval)
                            setEnvelopeState('closed')
                            onStateChange?.('closed')
                            // Ejecutar callback cuando termine la animación
                            if (onCloseComplete) {
                                setTimeout(() => onCloseComplete(), 50)
                            }
                            return 1
                        }
                        return newOpacity
                    })
                }, 25)
            }, 400)
        }
    }

    // Función para hacer volar el sobre (después de enviar)
    const flyAway = () => {
        if (envelopeState === 'closed') {
            setEnvelopeState('flyingAway')
            onStateChange?.('flyingAway')

            // Animación de vuelo hacia la derecha a velocidad tremenda
            const flyInterval = setInterval(() => {
                setFlyingXPosition(prev => {
                    const newX = prev + 1.5 // Velocidad tremenda
                    if (newX >= 25) {
                        clearInterval(flyInterval)
                        // Hacer invisible el sobre instantáneamente
                        setEnvelopeOpacity(0)
                        // Resetear posición mientras es invisible
                        setFlyingXPosition(0)
                        setEnvelopeScale(0.1) // Empezar pequeño
                        
                        // Reaparecer el sobre con animación de crecimiento
                        setTimeout(() => {
                            setEnvelopeOpacity(1) // Hacer visible de inmediato
                            const reappearInterval = setInterval(() => {
                                setEnvelopeScale(prev => {
                                    const newScale = prev + 0.05
                                    if (newScale >= 1) {
                                        clearInterval(reappearInterval)
                                        setEnvelopeState('closed')
                                        onStateChange?.('closed')
                                        return 1
                                    }
                                    return newScale
                                })
                            }, 16)
                        }, 100)
                        return 25
                    }
                    return newX
                })
            }, 16)
        }
    }

    // Exponer las funciones al componente padre
    if (onClose) {
        onClose.current = { closeEnvelope, flyAway }
    }

    useFrame((state) => {
        const t = state.clock.elapsedTime

        if (envelopeRef.current) {
            if (envelopeState === 'closed') {
                // Continuar con el tiempo desde donde se detuvo
                currentTimeRef.current += 0.016 // Aproximadamente 60fps
                envelopeRef.current.position.y = Math.sin(currentTimeRef.current * 0.9) * 0.2
                envelopeRef.current.rotation.z = Math.sin(currentTimeRef.current * 0.2) * 0.02
            } else if (envelopeState === 'flyingAway') {
                // Durante el vuelo, aplicar la posición X de vuelo
                envelopeRef.current.position.x = flyingXPosition
                envelopeRef.current.rotation.z = 0 // Mantener recto durante el vuelo
            }
            // Para otros estados, mantener la posición actual (no actualizar)
        }
    })

    const handleClick = () => {
        if (envelopeState === 'closed') {
            setEnvelopeState('opening')
            onStateChange?.('opening')

            // Fase 1: Desaparecer el sello y la solapa (500ms)
            const fadeInterval = setInterval(() => {
                setSealOpacity(prev => {
                    const newOpacity = prev - 0.05
                    if (newOpacity <= 0) {
                        return 0
                    }
                    return newOpacity
                })
                setFlapOpacity(prev => {
                    const newOpacity = prev - 0.05
                    if (newOpacity <= 0) {
                        clearInterval(fadeInterval)
                        return 0
                    }
                    return newOpacity
                })
            }, 15)

            // Fase 2: Sacar la carta después de que desaparezca la solapa
            setTimeout(() => {
                // Hacer visible el papel justo antes de que empiece a salir
                setPaperVisible(true)
                
                // Animación: agrandar la carta desde pequeña hasta su tamaño final
                const paperAnimationInterval = setInterval(() => {
                    setPaperScale(prev => {
                        const newScale = prev + 0.06
                        if (newScale >= 1) {
                            clearInterval(paperAnimationInterval)
                            setEnvelopeState('open')
                            onStateChange?.('open')
                            return 1
                        }
                        return newScale
                    })
                }, 16)
            }, 300)
        }
    }

    const handlePointerOver = () => {
        document.body.classList.add('hovering-envelope');
    };

    const handlePointerOut = () => {
        document.body.classList.remove('hovering-envelope');
    };

    return (
        <group 
            ref={envelopeRef} 
            onClick={handleClick} 
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            style={{ cursor: 'pointer' }} 
            scale={[envelopeScale, envelopeScale, envelopeScale]}
        >

            {/* Cuerpo principal del sobre */}
            <mesh position={[0, 2, 0]}
                scale={[1.5, 1.3, 1]}>
                <boxGeometry args={[3, 2.2, 0.1]} />
                <meshStandardMaterial
                    color={envelopeColors.body}
                    roughness={0.4}
                    metalness={0.2}
                    transparent
                    opacity={envelopeOpacity}
                    emissive={envelopeColors.body}
                    emissiveIntensity={0.15}
                />
            </mesh>

            {/* Solapa superior (triángulo invertido) - ahora con opacidad controlada */}
            <mesh position={[0, 2.6, 0]}
                rotation={[Math.PI / 2, 0, Math.PI]}
                scale={[1.68, 1, 0.7]} >
                <coneGeometry args={[1.4, 2, 3]} />
                <meshStandardMaterial 
                    color={envelopeColors.flap}
                    roughness={0.4}
                    metalness={0.2}
                    transparent
                    opacity={flapOpacity * envelopeOpacity}
                    emissive={envelopeColors.flap}
                    emissiveIntensity={0.15}
                />
            </mesh>

            {/* Carta/Papel que aparece y se agranda */}
            {paperVisible && (
                <group position={[0, paperPosition, 1.5]} scale={[paperScale, paperScale, 1]}>
                    <mesh>
                        <planeGeometry args={[4, 3]} />
                        <meshStandardMaterial
                            color={envelopeColors.paper}
                            roughness={0.5}
                            metalness={0.0}
                            side={THREE.DoubleSide}
                        />
                    </mesh>

                    {/* Borde superior de la carta */}
                    <mesh position={[0, 1.5, 0.01]}>
                        <planeGeometry args={[4, 0.4]} />
                        <meshStandardMaterial 
                            color={theme === 'dark' ? '#8cecf3' : '#da3009'} 
                        />
                    </mesh>

                    {/* Líneas decorativas en la carta (simulando texto) */}
                    <group position={[0, 0, 0.01]}>
                        {[0.6, 0.3, 0, -0.3, -0.6].map((yPos, index) => (
                            <mesh key={index} position={[0, yPos, 0]}>
                                <planeGeometry args={[3, 0.04]} />
                                <meshStandardMaterial color="#CCCCCC" />
                            </mesh>
                        ))}
                    </group>
                </group>
            )}

            {/* Sello o adhesivo - ahora con opacidad controlada */}
            <mesh ref={sealRef} position={[0, 1.7, 1]}>
                <circleGeometry args={[0.3, 32]} />
                <meshStandardMaterial
                    color={envelopeColors.seal}
                    roughness={0.3}
                    metalness={0.3}
                    depthTest={false}
                    transparent
                    opacity={sealOpacity * envelopeOpacity}
                    emissive={envelopeColors.seal}
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* Dirección escrita en el sobre */}
            <group position={[-1.2, 1.2, 1]}>
                {[
                    { y: 0.25, w: 1.4 },
                    { y: 0.05, w: 1.2 },
                    { y: -0.15, w: 1.35 },
                    { y: -0.35, w: 0.9 },
                ].map((line, i) => (
                    <mesh key={i} position={[0, line.y, 0]}>
                        <planeGeometry args={[line.w, 0.05]} />
                        <meshStandardMaterial
                            color={theme === 'dark' ? '#887777' : '#000000'} 
                            opacity={0.55 * envelopeOpacity}
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