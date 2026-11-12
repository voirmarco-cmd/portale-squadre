#!/usr/bin/env node
/**
 * Attribuzione marcatori per differenza tra due snapshot ufficiali.
 *
 * Esecuzione: node scripts/derive-match-scorers.mjs --previous-ref=HEAD^
 * Scrive index.html SOLO quando, per ciascuna squadra, esiste una singola nuova
 * partita e l'incremento dei marcatori cumulativi e' uguale ai gol realizzati.
 * Non assegna reti arbitrarie e non cancella tabellini gia' verificati.
 * Non legge i Google Sheets: presuppone che lo snapshot aggiornato li contenga.
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const file='index.html';
const marker='const CHAMPIONSHIP_SNAPSHOT=';
const endMarker=';\nPORTAL.competitions.unshift';
const ref=process.argv.find(a=>a.startsWith('--previous-ref='))?.split('=').slice(1).join('=')||'HEAD^';
const checkOnly=process.argv.includes('--check');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()
 .replace(/[^A-Z0-9]+/g,' ').trim()
 .replace(/^PRO ITALY$/,'PROITALY')
 .replace(/^AL TAUVIN$/,'AL TAUVIN')
 .replace(/^TERM PERUGINO$/,'TERMOIDRAULICA PERUGINO')
 .replace(/^CARR VACCARI$/,'CARROZZERIA VACCARI')
 .replace(/^ATL SAN LORENZO$/,'ATLETICO SAN LORENZO')
 .replace(/^PARENT PROJECT T$/,'PARENT PROJECT TEAM');
function extract(html){
 const a=html.indexOf(marker),start=a+marker.length,end=html.indexOf(endMarker,start);
 if(a<0||end<0)throw Error('Non trovo CHAMPIONSHIP_SNAPSHOT in index.html');
 return {start,end,snapshot:JSON.parse(html.slice(start,end))};
}
const currentHtml=readFileSync(file,'utf8');
const current=extract(currentHtml);
let previousHtml;
try{previousHtml=execFileSync('git',['show',ref+':'+file],{encoding:'utf8',maxBuffer:16*1024*1024});}
catch(e){console.error('[Marcatori] Impossibile leggere '+ref+':'+file+'; nessuna modifica.');process.exit(1)}
const previous=extract(previousHtml).snapshot;
const prevById=new Map((previous.competitions||[]).map(c=>[c.id,c]));
let attributed=0,attributedGoals=0,pending=[],updatedTeams=0,markedScheduleChanges=0;
for(const comp of current.snapshot.competitions||[]){
 const old=prevById.get(comp.id);if(!old)continue;
 const priorTotals=new Map((old.scorers||[]).map(s=>[norm(s.team)+'|'+norm(s.name),Number(s.goals)]));
 const deltaByTeam=new Map;
 for(const s of comp.scorers||[]){
   const d=Number(s.goals)-(priorTotals.get(norm(s.team)+'|'+norm(s.name))||0);
   if(d===0)continue;
   const k=norm(s.team),list=deltaByTeam.get(k)||[];
   list.push({name:String(s.name).trim(),goals:d});deltaByTeam.set(k,list);
 }
 const previousFixtures=new Map((old.fixtures||[]).map(f=>[[f.round,norm(f.home),norm(f.away)].join('|'),f]));
 // Confronta lo stesso incontro nella pubblicazione precedente e marca per 48 ore
 // soltanto cambi di calendario già resi pubblici (non nuove categorie o prima programmazione).
 const oldRoundPairs=new Map((old.fixtures||[]).map(f=>[[f.round,[norm(f.home),norm(f.away)].sort().join('|')].join('|'),f]));
 const nowIso=new Date().toISOString();
 const isPlannedDate=date=>/^(lun|mar|mer|gio|ven|sab|dom)\s+\d{1,2}\/\d{1,2}$/i.test(String(date||''));
 for(const f of comp.fixtures||[]){
   if(f.result||f.modifiedAt)continue;
   const key=[f.round,norm(f.home),norm(f.away)].join('|');
   const previousMatch=previousFixtures.get(key)||oldRoundPairs.get([f.round,[norm(f.home),norm(f.away)].sort().join('|')].join('|'));
   const changedFields=['date','time','field','locker'].some(k=>String(f[k]||'')!==String(previousMatch?.[k]||''));
   const oldPublished=previousMatch&&(isPlannedDate(previousMatch.date)||String(previousMatch.date||'').startsWith('dal '));
   const newScheduledWithoutPrior=!previousMatch&&isPlannedDate(f.date);
   // Una partita semplicemente programmata per la prima volta non e' una modifica.
   const firstScheduling=previousMatch&&!oldPublished&&isPlannedDate(f.date);
   if((oldPublished&&changedFields&&!firstScheduling)||newScheduledWithoutPrior){
     f.modifiedAt=nowIso;markedScheduleChanges++;
   }
 }
 const changed=(comp.fixtures||[]).filter(f=>{
   if(!/^\d+-\d+$/.test(String(f.result||'')))return false;
   const oldF=previousFixtures.get([f.round,norm(f.home),norm(f.away)].join('|'));
   return !oldF||oldF.result!==f.result;
 });
 const byTeam=new Map;
 for(const fixture of changed){
   const [homeGoals,awayGoals]=fixture.result.split('-').map(Number);
   for(const [side,team,goals] of [['home',fixture.home,homeGoals],['away',fixture.away,awayGoals]]){
     const k=norm(team),occ=byTeam.get(k)||[];
     occ.push({fixture,side,goals});byTeam.set(k,occ);
   }
 }
 for(const [team,occ] of byTeam){
   const increments=deltaByTeam.get(team)||[];
   const sum=increments.reduce((n,x)=>n+x.goals,0);
   if(occ.length!==1||increments.some(x=>x.goals<0)||sum!==occ[0].goals){
     pending.push({competition:comp.id,team,matches:occ.length,goals:occ.reduce((n,x)=>n+x.goals,0),difference:sum});
     continue;
   }
   const {fixture,side,goals}=occ[0];
   const previousList=fixture.matchScorers?.[side];
   if(Array.isArray(previousList)){
     if(previousList.reduce((n,x)=>n+Number(x.goals||0),0)!==goals)
       pending.push({competition:comp.id,team,error:'Il tabellino gia compilato non coincide col risultato'});
     continue;
   }
   fixture.matchScorers??={};
   fixture.matchScorers[side]=increments.map(x=>({name:x.name,goals:x.goals}));
   if(fixture.matchScorersStatus)delete fixture.matchScorersStatus[side];
   if(fixture.scorerSourceIssues)delete fixture.scorerSourceIssues[side];
   if(fixture.matchScorersStatus&&!Object.keys(fixture.matchScorersStatus).length)delete fixture.matchScorersStatus;
   if(fixture.scorerSourceIssues&&!Object.keys(fixture.scorerSourceIssues).length)delete fixture.scorerSourceIssues;
   attributed++;attributedGoals+=goals;updatedTeams++;
 }
}
console.log('[Marcatori] Lati attribuiti: '+attributed+', gol attribuiti: '+attributedGoals+', non derivabili: '+pending.length+'; partite modificate: '+markedScheduleChanges);
for(const x of pending)console.warn('[Marcatori] Da verificare: '+JSON.stringify(x));
if(attributed>0||markedScheduleChanges>0){
 if(checkOnly)process.exit(2);
 const html=currentHtml.slice(0,current.start)+JSON.stringify(current.snapshot)+currentHtml.slice(current.end);
 writeFileSync(file,html);
}
