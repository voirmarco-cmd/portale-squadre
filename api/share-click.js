export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const team = typeof req.body?.team === "string" ? req.body.team.slice(0, 100) : "";
  console.log("PORTAL_SHARE_CLICK", team);
  res.status(204).end();
}
