/* Minimal Upstash Redis client over the REST API.
   No dependencies — the whole project stays build-free.

   Required environment variables (Vercel → Settings → Environment Variables):
     UPSTASH_REDIS_REST_URL
     UPSTASH_REDIS_REST_TOKEN
   Both are created for you if you add the Upstash integration from the
   Vercel Marketplace. */

const URL_BASE = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

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