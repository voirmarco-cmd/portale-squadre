#!/usr/bin/env node
/**
 * Pre-deployment gate for Portale Squadre.
 *
 * A normal numeric result is NOT publishable without a complete, match-specific
 * scorer breakdown for both sides. Historical inconsistencies documented below
 * are grandfathered only for their exact ORIGINAL competition, fixture and score.
 * Any future result (or changed score) must pass the strict rule.
 *
 * For an explicitly user-confirmed forfeit: add
 *   resultType: "tavolino", awardReason: "<documented official decision>"
 * to the fixture. Never infer a forfeit from 3-0, 4-0 or empty scorers.
 */
import { readFileSync } from "node:fs";

const html=readFileSync(new URL("../index.html", import.meta.url),"utf8");
function objectAfter(marker) {
  const markerAt=html.indexOf(marker);
  if(markerAt<0)throw Error("Missing embedded data: "+marker);
  const start=marker.startsWith("{")?markerAt:html.indexOf("{",markerAt+marker.length);
  if(start<0)throw Error("Missing JSON object after "+marker);
  let depth=0,quoted=false,escaped=false;
  for(let i=start;i<html.length;i++){
    const ch=html[i];
    if(quoted){
      if(escaped)escaped=false;
      else if(ch==="\\")escaped=true;
      else if(ch==='"')quoted=false;
    }else{
      if(ch==='"')quoted=true;
      else if(ch==="{")depth++;
      else if(ch==="}"&&!--depth)return JSON.parse(html.slice(start,i+1));
    }
  }
  throw Error("Unterminated embedded JSON after "+marker);
}
const championships=objectAfter("const CHAMPIONSHIP_SNAPSHOT=");
const legacyCup=objectAfter("window.SNAPSHOT=");
const cups=[
  {id:"coppa-bartoli-bassano-c5-2026",...legacyCup},
  objectAfter('{"id":"coppa-bartoli-bassano-c7-2026"'),
  objectAfter('{"id":"coppa-bartoli-bassano-gabbione-2026"')
];
const competitions=[...championships.competitions,...cups];

/**
 * Historical missing/partial attribution existing BEFORE this guard.
 * A fingerprint includes the RESULT: changing its score invalidates the
 * exception. Remove an entry once the official record has been reconciled.
 *
 * These exceptions are NOT permission to publish new incomplete matches.
 */
const historicalExceptions=[
  ["coppa-bartoli-bassano-c5-2026","B","gio 15/10","AS GUASTICCE","ATLETICO SAN LORENZO","3-17"],
  ["coppa-bartoli-bassano-c5-2026","F","gio 15/10","AL-TAUVIN","FRATEII FC","4-0"],
  ["coppa-bartoli-bassano-c5-2026","F","lun 19/10","FRATEII FC","AS SURF4ALL","0-4"],
  ["coppa-bartoli-bassano-c5-2026","F","mer 21/10","FRATEII FC","DYNAMO MELAFUMO","0-4"],
  ["coppa-bartoli-bassano-c5-2026","L","mer 21/10","RED DEVILS","REAL LIBURNA","8-3"],
  ["coppa-bartoli-bassano-c5-2026","D","gio 22/10","LEGHORN 1915 CAFF. DAME'","ZUTALORS FC","11-3"],
  ["coppa-bartoli-bassano-c5-2026","Q6","mer 28/10","JOKERS","PHOENIX FC","4-0"],
  ["coppa-bartoli-bassano-c5-2026","Q1","mer 28/10","FEMMY UNITED","FC PALLINA'S","7-2"],
  ["coppa-bartoli-bassano-c5-2026","Q1","mer 28/10","L9 X TROTTA","PLESSO","4-0"],
  ["coppa-bartoli-bassano-c5-2026","Q2","gio 29/10","FC CISIPENSERA'","I CACTUS","9-2"],
  ["coppa-bartoli-bassano-c5-2026","S4","gio 5/11","KALYPSO","ATLETICO SAN LORENZO","5-12"],
  ["coppa-bartoli-bassano-c7-2026","B","mar 27/10","FC PINOLINO","SANGRE NUEVA","4-0"],
  ["coppa-bartoli-bassano-c7-2026","C7/O","lun 2/11","FC FANALE","FC PINOLINO","4-6"],
  ["coppa-bartoli-bassano-c7-2026","C7/A","gio 5/11","SANGRE NUEVA","TERMOIDRAULICA PERUGINO","0-4"],
  ["coppa-bartoli-bassano-c7-2026","C7/O","lun 9/11","FC PINOLINO","NFZ","5-7"],
  ["coppa-bartoli-bassano-gabbione-2026","D","mer 14/10","FC JAMAICA","FABIO & FRIENDS","11-4"],
  ["coppa-bartoli-bassano-gabbione-2026","A","mar 20/10","ZERI FC","LIVING BAR","4-0"],
  ["coppa-bartoli-bassano-gabbione-2026","A","gio 29/10","AMARANTO RACING","LIVING BAR","4-0"],
  ["coppa-bartoli-bassano-gabbione-2026","D","gio 29/10","FABIO & FRIENDS","BOCA MARE E SOLE","0-4"],
  ["coppa-bartoli-bassano-gabbione-2026","GAB/A","lun 2/11","OSTRICONDA 2022","FC JAMAICA","4-0"]
];
const fingerprint=(id,f)=>[id,f.group||"",f.date||"",f.home||"",f.away||"",f.result||""].join("|");
const legacy=new Set(historicalExceptions.map(row=>row.join("|")));
const encountered=new Set();
const problems=[];
let numericResults=0,validated=0,grandfathered=0,forfeits=0;

