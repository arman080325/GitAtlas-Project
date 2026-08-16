/* POST /api/track
   Accepts a small batch of anonymous events from the page and turns them into
   Redis counters. Nothing here identifies a person: no IP is stored, no cookie
   is set, and the only identifier is a random per-session string the browser
   throws away when the tab closes.

   Body: { sid: "abc123", events: [{ n: "command_copied", p: { ... } }] } */

const { pipeline, configured } = require("./_lib/redis.js");
const { COMMANDS, SECTIONS } = require("./_lib/commands.js");
const crypto = require("crypto");

const MAX_EVENTS = 25;
const RATE_LIMIT = 120;        // requests per minute, per hashed IP
const SID = /^[a-z0-9]{6,32}$/;

const EVENTS = new Set([
  "page_view",
  "command_copied",
  "example_copied",
  "example_opened",
  "search_performed",
  "search_no_results",
  "section_viewed",
  "theme_changed"
]);

function today() {
  return new Date().toISOString().slice(0, 10);
}

/* Search terms are user input, so they get scrubbed hard before they can
   become a Redis key. */
function cleanQuery(value) {
  if (typeof value !== "string") return null;
  const q = value.toLowerCase().trim().replace(/[^a-z0-9 ._:/-]/g, "").slice(0, 40);
  return q.length >= 2 ? q : null;
}

function clientKey(req) {
  const fwd = req.headers["x-forwarded-for"] || "";
  const ip = String(fwd).split(",")[0].trim() || "unknown";
  const salt = process.env.TRACK_SALT || "gitatlas";
  return crypto.createHash("sha256").update(salt + ip).digest("hex").slice(0, 16);
}

/* One event in, zero or more Redis commands out. Anything unrecognised is
   dropped rather than stored, which is what keeps key cardinality bounded. */
function commandsFor(event, sid) {
  const name = event && event.n;
  const p = (event && event.p) || {};
  const day = today();

  if (!EVENTS.has(name)) return [];

  switch (name) {
    case "page_view":
      return [
        ["INCR", "visits:total"],
        ["INCR", "visits:" + day],
        ["PFADD", "visitors:all", sid],
        ["PFADD", "visitors:" + day, sid],
        ["EXPIRE", "visitors:" + day, 60 * 60 * 24 * 120]
      ];

    case "command_copied": {
      if (!COMMANDS.has(p.command)) return [];
      const out = [
        ["INCR", "copies:total"],
        ["INCR", "copies:" + day],
        ["HINCRBY", "copies:by_command", p.command, 1],
        ["PFADD", "copiers:all", sid]
      ];
      if (SECTIONS.has(p.section)) out.push(["HINCRBY", "copies:by_section", p.section, 1]);
      if (p.from_search === true) out.push(["INCR", "copies:from_search"]);
      if (p.risk === "danger" || p.risk === "warn") out.push(["HINCRBY", "copies:by_risk", p.risk, 1]);
      return out;
    }

    case "example_copied":
      if (!COMMANDS.has(p.command)) return [];
      return [
        ["INCR", "copies:total"],
        ["INCR", "copies:examples"],
        ["HINCRBY", "copies:by_example", p.command, 1]
      ];

    case "example_opened":
      if (!COMMANDS.has(p.command)) return [];
      return [["HINCRBY", "opened:examples", p.command, 1]];

    case "search_performed": {
      const q = cleanQuery(p.query);
      return q ? [["INCR", "search:total"], ["HINCRBY", "search:queries", q, 1]] : [];
    }

    /* The most useful counter on the site: every miss is a command someone
       expected to find and the atlas does not have yet. */
    case "search_no_results": {
      const q = cleanQuery(p.query);
      return q ? [["HINCRBY", "search:misses", q, 1]] : [];
    }

    case "section_viewed":
      if (!SECTIONS.has(p.section)) return [];
      return [["HINCRBY", "views:by_section", p.section, 1]];

    case "theme_changed":
      if (["system", "light", "dark"].indexOf(p.mode) === -1) return [];
      return [["HINCRBY", "theme:mode", p.mode, 1]];

    default:
      return [];
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Use POST." });
    return;
  }

  /* Analytics must never break the page, so an unconfigured deployment
     still answers cleanly. */
  if (!configured) {
    res.status(200).json({ ok: true, stored: 0, configured: false });
    return;
  }

  let payload = req.body;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch (err) { payload = null; }
  }

  const sid = payload && payload.sid;
  const events = payload && payload.events;

  if (!SID.test(String(sid)) || !Array.isArray(events) || !events.length) {
    res.status(400).json({ ok: false, error: "Malformed payload." });
    return;
  }

  try {
    const rlKey = "rl:" + clientKey(req) + ":" + Math.floor(Date.now() / 60000);
    const [hits] = await pipeline([["INCR", rlKey], ["EXPIRE", rlKey, 90]]);

    if (Number(hits) > RATE_LIMIT) {
      res.status(429).json({ ok: false, error: "Too many requests." });
      return;
    }

    const writes = [];
    events.slice(0, MAX_EVENTS).forEach(function (event) {
      commandsFor(event, sid).forEach(function (cmd) { writes.push(cmd); });
    });

    if (writes.length) await pipeline(writes);
    res.status(200).json({ ok: true, stored: writes.length });
  } catch (err) {
    /* Swallow storage failures — a dropped count is never worth a 500 on
       somebody's page. */
    res.status(200).json({ ok: true, stored: 0 });
  }
};