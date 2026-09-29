// Converte cada foto de ./imagens para WebP (640, 1280, 1920 px) em ./imagens/otimizadas.
// Gera também ./imagens/og.jpg (1200x630) para a prévia do link no WhatsApp:
// usa "depois-1" se existir (melhor antes/depois), senão a fachada.
// Uso: npm install → npm run otimizar
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, parse } from 'node:path';

const DIR = 'imagens';
const OUT = join(DIR, 'otimizadas');
const WS = [640, 1280, 1920];
const FOTO = /\.(jpe?g|png|webp|avif|tiff?)$/i;
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

await mkdir(OUT, { recursive: true });
const fotos = (await readdir(DIR, { withFileTypes: true }))
  .filter((f) => f.isFile() && FOTO.test(f.name) && f.name !== 'og.jpg')
  .map((f) => ({ arquivo: join(DIR, f.name), nome: slug(parse(f.name).name), original: f.name }));

for (const { arquivo, nome, original } of fotos) {
  for (const w of WS) {
    await sharp(arquivo).rotate().resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 80 }).toFile(join(OUT, `${nome}-${w}.webp`));
  }
  console.log(`${original} → ${nome}-{${WS.join(',')}}.webp`);
}

const capa = fotos.find((f) => f.nome === 'depois-1') || fotos.find((f) => f.nome === 'fachada');
if (capa) {
  await sharp(capa.arquivo).rotate()
    .resize(1200, 630, { fit: 'cover', position: capa.nome === 'fachada' ? 'north' : 'centre' })
    .jpeg({ quality: 85 }).toFile(join(DIR, 'og.jpg'));
  console.log(`og.jpg a partir de ${capa.original}`);
}
