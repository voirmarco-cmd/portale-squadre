#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Script } from "node:vm";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
 .filter(match=>!/\bsrc\s*=/.test(match[1]));
let failures=0;
for(let i=0;i<scripts.length;i++){
 try{new Script(scripts[i][2],{filename:"index.html:inline-script-"+(i+1)});}
 catch(error){failures++;console.error("ERRORE JAVASCRIPT in script "+(i+1)+":\n"+error.stack);}
}
for(const filename of ["posthog-init.js","sw.js"]){
 try{new Script(readFileSync(new URL("../"+filename,import.meta.url),"utf8"),{filename});}
 catch(error){failures++;console.error("ERRORE JAVASCRIPT in "+filename+":\n"+error.stack);}
}
if(failures){console.error("PUBBLICAZIONE BLOCCATA: "+failures+" script non validi.");process.exitCode=1;}
else console.log("[Pubblicazione] Sintassi JavaScript valida in "+scripts.length+" script HTML e due script esterni.");
