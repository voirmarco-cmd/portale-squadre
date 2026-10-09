import fs from 'node:fs';

const [oldPath, newPath] = process.argv.slice(2);
if (!oldPath || !newPath) throw Error('Specify previous and new HTML paths');
const oldHtml = fs.readFileSync(oldPath, 'utf8');
let html = fs.readFileSync(newPath, 'utf8');

function fixtureBlocks(source) {
  const blocks = [];
  const marker = '"fixtures":[';
  let from = 0;
  while (true) {
    const start = source.indexOf(marker, from);
    if (start < 0) break;
    const open = start + marker.length - 1;
    let depth = 0, quoted = false, escaped = false, end = -1;
    for (let i = open; i < source.length; i++) {
      const ch = source[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') quoted = false;
      } else if (ch === '"') quoted = true;
      else if (ch === '[') depth++;
      else if (ch === ']' && --depth === 0) { end = i + 1; break; }
    }
    if (end < 0) throw Error('Unclosed fixture array');
    blocks.push({open, end, games: JSON.parse(source.slice(open, end))});
    from = end;
  }
  return blocks;
}

const oldBlocks = fixtureBlocks(oldHtml);
const newBlocks = fixtureBlocks(html);
if (oldBlocks.length !== newBlocks.length || !newBlocks.length) {
  throw Error('Competition fixture blocks changed: manual review required');
}
const key = g => [g.round, g.group || '', g.home, g.away].join('|');
const timestamp = new Date().toISOString();
let changed = 0;
const replacements = [];
for (let i = 0; i < newBlocks.length; i++) {
  const before = new Map(oldBlocks[i].games.map(g => [key(g), g]));
  const after = newBlocks[i];
  let touched = false;
  for (const game of after.games) {
    const previous = before.get(key(game));
    if (!previous) continue; // New fixtures are not MODIFICATO
    if (game.date !== previous.date || game.time !== previous.time) {
      // Do not reset a timestamp if the already-published modification is unchanged.
      if (!game.modifiedAt || game.modifiedAt === previous.modifiedAt) {
        game.modifiedAt = timestamp;
        touched = true;
        changed++;
      }
    } else if (previous.modifiedAt && !game.modifiedAt) {
      game.modifiedAt = previous.modifiedAt;
      touched = true;
    }
  }
  if (touched) replacements.push({start: after.open, end: after.end, value: JSON.stringify(after.games)});
}
for (const item of replacements.reverse()) {
  html = html.slice(0, item.start) + item.value + html.slice(item.end);
}
if (replacements.length) fs.writeFileSync(newPath, html);
console.log('MODIFICATO: ' + changed + ' newly changed fixtures; ' + replacements.length + ' updated competitions.');
