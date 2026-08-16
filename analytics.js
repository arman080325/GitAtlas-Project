/* =========================================================
   GitAtlas — analytics
   Counts what is useful and nothing that is personal:
     · a random id that lives only for this browser tab
     · which commands get copied, and which searches find nothing
   No cookies, no IP storage, no cross-site anything. Honours Do Not Track,
   and every failure is silent so a blocked request never affects the page.
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.GITATLAS_ANALYTICS || {};
  var ENDPOINT = CFG.endpoint || "/api/track";
  var FLUSH_AT = 12;          // send once this many events are queued
  var FLUSH_EVERY = 15000;    // ...or after this long
  var SESSION_CAP = 300;      // stop counting after this many events per tab

  /* ---------- opt out ---------- */

  var dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1" ||
            navigator.msDoNotTrack === "1" || navigator.globalPrivacyControl === true;

  var optedOut = dnt;
  try {
    if (localStorage.getItem("gitatlas-no-analytics") === "1") optedOut = true;
  } catch (e) { /* storage blocked; carry on */ }

  /* ---------- a throwaway session id ---------- */

  function makeId() {
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    var out = "";
    for (var i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  var sid;
  try {
    sid = sessionStorage.getItem("gitatlas-sid");
    if (!sid) { sid = makeId(); sessionStorage.setItem("gitatlas-sid", sid); }
  } catch (e) { sid = makeId(); }

  /* ---------- PostHog, if a key is configured ---------- */

  var phReady = false;
  var phPending = [];

  function loadPostHog() {
    if (!CFG.posthogKey || optedOut) return;
    var host = CFG.posthogHost || "https://us.i.posthog.com";
    var assets = host.replace(".i.posthog.com", "-assets.i.posthog.com");

    var script = document.createElement("script");
    script.async = true;
    script.src = assets + "/static/array.js";
    script.onload = function () {
      if (!window.posthog || !window.posthog.init) return;
      window.posthog.init(CFG.posthogKey, {
        api_host: host,
        persistence: "memory",          // cookieless
        autocapture: false,             // we send named events on purpose
        capture_pageview: true,
        capture_pageleave: true,
        disable_session_recording: true,
        person_profiles: "identified_only"
      });
      phReady = true;
      phPending.splice(0).forEach(function (e) {
        try { window.posthog.capture(e.n, e.p); } catch (err) { /* ignore */ }
      });
    };
    script.onerror = function () { phPending.length = 0; };
    document.head.appendChild(script);
  }

  /* ---------- our own queue ---------- */

  var queue = [];
  var counted = 0;
  var timer = null;

  function send(useBeacon) {
    if (!queue.length) return;
    var body = JSON.stringify({ sid: sid, events: queue.splice(0, 25) });

    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
        return;
      }
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true
      }).catch(function () { /* offline or blocked — fine */ });
    } catch (e) { /* fine */ }
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = null; send(false); }, FLUSH_EVERY);
  }

  function track(name, props) {
    if (optedOut || counted >= SESSION_CAP) return;
    counted++;

    var event = { n: name, p: props || {} };
    queue.push(event);

    if (CFG.posthogKey) {
      if (phReady) {
        try { window.posthog.capture(name, event.p); } catch (e) { /* ignore */ }
      } else if (phPending.length < 50) {
        phPending.push(event);
      }
    }

    if (queue.length >= FLUSH_AT) send(false);
    else schedule();
  }

  /* Anything still queued goes out as the tab closes or is hidden. */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") send(true);
  });
  window.addEventListener("pagehide", function () { send(true); });

  /* ---------- public surface ---------- */

  window.GitAtlasAnalytics = {
    track: track,
    enabled: function () { return !optedOut; },
    /* Lets anyone turn it off for good from the console:
       GitAtlasAnalytics.optOut()  */
    optOut: function () {
      optedOut = true;
      queue.length = 0;
      try { localStorage.setItem("gitatlas-no-analytics", "1"); } catch (e) {}
      return "Analytics off for this browser.";
    },
    optIn: function () {
      try { localStorage.removeItem("gitatlas-no-analytics"); } catch (e) {}
      optedOut = dnt;
      return optedOut ? "Still off — your browser sends Do Not Track." : "Analytics on.";
    }
  };

  if (!optedOut) {
    loadPostHog();
    track("page_view", { path: location.pathname });
  }
})();