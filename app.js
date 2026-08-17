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

  /* ---------- error-to-fix assistant ----------
     Matches familiar Git failures in the browser only. The user-provided
     error is never rendered or sent to analytics. */
  var FIXES = [
    { match: /(?:the term|command not found|not recognized).*(?:gitt|gittt|gti)\b|\b(gitt|gittt|gti)\s+(?:push|pull|status|commit|add|log|branch|switch)\b/, title: "That looks like a typo in the Git command", cause: "PowerShell cannot find a program called gitt. The Git command is spelled git with one t.", checks: ["git --version", "Get-Command git"], steps: ["Re-run the command with git, not gitt.", "If git itself is not recognised, install Git for Windows and open a new terminal."], command: "git push", jump: "sync" },
    { match: /not a git repository/, title: "This folder is not a Git repository", cause: "Git cannot find a .git folder from where you ran the command.", checks: ["pwd", "git rev-parse --show-toplevel"], steps: ["Move into the project folder, then run git status.", "If this is a new project, initialise it first with git init."], command: "git status", jump: "start" },
    { match: /remote contains work|failed to push some refs|updates were rejected/, title: "The remote has commits you do not have", cause: "Someone (or GitHub's README/license setup) added commits to the remote branch first. Git will not overwrite them with a normal push.", checks: ["git status", "git fetch origin", "git log --oneline HEAD..origin/main"], steps: ["Save or commit your local work first.", "Pull the remote commits, resolve any conflict, then push again."], command: "git pull --rebase origin main", jump: "sync" },
    { match: /unrelated histories/, title: "Git sees two separate project histories", cause: "The local and remote repositories were created independently, so they have no shared first commit.", checks: ["git log --oneline --all -5", "git remote -v"], steps: ["Confirm both histories truly belong together before combining them.", "Merge with the explicit allow-unrelated-histories option, then resolve any conflict."], command: "git pull origin main --allow-unrelated-histories", jump: "merge" },
    { match: /local changes.*overwritten|would be overwritten by (checkout|switch)/, title: "Switching branches would overwrite your edits", cause: "Your working tree has changes that conflict with files on the branch you want to switch to.", checks: ["git status", "git diff"], steps: ["Commit the work, stash it, or discard only the changes you no longer need.", "After the working tree is clean, switch branches again."], command: "git stash push -m \"work before switching branches\"", jump: "stash" },
    { match: /no tracking information|has no upstream branch/, title: "This branch is not linked to a remote branch", cause: "Git does not know which remote branch a bare pull or push should use.", checks: ["git branch -vv", "git remote -v"], steps: ["For a new branch, publish it and set the upstream in one command.", "For an existing remote branch, set the upstream to its matching origin branch."], command: "git push -u origin HEAD", jump: "remotes" },
    { match: /detached head/, title: "You are viewing a commit, not working on a branch", cause: "HEAD points directly at a commit or tag. New commits can become hard to find once you switch away.", checks: ["git status", "git log --oneline -3"], steps: ["If you want to keep working from here, create a branch before committing.", "If you were only inspecting history, switch back to your normal branch."], command: "git switch -c fix/from-detached-head", jump: "branch" },
    { match: /permission denied \(publickey\)|authentication failed|could not read username/, title: "GitHub could not authenticate this connection", cause: "Your remote URL and available SSH key or HTTPS credentials do not match an account with access.", checks: ["git remote -v", "ssh -T git@github.com"], steps: ["Check whether origin uses SSH or HTTPS.", "For SSH, add the correct public key to GitHub; for HTTPS, authenticate with a token or GitHub CLI."], command: "gh auth status", jump: "security" },
    { match: /conflict \(content\)|merge conflict|could not apply/, title: "Git needs help combining two edits", cause: "Both sides changed overlapping lines, and Git cannot safely choose one automatically.", checks: ["git status", "git diff --name-only --diff-filter=U"], steps: ["Open each file Git marks as unmerged and choose the final content.", "Stage every resolved file, then continue the merge, rebase, or cherry-pick."], command: "git status", jump: "merge" },
    { match: /author identity unknown|please tell me who you are/, title: "Git does not know who should author the commit", cause: "A user name or email is missing from this repository and your global configuration.", checks: ["git config --show-origin --get user.name", "git config --show-origin --get user.email"], steps: ["Set your name and email globally, or set a work email only in this repository.", "Retry the commit after checking the values."], command: "git config --global user.name \"Your Name\"", jump: "setup" },
    { match: /src refspec .* does not match any/, title: "There is no local commit or branch to push", cause: "This often happens when a new repository has no first commit yet, or the branch name in the push command is wrong.", checks: ["git status", "git branch --show-current", "git log -1 --oneline"], steps: ["Make and commit at least one change if the repository is empty.", "Then push the branch Git reports as current."], command: "git add . && git commit -m \"Initial commit\"", jump: "commit" }
  ];

  function fixHTML(fix) {
    var checks = fix.checks.map(function (cmd) { return '<li><code>' + esc(cmd) + '</code><button type="button" class="mini-copy" data-fix-copy="' + esc(cmd) + '">Copy</button></li>'; }).join("");
    var steps = fix.steps.map(function (step) { return "<li>" + esc(step) + "</li>"; }).join("");
    return '<div class="fix-result-head"><p class="eyebrow">Likely match</p><h3>' + esc(fix.title) + '</h3><p>' + esc(fix.cause) + '</p></div><div class="fix-columns"><div><h4>Check first</h4><ul class="fix-commands">' + checks + '</ul></div><div><h4>Safe path</h4><ol class="fix-steps">' + steps + '</ol></div></div><div class="fix-next"><span>Then run</span><code>' + esc(fix.command) + '</code><button type="button" class="mini-copy" data-fix-copy="' + esc(fix.command) + '">Copy</button><button type="button" class="text-btn" data-jump="' + fix.jump + '">See related commands</button></div>';
  }

  function showFix(raw) {
    var result = el("fixResult"), query = raw.toLowerCase().replace(/\s+/g, " ").trim();
    var fix = FIXES.filter(function (item) { return item.match.test(query); })[0];
    if (!query) { result.hidden = true; return; }
    if (!fix) result.innerHTML = '<div class="fix-result-head"><p class="eyebrow">No exact match yet</p><h3>Start with a safe snapshot.</h3><p>GitAtlas did not recognise that error. These checks reveal your branch, changed files, and recent history without changing anything.</p></div><div class="fix-next"><code>git status</code><button type="button" class="mini-copy" data-fix-copy="git status">Copy</button><code>git log --oneline -5</code><button type="button" class="mini-copy" data-fix-copy="git log --oneline -5">Copy</button><button type="button" class="text-btn" data-jump="fixes">Browse common errors</button></div>';
    else result.innerHTML = fixHTML(fix);
    result.hidden = false;
    result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }

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

  function sectionOf(ref) { return ATLAS[+ref.split(":")[0]].id; }

  /* Analytics is optional: if analytics.js is absent or the visitor opted
     out, this is a no-op and nothing downstream notices. */
  function track(name, props) {
    if (window.GitAtlasAnalytics) window.GitAtlasAnalytics.track(name, props);
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

    reportSearch(raw.trim(), hits.length);

    note.hidden = false;
    note.innerHTML = hits.length
      ? "<b>" + hits.length + "</b> " + (hits.length === 1 ? "command" : "commands") +
        " matching \u201C" + esc(raw.trim()) + "\u201D \u00B7 press Esc to clear"
      : "Nothing matched \u201C" + esc(raw.trim()) + "\u201D";

    render(hits, terms);
  }

  /* Wait for a pause in typing so "g", "gi", "git" is one event, not three. */
  var reportTimer = null;
  var lastReported = "";
  function reportSearch(query, hits) {
    clearTimeout(reportTimer);
    if (query.length < 2 || query === lastReported) return;
    reportTimer = setTimeout(function () {
      lastReported = query;
      track(hits ? "search_performed" : "search_no_results", { query: query, hits: hits });
    }, 900);
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
  el("fixForm").addEventListener("submit", function (ev) { ev.preventDefault(); showFix(el("errorInput").value); });
  el("fixClear").addEventListener("click", function () { el("errorInput").value = ""; el("fixResult").hidden = true; el("fixClear").hidden = true; el("errorInput").focus(); });
  el("errorInput").addEventListener("input", function () { el("fixClear").hidden = !this.value; });

  /* ---------- interaction: one delegated click handler ---------- */

  document.addEventListener("click", function (ev) {
    var sample = ev.target.closest("[data-error-sample]");
    if (sample) { el("errorInput").value = sample.getAttribute("data-error-sample"); el("fixClear").hidden = false; showFix(el("errorInput").value); return; }
    var fixCopy = ev.target.closest("[data-fix-copy]");
    if (fixCopy) { copyText(fixCopy.getAttribute("data-fix-copy")).then(function () { flash(fixCopy); toast("Copied the diagnostic command"); }).catch(function () { toast("Could not copy — select the text instead"); }); return; }
    var copyBtn = ev.target.closest("[data-copy]");
    if (copyBtn) {
      var cmd = lookup(copyBtn.getAttribute("data-copy"));
      copyText(cmd.c).then(function () {
        flash(copyBtn);
        toast("Copied  " + shorten(cmd.c));
        var risk = riskOf(cmd.c);
        track("command_copied", {
          command: cmd.c,
          section: sectionOf(copyBtn.getAttribute("data-copy")),
          risk: risk ? risk.k : "none",
          from_search: currentTerms.length > 0
        });
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
        track("example_copied", { command: ex.c, section: sectionOf(exBtn.getAttribute("data-copyex")) });
      }).catch(function () { toast("Could not copy \u2014 select the text instead"); });
      return;
    }

    var toggle = ev.target.closest("[data-ex]");
    if (toggle) {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      var wrap = toggle.nextElementSibling;
      if (wrap) wrap.classList.toggle("open", !open);
      if (!open) track("example_opened", { command: lookup(toggle.getAttribute("data-ex")).c });
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
      track("theme_changed", { mode: next });
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

  var reported = {};

  function setActive(id) {
    if (id === activeId) return;
    if (!reported[id]) { reported[id] = true; track("section_viewed", { section: id }); }
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

  /* ---------- live counter ----------
     Reads the public aggregate and counts up to it. If the API is not
     configured yet, or the number is still tiny, the stat stays hidden. */

  /* Raise MIN_COPIES once the site has real traffic — a counter reading "3"
     undersells it. Set to 1 while demoing. */
  var MIN_COPIES = 1;

  function liveCounter() {
    var wrap = el("statCopies"), out = el("copyCount");
    if (!wrap || !out || !window.fetch) return;

    fetch("/api/stats", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.configured || !data.copies || data.copies < MIN_COPIES) return;
        wrap.hidden = false;
        countUp(out, data.copies);
        wrap.title = data.copies.toLocaleString() + " commands copied by " +
                     (data.copiers || 0).toLocaleString() + " people";
      })
      .catch(function () { /* no counter today */ });
  }

  function countUp(node, target) {
    if (reduceMotion) { node.textContent = target.toLocaleString(); return; }
    var start = performance.now(), from = 0, time = 1400;

    (function step(now) {
      var p = Math.min(1, (now - start) / time);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(from + (target - from) * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---------- opt out link ---------- */

  var optOutLink = el("optOut");
  if (optOutLink) {
    optOutLink.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (!window.GitAtlasAnalytics) return;
      var on = window.GitAtlasAnalytics.enabled();
      toast(on ? window.GitAtlasAnalytics.optOut() : window.GitAtlasAnalytics.optIn());
      optOutLink.textContent = on ? "turn it back on" : "turn it off";
    });
    if (window.GitAtlasAnalytics && !window.GitAtlasAnalytics.enabled()) {
      optOutLink.textContent = "turn it back on";
    }
  }

  /* ---------- guided playbooks + recovery wizard ----------
     Two ways into the same content: answer two questions, or open a
     playbook directly. Every risky step carries the read-only check
     you should run before it. */

  var wizPath = [];

  function pbById(id) {
    for (var i = 0; i < PLAYBOOKS.length; i++) if (PLAYBOOKS[i].id === id) return PLAYBOOKS[i];
    return null;
  }

  function wizNode() {
    var node = WIZARD;
    for (var i = 0; i < wizPath.length; i++) node = node.options[wizPath[i]].next;
    return node;
  }

  function crumbsHTML() {
    var html = '<button type="button" class="crumb" data-wiz-to="0">Start</button>';
    var node = WIZARD;
    for (var i = 0; i < wizPath.length; i++) {
      var opt = node.options[wizPath[i]];
      html += '<span class="crumb-sep">/</span><button type="button" class="crumb" data-wiz-to="' +
              (i + 1) + '">' + esc(opt.label) + "</button>";
      node = opt.next;
    }
    return '<nav class="wiz-crumbs" aria-label="Your answers">' + html + "</nav>";
  }

  function questionHTML(node) {
    var opts = node.options.map(function (o, i) {
      return '<button type="button" class="wiz-option" data-wiz="' + i + '">' +
               "<b>" + esc(o.label) + "</b>" +
               (o.hint ? "<span>" + esc(o.hint) + "</span>" : "") +
               '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
             "</button>";
    }).join("");
    return (wizPath.length ? crumbsHTML() : "") +
           '<p class="wiz-q">' + esc(node.q) + "</p>" +
           '<div class="wiz-options">' + opts + "</div>";
  }

  function stepHTML(step, pbId, index) {
    var html = '<li class="pb-step"><span class="pb-num">' + (index + 1) + "</span><div class=\"pb-body\">" +
               '<p class="pb-do">' + esc(step.do) + "</p>";

    if (step.check) {
      html += '<div class="pb-check">' +
                '<p class="pb-check-head">Check first</p>' +
                '<div class="pb-mini"><code>' + esc(step.check.cmd) + "</code>" +
                  '<button type="button" class="mini-copy" data-pb-copy="' + pbId + ":" + index + ':check">Copy</button></div>' +
                "<p>" + esc(step.check.why) + "</p>" +
              "</div>";
    }

    html += '<div class="pb-cmd"><pre>' + esc(step.cmd) + "</pre>" +
              '<button type="button" class="mini-copy" data-pb-copy="' + pbId + ":" + index + ':cmd">Copy</button></div>';

    if (step.warn) html += '<p class="pb-warn">' + esc(step.warn) + "</p>";
    return html + "</div></li>";
  }

  function playbookHTML(pb, fromWizard) {
    var steps = pb.steps.map(function (step, i) { return stepHTML(step, pb.id, i); }).join("");
    var related = pb.related.map(function (id) {
      var cat = null;
      ATLAS.forEach(function (c) { if (c.id === id) cat = c; });
      return cat ? '<button type="button" class="text-btn" data-jump="' + id + '">' + esc(cat.label) + "</button>" : "";
    }).join("");

    return (fromWizard ? crumbsHTML() : "") +
      '<article class="playbook">' +
        '<header class="pb-head">' +
          '<p class="pb-kind ' + pb.kind + '">' + (pb.kind === "rescue" ? "Recovery" : "Workflow") + "</p>" +
          "<h3>" + esc(pb.title) + "</h3>" +
          '<p class="pb-goal">' + esc(pb.goal) + "</p>" +
          '<p class="pb-when"><b>When</b> ' + esc(pb.when) + "</p>" +
          '<div class="pb-actions">' +
            '<button type="button" class="btn btn-small" data-pb-all="' + pb.id + '">Copy all commands</button>' +
            '<button type="button" class="text-btn" data-wiz-to="0">Start over</button>' +
          "</div>" +
        "</header>" +
        '<ol class="pb-steps">' + steps + "</ol>" +
        '<footer class="pb-after"><p>' + esc(pb.after) + "</p>" +
          (related ? '<div class="pb-related"><span>Related commands</span>' + related + "</div>" : "") +
        "</footer>" +
      "</article>";
  }

  function renderWizard() {
    var stage = el("wizardStage");
    if (!stage) return;
    stage.innerHTML = questionHTML(wizNode());
  }

  function openPlaybook(id, fromWizard) {
    var pb = pbById(id), stage = el("wizardStage");
    if (!pb || !stage) return;
    stage.innerHTML = playbookHTML(pb, fromWizard);
    track("playbook_opened", { playbook: id, via: fromWizard ? "wizard" : "direct" });
    try { history.replaceState(null, "", "#play-" + id); } catch (e) { /* ignore */ }
  }

  function buildPlaybookChips() {
    var wrap = el("playbookChips");
    if (!wrap) return;
    wrap.innerHTML = PLAYBOOKS.map(function (pb) {
      return '<button type="button" class="pb-chip ' + pb.kind + '" data-play="' + pb.id + '">' +
             esc(pb.title) + "</button>";
    }).join("");
  }

  /* All wizard interaction, delegated from the section itself. */
  function initWizard() {
    var section = el("wizard");
    if (!section || typeof PLAYBOOKS === "undefined") return;

    buildPlaybookChips();
    renderWizard();

    section.addEventListener("click", function (ev) {
      var choice = ev.target.closest("[data-wiz]");
      if (choice) {
        var i = +choice.getAttribute("data-wiz");
        var opt = wizNode().options[i];
        track("wizard_answer", { depth: wizPath.length });

        if (opt.play) { wizPath.push(i); openPlaybook(opt.play, true); return; }
        if (opt.jump) { scrollToId(opt.jump); return; }
        wizPath.push(i);
        renderWizard();
        return;
      }

      var crumb = ev.target.closest("[data-wiz-to]");
      if (crumb) {
        wizPath = wizPath.slice(0, +crumb.getAttribute("data-wiz-to"));
        renderWizard();
        try { history.replaceState(null, "", "#wizard"); } catch (e) { /* ignore */ }
        return;
      }

      var chip = ev.target.closest("[data-play]");
      if (chip) {
        wizPath = [];
        openPlaybook(chip.getAttribute("data-play"), false);
        return;
      }

      var stepCopy = ev.target.closest("[data-pb-copy]");
      if (stepCopy) {
        var parts = stepCopy.getAttribute("data-pb-copy").split(":");
        var pb = pbById(parts[0]);
        if (!pb) return;
        var step = pb.steps[+parts[1]];
        var text = parts[2] === "check" ? step.check.cmd : step.cmd;
        copyText(text).then(function () {
          flash(stepCopy);
          toast(parts[2] === "check" ? "Copied the check" : "Copied step " + (+parts[1] + 1));
          track("playbook_copied", { playbook: pb.id });
        }).catch(function () { toast("Could not copy \u2014 select the text instead"); });
        return;
      }

      var all = ev.target.closest("[data-pb-all]");
      if (all) {
        var book = pbById(all.getAttribute("data-pb-all"));
        if (!book) return;
        var script = "# " + book.title + "\n# " + book.goal + "\n\n" +
          book.steps.map(function (st, n) {
            return "# " + (n + 1) + ". " + st.do +
                   (st.check ? "\n" + st.check.cmd : "") + "\n" + st.cmd;
          }).join("\n\n") + "\n";
        copyText(script).then(function () {
          flash(all);
          toast("Copied all " + book.steps.length + " steps");
          track("playbook_copied", { playbook: book.id });
        }).catch(function () { toast("Could not copy \u2014 select the text instead"); });
      }
    });
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
  initWizard();
  if (window.requestIdleCallback) requestIdleCallback(liveCounter, { timeout: 3000 });
  else setTimeout(liveCounter, 1200);

  if (location.hash.indexOf("#play-") === 0) {
    var wanted = location.hash.slice(6);
    if (pbById(wanted)) {
      openPlaybook(wanted, false);
      setTimeout(function () {
        var sec = el("wizard");
        if (sec) sec.scrollIntoView({ block: "start" });
      }, 60);
    }
  } else if (location.hash) {
    var hashTarget = document.getElementById(location.hash.slice(1));
    if (hashTarget) setTimeout(function () { hashTarget.scrollIntoView(); }, 60);
  }
})();