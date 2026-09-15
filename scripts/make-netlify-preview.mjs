import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const out = join(root, 'netlify-preview');
const routes = ['', 'catalogo', 'categorias', 'nosotros', 'visitanos'];

await rm(out, { recursive: true, force: true });
await mkdir(join(out, 'assets'), { recursive: true });
await cp(join(root, 'public', 'assets'), join(out, 'assets'), { recursive: true });
const css = await readFile(join(root, 'app', 'globals.css'), 'utf8');
await writeFile(join(out, 'styles.css'), css.replace(/^@import[^;]+;\s*/m, ''), 'utf8');

for (const route of routes) {
  const response = await fetch(`http://localhost:5173/${route}`);
  if (!response.ok) throw new Error(`${route || '/'} returned ${response.status}`);
  let html = await response.text();
  html = html
    .replace(/<div class="loading-screen"[\s\S]*?<\/div>/, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<link[^>]+modulepreload[^>]*>/gi, '')
    .replace(/<link rel="stylesheet" href="\/app\/globals\.css"[^>]*>/, '<link rel="stylesheet" href="/styles.css">')
    .replace(/<link rel="preload"[^>]+>/gi, '')
    .replace(/<link rel="icon" href="\/assets\/logo\.png"[^>]*>/, '<link rel="icon" href="/assets/logo.png">')
    .replace(/href="\/(catalogo|categorias|nosotros|visitanos)"/g, 'href="/$1/"');
  const target = route ? join(out, route) : out;
  await mkdir(target, { recursive: true });
  await writeFile(join(target, 'index.html'), html, 'utf8');
}

await writeFile(join(out, '_redirects'), '/* /index.html 200\n', 'utf8');
await writeFile(join(out, 'README.txt'), 'Vista previa estática para Netlify. La versión completa (filtros, administrador, D1/R2 y APIs) requiere el runtime Cloudflare del proyecto.\n', 'utf8');
console.log(`Created ${out}`);
