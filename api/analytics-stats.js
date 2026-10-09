import {list} from "@vercel/blob";
export default async function handler(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).end()}
 const days=Math.min(90,Math.max(1,Number(req.query.days)||7));
 const cutoff=Date.now()-days*86400000;
 const byEvent={},bySport={},byCompetition={},byDate={},byView={};
 let cursor,scanned=0;
 try{
   do{
     const page=await list({prefix:"analytics/events/",limit:1000,cursor});
     for(const blob of page.blobs){
       if(new Date(blob.uploadedAt).getTime()<cutoff)continue;
       // Archivio eventi pubblico solo per conteggi aggregati, senza identificatori personali.
       const resp=await fetch(blob.url,{cache:"no-store"});
       if(!resp.ok)continue;
       const e=await resp.json(),d=e.data||{},date=String(e.at||"").slice(0,10);
       const add=(o,k)=>{if(k)o[k]=(o[k]||0)+1};
       add(byEvent,e.event);add(bySport,d.sport);add(byCompetition,d.competition);add(byView,d.view);add(byDate,date);
       scanned++;
     }
     cursor=page.hasMore?page.cursor:undefined;
   }while(cursor);
   res.setHeader("Cache-Control","no-store");
   return res.status(200).json({days,events:scanned,byEvent,bySport,byCompetition,byView,byDate,note:"Conteggi di interazioni, non visitatori unici; archivio dal giorno di attivazione."});
 }catch(e){console.error("ANALYTICS_REPORT_ERROR",e?.message||e);return res.status(503).json({error:"report unavailable"})}
}
