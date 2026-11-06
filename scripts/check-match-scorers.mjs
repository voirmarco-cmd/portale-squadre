#!/usr/bin/env node
// Validate match-level scorers on newly published results.
// Historical gaps remain reported separately; this gate prevents NEW omissions.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

function readSnapshots(html) {
  const legacy = html.match(/window\.SNAPSHOT=(\{.*?\});<\/script>/s);
  const championships = html.match(/const CHAMPIONSHIP_SNAPSHOT=(\{.*?\});\s*PORTAL\.competitions/s);
  if (!legacy) throw Error('Snapshot COPPA non trovato in index.html');
  const objects = [JSON.parse(legacy[1])];
  if (championships) objects.push(...JSON.parse(championships[1]).competitions);
  return objects.flatMap((s) => (s.fixtures || []).map((f) => ({
    ...f, competition: s.meta?.competition || s.name || 'Campionato'
  })));
}
const normalize = value => String(value || '').trim().toUpperCase()
  .replace(/\bUTD\b/g, 'UNITED').replace(/\s+/g, ' ');
const key = f => [f.competition, f.date, f.time, normalize(f.home), normalize(f.away)].join('|');
function valid(f) {
  const match = /^\s*(\d+)\s*[-:]\s*(\d+)/.exec(String(f.result || ''));
  if (!match) return true;
  const goals = [Number(match[1]), Number(match[2])];
  if (!f.matchScorers || typeof f.matchScorers !== 'object') return false;
  return ['home','away'].every((side, i) => {
    const entry = f.matchScorers[side];
    if (goals[i] === 0) return entry === null || (Array.isArray(entry) && entry.length === 0);
    return Array.isArray(entry) && entry.length > 0 &&
      entry.every(x => typeof x.name === 'string' && x.name.trim() && Number.isInteger(Number(x.goals)) && Number(x.goals) > 0) &&
      entry.reduce((sum,x) => sum + Number(x.goals), 0) <= goals[i];
  });
}
const current = readSnapshots(fs.readFileSync('index.html', 'utf8'));
let previous = [];
try {
  previous = readSnapshots(execFileSync('git', ['show', 'HEAD^:index.html'], {encoding:'utf8', maxBuffer: 12 * 1024 * 1024}));
} catch {
  // First commit/shallow checkout: report pre-existing gaps but don't reject them.
}
const old = new Map(previous.map(f => [key(f), f]));
const failures = [];
for (const match of current) {
  if (!match.result || valid(match)) continue;
  const before = old.get(key(match));
  if (!before || !before.result || valid(before)) {
    failures.push(match);
  }
}
if (failures.length) {
  for (const f of failures) {
    console.error('::error::Marcatori mancanti/non validi: ' +
      [f.competition, f.date, f.home, f.result, f.away].join(' / '));
  }
  console.error('Pubblicazione incompleta: ' + failures.length + ' incontri. Associare matchScorers verificati prima di pubblicare.');
  process.exitCode = 1;
} else {
  const historical = current.filter(f => f.result && !valid(f));
  console.log('Nessuna nuova omissione di marcatori. Lacune storiche ancora presenti: ' + historical.length);
}
