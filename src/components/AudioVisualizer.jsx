import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import playlist from '../data/playlist';
import '../styles/AudioVisualizer.css';

const AudioVisualizer = () => {
    const { theme } = useTheme();
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const configRef = useRef(null);
    const themeRef = useRef(theme);

    // Indica si al cambiar de pista se debe seguir reproduciendo
    const wasPlayingRef = useRef(false);

    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentTrack = playlist[currentTrackIndex];

    const isTitleLong = currentTrack.title.length > 30;

    const baseConfig = useMemo(() => ({
        barWidth: 2,
        gap: 1,
        height: 50,
        fftSize: 2048,
        densityFactor: 1,
        colorBar: theme === 'light' ? 0 : 170
    }), [theme]);

    const config = useMemo(() => {
        const { barWidth, gap, densityFactor } = baseConfig;

        return {
            ...baseConfig,
            barCount: Math.floor(
                (screenWidth * densityFactor) / (barWidth + gap)
            )
        };
    }, [screenWidth, baseConfig]);

    useEffect(() => {
        configRef.current = config;
        themeRef.current = theme;
    }, [config, theme]);

    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const width = window.innerWidth;
            setScreenWidth(width);

            canvas.width = width;
            canvas.height = config.height;
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [config.height]);

    // Bucle de dibujo del visualizador (lee todo desde refs)
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);

        const { barCount, barWidth, gap } = configRef.current;
        const totalWidth = barCount * (barWidth + gap);
        const startX = (width - totalWidth) / 2;

        for (let i = 0; i < barCount; i++) {
            const value = dataArray[i];
            const barHeight = (value / 255) * height;

            const x = startX + i * (barWidth + gap);
            const y = height - barHeight;

            const brightness = 20 + (value / 255) * 30;
            const currentColor = themeRef.current === 'light' ? 0 : 170;
            ctx.fillStyle = `hsl(${currentColor}, 100%, ${brightness}%)`;

            ctx.fillRect(x, y, barWidth, barHeight);
        }

        animationRef.current = requestAnimationFrame(draw);
    }, []);

    // Crea el grafo de audio SOLO UNA VEZ y dentro de un gesto del usuario
    // (los navegadores bloquean un AudioContext creado sin interacción)
    const initAudioGraph = () => {
        if (audioContextRef.current) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioRef.current);

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = configRef.current.fftSize;
        analyser.smoothingTimeConstant = 0.8;

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        draw();
    };

    const startPlayback = (audio) => {
        audio.play().catch((error) => {
            // AbortError = se cambió de pista antes de empezar; no es un error real
            if (error.name !== 'AbortError') console.error('Error al reproducir:', error);
        });
    };

    // Funciones de control del reproductor
    const playAudio = () => {
        const audio = audioRef.current;
        if (!audio) return;

        initAudioGraph();
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        startPlayback(audio);
    };

    const pauseAudio = () => {
        audioRef.current?.pause();
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    };

    const changeTrack = (getIndex) => {
        wasPlayingRef.current = !audioRef.current.paused;
        setCurrentTrackIndex(getIndex);
    };

    const playNextTrack = () => {
        changeTrack(i => (i + 1) % playlist.length);
    };

    const playPreviousTrack = () => {
        changeTrack(i => (i === 0 ? playlist.length - 1 : i - 1));
    };

    // Cambiar de canción: el navegador hace streaming del archivo,
    // así que la reproducción empieza sin esperar la descarga completa
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.src = currentTrack.file;

        if (wasPlayingRef.current) {
            wasPlayingRef.current = false;
            startPlayback(audio);
        }
    }, [currentTrack.file]);

    // Eventos del elemento <audio>: única fuente de verdad del estado
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Elemento oculto que pre-carga la siguiente pista en la caché del navegador
        const preloader = new Audio();
        preloader.preload = 'auto';

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => {
            // Ignorar la pausa momentánea al saltar de pista
            if (!wasPlayingRef.current) setIsPlaying(false);
        };
        const handleEnded = () => {
            wasPlayingRef.current = true;
            setCurrentTrackIndex(i => (i + 1) % playlist.length);
        };
        const handleLoading = () => setIsLoading(true);
        const handleReady = () => setIsLoading(false);

        // Cuando la pista actual ya puede sonar completa, pre-cargar la siguiente
        const handleCanPlayThrough = () => {
            const index = playlist.findIndex(track => audio.src.endsWith(track.file));
            const nextTrack = playlist[(index + 1) % playlist.length];
            if (!preloader.src.endsWith(nextTrack.file)) {
                preloader.src = nextTrack.file;
            }
        };

        const listeners = {
            play: handlePlay,
            pause: handlePause,
            ended: handleEnded,
            loadstart: handleLoading,
            waiting: handleLoading,
            canplay: handleReady,
            playing: handleReady,
            canplaythrough: handleCanPlayThrough,
        };

        Object.entries(listeners).forEach(([event, handler]) => audio.addEventListener(event, handler));

        return () => {
            Object.entries(listeners).forEach(([event, handler]) => audio.removeEventListener(event, handler));

            preloader.removeAttribute('src');
            preloader.load();
        };
    }, []);

    // Limpiar el contexto de audio solo cuando el componente se desmonte
    useEffect(() => {
        return () => {
            cancelAnimationFrame(animationRef.current);

            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
                analyserRef.current = null;
            }
        };
    }, []);

    return (
        <div className="audio-visualizer-fixed">
            <canvas ref={canvasRef} className="visualizer-canvas" />
            <audio ref={audioRef} preload="auto" />

            {/* Controles integrados dentro del visualizador */}
            <div className="audio-controls">
                <div className="song-info">
                    <div className="song-title">
                        <span className={`song-title-text ${isTitleLong ? 'long' : ''}`}>
                            {currentTrack.title}
                            {isLoading && isPlaying && <span className="loading-dots">...</span>}
                        </span>
                    </div>
                    <p className="song-artist">{currentTrack.artist}</p>
                </div>

                <button
                    className="control-button btn-previous"
                    onClick={playPreviousTrack}
                    aria-label="Anterior"
                    title="Anterior"
                >
                    <SkipBack size={18} />
                </button>

                <button
                    className={`control-button play-pause ${isPlaying ? 'btn-pause' : 'btn-play'}`}
                    onClick={togglePlayPause}
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button
                    className="control-button btn-next"
                    onClick={playNextTrack}
                    aria-label="Siguiente"
                    title="Siguiente"
                >
                    <SkipForward size={18} />
                </button>
            </div>
        </div>
    );
};

export default AudioVisualizer;
