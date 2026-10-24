// Isolated, optional analytics. A failure here never blocks portal features.
(function () {
  "use strict";
  const allowed = new Set([
    "Portal Open", "Portal View", "Team Selected", "Team Entry",
    "Competition Viewed", "Match Scorers Opened", "Standings Tab",
    "Favorite Added", "Favorite Removed", "Team Shared", "Search Used",
    "Sport Filter", "Standalone Open", "Standalone First Open", "Change Team"
  ]);
  const pending = [];
  let ready = false;
  window.portalPosthogCapture = function (name, properties) {
    if (!allowed.has(name)) return;
    const safe = {};
    for (const [key, value] of Object.entries(properties || {})) {
      if (/^(team|competition|sport|view|source|tab|mode|match|fixture|filter|competitions)$/.test(key) &&
          (typeof value === "string" || typeof value === "number")) {
        safe[key] = String(value).slice(0, 120);
      }
    }
    if (ready) {
      try { window.posthog.capture(name, safe); } catch (_) {}
    } else if (pending.length < 100) pending.push([name, safe]);
  };
  function start(token, host) {
    // Official PostHog HTML snippet bootstrap, loaded only after config is available.
    (function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2===o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=true,p.crossOrigin="anonymous",p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset get_distinct_id".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)})(document,window.posthog||[]);
    window.posthog.init(token, {
      api_host: host,
      cookieless_mode: "always",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      person_profiles: "never",
      capture_exceptions: false,
      capture_performance: false,
      enable_heatmaps: false,
      disable_surveys: true,
      advanced_disable_feature_flags: true,
      before_send: function (event) {
        if (!allowed.has(event.event)) return null;
        const props = event.properties || {};
        for (const key of ["$current_url", "$pathname", "$referrer", "$referring_domain",
          "$initial_referrer", "$initial_referring_domain", "$host", "$session_id"]) {
          delete props[key];
        }
        return event;
      }
    });
    ready = true;
    for (const [name, props] of pending.splice(0)) {
      try { window.posthog.capture(name, props); } catch (_) {}
    }
  }
  fetch("/api/posthog-config", { cache: "no-store" })
    .then(r => r.ok ? r.json() : null)
    .then(c => { if (c && /^phc_[A-Za-z0-9_-]+$/.test(c.token || "") &&
      c.host === "https://eu.i.posthog.com") start(c.token, c.host); })
    .catch(() => {});
})();
