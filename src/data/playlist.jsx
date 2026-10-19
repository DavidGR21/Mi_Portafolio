// Playlist de audio para el visualizador
// BASE_URL respeta el `base` de vite.config.js (funciona en dev y en GitHub Pages)
const AUDIO_PATH = `${import.meta.env.BASE_URL}assets/audios/`;

export const playlist = [
    {
        id: 1,
        title: "Color Stay",
        artist: "Heaven Hazy",
        file: `${AUDIO_PATH}colorStay.mp3`
    },
    {
        id: 2,
        title: "Self Love (Spider-Man: Across the Spider-Verse)",
        artist: "Coi Leray",
        file: `${AUDIO_PATH}selfLove.mp3`
    },
    {
        id: 3,
        title: "Mona Lisa",
        artist: "Dominic Fike",
        file: `${AUDIO_PATH}monaLisa.mp3`
    },
    {
        id: 4,
        title: "Where We Come From",
        artist: "Lecrae",
        file: `${AUDIO_PATH}whereWeComeFrom.mp3`
    }
];

export default playlist;
