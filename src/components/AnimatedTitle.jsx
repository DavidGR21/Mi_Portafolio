import { useState, useEffect } from 'react';

function AnimatedTitle({ text, className = '' }) {
    const [displayText, setDisplayText] = useState('');
    const [isAnimating, setIsAnimating] = useState(true);

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    useEffect(() => {
        setIsAnimating(true);
        let frameCount = 0;
        const totalFrames = 6; // Duración total de la animación en frames

        const interval = setInterval(() => {
            if (frameCount < totalFrames) {
                // Mostrar caracteres aleatorios para todos
                setDisplayText(
                    text
                        .split('')
                        .map((char) => {
                            if (char === ' ') {
                                return ' ';
                            }
                            return characters[Math.floor(Math.random() * characters.length)];
                        })
                        .join('')
                );
                frameCount++;
            } else {
                // Mostrar el texto final todo a la vez
                setDisplayText(text);
                setIsAnimating(false);
                clearInterval(interval);
            }
        }, 80);

        return () => clearInterval(interval);
    }, [text]);

    return <h2 className={`${className} ${isAnimating ? 'animating' : ''}`}>{displayText}</h2>;
}

export default AnimatedTitle;
