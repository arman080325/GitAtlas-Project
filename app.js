/* =========================================================
   GitAtlas — app.js
   Plain JavaScript. No build step, no dependencies.
   ========================================================= */
(function () {
  "use strict";

  var GROUPS = {
    config: "Getting set up",
    basics: "Everyday Git",
    inspect: "Looking around",
    branching: "Branches",
    remote: "Working with others",
    rescue: "When things break",
    release: "Shipping",
    advanced: "Scaling up",
    automation: "Automation",
    github: "GitHub"
  };

  var ICONS = {
    sheet: '<svg class="sheet" viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="1.5" width="9" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 14.5h-8a1 1 0 0 1-1-1v-9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    tick: '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5 6 12l7.5-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    caret: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* ---------- section explainer animations ----------
     Each section header carries a small SVG that acts out what the
     commands in it actually do to your history. */

  var GHPATH = 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z';

  var SCENE = {
    /* two settings sliding along their tracks */
    config:
      '<line class="ln" x1="12" y1="15" x2="138" y2="15"/><line class="ln" x1="12" y1="31" x2="138" y2="31"/>' +
      '<circle class="nd fx-slide" cx="34" cy="15" r="6" style="--dx:70px;--dur:5s"/>' +
      '<circle class="nd fx-slide" cx="116" cy="31" r="6" style="--dx:-70px;--dur:5s;--d:.6s"/>',

    /* a repository copied to a second machine */
    clone:
      '<rect class="sq" x="8" y="12" width="38" height="24" rx="3"/>' +
      '<path class="ln ac fx-flow" d="M52 24h44"/>' +
      '<path class="ln ac" d="M90 19l6 5-6 5"/>' +
      '<rect class="sq fx-pop" x="102" y="12" width="38" height="24" rx="3" style="--dur:3s"/>',

    /* loose files gathered into the staging area */
    stage:
      '<path class="ln" d="M104 8v28M104 8h12M104 36h12"/>' +
      '<rect class="sq fx-slide" x="12" y="18" width="13" height="13" rx="2" style="--dx:72px;--dur:3.4s"/>' +
      '<rect class="sq fx-slide" x="34" y="18" width="13" height="13" rx="2" style="--dx:52px;--dur:3.4s;--d:.25s"/>' +
      '<rect class="sq fx-slide" x="56" y="18" width="13" height="13" rx="2" style="--dx:32px;--dur:3.4s;--d:.5s"/>',

    /* a new commit appearing on the line */
    commit:
      '<line class="ln" x1="12" y1="24" x2="138" y2="24"/>' +
      '<circle class="nd" cx="26" cy="24" r="6"/><circle class="nd" cx="60" cy="24" r="6"/>' +
      '<circle class="nd" cx="94" cy="24" r="6"/>' +
      '<circle class="nd fl fx-pop" cx="128" cy="24" r="7" style="--dur:2.6s"/>',

    /* a lens sweeping back over past commits */
    scan:
      '<line class="ln" x1="12" y1="28" x2="138" y2="28"/>' +
      '<circle class="nd" cx="28" cy="28" r="5"/><circle class="nd" cx="58" cy="28" r="5"/>' +
      '<circle class="nd" cx="90" cy="28" r="5"/><circle class="nd" cx="120" cy="28" r="5"/>' +
      '<g class="fx-slide" style="--dx:92px;--dur:4.4s">' +
      '<circle class="ln ac" cx="26" cy="20" r="9" fill="none"/><path class="ln ac" d="M33 27l6 6"/></g>',

    /* one line becoming two */
    branch:
      '<line class="ln" x1="12" y1="32" x2="138" y2="32"/>' +
      '<circle class="nd" cx="30" cy="32" r="5"/><circle class="nd" cx="58" cy="32" r="5"/>' +
      '<path class="ln ac fx-draw" d="M58 32c22 0 22-20 44-20h34" style="--len:82;--dur:4s"/>' +
      '<circle class="nd fl fx-pop" cx="126" cy="12" r="6" style="--dur:4s;--d:1.4s"/>',

    /* two lines coming back together */
    merge:
      '<line class="ln" x1="12" y1="32" x2="138" y2="32"/>' +
      '<circle class="nd" cx="26" cy="32" r="5"/>' +
      '<path class="ln ac fx-draw" d="M20 12h30c22 0 22 20 44 20" style="--len:80;--dur:4s"/>' +
      '<circle class="nd" cx="20" cy="12" r="5"/>' +
      '<circle class="nd fl fx-pop" cx="112" cy="32" r="7" style="--dur:4s;--d:1.5s"/>',

    /* commits lifted onto a newer base */
    rebase:
      '<line class="ln" x1="12" y1="14" x2="138" y2="14"/>' +
      '<line class="ln" x1="12" y1="36" x2="72" y2="36"/>' +
      '<circle class="nd fx-lift" cx="86" cy="36" r="6" style="--dy:-22px;--dx:8px;--dur:4s"/>' +
      '<circle class="nd fx-lift" cx="110" cy="36" r="6" style="--dy:-22px;--dx:8px;--dur:4s;--d:.3s"/>' +
      '<circle class="nd fx-lift" cx="134" cy="36" r="6" style="--dy:-22px;--dx:8px;--dur:4s;--d:.6s"/>',

    /* local and remote trading commits */
    sync:
      '<rect class="sq" x="8" y="12" width="34" height="24" rx="3"/>' +
      '<rect class="sq" x="108" y="12" width="34" height="24" rx="3"/>' +
      '<path class="ln ac fx-flow" d="M48 18h54"/><path class="ln ac" d="M96 13l6 5-6 5"/>' +
      '<path class="ln fx-flow" d="M102 31H48"/><path class="ln" d="M54 26l-6 5 6 5"/>',

    /* a branch merged in and approved */
    pr:
      '<line class="ln" x1="12" y1="34" x2="100" y2="34"/>' +
      '<path class="ln ac fx-draw" d="M28 34c0-16 8-20 26-20h20c18 0 18 20 26 20" style="--len:96;--dur:4.2s"/>' +
      '<circle class="nd" cx="28" cy="34" r="5"/>' +
      '<path class="ln ac fx-draw" d="M110 34l6 6 12-14" style="--len:34;--dur:4.2s;--d:1.6s"/>',

    /* work dropped into the drawer, then taken back out */
    stash:
      '<path class="ln" d="M34 24v12h82V24"/>' +
      '<path class="ln" d="M34 24h82"/>' +
      '<rect class="sq fx-lift" x="46" y="6" width="20" height="14" rx="2" style="--dy:16px;--dur:3.6s"/>' +
      '<rect class="sq fx-lift" x="84" y="6" width="20" height="14" rx="2" style="--dy:16px;--dur:3.6s;--d:.4s"/>' +
      '<circle class="fl fx-blink" cx="126" cy="30" r="3"/>',

    /* a commit rewound */
    undo:
      '<line class="ln" x1="12" y1="32" x2="138" y2="32"/>' +
      '<circle class="nd" cx="30" cy="32" r="5"/><circle class="nd" cx="62" cy="32" r="5"/>' +
      '<circle class="nd fl fx-slide" cx="94" cy="32" r="6" style="--dx:-32px;--dur:3.4s"/>' +
      '<path class="ln ac fx-draw" d="M110 18c-8-8-30-8-38 0" style="--len:52;--dur:3.4s"/>' +
      '<path class="ln ac fx-draw" d="M72 10v9h9" style="--len:20;--dur:3.4s;--d:.4s"/>',

    /* one commit hopping to another branch */
    cherry:
      '<line class="ln" x1="12" y1="34" x2="138" y2="34"/>' +
      '<line class="ln" x1="12" y1="12" x2="138" y2="12"/>' +
      '<circle class="nd" cx="34" cy="34" r="5"/><circle class="nd" cx="98" cy="34" r="5"/>' +
      '<circle class="nd fl fx-lift" cx="66" cy="34" r="6" style="--dy:-22px;--dx:30px;--dur:3.6s"/>',

    /* a release label attaching to a commit */
    tag:
      '<line class="ln" x1="12" y1="30" x2="138" y2="30"/>' +
      '<circle class="nd" cx="40" cy="30" r="5"/><circle class="nd fl" cx="84" cy="30" r="6"/>' +
      '<circle class="nd" cx="128" cy="30" r="5"/>' +
      '<g class="fx-pop" style="--dur:3.4s"><path class="ln ac" d="M84 24V10h34l8 7-8 7H84z"/>' +
      '<circle class="fl" cx="92" cy="17" r="2"/></g>',

    /* work moving through the checks */
    pipeline:
      '<rect class="sq" x="10" y="14" width="26" height="20" rx="3"/>' +
      '<rect class="sq" x="52" y="14" width="26" height="20" rx="3"/>' +
      '<rect class="sq" x="94" y="14" width="26" height="20" rx="3"/>' +
      '<path class="ln fx-flow" d="M36 24h16M78 24h16"/>' +
      '<circle class="fl fx-slide" cx="23" cy="24" r="4" style="--dx:84px;--dur:3.6s"/>' +
      '<path class="ln ac fx-draw" d="M128 24l4 5 8-11" style="--len:24;--dur:3.6s;--d:1.6s"/>',

    /* local commits travelling up to the remote */
    github:
      '<line class="ln" x1="10" y1="32" x2="86" y2="32"/>' +
      '<circle class="nd" cx="20" cy="32" r="5"/><circle class="nd" cx="44" cy="32" r="5"/>' +
      '<circle class="fl fx-slide" cx="68" cy="32" r="5" style="--dx:34px;--dur:3.4s"/>' +
      '<path class="ln ac fx-flow" d="M76 32h22"/>' +
      '<g class="gh-scene" transform="translate(108 10)"><g transform="scale(1.5)">' +
      '<path class="gh-mark" d="' + GHPATH + '"/></g></g>',

    /* a shield closing over the repository */
    shield:
      '<path class="ln ac fx-draw" d="M60 8l22 7v12c0 10-9 16-22 19-13-3-22-9-22-19V15l22-7z" style="--len:110;--dur:4s"/>' +
      '<path class="ln ac fx-draw" d="M50 25l7 7 14-15" style="--len:32;--dur:4s;--d:1.4s"/>' +
      '<circle class="nd fx-blink" cx="112" cy="24" r="5"/><circle class="nd fx-blink" cx="132" cy="24" r="5" style="--d:.5s"/>'
  };

  var SCENE_FOR = {
    setup: "config", aliases: "config", ignore: "stage", start: "clone",
    staging: "stage", commit: "commit", history: "scan", inspect: "scan",
    branch: "branch", merge: "merge", rebase: "rebase", remotes: "sync",
    sync: "sync", fork: "pr", stash: "stash", undo: "undo", cherry: "cherry",
    tags: "tag", advanced: "clone", hooks: "pipeline", maintenance: "pipeline",
    security: "shield", ghcli: "github", actions: "pipeline", workflows: "pr",
    fixes: "undo"
  };

  function sceneHTML(id) {
    var body = SCENE[SCENE_FOR[id] || "commit"];
    return '<svg class="sec-anim" viewBox="0 0 150 44" aria-hidden="true">' + body + "</svg>";
  }

  /* ---------- tiny helpers ---------- */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Escape, then wrap every occurrence of every search term in <mark>. */
  function mark(text, terms) {
    if (!terms || !terms.length) return esc(text);
    var lower = text.toLowerCase();
    var hits = [];
    terms.forEach(function (t) {
      var from = 0, at;
      while ((at = lower.indexOf(t, from)) !== -1) {
        hits.push([at, at + t.length]);
        from = at + t.length;
      }
    });
    if (!hits.length) return esc(text);
    hits.sort(function (a, b) { return a[0] - b[0]; });

    var merged = [hits[0]];
    for (var i = 1; i < hits.length; i++) {
      var last = merged[merged.length - 1];
      if (hits[i][0] <= last[1]) { last[1] = Math.max(last[1], hits[i][1]); }
      else { merged.push(hits[i]); }
    }

    var out = "", cursor = 0;
    merged.forEach(function (h) {
      out += esc(text.slice(cursor, h[0])) + "<mark>" + esc(text.slice(h[0], h[1])) + "</mark>";
      cursor = h[1];
    });
    return out + esc(text.slice(cursor));
  }

  /* Light syntax tint for a command line: flags and quoted strings. */
  function tint(cmd) {
    return esc(cmd)
      .replace(/(&quot;|")([^"]*)(&quot;|")/g, '<span class="str">$1$2$3</span>')
      .replace(/(^|\s)(--?[a-zA-Z][\w-]*)/g, '$1<span class="flag">$2</span>');
  }

  /* Dim the comment lines inside an example block. */
  function tintExample(code) {
    return esc(code).split("\n").map(function (line) {
      var at = line.indexOf("#");
      if (at === -1) return line;
      return line.slice(0, at) + '<span class="comment">' + line.slice(at) + "</span>";
    }).join("\n");
  }

  function el(id) { return document.getElementById(id); }

  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

  /* Some entries are concepts or error messages rather than runnable commands. */
  var RUNNABLE = /^(git|gh|npx|npm|pip|java|ssh|ssh-keygen|gpg|cat|echo|ls|chmod|pre-commit|gitleaks)\b/;

  /* Flag the commands that can cost somebody their work. */
  function riskOf(cmd) {
    if (/^git config/.test(cmd)) return null;
    if (/reset --hard|clean -f|stash clear|branch -D|--force(?!-with-lease)|filter-repo|filter-branch|bfg\.jar|--prune=now|push --mirror/.test(cmd)) {
      return { k: "danger", t: "Destroys work" };
    }
    if (/^git commit .*--amend|^git commit --squash|^git rebase (?!--(abort|continue|skip|edit-todo))|^git reset --soft|^git reset HEAD|^git pull --rebase|--force-with-lease|^git lfs migrate/.test(cmd)) {
      return { k: "warn", t: "Rewrites history" };
    }
    return null;
  }

  /* ---------- build the searchable index ---------- */

  var INDEX = [];
  ATLAS.forEach(function (cat, ci) {
    cat.commands.forEach(function (cmd, xi) {
      INDEX.push({
        ci: ci, xi: xi, cat: cat, cmd: cmd,
        hay: (cmd.c + " " + cmd.d + " " + cmd.e + " " + (cmd.x || "") + " " + cat.label + " " + cat.tag).toLowerCase()
      });
    });
  });

  el("statCommands").textContent = INDEX.length;
  el("statSections").textContent = ATLAS.length;
  el("statExamples").textContent = INDEX.filter(function (e) { return !!e.cmd.x; }).length;
  var searchInput = el("search");
  searchInput.placeholder = "Search " + INDEX.length + " commands \u2014 try \u201Cundo\u201D, \u201Crebase\u201D, \u201Csecret\u201D";

  /* ---------- render ---------- */

  function cardHTML(entry, terms) {
    var c = entry.cmd;
    var ref = entry.ci + ":" + entry.xi;
    var runnable = RUNNABLE.test(c.c);
    var risk = runnable ? riskOf(c.c) : null;

    var head;
    if (runnable) {
      head = '<div class="cmd-row">' +
          '<span class="prompt" aria-hidden="true">$</span>' +
          '<code class="cmd">' + (terms.length ? mark(c.c, terms) : tint(c.c)) + '</code>' +
          '<button class="copy-btn" type="button" data-copy="' + ref + '" aria-label="Copy this command">' +
            ICONS.sheet + ICONS.tick + '<span>Copy</span>' +
          '</button>' +
        '</div>';
      if (risk) {
        head += '<p class="risk ' + risk.k + '">' + risk.t + '</p>';
      }
    } else {
      head = '<h3 class="card-title">' + mark(c.c, terms) + '</h3>';
    }

    var html = '<article class="card' + (runnable ? '' : ' card-note') + ' reveal" data-ref="' + ref + '">' +
      head +
      '<p class="card-desc">' + mark(c.d, terms) + '</p>' +
      '<p class="card-use"><b>Use it when</b>' + mark(c.e, terms) + '</p>';

    if (c.x) {
      html += '<button class="ex-toggle" type="button" aria-expanded="false" data-ex="' + ref + '">' +
                ICONS.caret + 'Example' +
              '</button>' +
              '<div class="ex-wrap" id="ex-' + entry.ci + '-' + entry.xi + '"><div class="ex-inner">' +
                '<pre class="ex"><button class="ex-copy" type="button" data-copyex="' + ref + '" aria-label="Copy this example">' +
                  ICONS.sheet + ICONS.tick + '</button>' + tintExample(c.x) + '</pre>' +
              '</div></div>';
    }
    return html + "</article>";
  }

  function sectionHTML(cat, entries, terms) {
    return '<section class="section" id="' + cat.id + '">' +
      '<header class="section-head reveal">' +
        '<div class="section-head-text">' +
          '<p class="section-index"><i>' + esc(GROUPS[cat.tag] || cat.tag) + '</i>' +
            '<span></span>' + entries.length + (entries.length === 1 ? " command" : " commands") +
          '</p>' +
          '<h2 class="section-title">' + esc(cat.label) + '</h2>' +
          '<p class="section-blurb">' + esc(cat.blurb) + '</p>' +
        '</div>' +
        sceneHTML(cat.id) +
      '</header>' +
      '<div class="cards">' +
        entries.map(function (e) { return cardHTML(e, terms); }).join("") +
      '</div>' +
    '</section>';
  }

  function render(entries, terms) {
    var byCat = {};
    entries.forEach(function (e) {
      (byCat[e.ci] = byCat[e.ci] || []).push(e);
    });

    var html = "";
    ATLAS.forEach(function (cat, ci) {
      if (byCat[ci]) html += sectionHTML(cat, byCat[ci], terms);
    });

    el("sections").innerHTML = html;
    el("empty").hidden = entries.length > 0;
    observeCards();
    observeSpy();
    updateRailCounts(byCat);
  }

  /* ---------- rail ---------- */

  function buildRail() {
    var html = "", lastTag = null;
    ATLAS.forEach(function (cat) {
      if (cat.tag !== lastTag) {
        html += '<p class="rail-title">' + esc(GROUPS[cat.tag] || cat.tag) + "</p>";
        lastTag = cat.tag;
      }
      html += '<a class="rail-link" href="#' + cat.id + '" data-rail="' + cat.id + '">' +
                '<span>' + esc(cat.label) + '</span>' +
                '<span class="rail-count">' + cat.commands.length + "</span>" +
              "</a>";
    });
    el("railNav").innerHTML = html;
  }

  function updateRailCounts(byCat) {
    ATLAS.forEach(function (cat, ci) {
      var link = document.querySelector('[data-rail="' + cat.id + '"]');
      if (!link) return;
      var n = byCat[ci] ? byCat[ci].length : 0;
      link.querySelector(".rail-count").textContent = n;
      link.classList.toggle("dimmed", n === 0);
    });
  }

  /* ---------- reveal on scroll ---------- */

  var revealObserver = null;
  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(function (items) {
      items.forEach(function (item, i) {
        if (!item.isIntersecting) return;
        var node = item.target;
        node.style.transitionDelay = Math.min(i * 35, 210) + "ms";
        node.classList.add("in");
        revealObserver.unobserve(node);
      });
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.05 });
  }

  function observeCards() {
    var items = document.querySelectorAll(".reveal:not(.in)");
    if (!revealObserver) {
      items.forEach(function (c) { c.classList.add("in"); });
    } else {
      items.forEach(function (c) { revealObserver.observe(c); });
    }
    observeScenes();
  }

  /* Section animations idle until the section is on screen. */
  var sceneObserver = null;
  if ("IntersectionObserver" in window) {
    sceneObserver = new IntersectionObserver(function (items) {
      items.forEach(function (item) {
        item.target.classList.toggle("live", item.isIntersecting);
      });
    }, { rootMargin: "80px 0px" });
  }

  function observeScenes() {
    var sections = document.querySelectorAll(".section");
    if (!sceneObserver) {
      sections.forEach(function (sec) { sec.classList.add("live"); });
      return;
    }
    sections.forEach(function (sec) { sceneObserver.observe(sec); });
  }

  /* ---------- copying ---------- */

  function lookup(ref) {
    var p = ref.split(":");
    return ATLAS[+p[0]].commands[+p[1]];
  }

  var toastTimer = null;
  function toast(msg) {
    var t = el("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1900);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); }
      catch (err) { reject(err); }
      document.body.removeChild(ta);
    });
  }

  function flash(btn) {
    btn.classList.add("done");
    var card = btn.closest(".card");
    if (card) card.classList.add("copied");
    setTimeout(function () {
      btn.classList.remove("done");
      if (card) card.classList.remove("copied");
    }, 1500);
  }

  function shorten(s) {
    var first = s.split("\n")[0];
    return first.length > 44 ? first.slice(0, 44) + "\u2026" : first;
  }

  /* ---------- search ---------- */

  var currentTerms = [];

  function runSearch(raw) {
    var q = raw.trim().toLowerCase();
    var note = el("filterNote");
    el("searchClear").hidden = !q;

    if (!q) {
      currentTerms = [];
      note.hidden = true;
      render(INDEX, []);
      return;
    }

    var terms = q.split(/\s+/).filter(Boolean);
    currentTerms = terms;
    var hits = INDEX.filter(function (e) {
      return terms.every(function (t) { return e.hay.indexOf(t) !== -1; });
    });

    note.hidden = false;
    note.innerHTML = hits.length
      ? "<b>" + hits.length + "</b> " + (hits.length === 1 ? "command" : "commands") +
        " matching \u201C" + esc(raw.trim()) + "\u201D \u00B7 press Esc to clear"
      : "Nothing matched \u201C" + esc(raw.trim()) + "\u201D";

    render(hits, terms);
  }

  var searchTimer = null;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimer);
    var v = searchInput.value;
    searchTimer = setTimeout(function () { runSearch(v); }, 110);
  });

  function clearSearch() {
    searchInput.value = "";
    runSearch("");
    searchInput.focus();
  }
  el("searchClear").addEventListener("click", clearSearch);
  el("emptyReset").addEventListener("click", clearSearch);

  /* ---------- interaction: one delegated click handler ---------- */

  document.addEventListener("click", function (ev) {
    var copyBtn = ev.target.closest("[data-copy]");
    if (copyBtn) {
      var cmd = lookup(copyBtn.getAttribute("data-copy"));
      copyText(cmd.c).then(function () {
        flash(copyBtn);
        toast("Copied  " + shorten(cmd.c));
      }).catch(function () { toast("Could not copy \u2014 select the text instead"); });
      return;
    }

    var exBtn = ev.target.closest("[data-copyex]");
    if (exBtn) {
      var ex = lookup(exBtn.getAttribute("data-copyex"));
      copyText(ex.x).then(function () {
        exBtn.classList.add("done");
        setTimeout(function () { exBtn.classList.remove("done"); }, 1500);
        toast("Copied the example");
      }).catch(function () { toast("Could not copy \u2014 select the text instead"); });
      return;
    }

    var toggle = ev.target.closest("[data-ex]");
    if (toggle) {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      var wrap = toggle.nextElementSibling;
      if (wrap) wrap.classList.toggle("open", !open);
      return;
    }

    var chip = ev.target.closest("[data-jump]");
    if (chip) { scrollToId(chip.getAttribute("data-jump")); return; }

    var railLink = ev.target.closest(".rail-link");
    if (railLink) {
      ev.preventDefault();
      var id = railLink.getAttribute("data-rail");
      history.replaceState(null, "", "#" + id);
      closeRail();
      scrollToId(id);
      return;
    }

    var brandLink = ev.target.closest('.brand[href="#top"], .skip-link');
    if (brandLink) {
      ev.preventDefault();
      brandLink.classList.contains("skip-link") ? scrollToId("atlas") : smoothTo(0);
    }
  });

  /* ---------- mobile rail drawer ---------- */

  var rail = el("rail"), scrim = el("railScrim"), navBtn = el("navBtn");

  function openRail() {
    rail.classList.add("open");
    scrim.hidden = false;
    navBtn.setAttribute("aria-expanded", "true");
  }
  function closeRail() {
    rail.classList.remove("open");
    scrim.hidden = true;
    navBtn.setAttribute("aria-expanded", "false");
  }
  navBtn.addEventListener("click", function () {
    rail.classList.contains("open") ? closeRail() : openRail();
  });
  scrim.addEventListener("click", closeRail);

  /* ---------- theme: follows the system unless you say otherwise ---------- */

  var root = document.documentElement;
  var themeBtn = el("themeBtn");
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: light)") : null;

  var MODES = ["system", "light", "dark"];
  var MODE_ICON = {
    system: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="3.5" width="16" height="11" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7 17.5h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    light: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4" fill="currentColor"/><path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M4 4l1.4 1.4M14.6 14.6 16 16M16 4l-1.4 1.4M5.4 14.6 4 16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    dark: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 12.4A7 7 0 0 1 7.6 3.5a7 7 0 1 0 8.9 8.9z" fill="currentColor"/></svg>'
  };
  var MODE_TEXT = { system: "System", light: "Light", dark: "Dark" };

  function readMode() {
    try {
      var saved = localStorage.getItem("gitatlas-theme");
      return MODES.indexOf(saved) !== -1 ? saved : "system";
    } catch (e) { return "system"; }
  }

  var mode = readMode();

  function applyTheme(next, announce) {
    mode = next;
    var resolved = next === "system" ? (mq && mq.matches ? "light" : "dark") : next;
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-theme-mode", next);

    themeBtn.innerHTML = MODE_ICON[next] +
      '<span class="mode-label">Theme: ' + MODE_TEXT[next] + "</span>";
    themeBtn.setAttribute("aria-label",
      "Theme: " + MODE_TEXT[next] + ". Click to switch.");

    try { localStorage.setItem("gitatlas-theme", next); } catch (e) { /* private mode */ }
    if (announce) {
      toast(next === "system" ? "Theme follows your system" : MODE_TEXT[next] + " theme");
    }
  }

  themeBtn.addEventListener("click", function () {
    applyTheme(MODES[(MODES.indexOf(mode) + 1) % MODES.length], true);
  });

  if (mq) {
    var onSchemeChange = function () { if (mode === "system") applyTheme("system", false); };
    if (mq.addEventListener) mq.addEventListener("change", onSchemeChange);
    else if (mq.addListener) mq.addListener(onSchemeChange);
  }

  applyTheme(mode, false);

  /* ---------- keyboard ---------- */

  document.addEventListener("keydown", function (ev) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

    if ((ev.key === "/" && !typing) || ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k")) {
      ev.preventDefault();
      searchInput.focus();
      searchInput.select();
      return;
    }
    if (ev.key === "Escape") {
      if (rail.classList.contains("open")) { closeRail(); return; }
      if (searchInput.value) { clearSearch(); searchInput.blur(); }
    }
  });

  /* ---------- scrolling ----------
     The progress bar is the only thing recalculated per frame; the active
     section comes from an observer, so scrolling never triggers layout. */

  var toTop = el("toTop");
  var progressBar = el("progress");
  var ticking = false;
  var lastY = -1;
  var heroParallax = el("demo");

  function frame() {
    ticking = false;
    var doc = document.documentElement;
    var y = window.scrollY || doc.scrollTop;
    if (y === lastY) return;
    lastY = y;

    var max = doc.scrollHeight - window.innerHeight;
    progressBar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";

    var showTop = y > 600;
    if (showTop === toTop.hidden) toTop.hidden = !showTop;

    if (heroParallax && y < window.innerHeight) {
      heroParallax.style.transform = "translate3d(0," + (y * 0.06).toFixed(2) + "px,0)";
    }
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });

  /* Which section am I in? Observed, not measured. */
  var railLinks = {};
  var activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    if (activeId && railLinks[activeId]) railLinks[activeId].classList.remove("active");
    activeId = id;
    var link = railLinks[id];
    if (!link) return;
    link.classList.add("active");
    var pane = link.closest(".rail-scroll");
    if (pane) {
      var box = link.getBoundingClientRect(), edge = pane.getBoundingClientRect();
      if (box.top < edge.top || box.bottom > edge.bottom) link.scrollIntoView({ block: "nearest" });
    }
  }

  var spy = null;
  if ("IntersectionObserver" in window) {
    var seen = new Map();
    spy = new IntersectionObserver(function (items) {
      items.forEach(function (i) { seen.set(i.target, i.intersectionRatio); });
      var best = null, bestRatio = 0;
      seen.forEach(function (ratio, node) {
        if (ratio > bestRatio && node.isConnected) { bestRatio = ratio; best = node; }
      });
      if (best) setActive(best.id);
    }, { rootMargin: "-88px 0px -55% 0px", threshold: [0, .01, .2, .6, 1] });
  }

  function observeSpy() {
    railLinks = {};
    document.querySelectorAll(".rail-link").forEach(function (l) {
      railLinks[l.getAttribute("data-rail")] = l;
    });
    if (!spy) return;
    spy.disconnect();
    document.querySelectorAll(".section").forEach(function (sec) { spy.observe(sec); });
  }

  /* Eased anchor scrolling — long jumps should feel carried, not teleported. */
  var scrolling = null;
  function stopScroll() { scrolling = null; }
  ["wheel", "touchstart", "keydown"].forEach(function (evt) {
    window.addEventListener(evt, stopScroll, { passive: true });
  });

  function smoothTo(targetY) {
    if (reduceMotion) { window.scrollTo(0, targetY); return; }
    var startY = window.scrollY || document.documentElement.scrollTop;
    var delta = targetY - startY;
    if (Math.abs(delta) < 4) return;
    var time = Math.min(1150, Math.max(420, Math.abs(delta) * 0.42));
    var token = {};
    scrolling = token;
    var t0 = performance.now();

    (function step(now) {
      if (scrolling !== token) return;
      var p = Math.min(1, (now - t0) / time);
      var eased = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      window.scrollTo(0, startY + delta * eased);
      if (p < 1) requestAnimationFrame(step); else scrolling = null;
    })(t0);
  }

  function scrollToId(id) {
    var target = document.getElementById(id);
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.scrollY - 92;
    smoothTo(Math.max(0, top));
  }

  toTop.addEventListener("click", function () { smoothTo(0); });

  /* ---------- hero: a real workflow, running end to end ----------
     Each line types out, its output lands, and the graph advances one step. */

  var WORKFLOW = [
    { c: "git switch -c feat/login",                  o: "Switched to a new branch 'feat/login'", b: "feat/login", g: 1 },
    { c: 'git commit -m "feat: add login form"',      o: "1 file changed, 48 insertions(+)", g: 2 },
    { c: 'git commit -m "test: cover login flow"',    o: "1 file changed, 26 insertions(+)", g: 3 },
    { c: "git push -u origin feat/login",             o: "branch 'feat/login' set up to track origin", g: 4 },
    { c: "gh pr create --fill",                       o: "github.com/arman080325/myapp/pull/42", g: 5 },
    { c: "gh pr merge 42 --squash --delete-branch",   o: "Merged pull request #42", ok: true, b: "main", g: 6 },
    { c: 'git tag -a v1.2.0 -m "Release 1.2.0"',      o: "Tagged v1.2.0 \u00b7 pushed to origin", ok: true, g: 7 }
  ];

  var demoTimers = [];
  function demoWait(fn, ms) { demoTimers.push(setTimeout(fn, ms)); }
  function demoStop() { demoTimers.forEach(clearTimeout); demoTimers = []; }

  function runDemo() {
    var list = el("demoLines"), graph = el("demoGraph"), branch = el("demoBranch");
    if (!list || !graph) return;

    var steps = graph.querySelectorAll("[data-step]");
    function showStep(n) {
      steps.forEach(function (node) {
        if (+node.getAttribute("data-step") <= n) node.classList.add("on");
      });
    }
    function resetGraph() {
      steps.forEach(function (node) { node.classList.remove("on"); });
    }

    if (reduceMotion) {
      list.innerHTML = WORKFLOW.map(function (s) {
        return '<li><span class="demo-cmd">' + esc(s.c) + '</span>' +
               '<span class="demo-out on' + (s.ok ? " ok" : "") + '">' + esc(s.o) + "</span></li>";
      }).join("");
      showStep(7);
      branch.textContent = "main";
      return;
    }

    var i = 0;

    function scrollTerminal() {
      var body = list.parentElement;
      var over = list.scrollHeight - body.clientHeight;
      list.style.transform = over > 0 ? "translateY(" + -over + "px)" : "none";
    }

    function typeLine() {
      var step = WORKFLOW[i];
      var li = document.createElement("li");
      var cmd = document.createElement("span");
      cmd.className = "demo-cmd";
      var cursor = document.createElement("span");
      cursor.className = "demo-cursor";
      li.appendChild(cmd);
      cmd.appendChild(cursor);
      list.appendChild(li);
      scrollTerminal();

      var n = 0;
      (function tick() {
        if (n <= step.c.length) {
          cmd.textContent = step.c.slice(0, n);
          cmd.appendChild(cursor);
          n++;
          demoWait(tick, 26);
          return;
        }
        cursor.remove();

        demoWait(function () {
          var out = document.createElement("span");
          out.className = "demo-out" + (step.ok ? " ok" : "");
          out.textContent = step.o;
          li.appendChild(out);
          requestAnimationFrame(function () { out.classList.add("on"); });

          if (step.b) branch.textContent = step.b;
          showStep(step.g);
          scrollTerminal();

          i++;
          if (i < WORKFLOW.length) demoWait(typeLine, 780);
          else demoWait(restart, 3600);
        }, 340);
      })();
    }

    function restart() {
      list.style.transition = "opacity .45s ease";
      list.style.opacity = "0";
      demoWait(function () {
        list.innerHTML = "";
        list.style.transform = "none";
        resetGraph();
        branch.textContent = "main";
        list.style.opacity = "1";
        i = 0;
        demoWait(typeLine, 500);
      }, 480);
    }

    /* Only run while the hero is actually on screen. */
    var demoEl = el("demo");
    if ("IntersectionObserver" in window) {
      var started = false;
      new IntersectionObserver(function (items) {
        items.forEach(function (item) {
          if (item.isIntersecting && !started) { started = true; typeLine(); }
          else if (!item.isIntersecting && started) { demoStop(); started = false; i = 0; list.innerHTML = ""; resetGraph(); branch.textContent = "main"; list.style.transform = "none"; }
        });
      }, { threshold: 0.25 }).observe(demoEl);
    } else {
      typeLine();
    }
  }

  /* ---------- go ---------- */

  /* The wordmark is built letter by letter so each one can arrive on its own. */
  function animateWordmark() {
    var title = document.querySelector(".hero-title");
    if (!title) return;
    var word = "GitAtlas";
    var html = "";
    for (var i = 0; i < word.length; i++) {
      var accent = i >= 3 ? " accent" : "";
      html += '<span class="ltr' + accent + '" style="--d:' + (0.18 + i * 0.055).toFixed(3) + 's">' +
                '<i style="--w:' + (i * 0.06).toFixed(2) + 's">' + word[i] + "</i>" +
              "</span>";
    }
    title.innerHTML = html + '<span class="caret" aria-hidden="true"></span>';
    title.setAttribute("aria-label", word);
  }

  function animateLede() {
    var lede = document.querySelector(".hero-lede");
    if (!lede) return;
    var words = lede.textContent.trim().split(/\s+/);
    lede.innerHTML = words.map(function (w, i) {
      return '<span class="word" style="--d:' + (0.55 + i * 0.022).toFixed(3) + 's">' + esc(w) + "</span>";
    }).join(" ");
  }

  animateWordmark();
  animateLede();
  buildRail();
  render(INDEX, []);
  frame();
  runDemo();

  if (location.hash) {
    var hashTarget = document.getElementById(location.hash.slice(1));
    if (hashTarget) setTimeout(function () { hashTarget.scrollIntoView(); }, 60);
  }
})();