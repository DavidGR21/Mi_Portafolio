/* eslint-env node */
// Optimiza las capturas y videos de un proyecto para la galería del portafolio.
//
//   npm run media -- <slug> [--poster 2]
//
// Lee los originales de  media-src/<slug>/  (fuera de public, no se publican) y genera en
// public/assets/projects/<slug>/:
//   - imágenes  -> <nombre>.webp        (máx. 1600 px de ancho)
//               -> thumbs/<nombre>.webp (240 px, para la tira de miniaturas)
//   - videos    -> <nombre>.mp4         (H.264 máx. 1280 px, "faststart": empieza a
//                                        reproducirse mientras se descarga)
//               -> <nombre>-poster.webp + thumbs/<nombre>.webp (fotograma del segundo --poster)
// Al final imprime el bloque `media: [...]` listo para pegar en src/data/projectsData.jsx.
// Requiere ffmpeg en el PATH.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { extname, basename, join } from 'node:path';

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp']);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.mkv', '.avi']);

const args = process.argv.slice(2);
const slug = args.find((arg) => !arg.startsWith('--'));
const posterIndex = args.indexOf('--poster');
const posterTime = posterIndex >= 0 ? Number(args[posterIndex + 1]) : 1;

if (!slug) {
    console.error('Uso: npm run media -- <slug> [--poster <segundos>]');
    process.exit(1);
}

const srcDir = join('media-src', slug);
const outDir = join('public', 'assets', 'projects', slug);
const thumbDir = join(outDir, 'thumbs');

if (!existsSync(srcDir)) {
    console.error(`No existe ${srcDir}. Pon ahí las capturas y videos originales.`);
    process.exit(1);
}
mkdirSync(thumbDir, { recursive: true });

const ffmpeg = (...ffArgs) => {
    const result = spawnSync('ffmpeg', ['-v', 'error', '-y', ...ffArgs], { stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`ffmpeg falló con: ${ffArgs.join(' ')}`);
};

// Escala solo hacia abajo, a un ancho par (requisito de H.264)
const fit = (maxWidth) => `scale='min(${maxWidth},iw)':-2:flags=lanczos`;
const kb = (file) => `${Math.round(statSync(file).size / 1024)} KB`;

// "03-sala-de-juegos" -> "Sala de juegos" (título provisional, se puede editar)
const toCaption = (name) => {
    const text = name.replace(/^\d+[-_ ]*/, '').replace(/[-_]+/g, ' ').trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
};

const files = readdirSync(srcDir).sort();
const entries = [];
const publicPath = `assets/projects/${slug}`;

for (const file of files) {
    const ext = extname(file).toLowerCase();
    const name = basename(file, extname(file));
    const input = join(srcDir, file);

    if (VIDEO_EXT.has(ext)) {
        const video = join(outDir, `${name}.mp4`);
        const poster = join(outDir, `${name}-poster.webp`);
        ffmpeg('-i', input, '-vf', fit(1280), '-c:v', 'libx264', '-preset', 'slow', '-crf', '28',
            '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k',
            '-movflags', '+faststart', video);
        ffmpeg('-ss', String(posterTime), '-i', input, '-frames:v', '1', '-vf', fit(1280),
            '-c:v', 'libwebp', '-quality', '80', poster);
        ffmpeg('-ss', String(posterTime), '-i', input, '-frames:v', '1', '-vf', fit(240),
            '-c:v', 'libwebp', '-quality', '70', join(thumbDir, `${name}.webp`));
        console.log(`video   ${file} -> ${kb(input)} => ${kb(video)} (+ póster ${kb(poster)})`);
        entries.push({ type: 'video', name, caption: 'Trailer' });
    } else if (IMAGE_EXT.has(ext)) {
        const image = join(outDir, `${name}.webp`);
        ffmpeg('-i', input, '-vf', fit(1600), '-c:v', 'libwebp', '-quality', '85', image);
        ffmpeg('-i', input, '-vf', fit(240), '-c:v', 'libwebp', '-quality', '70', join(thumbDir, `${name}.webp`));
        console.log(`imagen  ${file} -> ${kb(input)} => ${kb(image)}`);
        entries.push({ type: 'image', name, caption: toCaption(name) });
    }
}

// Los videos primero: son lo primero que se ve al abrir la galería
entries.sort((a, b) => (a.type === b.type ? 0 : a.type === 'video' ? -1 : 1));

console.log(`\nPega esto en el proyecto (src/data/projectsData.jsx):\n`);
console.log(`media: projectMedia("${publicPath}", [`);
entries.forEach(({ type, name, caption }) => {
    console.log(`    ["${type}", "${name}", "${caption}"],`);
});
console.log(']),');
