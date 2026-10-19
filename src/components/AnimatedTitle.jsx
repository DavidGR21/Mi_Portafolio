import { Fragment, useState, useEffect } from 'react';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*';
const TOTAL_FRAMES = 18; // Duración total de la animación en frames
const FRAME_MS = 40;

const randomChar = () => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];

// La letra final siempre ocupa su espacio (invisible mientras se anima) y la letra
// aleatoria se dibuja encima sin afectar el layout: el título nunca cambia de líneas
const charStyle = { position: 'relative', display: 'inline-block' };
const hiddenStyle = { visibility: 'hidden' };
const randomStyle = { position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)' };
const wordStyle = { whiteSpace: 'nowrap' };

// Título con efecto "scramble": las letras se revelan de izquierda a derecha
function AnimatedTitle({ text, className = '' }) {
    const [scramble, setScramble] = useState({ revealed: text.length, chars: '' });
    const isAnimating = scramble.revealed < text.length;

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setScramble({ revealed: text.length, chars: '' });
            return;
        }

        let frameCount = 0;
        const nextFrame = () => {
            const revealed = Math.floor((frameCount / TOTAL_FRAMES) * text.length);
            setScramble({ revealed, chars: Array.from(text, randomChar).join('') });
        };

        nextFrame();
        const interval = setInterval(() => {
            frameCount++;
            nextFrame();
            if (frameCount >= TOTAL_FRAMES) clearInterval(interval);
        }, FRAME_MS);

        return () => clearInterval(interval);
    }, [text]);

    // Se agrupa por palabras para que el salto de línea solo ocurra entre palabras
    let index = 0;
    const words = text.split(' ').map((word, wordIndex) => {
        const chars = Array.from(word, (char) => {
            const i = index++;
            const isRevealed = i < scramble.revealed;
            return (
                <span key={i} style={charStyle}>
                    <span style={isRevealed ? undefined : hiddenStyle}>{char}</span>
                    {!isRevealed && <span style={randomStyle}>{scramble.chars[i]}</span>}
                </span>
            );
        });
        index++; // el espacio entre palabras
        return (
            <Fragment key={wordIndex}>
                {wordIndex > 0 && ' '}
                <span style={wordStyle}>{chars}</span>
            </Fragment>
        );
    });

    return (
        <h2
            className={`${className} ${isAnimating ? 'animating' : ''}`}
            data-text={isAnimating ? '' : text}
            aria-label={text}
        >
            <span aria-hidden="true">{words}</span>
        </h2>
    );
}

export default AnimatedTitle;
