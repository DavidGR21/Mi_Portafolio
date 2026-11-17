// Utilidades de la galería de proyectos (sin componentes, para el fast refresh de Vite)

// Evento compartido entre el video de la galería y el reproductor de música:
// cuando uno empieza a sonar, el otro se pausa para que nunca suenen a la vez
export const MEDIA_PLAY_EVENT = 'portfolio:media-play';

// Precarga en la caché del navegador (cada URL una sola vez)
const preloaded = new Set();
const preloadImages = (urls) => {
    urls.forEach((url) => {
        if (!url || preloaded.has(url)) return;
        preloaded.add(url);
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
    });
};

// Miniaturas, póster del video y capturas grandes (pesan pocos KB cada una)
export const preloadGallery = (media = []) => {
    preloadImages(media.flatMap((item) => [item.thumb, item.poster, item.type === 'image' && item.src]));
};
