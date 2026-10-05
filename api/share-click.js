export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const event = typeof req.body?.event === "string" ? req.body.event.slice(0, 50) : "Team Shared";
  const team = typeof req.body?.team === "string" ? req.body.team.slice(0, 100) : "";
  const allowed = new Set(["Team Shared", "Favorite Added", "Favorite Removed"]);
  if (!allowed.has(event)) return res.status(400).end();
  console.log("PORTAL_EVENT", event, team);
  res.status(204).end();
}
