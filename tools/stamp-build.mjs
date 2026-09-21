import { createHash } from 'node:crypto';
import fs from 'node:fs';

// Wersjonowanie punktu wejścia: nowy bundle musi wczytać także nowy manifest PNG.
const version = createHash('sha256').update(fs.readFileSync('dist/game.js')).digest('hex').slice(0, 12);
const html = fs.readFileSync('index.html', 'utf8');
const script = /src="dist\/game\.js(?:\?v=[a-z0-9-]+)?"/;
if (!script.test(html)) throw new Error('Nie znaleziono skryptu gry w index.html');
fs.writeFileSync('index.html', html.replace(script, `src="dist/game.js?v=${version}"`));
console.log(`Wersja skryptu gry: ${version}`);
