// Public, non-sensitive PostHog browser configuration.
// If the project is not configured, the portal continues normally without analytics.
export default function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).json({
    token: process.env.POSTHOG_PROJECT_TOKEN || null,
    host: "https://eu.i.posthog.com"
  });
};
