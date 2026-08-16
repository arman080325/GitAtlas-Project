/* Minimal Upstash Redis client over the REST API.
   No dependencies — the whole project stays build-free.

   Environment variables are read under either naming scheme, because the
   Upstash marketplace integration provisions KV_REST_API_* while a database
   created directly on upstash.com gives you UPSTASH_REDIS_REST_*. Whichever
   pair exists wins — nothing to rename by hand.

     KV_REST_API_URL          / UPSTASH_REDIS_REST_URL
     KV_REST_API_TOKEN        / UPSTASH_REDIS_REST_TOKEN

   Note: KV_REST_API_READ_ONLY_TOKEN is deliberately ignored — /api/track
   needs write access. */

const URL_BASE = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const configured = Boolean(URL_BASE && TOKEN);

/* Sends an array of commands as one round trip.
   Each command is itself an array: ["INCR", "copies:total"]. */
async function pipeline(commands) {
  if (!configured || !commands.length) return [];

  const res = await fetch(URL_BASE + "/pipeline", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(commands)
  });

  if (!res.ok) {
    throw new Error("Upstash responded " + res.status);
  }

  const body = await res.json();
  return body.map(function (entry) {
    return entry && entry.error ? null : entry.result;
  });
}

module.exports = { pipeline, configured };