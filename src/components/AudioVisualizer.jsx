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
    const sourceNodeRef = useRef(null);
    const configRef = useRef(null);
    const themeRef = useRef(theme);

    // Caché de blob URLs para evitar re-fetch
    const audioCacheRef = useRef({});   // { filePath: blobUrl }
    const loadingPromisesRef = useRef({}); // { filePath: Promise } — evita descargas duplicadas

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

    // Resuelve la ruta correcta según el entorno
    const resolvePath = useCallback((filePath) => {
        if (window.location.hostname.includes('github.io') && !filePath.startsWith('.')) {
            return `.${filePath}`;
        }
        return filePath;
    }, []);

    // Carga UN archivo de audio con caché. Si ya se está descargando, reutiliza la misma promesa.
    const loadAudioFile = useCallback(async (filePath) => {
        // 1. Ya está en caché → devolver inmediatamente
        if (audioCacheRef.current[filePath]) {
            return audioCacheRef.current[filePath];
        }

        // 2. Ya se está descargando → esperar la misma promesa
        if (loadingPromisesRef.current[filePath]) {
            return loadingPromisesRef.current[filePath];
        }

        // 3. Nueva descarga
        const fetchAudio = async () => {
            const finalPath = resolvePath(filePath);
            try {
                const response = await fetch(finalPath);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                audioCacheRef.current[filePath] = blobUrl;
                return blobUrl;
            } catch (error) {
                console.error('Error loading audio file:', error);
                // Fallback con ruta absoluta
                const absolutePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
                const response = await fetch(absolutePath);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                audioCacheRef.current[filePath] = blobUrl;
                return blobUrl;
            } finally {
                delete loadingPromisesRef.current[filePath];
            }
        };

        loadingPromisesRef.current[filePath] = fetchAudio();
        return loadingPromisesRef.current[filePath];
    }, [resolvePath]);

    // Pre-carga todas las pistas en segundo plano
    // Prioridad: pista actual primero, luego el resto en paralelo
    const preloadAllTracks = useCallback(async () => {
        // Cargar la pista actual primero (si no está en caché aún)
        const currentFile = playlist[0].file;
        if (!audioCacheRef.current[currentFile]) {
            try { await loadAudioFile(currentFile); } catch { /* silencioso */ }
        }

        // Resto de pistas en paralelo, sin bloquear nada
        const others = playlist.slice(1).map(track =>
            loadAudioFile(track.file).catch(() => { /* error silencioso */ })
        );
        await Promise.allSettled(others);
    }, [loadAudioFile]);

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

    // Cargar y cambiar de canción
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

                // Obtener la URL del caché (o descargar si aún no está lista)
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
    }, [currentTrackIndex, loadAudioFile]);

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

                // Pre-cargar el resto de pistas en segundo plano (sin bloquear)
                preloadAllTracks();
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

            // Liberar todos los blobs del caché
            Object.values(audioCacheRef.current).forEach(url => {
                if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
            });
            audioCacheRef.current = {};
        };
    }, [preloadAllTracks]);

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