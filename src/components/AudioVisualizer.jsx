import { useRef, useEffect, useState, useMemo } from 'react';
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
    const sourceNodeRef = useRef(null);
    const configRef = useRef(null);
    const themeRef = useRef(theme);

    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wasPlayingRef = useRef(false);

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

    // Función para cargar archivos de audio
    const loadAudioFile = async (filePath) => {
        try {
            // Para desarrollo local y GitHub Pages
            let finalPath = filePath;

            // Si estamos en GitHub Pages y la ruta no es relativa, hacerla relativa
            if (window.location.hostname.includes('github.io') && !filePath.startsWith('.')) {
                finalPath = `.${filePath}`;
            }

            const response = await fetch(finalPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error loading audio file:', error);
            // Fallback: intentar con ruta absoluta desde root
            try {
                const absolutePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
                const response = await fetch(absolutePath);
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                throw fallbackError;
            }
        }
    };

    // Funciones de control del reproductor
    const playAudio = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            await audio.play();
            setIsPlaying(true);
            if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
            }
        } catch (error) {
            console.error('Error al reproducir:', error);
        }
    };

    const pauseAudio = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            setIsPlaying(false);
        }
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    };

    const playNextTrack = () => {
        wasPlayingRef.current = isPlaying;
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        setCurrentTrackIndex(nextIndex);
    };

    const playPreviousTrack = () => {
        wasPlayingRef.current = isPlaying;
        const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
        setCurrentTrackIndex(prevIndex);
    };

    // Cargar y cambiar de canción - CORREGIDO
    useEffect(() => {
        const loadTrack = async () => {
            const audio = audioRef.current;
            if (!audio) return;

            try {
                setIsLoading(true);

                // Pausar audio actual antes de cambiar
                if (isPlaying) {
                    audio.pause();
                }

                // Limpiar URL anterior si existe
                if (audio.src && audio.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audio.src);
                }

                // Cargar el nuevo archivo de audio
                const audioUrl = await loadAudioFile(currentTrack.file);
                audio.src = audioUrl;

                // NO crear un nuevo source node - reutilizar el existente
                // El source node ya está conectado desde la inicialización

                // Si estaba reproduciendo, seguir reproduciendo
                if (wasPlayingRef.current) {
                    await playAudio();
                    wasPlayingRef.current = false;
                }
            } catch (error) {
                console.error('Error al cargar la canción:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTrack();
    }, [currentTrackIndex]);

    // Inicialización de audio y visualizador - CORREGIDO
    useEffect(() => {
        const audio = audioRef.current;

        const initAudio = async () => {
            try {
                // Cargar archivo de audio inicial
                const audioUrl = await loadAudioFile(currentTrack.file);
                audio.src = audioUrl;

                // Crear contexto de audio si no existe
                if (!audioContextRef.current) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    const audioContext = new AudioContext();

                    const analyser = audioContext.createAnalyser();

                    // Crear source node SOLO UNA VEZ
                    const source = audioContext.createMediaElementSource(audio);
                    sourceNodeRef.current = source;

                    source.connect(analyser);
                    analyser.connect(audioContext.destination);

                    analyser.fftSize = config.fftSize;
                    analyser.smoothingTimeConstant = 0.8;

                    audioContextRef.current = audioContext;
                    analyserRef.current = analyser;
                }

                // Listener para cuando termina la canción
                const handleEnded = () => {
                    wasPlayingRef.current = true;
                    const nextIndex = (currentTrackIndex + 1) % playlist.length;
                    setCurrentTrackIndex(nextIndex);
                };

                // Listener para actualizar el estado de reproducción
                const handlePlay = () => setIsPlaying(true);
                const handlePause = () => {
                    if (!wasPlayingRef.current) {
                        setIsPlaying(false);
                    }
                };

                audio.addEventListener('ended', handleEnded);
                audio.addEventListener('play', handlePlay);
                audio.addEventListener('pause', handlePause);

                // Guardar handlers para cleanup
                audio._handleEnded = handleEnded;
                audio._handlePlay = handlePlay;
                audio._handlePause = handlePause;

                draw();
            } catch (err) {
                console.error('Error al inicializar audio:', err);
            }
        };

        const draw = () => {
            const canvas = canvasRef.current;
            const analyser = analyserRef.current;
            if (!canvas || !analyser) return;

            const ctx = canvas.getContext('2d');
            const { width, height } = canvas;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, width, height);

            const { barCount, barWidth, gap } = configRef.current || config;
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
        };

        initAudio();

        return () => {
            cancelAnimationFrame(animationRef.current);

            if (audio) {
                audio.removeEventListener('ended', audio._handleEnded);
                audio.removeEventListener('play', audio._handlePlay);
                audio.removeEventListener('pause', audio._handlePause);

                // Limpiar URLs de objeto
                if (audio.src && audio.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audio.src);
                }
            }

            // Limpiar el contexto de audio solo cuando el componente se desmonte
            if (audioContextRef.current) {
                // Desconectar el source node antes de cerrar
                if (sourceNodeRef.current) {
                    sourceNodeRef.current.disconnect();
                    sourceNodeRef.current = null;
                }
                audioContextRef.current.close();
                audioContextRef.current = null;
                analyserRef.current = null;
            }
        };
    }, []);

    return (
        <div className="audio-visualizer-fixed">
            <canvas ref={canvasRef} className="visualizer-canvas" />
            <audio ref={audioRef} />

            {/* Controles integrados dentro del visualizador */}
            <div className="audio-controls">
                <div className="song-info">
                    <div className="song-title">
                        <span className={`song-title-text ${isTitleLong ? 'long' : ''}`}>
                            {currentTrack.title}
                            {isLoading && <span className="loading-dots">...</span>}
                        </span>
                    </div>
                    <p className="song-artist">{currentTrack.artist}</p>
                </div>

                <button
                    className="control-button btn-previous"
                    onClick={playPreviousTrack}
                    disabled={isLoading}
                    aria-label="Anterior"
                    title="Anterior"
                >
                    <SkipBack size={18} />
                </button>

                <button
                    className={`control-button play-pause ${isPlaying ? 'btn-pause' : 'btn-play'}`}
                    onClick={togglePlayPause}
                    disabled={isLoading}
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    title={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button
                    className="control-button btn-next"
                    onClick={playNextTrack}
                    disabled={isLoading}
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