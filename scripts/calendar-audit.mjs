/**
 * NCC calendar audit, v1. Pure, read-only validator.
 * Input JSON: {general:[row arrays], competitions:[{id,sport,document,rows:[row arrays]}]}
 * Rows are Google Sheets FORMATTED_VALUE arrays; indexes are 0-based.
 * No writes to Google Sheets, GitHub data or the public portal.
 */
import {readFileSync} from 'node:fs';

const clean = x => String(x ?? '').trim().replace(/\s+/g,' ');
const key = x => clean(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").toUpperCase();
const date = x => {
  const m=clean(x).match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if(!m)return '';
  return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}${m[3]?'/'+m[3]:''}`;
};
const time = x => clean(x).replace('.',':').padStart(5,'0');
const matchKey = m => [m.group,key(m.home),key(m.away)].join('|');
const same = (a,b) => key(a)===key(b);
function parse(rows,source,{sport='',document=''}={}){
  const matches=[], warnings=[];
  let section='';
  rows.forEach((r,i)=>{
    const row=i+1;
    if(!Array.isArray(r))return;
    const a=clean(r[0]), home=clean(r[4]), away=clean(r[11]), group=clean(r[10]);
    if(/^PROGRAMMA GARE|^SETTIMANA|^CALENDARIO|^GARE DAL|^GARE DEL/i.test(a))section=a;
    if(key(home)==='SQUADRA CASA'||key(away)==='SQUADRA OSPITE')return;
    // Placeholder knockout pairings and empty field slots are not scheduled fixtures.
    if(!home&&!away)return;
    if(!home||!away){warnings.push({code:'INCOMPLETE_ROW',source,document,row,home,away});return;}
    if(/^(SEMIFINALE|FINALE|QUARTI DI FINALE|VINCENTE|PERDENTE)$/i.test(home)&&!date(a))return;
    const m={source,document,sport,row,section,date:date(a),time:time(r[1]),field:clean(r[2]),changing:clean(r[3]),home,away,group,result:clean(r[17])};
    if(!m.date||!m.time||!m.field)warnings.push({code:'INCOMPLETE_FIXTURE',source,document,row,match:m});
    matches.push(m);
  });
  return {matches,warnings};
}
export function audit({general,competitions=[]}){
  if(!Array.isArray(general)||!Array.isArray(competitions))throw Error('Expected general array and competitions array');
  const g=parse(general,'general'), errors=[],warnings=[...g.warnings],checks=[];
  const active=[];
  for(const c of competitions){
    if(!c.id||!Array.isArray(c.rows))throw Error('Each competition needs id and rows');
    const p=parse(c.rows,'comunicato',{sport:c.sport||'',document:c.document||c.id});
    warnings.push(...p.warnings);
    const belongs=m=>c.groupCodes?.includes(m.group) || (typeof c.matchFilter==='string' && c.matchFilter==='all');
    // Strict matching is allowed only with an explicit scope; no guessed competition from field number.
    const expected=g.matches.filter(belongs);
    if(!c.groupCodes?.length&&c.matchFilter!=='all'){
      warnings.push({code:'SCOPE_NOT_CONFIGURED',document:c.document||c.id});
      continue;
    }
    const groupBy=(arr)=>{const map=new Map();for(const m of arr){const k=matchKey(m);map.set(k,[...(map.get(k)||[]),m]);}return map;};
    const em=groupBy(expected),am=groupBy(p.matches);
    for(const [k,ms] of em){
      const actual=am.get(k)||[];
      if(ms.length>1)errors.push({code:'DUPLICATE_GENERAL',key:k,rows:ms.map(x=>x.row)});
      if(actual.length!==ms.length)errors.push({code:actual.length?'COUNT_MISMATCH':'MISSING_IN_COMMUNICATO',key:k,document:c.document||c.id,generalRows:ms.map(x=>x.row),comunicatoRows:actual.map(x=>x.row)});
      if(ms.length===1&&actual.length===1){
        const a=ms[0],b=actual[0];
        for(const f of ['date','time','field','group','home','away']){
          if(!same(a[f],b[f]))errors.push({code:'FIELD_MISMATCH',field:f,key:k,document:c.document||c.id,general:{row:a.row,value:a[f]},comunicato:{row:b.row,value:b[f]}});
        }
      }
    }
    for(const [k,ms] of am){
      if(!em.has(k))errors.push({code:'EXTRA_IN_COMMUNICATO',key:k,document:c.document||c.id,rows:ms.map(x=>x.row)});
      if(ms.length>1)errors.push({code:'DUPLICATE_COMMUNICATO',key:k,document:c.document||c.id,rows:ms.map(x=>x.row)});
    }
    checks.push({id:c.id,document:c.document||c.id,expected:expected.length,found:p.matches.length});
    active.push(...expected);
  }
  // Physical pitch collisions across all sports, including competitions not yet onboarded.
  const occupied=new Map();
  for(const m of g.matches){
    if(!m.date||!m.time||!m.field)continue;
    const slot=[m.date,m.time,key(m.field)].join('|');
    const other=occupied.get(slot);
    if(other)errors.push({code:'FIELD_COLLISION',slot,rows:[other.row,m.row]});
    else occupied.set(slot,m);
  }
  return {ok:errors.length===0&&warnings.every(w=>w.code!=='SCOPE_NOT_CONFIGURED'),errors,warnings,checks,generalMatches:g.matches.length,validatedMatches:active.length};
}
if(process.argv[1] && import.meta.url===new URL('file://'+process.argv[1]).href){
  const path=process.argv[2];
  if(!path){console.error('Usage: node scripts/calendar-audit.mjs data.json');process.exit(2);}
  const report=audit(JSON.parse(readFileSync(path,'utf8')));
  console.log(JSON.stringify(report,null,2));
  process.exit(report.ok?0:1);
}
