import { useEffect, useState } from 'react';
import '../styles/DragHint.css';

function DragHint() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Ocultar el hint después de 5 segundos
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="drag-hint">
            <div className="drag-hint-hand">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 11V6C9 5.44772 9.44772 5 10 5C10.5523 5 11 5.44772 11 6V11M11 11V4C11 3.44772 11.4477 3 12 3C12.5523 3 13 3.44772 13 4V11M11 11V5C11 4.44772 11.4477 4 12 4C12.5523 4 13 4.44772 13 5V11M13 11V6C13 5.44772 13.4477 5 14 5C14.5523 5 15 5.44772 15 6V11M15 11V8C15 7.44772 15.4477 7 16 7C16.5523 7 17 7.44772 17 8V13C17 16.3137 14.3137 19 11 19H10C6.68629 19 4 16.3137 4 13V12C4 11.4477 4.44772 11 5 11C5.55228 11 6 11.4477 6 12V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <div className="drag-hint-arrows">
                <span className="arrow-left">←</span>
                <span className="arrow-right">→</span>
            </div>
            <p className="drag-hint-text">Arrastra para girar</p>
        </div>
    );
}

export default DragHint;
