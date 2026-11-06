#!/usr/bin/env node
// Automatic scorer audit for all published cups and league championships.
// Results are independently publishable; missing scorer details must remain pending,
// while forged, impossible or mismatched scorer data is rejected.
import fs from 'node:fs';

function parseFixtures(html) {
  const cup = html.match(/window\.SNAPSHOT=(\{.*?\});<\/script>/s);
  const leagues = html.match(/const CHAMPIONSHIP_SNAPSHOT=(\{.*?\});\s*PORTAL\.competitions/s);
  if (!cup || !leagues) throw new Error('Snapshot coppe/campionati non identificabile: controllo interrotto');
  const competitions = [JSON.parse(cup[1]), ...JSON.parse(leagues[1]).competitions];
  return competitions.flatMap(c => (c.fixtures || []).map(f => ({...f, competition:c.meta?.competition || c.name || 'competizione'})));
}
const fixtures = parseFixtures(fs.readFileSync('index.html','utf8'));
const missing = [], invalid = [], complete = [];
for (const f of fixtures) {
  if (!f.result || /RINV|POST|ANN/i.test(f.result)) continue;
  const m = /^\s*(\d+)\s*[-:]\s*(\d+)\s*(?:DCR)?\s*$/i.exec(String(f.result));
  if (!m) { invalid.push({f,reason:'risultato non interpretabile'}); continue; }
  const score = {home:Number(m[1]),away:Number(m[2])};
  const label = [f.competition,f.date,f.home,f.result,f.away].join(' | ');
  if (!f.matchScorers || f.matchScorers.home === null || f.matchScorers.away === null) {
    missing.push(label);
    continue;
  }
  let waiting = false;
  for (const side of ['home','away']) {
    const items = f.matchScorers[side];
    if (!Array.isArray(items)) {
      waiting = true;
      continue;
    }
    if (items.some(x => !x || typeof x.name !== 'string' || !x.name.trim() ||
      !Number.isInteger(Number(x.goals)) || Number(x.goals) <= 0)) {
      invalid.push({f,reason:side+' contiene un marcatore non valido'});
      continue;
    }
    const assigned = items.reduce((sum,x)=>sum + Number(x.goals),0);
    if (assigned > score[side]) invalid.push({f,reason:side+' ha '+assigned+' reti attribuite su '+score[side]});
    // A deficit might be an own goal, but cannot be assumed to be one.
    else if (assigned < score[side]) waiting = true;
  }
  if (waiting) missing.push(label);
  else complete.push(label);
}
const uniqueMissing = [...new Set(missing)];
for (const l of uniqueMissing) console.log('::warning::Marcatori incompleti / da verificare: '+l);
for (const x of invalid) console.error('::error::'+[x.f.competition,x.f.date,x.f.home,x.f.away,x.reason].join(' | '));
console.log('Riepilogo controllo automatico: '+complete.length+' partite complete, '+uniqueMissing.length+' con marcatori in attesa, '+invalid.length+' incongruenze.');
if (invalid.length) process.exitCode=1;
