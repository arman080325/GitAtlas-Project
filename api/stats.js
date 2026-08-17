/* GET /api/stats
   Public, cached, aggregate only. This is what the live counter in the hero
   reads, and what you can hit yourself to see which commands people actually
   use and what they searched for and did not find.

   Optional: /api/stats?detail=1 also returns the top commands, the top
   sections and the most common searches that returned nothing. */

const { pipeline, configured } = require("./_lib/redis.js");

function topFromHash(hash, limit) {
  if (!hash) return [];
  const rows = [];

  /* Upstash returns HGETALL as a flat [field, value, field, value] array. */
  if (Array.isArray(hash)) {
    for (let i = 0; i < hash.length; i += 2) {
      rows.push({ key: hash[i], count: Number(hash[i + 1]) || 0 });
    }
  } else {
    Object.keys(hash).forEach(function (key) {
      rows.push({ key: key, count: Number(hash[key]) || 0 });
    });
  }

  return rows.sort(function (a, b) { return b.count - a.count; }).slice(0, limit);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (!configured) {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ configured: false, copies: 0, visitors: 0 });
    return;
  }

  const detail = req.query && (req.query.detail === "1" || req.query.detail === "true");

  try {
    const reads = [
      ["GET", "copies:total"],
      ["PFCOUNT", "visitors:all"],
      ["PFCOUNT", "copiers:all"],
      ["GET", "visits:total"]
    ];

    if (detail) {
      reads.push(
        ["HGETALL", "copies:by_command"],
        ["HGETALL", "copies:by_section"],
        ["HGETALL", "search:misses"],
        ["HGETALL", "search:queries"],
        ["HGETALL", "playbooks:opened"],
        ["HGETALL", "playbooks:copied"]
      );
    }

    const out = await pipeline(reads);

    const body = {
      configured: true,
      copies: Number(out[0]) || 0,
      visitors: Number(out[1]) || 0,
      copiers: Number(out[2]) || 0,
      visits: Number(out[3]) || 0
    };

    if (detail) {
      body.topCommands = topFromHash(out[4], 20);
      body.topSections = topFromHash(out[5], 26);
      body.missedSearches = topFromHash(out[6], 25);
      body.topSearches = topFromHash(out[7], 25);
      body.topPlaybooks = topFromHash(out[8], 20);
      body.copiedPlaybooks = topFromHash(out[9], 20);
    }

    /* Served from the edge cache for a minute; the counter does not need to
       be exact to the second and this keeps Upstash requests near zero. */
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
    res.status(200).json(body);
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ configured: false, copies: 0, visitors: 0 });
  }
};