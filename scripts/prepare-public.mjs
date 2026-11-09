#!/usr/bin/env node
import { cpSync, copyFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

// Vercel requires an explicit static output folder when a buildCommand is set.
// Only public PWA assets go here; the root /api directory stays in place for
// Vercel's serverless-function discovery. Never copy node_modules or source tools.
const root=resolve(import.meta.dirname,"..");
const out=resolve(root,"public");
rmSync(out,{recursive:true,force:true});
mkdirSync(out,{recursive:true});
for(const name of ["index.html","privacy.html","posthog-init.js","manifest.webmanifest","sw.js"]){
  copyFileSync(resolve(root,name),resolve(out,name));
}
cpSync(resolve(root,"icons"),resolve(out,"icons"),{recursive:true});
console.log("[Pubblicazione] File pubblici preparati in public/; controlli marcatori superati.");
