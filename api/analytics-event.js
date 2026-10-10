// Legacy endpoint disabled to prevent Blob quota consumption from cached PWA clients.
export default function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  return res.status(204).end();
}
