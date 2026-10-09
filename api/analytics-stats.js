import {list} from "@vercel/blob";
export default async function handler(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).end()}
 const days=Math.min(90,Math.max(1,Number(req.query.days)||7));
 const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
 const requested=typeof req.query.date==="string"?req.query.date:today;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(requested))return res.status(400).json({error:"invalid date"});
 const cutoff=Date.now()-days*86400000;
 const singleDay=req.query.days===undefined;
 const byEvent={},bySport={},byCompetition={},byDate={},byView={},byTeam={};
 let cursor,scanned=0;
 try{
   do{
     const page=await list({prefix:"analytics/events/",limit:1000,cursor});
     for(const blob of page.blobs){
       if(singleDay ? new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(blob.uploadedAt))!==requested : new Date(blob.uploadedAt).getTime()<cutoff)continue;
       // Archivio privato; questo endpoint espone solo conteggi aggregati, senza identificatori personali.
       const file=blob.pathname.split("/").pop()||"";
       const parts=file.replace(/-[a-z0-9]{6,}\.json$/i,"").replace(/\.json$/i,"").split("__");
       const date=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(blob.uploadedAt));
       const eventMap={"team-shared":"Team Shared","favorite-added":"Favorite Added","favorite-removed":"Favorite Removed"};
       const event=eventMap[parts[0]]||parts[0];
       const add=(o,k)=>{if(k&&k!=="none")o[k]=(o[k]||0)+1};
       add(byEvent,event);add(bySport,parts[1]);add(byCompetition,parts[2]);add(byView,parts[3]);add(byTeam,parts[4]);add(byDate,date);
       scanned++;
     }
     cursor=page.hasMore?page.cursor:undefined;
   }while(cursor);
   res.setHeader("Cache-Control","no-store");
   return res.status(200).json({date:singleDay?requested:null,days:singleDay?1:days,events:scanned,byEvent,bySport,byCompetition,byView,byTeam,byDate,note:"Conteggi di interazioni, non visitatori unici; archivio dal giorno di attivazione."});
 }catch(e){console.error("ANALYTICS_REPORT_ERROR",e?.message||e);return res.status(503).json({error:"report unavailable"})}
}
