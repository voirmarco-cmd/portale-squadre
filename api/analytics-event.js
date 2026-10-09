import {put} from "@vercel/blob";
import {createHmac} from "node:crypto";
const allowed=new Set(["Team Shared","Favorite Added","Favorite Removed","Portal Open","Portal View","Team Selected","Competition Viewed","Sport Filter","Standings Tab","Search Used","Team Entry","Standalone Open","Standalone First Open","Match Scorers Opened","Change Team"]);
export default async function handler(req,res){
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).end()}
 const name=typeof req.body?.event==="string"?req.body.event.slice(0,60):"";
 if(!allowed.has(name))return res.status(400).json({error:"invalid event"});
 const raw=req.body?.data&&typeof req.body.data==="object"?req.body.data:{};
 const data={};for(const k of ["sport","competition","view","source","tab","mode","competitions","team"]){
   if(typeof raw[k]==="string")data[k]=raw[k].slice(0,120);
 }
 const now=new Date(),date=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
 const visitor=typeof req.body?.visitor==="string"&&/^[0-9a-f-]{36}$/i.test(req.body.visitor)?req.body.visitor:null;
 const secret=process.env.ANALYTICS_HASH_SECRET||process.env.BLOB_READ_WRITE_TOKEN;
 const dailyVisitor=visitor&&secret?createHmac("sha256",secret).update(date+":"+visitor).digest("hex").slice(0,24):null;
 try{
   // Ogni evento e' un file distinto: niente sovrascritture o contatori persi in concorrenza.
   await put("analytics/events/"+date+"/"+name.toLowerCase().replace(/[^a-z]+/g,"-")+"__"+(data.sport||"none").replace(/[^a-z0-9]/gi,"-")+"__"+(data.competition||"none").replace(/[^a-z0-9-]/gi,"-")+"__"+(data.view||"none").replace(/[^a-z0-9-]/gi,"-")+"__"+(data.team||"none").replace(/[^a-z0-9-]/gi,"-")+"__"+(dailyVisitor||"none")+".json",
     JSON.stringify({at:now.toISOString(),event:name,data}),
     {access:"private",addRandomSuffix:true,contentType:"application/json"});
   return res.status(204).end();
 }catch(e){console.error("ANALYTICS_ARCHIVE_ERROR",e?.message||e);return res.status(503).json({error:"archive unavailable"})}
}
