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
if (!newBlocks.length) throw Error('No competition fixtures found');
const key = g => [g.round, g.group || '', g.home, g.away].join('|');
// Tournaments may be added, removed or reordered between releases. Align blocks by
// existing fixture identity, never their array position or total count.
const oldSets = oldBlocks.map(block => new Set(block.games.map(key)));
const usedOld = new Set();
const timestamp = new Date().toISOString();
let changed = 0;
const replacements = [];
for (let i = 0; i < newBlocks.length; i++) {
  const after = newBlocks[i];
  const keys = after.games.map(key);
  let best = -1, shared = 0;
  for (let j = 0; j < oldBlocks.length; j++) {
    if (usedOld.has(j)) continue;
    const overlap = keys.filter(k => oldSets[j].has(k)).length;
    if (overlap > shared) { best = j; shared = overlap; }
  }
  // New competitions have no comparable old fixture block, so leave them alone.
  if (best < 0 || shared < 2 || shared / Math.min(keys.length, oldSets[best].size) < 0.1) continue;
  usedOld.add(best);
  const before = new Map(oldBlocks[best].games.map(g => [key(g), g]));
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