for(const c of competitions){
  const id=c.id;
  if(!id)throw Error("Competition is missing an id");
  for(const f of c.fixtures||[]){
    const result=String(f.result||"").trim();
    if(!result)continue;
    const matchId=fingerprint(id,f);
    const numeric=/^(\d+)-(\d+)$/.exec(result);
    const explicitlyAwarded=f.resultType==="tavolino";
    if(explicitlyAwarded){
      if(!String(f.awardReason||"").trim()){
        problems.push(matchId+": awarded match requires an official awardReason");
      }else forfeits++;
      continue;
    }
    if(!numeric){
      if(!["RINV"].includes(result.toUpperCase()))
        problems.push(matchId+": unrecognized result; document a forfeit explicitly");
      continue;
    }
    numericResults++;
    const sides=[["home",Number(numeric[1])],["away",Number(numeric[2])]];
    let issue="";
    for(const [side,goalCount] of sides){
      const list=f.matchScorers?.[side];
      if(!Array.isArray(list)){issue+=side+" scorer list missing; ";continue;}
      const bad=list.some(p=>!String(p?.name||"").trim()||!Number.isInteger(Number(p.goals))||Number(p.goals)<1);
      if(bad){issue+=side+" contains invalid scorer name or goal count; ";continue;}
      const sum=list.reduce((n,p)=>n+Number(p.goals),0);
      // A shootout result is not a normal match-goal count.
      if(!f.decidedByDcr && sum!==goalCount)
        issue+=side+" "+sum+"/"+goalCount+" goals attributed; ";
      if(f.matchScorersStatus?.[side]==="partial")
        issue+=side+" marked partial; ";
    }
    if(!issue){validated++;continue;}
    if(legacy.has(matchId)){grandfathered++;encountered.add(matchId);continue;}
    problems.push(matchId+": "+issue);
  }
}
const report="[Pubblicazione] "+numericResults+" risultati, "+validated+
  " tabellini completi, "+grandfathered+" anomalie storiche note, "+
  forfeits+" risultati a tavolino espliciti.";
console.log(report);
if(grandfathered)console.warn("[Pubblicazione] Anomalie storiche pregresse: il controllo NON le considera tabellini completi.");
if(problems.length){
  for(const problem of problems)console.error("ERRORE: "+problem);
  console.error("PUBBLICAZIONE BLOCCATA: associare i marcatori di ciascuna partita prima del deploy. Non inventare marcatori.");
  process.exitCode=1;
}else{
  console.log("[Pubblicazione] OK: nessun nuovo risultato privo di marcatori.");
}
