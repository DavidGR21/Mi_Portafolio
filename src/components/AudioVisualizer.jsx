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
    const sourceNodeRef = useRef(null); // Ref para el source node
    const configRef = useRef(null);
    const themeRef = useRef(theme); // Ref para mantener el tema actualizado

    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const wasPlayingRef = useRef(false); // Ref para rastrear si estaba reproduciendo

    const currentTrack = playlist[currentTrackIndex];
    
    // Determinar si el título es largo (más de 30 caracteres)
    const isTitleLong = currentTrack.title.length > 30;

    // Configuración base constante con color según el tema
    const baseConfig = useMemo(() => ({
        barWidth: 2,
        gap: 1,
        height: 50,
        fftSize: 2048,
        densityFactor: 1,
        colorBar: theme === 'light' ? 0 : 170  // Rojo en modo claro, Turquesa en modo oscuro
        /*
            Rojo:          0
            Naranja:       30
            Amarillo:      60
            Verde:         120
            Turquesa:      170
            Cyan:          180
            Azul:          220
            Morado:        270
            Rosa:          320
        */
    }), [theme]);

    // Configuración derivada del tamaño de pantalla
    const config = useMemo(() => {
        const { barWidth, gap, densityFactor } = baseConfig;

        return {
            ...baseConfig,
            barCount: Math.floor(
                (screenWidth * densityFactor) / (barWidth + gap)
            )
        };
    }, [screenWidth, baseConfig]);

    // Mantener siempre la config actualizada
    useEffect(() => {
        configRef.current = config;
        themeRef.current = theme; // Actualizar themeRef cuando cambie el tema
        console.log('Config actualizada:', config.colorBar, 'Tema:', theme);
    }, [config, theme]);

    // Ajuste del canvas al tamaño de la pantalla
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
        wasPlayingRef.current = true; // Marcar que debe seguir reproduciendo
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        setCurrentTrackIndex(nextIndex);
    };

    const playPreviousTrack = () => {
        wasPlayingRef.current = isPlaying; // Mantener el estado actual de reproducción
        const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
        setCurrentTrackIndex(prevIndex);
    };

    // Cargar y cambiar de canción
    useEffect(() => {
        const loadTrack = async () => {
            const audio = audioRef.current;
            if (!audio) return;

            try {
                // Importar el archivo de audio dinámicamente
                const audioModule = await import(/* @vite-ignore */ currentTrack.file);
                audio.src = audioModule.default;

                // Si estaba reproduciendo o fue cambio automático, seguir reproduciendo
                if (isPlaying || wasPlayingRef.current) {
                    await playAudio();
                    wasPlayingRef.current = false; // Resetear el flag
                }
            } catch (error) {
                console.error('Error al cargar la canción:', error);
            }
        };

        loadTrack();
    }, [currentTrackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

    // Inicialización de audio y visualizador
    useEffect(() => {
        const audio = audioRef.current;
        
        const initAudio = async () => {
            try {
                // Cargar archivo de audio inicial
                const mod = await import(/* @vite-ignore */ currentTrack.file);
                audio.src = mod.default;

                // Solo crear el contexto de audio si no existe
                if (!audioContextRef.current) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    const audioContext = new AudioContext();

                    const analyser = audioContext.createAnalyser();
                    
                    // Solo crear el source node si no existe
                    if (!sourceNodeRef.current) {
                        const source = audioContext.createMediaElementSource(audio);
                        sourceNodeRef.current = source;
                        
                        source.connect(analyser);
                        analyser.connect(audioContext.destination);
                    }

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
                    // Solo actualizar si no estamos haciendo una transición automática
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

                const brightness = 20 + (value / 255) * 30; // 20% a 50%
                // Calcular el color según el tema actual usando themeRef
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
            }

            // Limpiar el contexto de audio solo cuando el componente se desmonte
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            
            // Limpiar el source node
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
