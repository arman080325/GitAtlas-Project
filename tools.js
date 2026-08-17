/* =========================================================
   GitAtlas — tools.js
   Interactive Command Builders & Generators Studio
   Zero dependencies. Plain JavaScript.
   ========================================================= */

(function () {
  "use strict";

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error("copy failed"));
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }

  function downloadFile(filename, content) {
    var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function toast(msg) {
    var t = el("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  function flash(btn) {
    btn.classList.add("done");
    setTimeout(function () { btn.classList.remove("done"); }, 1500);
  }

  function track(name, props) {
    if (window.GitAtlasAnalytics && typeof window.GitAtlasAnalytics.track === "function") {
      window.GitAtlasAnalytics.track(name, props);
    }
  }

  /* =========================================================
     TOOL 1: git log Visual Builder
     ========================================================= */

  var logState = {
    preset: "graph",
    scope: "all",
    count: "10",
    customCount: "",
    author: "",
    since: "",
    sinceCustom: "",
    untilCustom: "",
    path: "",
    grep: "",
    merges: "all",
    customFormat: "%h - %an, %ar : %s"
  };

  var LOG_EXPLANATIONS = {
    "--graph": "Draws an ASCII graph showing branch splits and merge points on the left.",
    "--oneline": "Condenses each commit to a single line (short SHA + commit title).",
    "--decorate": "Prints branch names, tags, and HEAD pointers next to commit hashes.",
    "--all": "Shows commits from all local branches, remote-tracking branches, and tags.",
    "--first-parent": "Follows only the first parent commit on merges, keeping the timeline linear on main.",
    "--stat": "Lists changed files and number of insertions/deletions under each commit.",
    "-p": "Displays full line-by-line patch diffs for every change in each commit.",
    "--no-merges": "Hides merge commits that have two or more parents.",
    "--merges": "Shows only merge commits, useful for tracking pull request merges."
  };

  function buildLogCommand() {
    var flags = [];
    var explanations = [];

    if (logState.preset === "graph") {
      flags.push("--graph", "--oneline", "--decorate");
      explanations.push({ flag: "--graph", text: LOG_EXPLANATIONS["--graph"] });
      explanations.push({ flag: "--oneline", text: LOG_EXPLANATIONS["--oneline"] });
      explanations.push({ flag: "--decorate", text: LOG_EXPLANATIONS["--decorate"] });
    } else if (logState.preset === "compact") {
      flags.push("--oneline");
      explanations.push({ flag: "--oneline", text: LOG_EXPLANATIONS["--oneline"] });
    } else if (logState.preset === "stat") {
      flags.push("--stat");
      explanations.push({ flag: "--stat", text: LOG_EXPLANATIONS["--stat"] });
    } else if (logState.preset === "patch") {
      flags.push("-p");
      explanations.push({ flag: "-p", text: LOG_EXPLANATIONS["-p"] });
    } else if (logState.preset === "custom") {
      var fmt = logState.customFormat.trim() || "%h - %an, %ar : %s";
      flags.push('--pretty=format:"' + fmt + '"');
      explanations.push({ flag: '--pretty=format:"..."', text: "Custom template: " + fmt });
    }

    if (logState.scope === "all") {
      flags.push("--all");
      explanations.push({ flag: "--all", text: LOG_EXPLANATIONS["--all"] });
    } else if (logState.scope === "first-parent") {
      flags.push("--first-parent");
      explanations.push({ flag: "--first-parent", text: LOG_EXPLANATIONS["--first-parent"] });
    } else if (logState.scope === "remotes") {
      flags.push("--remotes");
      explanations.push({ flag: "--remotes", text: "Restricts log to remote-tracking branches." });
    }

    if (logState.merges === "no-merges") {
      flags.push("--no-merges");
      explanations.push({ flag: "--no-merges", text: LOG_EXPLANATIONS["--no-merges"] });
    } else if (logState.merges === "merges-only") {
      flags.push("--merges");
      explanations.push({ flag: "--merges", text: LOG_EXPLANATIONS["--merges"] });
    }

    var countVal = logState.count === "custom" ? logState.customCount.trim() : logState.count;
    if (countVal && countVal !== "all" && parseInt(countVal, 10) > 0) {
      flags.push("-n " + parseInt(countVal, 10));
      explanations.push({ flag: "-n " + parseInt(countVal, 10), text: "Limits output to the latest " + parseInt(countVal, 10) + " commits." });
    }

    if (logState.author.trim()) {
      var author = logState.author.trim();
      flags.push('--author="' + author + '"');
      explanations.push({ flag: '--author="' + author + '"', text: 'Filters commits written by author matching "' + author + '".' });
    }

    if (logState.since === "24h") {
      flags.push('--since="24 hours ago"');
      explanations.push({ flag: '--since="24 hours ago"', text: "Shows commits created in the last 24 hours." });
    } else if (logState.since === "7d") {
      flags.push('--since="7 days ago"');
      explanations.push({ flag: '--since="7 days ago"', text: "Shows commits created in the last 7 days." });
    } else if (logState.since === "2w") {
      flags.push('--since="2 weeks ago"');
      explanations.push({ flag: '--since="2 weeks ago"', text: "Shows commits created in the last 2 weeks." });
    } else if (logState.since === "1m") {
      flags.push('--since="1 month ago"');
      explanations.push({ flag: '--since="1 month ago"', text: "Shows commits created in the last month." });
    } else if (logState.since === "custom") {
      if (logState.sinceCustom.trim()) {
        flags.push('--since="' + logState.sinceCustom.trim() + '"');
        explanations.push({ flag: '--since="' + logState.sinceCustom.trim() + '"', text: 'Commits on or after "' + logState.sinceCustom.trim() + '".' });
      }
      if (logState.untilCustom.trim()) {
        flags.push('--until="' + logState.untilCustom.trim() + '"');
        explanations.push({ flag: '--until="' + logState.untilCustom.trim() + '"', text: 'Commits on or before "' + logState.untilCustom.trim() + '".' });
      }
    }

    if (logState.grep.trim()) {
      var grepText = logState.grep.trim();
      flags.push('--grep="' + grepText + '"');
      explanations.push({ flag: '--grep="' + grepText + '"', text: 'Filters commit messages containing "' + grepText + '".' });
    }

    var pathSuffix = "";
    if (logState.path.trim()) {
      var p = logState.path.trim();
      pathSuffix = " -- " + p;
      explanations.push({ flag: "-- " + p, text: 'Restricts output to commits that modified "' + p + '".' });
    }

    var cmd = "git log" + (flags.length ? " " + flags.join(" ") : "") + pathSuffix;
    return { cmd: cmd, explanations: explanations };
  }

  function updateLogBuilderUI() {
    var res = buildLogCommand();
    var codeEl = el("logOutputCode");
    if (codeEl) codeEl.textContent = res.cmd;

    var explEl = el("logExplList");
    if (explEl) {
      if (res.explanations.length === 0) {
        explEl.innerHTML = '<li class="studio-expl-item"><span class="studio-expl-flag">git log</span><span class="studio-expl-text">Shows the full default commit history from HEAD backward.</span></li>';
      } else {
        explEl.innerHTML = res.explanations.map(function (e) {
          return '<li class="studio-expl-item"><span class="studio-expl-flag">' + esc(e.flag) + '</span><span class="studio-expl-text">' + esc(e.text) + '</span></li>';
        }).join("");
      }
    }
  }

  function initLogBuilder() {
    var root = el("tool-log");
    if (!root) return;

    root.addEventListener("click", function (ev) {
      var presetBtn = ev.target.closest("[data-log-preset]");
      if (presetBtn) {
        root.querySelectorAll("[data-log-preset]").forEach(function (b) { b.classList.remove("active"); });
        presetBtn.classList.add("active");
        logState.preset = presetBtn.getAttribute("data-log-preset");
        var customWrap = el("logCustomFormatWrap");
        if (customWrap) customWrap.hidden = (logState.preset !== "custom");
        updateLogBuilderUI();
        track("tool_log_preset", { preset: logState.preset });
        return;
      }

      var scopeBtn = ev.target.closest("[data-log-scope]");
      if (scopeBtn) {
        root.querySelectorAll("[data-log-scope]").forEach(function (b) { b.classList.remove("active"); });
        scopeBtn.classList.add("active");
        logState.scope = scopeBtn.getAttribute("data-log-scope");
        updateLogBuilderUI();
        return;
      }

      var countBtn = ev.target.closest("[data-log-count]");
      if (countBtn) {
        root.querySelectorAll("[data-log-count]").forEach(function (b) { b.classList.remove("active"); });
        countBtn.classList.add("active");
        logState.count = countBtn.getAttribute("data-log-count");
        var customCountIn = el("logCustomCount");
        if (customCountIn) customCountIn.hidden = (logState.count !== "custom");
        updateLogBuilderUI();
        return;
      }

      var mergeBtn = ev.target.closest("[data-log-merges]");
      if (mergeBtn) {
        root.querySelectorAll("[data-log-merges]").forEach(function (b) { b.classList.remove("active"); });
        mergeBtn.classList.add("active");
        logState.merges = mergeBtn.getAttribute("data-log-merges");
        updateLogBuilderUI();
        return;
      }

      var copyBtn = ev.target.closest("#logCopyBtn");
      if (copyBtn) {
        var text = el("logOutputCode").textContent;
        copyText(text).then(function () {
          flash(copyBtn);
          toast("Copied git log command");
          track("tool_copied", { tool: "log" });
        }).catch(function () { toast("Could not copy — select text manually"); });
      }
    });

    var authorIn = el("logAuthor");
    if (authorIn) authorIn.addEventListener("input", function () { logState.author = this.value; updateLogBuilderUI(); });

    var grepIn = el("logGrep");
    if (grepIn) grepIn.addEventListener("input", function () { logState.grep = this.value; updateLogBuilderUI(); });

    var pathIn = el("logPath");
    if (pathIn) pathIn.addEventListener("input", function () { logState.path = this.value; updateLogBuilderUI(); });

    var formatIn = el("logCustomFormat");
    if (formatIn) formatIn.addEventListener("input", function () { logState.customFormat = this.value; updateLogBuilderUI(); });

    var customCountIn = el("logCustomCount");
    if (customCountIn) customCountIn.addEventListener("input", function () { logState.customCount = this.value; updateLogBuilderUI(); });

    var sinceSelect = el("logSince");
    if (sinceSelect) {
      sinceSelect.addEventListener("change", function () {
        logState.since = this.value;
        var customDates = el("logCustomDates");
        if (customDates) customDates.hidden = (this.value !== "custom");
        updateLogBuilderUI();
      });
    }

    var sinceCustomIn = el("logSinceCustom");
    if (sinceCustomIn) sinceCustomIn.addEventListener("input", function () { logState.sinceCustom = this.value; updateLogBuilderUI(); });

    var untilCustomIn = el("logUntilCustom");
    if (untilCustomIn) untilCustomIn.addEventListener("input", function () { logState.untilCustom = this.value; updateLogBuilderUI(); });

    updateLogBuilderUI();
  }

  /* =========================================================
     TOOL 2: Undo Matrix (reset vs restore vs revert)
     ========================================================= */

  var UNDO_DATA = {
    working: {
      label: "Working Directory",
      desc: "Unstaged edits in your local files (not yet added to Git)",
      goals: [
        {
          id: "w-file",
          title: "Discard unstaged edits in a specific file",
          hint: "Replaces file contents with the latest staged or committed version.",
          cmd: "git restore <file>",
          paramName: "file",
          paramDefault: "path/to/file.js",
          risk: "danger",
          riskLabel: "Destroys work",
          check: "git diff <file>",
          checkWhy: "Inspect what changes are about to be thrown away forever.",
          why: "Use `git restore` because the changes are only in the working tree. `reset` is for the index/commits and `revert` is for public history."
        },
        {
          id: "w-all",
          title: "Discard ALL unstaged changes in the entire repo",
          hint: "Restores all modified files back to clean state.",
          cmd: "git restore .",
          risk: "danger",
          riskLabel: "Destroys work",
          check: "git status",
          checkWhy: "Shows every modified file that will lose all unstaged edits.",
          why: "`git restore .` is the modern, safe replacement for the old `git checkout -- .`."
        },
        {
          id: "w-stash",
          title: "Temporarily put changes aside without losing them",
          hint: "Saves dirty work to the stash drawer and gives you a clean working tree.",
          cmd: "git stash push -m \"wip: saved before branch switch\"",
          risk: "safe",
          riskLabel: "Safe & Recoverable",
          check: "git status",
          checkWhy: "Confirms which modified and staged files will be sheltered.",
          why: "Stashing is strictly safer than discarding. You can restore them anytime with `git stash pop`."
        },
        {
          id: "w-patch",
          title: "Interactively discard specific hunks (lines)",
          hint: "Goes through every modified block and asks (y/n) to discard.",
          cmd: "git restore -p <file>",
          paramName: "file",
          paramDefault: "path/to/file.js",
          risk: "warn",
          riskLabel: "Rewrites working tree",
          check: "git diff <file>",
          checkWhy: "Preview the diff before choosing hunks to discard.",
          why: "Allows surgical discarding of debug lines while keeping your real work."
        }
      ]
    },
    staged: {
      label: "Staging Area (Index)",
      desc: "Changes added with git add, but not yet committed",
      goals: [
        {
          id: "s-file",
          title: "Unstage a specific file (keep changes in files)",
          hint: "Removes file from staging area without touching your actual code.",
          cmd: "git restore --staged <file>",
          paramName: "file",
          paramDefault: "path/to/file.js",
          risk: "safe",
          riskLabel: "Safe (No data lost)",
          check: "git diff --staged",
          checkWhy: "View what is currently staged in the index.",
          why: "`git restore --staged` is the modern command. It moves changes from index back to working directory safely."
        },
        {
          id: "s-all",
          title: "Unstage everything (keep changes in working tree)",
          hint: "Empties the staging area so nothing is queued for commit.",
          cmd: "git restore --staged .",
          risk: "safe",
          riskLabel: "Safe (No data lost)",
          check: "git status",
          checkWhy: "Verify what files will be removed from staging.",
          why: "Leaves all your file modifications untouched, just marks them as unstaged."
        },
        {
          id: "s-nuke",
          title: "Unstage AND discard all file modifications completely",
          hint: "Both removes from index and reverts local files back to HEAD.",
          cmd: "git restore --staged --worktree <file>",
          paramName: "file",
          paramDefault: "path/to/file.js",
          risk: "danger",
          riskLabel: "Destroys work",
          check: "git diff --staged <file>",
          checkWhy: "Examine what will be permanently deleted from both index and disk.",
          why: "Combining `--staged --worktree` resets both areas in a single command."
        }
      ]
    },
    committed: {
      label: "Committed Locally (Unpushed)",
      desc: "Commits saved on your branch, but not yet pushed to remote",
      goals: [
        {
          id: "c-soft",
          title: "Undo last commit, keep changes staged in index",
          hint: "Rewinds HEAD by 1 commit; all changes remain staged ready to re-commit.",
          cmd: "git reset --soft HEAD~1",
          risk: "safe",
          riskLabel: "Safe (Preserves work)",
          check: "git log -1 --stat",
          checkWhy: "Review the commit you are about to unwrap.",
          why: "`reset --soft` only moves the branch pointer backward. No files are modified or deleted."
        },
        {
          id: "c-mixed",
          title: "Undo last commit, keep changes as unstaged files",
          hint: "Rewinds HEAD and index; changes remain in your working tree.",
          cmd: "git reset HEAD~1",
          risk: "safe",
          riskLabel: "Safe (Preserves work)",
          check: "git log -1 --oneline",
          checkWhy: "Review the commit title being unwrapped.",
          why: "Default reset mode. Great for splitting one big commit into smaller, cleaner commits."
        },
        {
          id: "c-amend",
          title: "Fix last commit message or add extra files into it",
          hint: "Merges currently staged files into the previous commit.",
          cmd: "git commit --amend --no-edit",
          risk: "warn",
          riskLabel: "Rewrites commit SHA",
          check: "git status",
          checkWhy: "Ensure only the files you want added are currently staged.",
          why: "Amending updates the latest commit directly instead of making a messy 'fix typo' commit."
        },
        {
          id: "c-hard",
          title: "Completely obliterate last commit and discard all code",
          hint: "Wipes the commit from history and throws away all file modifications.",
          cmd: "git reset --hard HEAD~1",
          risk: "danger",
          riskLabel: "Destroys work",
          check: "git log -1 -p",
          checkWhy: "Verify exactly what code and commit will be lost forever.",
          why: "WARNING: `reset --hard` rewinds HEAD, clears the index, and overwrites working tree files. If needed, recover via `git reflog`."
        },
        {
          id: "c-multiple",
          title: "Undo last N commits (keep changes staged)",
          hint: "Rewinds multiple commits back into staged index.",
          cmd: "git reset --soft HEAD~<count>",
          paramName: "count",
          paramDefault: "3",
          risk: "safe",
          riskLabel: "Safe (Preserves work)",
          check: "git log --oneline -5",
          checkWhy: "Confirm how many commits you need to roll back.",
          why: "Squashes multiple local commits back into your staging area for a fresh single commit."
        }
      ]
    },
    pushed: {
      label: "Already Pushed to Remote",
      desc: "Commits already pushed to GitHub / GitLab / shared branch",
      goals: [
        {
          id: "p-revert",
          title: "Safely undo a pushed commit without rewriting history",
          hint: "Creates a brand new commit that applies the exact inverse diff.",
          cmd: "git revert <commit-hash>",
          paramName: "commit-hash",
          paramDefault: "abc1234",
          risk: "safe",
          riskLabel: "Team Safe (Public History)",
          check: "git log --oneline -5",
          checkWhy: "Find the exact commit hash you want to undo.",
          why: "`git revert` is the golden rule for public branches. It does not rewrite history, so collaborators will not encounter merge conflicts or broken branches."
        },
        {
          id: "p-revert-merge",
          title: "Safely revert an already merged pull request / merge commit",
          hint: "Reverts the merge commit while specifying the main parent branch line.",
          cmd: "git revert -m 1 <commit-hash>",
          paramName: "commit-hash",
          paramDefault: "abc1234",
          risk: "safe",
          riskLabel: "Team Safe",
          check: "git log -1 <commit-hash>",
          checkWhy: "Verify that the target commit has two parents (Merge: ...).",
          why: "Merge commits have multiple parents. `-m 1` tells Git to keep the mainline history intact and revert only the incoming branch."
        },
        {
          id: "p-no-commit",
          title: "Revert a commit into working tree without auto-committing",
          hint: "Applies inverse changes to your files so you can inspect or adjust before committing.",
          cmd: "git revert -n <commit-hash>",
          paramName: "commit-hash",
          paramDefault: "abc1234",
          risk: "safe",
          riskLabel: "Safe",
          check: "git diff <commit-hash>~1 <commit-hash>",
          checkWhy: "Inspect what the revert will do.",
          why: "`-n` / `--no-commit` lets you batch multiple reverts into a single clean commit."
        }
      ]
    },
    untracked: {
      label: "Untracked Files",
      desc: "Newly created files or build artifacts that Git is not tracking",
      goals: [
        {
          id: "u-dry",
          title: "Dry-run check: see which untracked files would be deleted",
          hint: "Lists untracked files and directories without deleting anything.",
          cmd: "git clean -nd",
          risk: "safe",
          riskLabel: "Safe (Read-Only Preview)",
          check: "git status -u",
          checkWhy: "Shows all untracked files in the repository.",
          why: "Always run `git clean -nd` first before running the actual deletion."
        },
        {
          id: "u-force",
          title: "Permanently delete all untracked files and directories",
          hint: "Removes all files not under version control.",
          cmd: "git clean -fd",
          risk: "danger",
          riskLabel: "Destroys untracked files",
          check: "git clean -nd",
          checkWhy: "CRITICAL: Run dry-run first so you don't delete untracked config or notes.",
          why: "`git clean -fd` deletes untracked files (`-f`) and whole untracked directories (`-d`). This cannot be undone by Git."
        },
        {
          id: "u-ignored",
          title: "Delete untracked AND .gitignored build artifacts",
          hint: "Thorough clean: wipes node_modules, dist, and ignored caches.",
          cmd: "git clean -fdx",
          risk: "danger",
          riskLabel: "Destroys ignored files",
          check: "git clean -ndx",
          checkWhy: "Shows every ignored folder (like node_modules) about to be wiped.",
          why: "`-x` includes ignored files. Perfect for fixing corrupted build environments."
        }
      ]
    }
  };

  var undoState = {
    stateKey: "working",
    goalIndex: 0,
    paramValue: ""
  };

  function getActiveUndoGoal() {
    var s = UNDO_DATA[undoState.stateKey];
    if (!s || !s.goals.length) return null;
    var idx = Math.min(undoState.goalIndex, s.goals.length - 1);
    return s.goals[idx];
  }

  function renderUndoSimulator() {
    var root = el("tool-undo");
    if (!root) return;

    // Render State Pills
    var statesWrap = el("undoStatesWrap");
    if (statesWrap) {
      statesWrap.innerHTML = Object.keys(UNDO_DATA).map(function (k) {
        var active = (k === undoState.stateKey) ? " active" : "";
        return '<button type="button" class="studio-pill' + active + '" data-undo-state="' + k + '">' +
                 '<b>' + esc(UNDO_DATA[k].label) + '</b>' +
               '</button>';
      }).join("");
    }

    var stateObj = UNDO_DATA[undoState.stateKey];
    var stateDescEl = el("undoStateDesc");
    if (stateDescEl) stateDescEl.textContent = stateObj.desc;

    // Render Goals
    var goalsWrap = el("undoGoalsWrap");
    if (goalsWrap) {
      goalsWrap.innerHTML = stateObj.goals.map(function (g, i) {
        var active = (i === undoState.goalIndex) ? " active" : "";
        return '<button type="button" class="studio-goal-card' + active + '" data-undo-goal="' + i + '">' +
                 '<div class="studio-goal-head">' +
                   '<b>' + esc(g.title) + '</b>' +
                   '<span class="studio-goal-risk ' + g.risk + '">' + esc(g.riskLabel) + '</span>' +
                 '</div>' +
                 '<p class="studio-goal-hint">' + esc(g.hint) + '</p>' +
               '</button>';
      }).join("");
    }

    // Render Result Card
    var goal = getActiveUndoGoal();
    if (!goal) return;

    var paramInputWrap = el("undoParamWrap");
    if (paramInputWrap) {
      if (goal.paramName) {
        paramInputWrap.hidden = false;
        var labelEl = paramInputWrap.querySelector("label");
        if (labelEl) labelEl.textContent = "Target " + goal.paramName + ":";
        var inputEl = paramInputWrap.querySelector("input");
        if (inputEl) {
          inputEl.placeholder = goal.paramDefault;
          if (!undoState.paramValue) undoState.paramValue = goal.paramDefault;
          inputEl.value = undoState.paramValue;
        }
      } else {
        paramInputWrap.hidden = true;
      }
    }

    var targetVal = (goal.paramName && undoState.paramValue.trim()) ? undoState.paramValue.trim() : (goal.paramDefault || "");
    var finalCmd = goal.cmd.replace("<" + (goal.paramName || "file") + ">", targetVal);

    var codeEl = el("undoOutputCode");
    if (codeEl) codeEl.textContent = finalCmd;

    var riskBadge = el("undoRiskBadge");
    if (riskBadge) {
      riskBadge.className = "risk " + (goal.risk === "danger" ? "danger" : (goal.risk === "warn" ? "warn" : "good"));
      riskBadge.textContent = goal.riskLabel;
    }

    var whyEl = el("undoWhyText");
    if (whyEl) whyEl.textContent = goal.why;

    var checkCmdEl = el("undoCheckCmd");
    if (checkCmdEl) checkCmdEl.textContent = goal.check;

    var checkWhyEl = el("undoCheckWhy");
    if (checkWhyEl) checkWhyEl.textContent = goal.checkWhy;
  }

  function initUndoSimulator() {
    var root = el("tool-undo");
    if (!root) return;

    root.addEventListener("click", function (ev) {
      var stateBtn = ev.target.closest("[data-undo-state]");
      if (stateBtn) {
        undoState.stateKey = stateBtn.getAttribute("data-undo-state");
        undoState.goalIndex = 0;
        undoState.paramValue = "";
        renderUndoSimulator();
        track("tool_undo_state", { state: undoState.stateKey });
        return;
      }

      var goalBtn = ev.target.closest("[data-undo-goal]");
      if (goalBtn) {
        undoState.goalIndex = parseInt(goalBtn.getAttribute("data-undo-goal"), 10);
        undoState.paramValue = "";
        renderUndoSimulator();
        track("tool_undo_goal", { goal: undoState.goalIndex });
        return;
      }

      var copyBtn = ev.target.closest("#undoCopyBtn");
      if (copyBtn) {
        var text = el("undoOutputCode").textContent;
        copyText(text).then(function () {
          flash(copyBtn);
          toast("Copied recovery command");
          track("tool_copied", { tool: "undo" });
        }).catch(function () { toast("Could not copy — select text manually"); });
        return;
      }

      var checkCopyBtn = ev.target.closest("#undoCheckCopyBtn");
      if (checkCopyBtn) {
        var checkText = el("undoCheckCmd").textContent;
        copyText(checkText).then(function () {
          flash(checkCopyBtn);
          toast("Copied check command");
        }).catch(function () { toast("Could not copy — select text manually"); });
      }
    });

    var paramIn = el("undoParamInput");
    if (paramIn) {
      paramIn.addEventListener("input", function () {
        undoState.paramValue = this.value;
        var goal = getActiveUndoGoal();
        if (goal && goal.paramName) {
          var targetVal = this.value.trim() || goal.paramDefault;
          var finalCmd = goal.cmd.replace("<" + goal.paramName + ">", targetVal);
          var codeEl = el("undoOutputCode");
          if (codeEl) codeEl.textContent = finalCmd;
        }
      });
    }

    renderUndoSimulator();
  }

  /* =========================================================
     TOOL 3: Visual .gitignore & .gitattributes Generator
     ========================================================= */

  var IGNORE_RULES = {
    macos: {
      category: "Operating Systems",
      name: "macOS",
      content: "# macOS\n.DS_Store\n.AppleDouble\n.LSOverride\nIcon\r\n._*\n.Spotlight-V100\n.Trashes"
    },
    windows: {
      category: "Operating Systems",
      name: "Windows",
      content: "# Windows\nThumbs.db\nThumbs.db:encryptable\nehthumbs.db\nehthumbs_vista.db\n*.stackdump\n[Dd]esktop.ini\n$RECYCLE.BIN/"
    },
    linux: {
      category: "Operating Systems",
      name: "Linux",
      content: "# Linux\n*~\n.fuse_hidden*\n.directory\n.Trash-*"
    },
    vscode: {
      category: "Editors & IDEs",
      name: "VS Code",
      content: "# Visual Studio Code\n.vscode/*\n!.vscode/settings.json\n!.vscode/tasks.json\n!.vscode/launch.json\n!.vscode/extensions.json\n*.code-workspace\n.history/"
    },
    jetbrains: {
      category: "Editors & IDEs",
      name: "JetBrains / IntelliJ / WebStorm",
      content: "# JetBrains IDEs\n.idea/\n*.iml\n*.iws\n*.ipr\nout/\n.idea_modules/"
    },
    sublime: {
      category: "Editors & IDEs",
      name: "Sublime Text",
      content: "# Sublime Text\n*.sublime-workspace\n*.sublime-project"
    },
    vim: {
      category: "Editors & IDEs",
      name: "Vim / Emacs",
      content: "# Vim & Emacs\n*.swp\n*.swo\n*~\n*.un~\n.#*\n\\#*\\#"
    },
    node: {
      category: "Languages & Frameworks",
      name: "Node.js / JS / TS",
      content: "# Node.js & Web\nnode_modules/\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\nlerna-debug.log*\n.pnpm-debug.log*\ndist/\nbuild/\n.next/\n.nuxt/\n.astro/\n.turbo/\n.cache/\n.output/\n.svelte-kit/"
    },
    python: {
      category: "Languages & Frameworks",
      name: "Python",
      content: "# Python\n__pycache__/\n*.py[cod]\n*$py.class\n*.so\n.Python\nbuild/\ndevelop-eggs/\ndist/\ndownloads/\neggs/\n.eggs/\nlib/\nlib64/\nparts/\nsdist/\nvar/\nwheels/\n*.egg-info/\n.installed.cfg\n*.egg\n.venv/\nvenv/\nenv/\nENV/\n.pytest_cache/\n.mypy_cache/\n.ruff_cache/"
    },
    java: {
      category: "Languages & Frameworks",
      name: "Java / Kotlin / Gradle / Maven",
      content: "# Java / Gradle / Maven\n*.class\n*.log\n*.ctxt\n.mtj.tmp/\n*.jar\n*.war\n*.nar\n*.ear\n*.zip\n*.tar.gz\n*.rar\ntarget/\n.gradle/\nbuild/\n!gradle/wrapper/gradle-wrapper.jar"
    },
    rust: {
      category: "Languages & Frameworks",
      name: "Rust / Cargo",
      content: "# Rust\n/target/\n**/*.rs.bk\n*.pdb"
    },
    go: {
      category: "Languages & Frameworks",
      name: "Go",
      content: "# Go\nbin/\n*.exe\n*.exe~\n*.dll\n*.so\n*.dylib\n*.test\n*.out\nvendor/"
    },
    php: {
      category: "Languages & Frameworks",
      name: "PHP / Composer",
      content: "# PHP & Composer\n/vendor/\n.phpunit.result.cache\ncomposer.phar"
    },
    cpp: {
      category: "Languages & Frameworks",
      name: "C / C++ / CMake",
      content: "# C / C++\n*.o\n*.obj\n*.dll\n*.so\n*.dylib\n*.exe\n*.out\n*.app\nbuild/\ncmake-build-*/\nCMakeFiles/\nCMakeCache.txt"
    },
    env: {
      category: "Secrets & Environment",
      name: "Environment Variables & Keys",
      content: "# Secrets & Keys\n.env\n.env.local\n.env.development.local\n.env.test.local\n.env.production.local\n*.pem\n*.key\n*.cert\n*.crt\n*.p12\n*.pfx\nsecrets.json\ncredentials.json"
    },
    logs: {
      category: "Secrets & Environment",
      name: "Log files & Dumps",
      content: "# Logs & System Dumps\n*.log\nlogs/\n*.pid\n*.seed\n*.pid.lock\ncore\n*.stackdump"
    },
    coverage: {
      category: "Secrets & Environment",
      name: "Testing & Code Coverage",
      content: "# Coverage & Test Reports\ncoverage/\n.nyc_output/\n*.lcov\n.coverage\n.coverage.*\nhtmlcov/"
    },
    docker: {
      category: "Secrets & Environment",
      name: "Docker overrides",
      content: "# Docker\n.docker/\ndocker-compose.override.yml"
    }
  };

  var ATTRIBUTES_PRESETS = {
    line_endings: {
      name: "Normalize Line Endings (LF across OS)",
      desc: "Forces Unix LF for code files while keeping CRLF for Windows batch files.",
      content: "# Auto detect text files and normalize line endings to LF\n* text=auto eol=lf\n\n# Windows specific script files require CRLF\n*.bat text eol=crlf\n*.cmd text eol=crlf\n*.ps1 text eol=crlf\n\n# Shell scripts must have LF\n*.sh text eol=lf"
    },
    git_lfs: {
      name: "Git LFS (Large File Storage)",
      desc: "Tracks large binary assets in Git LFS instead of repository blobs.",
      content: "# Large Media & Binaries in Git LFS\n*.zip filter=lfs diff=lfs merge=lfs -text\n*.tar.gz filter=lfs diff=lfs merge=lfs -text\n*.7z filter=lfs diff=lfs merge=lfs -text\n*.png filter=lfs diff=lfs merge=lfs -text\n*.jpg filter=lfs diff=lfs merge=lfs -text\n*.jpeg filter=lfs diff=lfs merge=lfs -text\n*.mp4 filter=lfs diff=lfs merge=lfs -text\n*.mov filter=lfs diff=lfs merge=lfs -text\n*.pdf filter=lfs diff=lfs merge=lfs -text\n*.wasm filter=lfs diff=lfs merge=lfs -text\n*.psd filter=lfs diff=lfs merge=lfs -text"
    },
    linguist: {
      name: "GitHub Linguist (Language stats overrides)",
      desc: "Prevents vendor and generated bundles from skewing repository language stats.",
      content: "# GitHub Linguist Overrides\nvendor/* linguist-vendored\ndist/* linguist-generated\n*.min.js linguist-generated\n*.min.css linguist-generated\n*.bundle.js linguist-generated\npackage-lock.json linguist-generated\nyarn.lock linguist-generated\npnpm-lock.yaml linguist-generated"
    },
    binary_diff: {
      name: "Treat as Binary (No text diffs)",
      desc: "Prevents Git from attempting text-based merges on image files.",
      content: "# Treat images as binary\n*.png binary\n*.jpg binary\n*.jpeg binary\n*.gif binary\n*.ico binary\n*.webp binary\n*.woff binary\n*.woff2 binary\n*.ttf binary\n*.eot binary"
    }
  };

  var ignoreSelected = {
    macos: true,
    windows: true,
    vscode: true,
    node: true,
    env: true,
    logs: true
  };

  var attributesSelected = {
    line_endings: true,
    linguist: true
  };

  var ignoreCustomText = "";
  var ignoreSubTab = "gitignore"; // "gitignore" | "gitattributes"

  function buildGitignoreContent() {
    var sections = [];
    sections.push("# Generated by GitAtlas — https://git-atlas-project.vercel.app\n# Fast, safe .gitignore configuration\n");

    var keys = Object.keys(IGNORE_RULES);
    keys.forEach(function (k) {
      if (ignoreSelected[k]) {
        sections.push(IGNORE_RULES[k].content);
      }
    });

    if (ignoreCustomText.trim()) {
      sections.push("# Custom project rules\n" + ignoreCustomText.trim());
    }

    return sections.join("\n\n") + "\n";
  }

  function buildGitattributesContent() {
    var sections = [];
    sections.push("# Generated by GitAtlas — https://git-atlas-project.vercel.app\n# Standard .gitattributes configuration\n");

    var keys = Object.keys(ATTRIBUTES_PRESETS);
    keys.forEach(function (k) {
      if (attributesSelected[k]) {
        sections.push(ATTRIBUTES_PRESETS[k].content);
      }
    });

    return sections.join("\n\n") + "\n";
  }

  function updateIgnorePreview() {
    var preview = el("ignorePreviewCode");
    if (!preview) return;

    if (ignoreSubTab === "gitignore") {
      preview.textContent = buildGitignoreContent();
    } else {
      preview.textContent = buildGitattributesContent();
    }
  }

  function renderIgnoreCheckboxes() {
    var wrap = el("ignoreCheckboxesWrap");
    if (!wrap) return;

    var categories = {};
    Object.keys(IGNORE_RULES).forEach(function (k) {
      var cat = IGNORE_RULES[k].category;
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({ key: k, item: IGNORE_RULES[k] });
    });

    var html = "";
    Object.keys(categories).forEach(function (cat) {
      html += '<div class="studio-ignore-group">' +
                '<h4 class="studio-ignore-cat-title">' + esc(cat) + '</h4>' +
                '<div class="studio-check-grid">';
      categories[cat].forEach(function (obj) {
        var checked = ignoreSelected[obj.key] ? " checked" : "";
        html += '<label class="studio-checkbox-label">' +
                  '<input type="checkbox" data-ignore-key="' + obj.key + '"' + checked + '> ' +
                  '<span>' + esc(obj.item.name) + '</span>' +
                '</label>';
      });
      html += '</div></div>';
    });
    wrap.innerHTML = html;
  }

  function renderAttributesCheckboxes() {
    var wrap = el("attributesCheckboxesWrap");
    if (!wrap) return;

    var html = '<div class="studio-ignore-group">' +
                 '<h4 class="studio-ignore-cat-title">Attributes Presets</h4>' +
                 '<div class="studio-check-grid-vertical">';
    Object.keys(ATTRIBUTES_PRESETS).forEach(function (k) {
      var item = ATTRIBUTES_PRESETS[k];
      var checked = attributesSelected[k] ? " checked" : "";
      html += '<label class="studio-checkbox-card">' +
                '<input type="checkbox" data-attr-key="' + k + '"' + checked + '> ' +
                '<div>' +
                  '<b>' + esc(item.name) + '</b>' +
                  '<p>' + esc(item.desc) + '</p>' +
                '</div>' +
              '</label>';
    });
    html += '</div></div>';
    wrap.innerHTML = html;
  }

  function initIgnoreGenerator() {
    var root = el("tool-ignore");
    if (!root) return;

    renderIgnoreCheckboxes();
    renderAttributesCheckboxes();
    updateIgnorePreview();

    root.addEventListener("click", function (ev) {
      var subTabBtn = ev.target.closest("[data-ignore-subtab]");
      if (subTabBtn) {
        root.querySelectorAll("[data-ignore-subtab]").forEach(function (b) { b.classList.remove("active"); });
        subTabBtn.classList.add("active");
        ignoreSubTab = subTabBtn.getAttribute("data-ignore-subtab");

        var gitignoreControls = el("gitignoreControls");
        var gitattributesControls = el("gitattributesControls");
        if (gitignoreControls) gitignoreControls.hidden = (ignoreSubTab !== "gitignore");
        if (gitattributesControls) gitattributesControls.hidden = (ignoreSubTab !== "gitattributes");

        var downloadBtn = el("ignoreDownloadBtn");
        if (downloadBtn) {
          downloadBtn.textContent = ignoreSubTab === "gitignore" ? "Download .gitignore" : "Download .gitattributes";
        }
        updateIgnorePreview();
        return;
      }

      var presetBtn = ev.target.closest("[data-ignore-preset]");
      if (presetBtn) {
        var p = presetBtn.getAttribute("data-ignore-preset");
        if (p === "web") {
          ignoreSelected = { macos: true, windows: true, vscode: true, node: true, env: true, logs: true };
        } else if (p === "python") {
          ignoreSelected = { macos: true, windows: true, vscode: true, jetbrains: true, python: true, env: true, logs: true };
        } else if (p === "all-common") {
          Object.keys(IGNORE_RULES).forEach(function (k) { ignoreSelected[k] = true; });
        } else if (p === "clear") {
          ignoreSelected = {};
        }
        renderIgnoreCheckboxes();
        updateIgnorePreview();
        track("tool_ignore_preset", { preset: p });
        return;
      }

      var copyBtn = ev.target.closest("#ignoreCopyBtn");
      if (copyBtn) {
        var text = (ignoreSubTab === "gitignore") ? buildGitignoreContent() : buildGitattributesContent();
        copyText(text).then(function () {
          flash(copyBtn);
          toast(ignoreSubTab === "gitignore" ? "Copied .gitignore" : "Copied .gitattributes");
          track("tool_copied", { tool: ignoreSubTab });
        }).catch(function () { toast("Could not copy — select text manually"); });
        return;
      }

      var dlBtn = ev.target.closest("#ignoreDownloadBtn");
      if (dlBtn) {
        if (ignoreSubTab === "gitignore") {
          downloadFile(".gitignore", buildGitignoreContent());
          toast("Downloaded .gitignore");
        } else {
          downloadFile(".gitattributes", buildGitattributesContent());
          toast("Downloaded .gitattributes");
        }
        track("tool_downloaded", { tool: ignoreSubTab });
      }
    });

    root.addEventListener("change", function (ev) {
      var igCheck = ev.target.closest("[data-ignore-key]");
      if (igCheck) {
        var key = igCheck.getAttribute("data-ignore-key");
        ignoreSelected[key] = igCheck.checked;
        updateIgnorePreview();
        return;
      }

      var attrCheck = ev.target.closest("[data-attr-key]");
      if (attrCheck) {
        var attrKey = attrCheck.getAttribute("data-attr-key");
        attributesSelected[attrKey] = attrCheck.checked;
        updateIgnorePreview();
      }
    });

    var customIn = el("ignoreCustomRules");
    if (customIn) {
      customIn.addEventListener("input", function () {
        ignoreCustomText = this.value;
        updateIgnorePreview();
      });
    }
  }

  /* =========================================================
     TOOL 4: Conventional Commit & PR Composer
     ========================================================= */

  var COMMIT_TYPES = [
    { type: "feat", label: "feat: A new feature", icon: "✨" },
    { type: "fix", label: "fix: A bug fix", icon: "🐛" },
    { type: "docs", label: "docs: Documentation changes", icon: "📚" },
    { type: "style", label: "style: Formatting / whitespace", icon: "🎨" },
    { type: "refactor", label: "refactor: Code restructuring", icon: "♻️" },
    { type: "perf", label: "perf: Performance improvement", icon: "⚡" },
    { type: "test", label: "test: Adding or fixing tests", icon: "🧪" },
    { type: "build", label: "build: Build system / dependencies", icon: "📦" },
    { type: "ci", label: "ci: CI/CD configuration", icon: "⚙️" },
    { type: "chore", label: "chore: Maintenance tasks", icon: "🔧" },
    { type: "revert", label: "revert: Reverting a commit", icon: "⏪" }
  ];

  var commitState = {
    subTab: "commit", // "commit" | "pr"
    type: "feat",
    scope: "",
    breaking: false,
    desc: "add user avatar upload endpoint",
    body: "",
    breakingBody: "",
    issue: "Closes #42",
    // PR Specific
    prTitle: "",
    prSummary: "Adds profile avatar uploads with S3 storage and image resizing.",
    prMotivation: "Users currently cannot personalize their profile pictures.",
    prBugFix: false,
    prNewFeat: true,
    prBreakingChange: false,
    prTests: "Unit tests added for upload service; manual verification on staging."
  };

  function buildCommitHeader() {
    var header = commitState.type;
    if (commitState.scope.trim()) header += "(" + commitState.scope.trim().toLowerCase() + ")";
    if (commitState.breaking) header += "!";
    header += ": " + (commitState.desc.trim() || "describe your change");
    return header;
  }

  function buildRawCommitMessage() {
    var lines = [buildCommitHeader()];

    if (commitState.body.trim()) {
      lines.push("");
      lines.push(commitState.body.trim());
    }

    if (commitState.breaking && commitState.breakingBody.trim()) {
      lines.push("");
      lines.push("BREAKING CHANGE: " + commitState.breakingBody.trim());
    }

    if (commitState.issue.trim()) {
      lines.push("");
      lines.push(commitState.issue.trim());
    }

    return lines.join("\n");
  }

  function buildGitCommitCommand() {
    var header = buildCommitHeader();
    var cmdParts = ['git commit -m "' + header.replace(/"/g, '\\"') + '"'];

    if (commitState.body.trim()) {
      cmdParts.push('-m "' + commitState.body.trim().replace(/"/g, '\\"') + '"');
    }

    if (commitState.breaking && commitState.breakingBody.trim()) {
      cmdParts.push('-m "BREAKING CHANGE: ' + commitState.breakingBody.trim().replace(/"/g, '\\"') + '"');
    }

    if (commitState.issue.trim()) {
      cmdParts.push('-m "' + commitState.issue.trim().replace(/"/g, '\\"') + '"');
    }

    return cmdParts.join(" ");
  }

  function buildPRMarkdown() {
    var title = commitState.prTitle.trim() || buildCommitHeader();
    var md = [];

    md.push("## Summary");
    md.push(commitState.prSummary.trim() || "Brief description of changes.");
    md.push("");

    md.push("## Motivation & Context");
    md.push(commitState.prMotivation.trim() || "Why is this change required? What problem does it solve?");
    md.push("");

    md.push("## Type of Change");
    md.push("- [" + (commitState.prBugFix ? "x" : " ") + "] 🐛 Bug fix");
    md.push("- [" + (commitState.prNewFeat ? "x" : " ") + "] ✨ New feature");
    md.push("- [" + (commitState.prBreakingChange ? "x" : " ") + "] 💥 Breaking change");
    md.push("");

    md.push("## How Has This Been Tested?");
    md.push(commitState.prTests.trim() || "Describe the tests that you ran to verify your changes.");
    md.push("");

    if (commitState.issue.trim()) {
      md.push("## Related Issues");
      md.push(commitState.issue.trim());
    }

    return md.join("\n");
  }

  function buildGhPrCommand() {
    var title = commitState.prTitle.trim() || buildCommitHeader();
    var body = buildPRMarkdown();
    return 'gh pr create --title "' + title.replace(/"/g, '\\"') + '" --body "' + body.replace(/"/g, '\\"') + '"';
  }

  function updateCommitComposerUI() {
    var codeEl = el("commitOutputCode");
    if (codeEl) {
      if (commitState.subTab === "commit") {
        codeEl.textContent = buildGitCommitCommand();
      } else {
        codeEl.textContent = buildGhPrCommand();
      }
    }

    var rawEl = el("commitRawMessage");
    if (rawEl) {
      rawEl.textContent = (commitState.subTab === "commit") ? buildRawCommitMessage() : buildPRMarkdown();
    }
  }

  function renderCommitTypes() {
    var select = el("commitTypeSelect");
    if (!select) return;
    select.innerHTML = COMMIT_TYPES.map(function (t) {
      var sel = (t.type === commitState.type) ? " selected" : "";
      return '<option value="' + t.type + '"' + sel + '>' + esc(t.label) + '</option>';
    }).join("");
  }

  function initCommitComposer() {
    var root = el("tool-commit");
    if (!root) return;

    renderCommitTypes();
    updateCommitComposerUI();

    root.addEventListener("click", function (ev) {
      var subTabBtn = ev.target.closest("[data-composer-subtab]");
      if (subTabBtn) {
        root.querySelectorAll("[data-composer-subtab]").forEach(function (b) { b.classList.remove("active"); });
        subTabBtn.classList.add("active");
        commitState.subTab = subTabBtn.getAttribute("data-composer-subtab");

        var commitForm = el("commitFormWrap");
        var prForm = el("prFormWrap");
        if (commitForm) commitForm.hidden = (commitState.subTab !== "commit");
        if (prForm) prForm.hidden = (commitState.subTab !== "pr");

        updateCommitComposerUI();
        track("tool_composer_subtab", { subtab: commitState.subTab });
        return;
      }

      var copyCmdBtn = ev.target.closest("#commitCopyCmdBtn");
      if (copyCmdBtn) {
        var cmd = (commitState.subTab === "commit") ? buildGitCommitCommand() : buildGhPrCommand();
        copyText(cmd).then(function () {
          flash(copyCmdBtn);
          toast(commitState.subTab === "commit" ? "Copied git commit command" : "Copied gh pr create command");
          track("tool_copied", { tool: commitState.subTab === "commit" ? "commit_cmd" : "pr_cmd" });
        }).catch(function () { toast("Could not copy — select text manually"); });
        return;
      }

      var copyRawBtn = ev.target.closest("#commitCopyRawBtn");
      if (copyRawBtn) {
        var rawText = (commitState.subTab === "commit") ? buildRawCommitMessage() : buildPRMarkdown();
        copyText(rawText).then(function () {
          flash(copyRawBtn);
          toast(commitState.subTab === "commit" ? "Copied raw message" : "Copied PR markdown");
          track("tool_copied", { tool: "raw_message" });
        }).catch(function () { toast("Could not copy — select text manually"); });
      }
    });

    var typeSelect = el("commitTypeSelect");
    if (typeSelect) {
      typeSelect.addEventListener("change", function () {
        commitState.type = this.value;
        updateCommitComposerUI();
      });
    }

    var scopeIn = el("commitScope");
    if (scopeIn) scopeIn.addEventListener("input", function () { commitState.scope = this.value; updateCommitComposerUI(); });

    var descIn = el("commitDesc");
    if (descIn) descIn.addEventListener("input", function () { commitState.desc = this.value; updateCommitComposerUI(); });

    var bodyIn = el("commitBody");
    if (bodyIn) bodyIn.addEventListener("input", function () { commitState.body = this.value; updateCommitComposerUI(); });

    var issueIn = el("commitIssue");
    if (issueIn) issueIn.addEventListener("input", function () { commitState.issue = this.value; updateCommitComposerUI(); });

    var breakingCheck = el("commitBreaking");
    if (breakingCheck) {
      breakingCheck.addEventListener("change", function () {
        commitState.breaking = this.checked;
        commitState.prBreakingChange = this.checked;
        var bWrap = el("commitBreakingWrap");
        if (bWrap) bWrap.hidden = !this.checked;
        updateCommitComposerUI();
      });
    }

    var breakingBodyIn = el("commitBreakingBody");
    if (breakingBodyIn) {
      breakingBodyIn.addEventListener("input", function () {
        commitState.breakingBody = this.value;
        updateCommitComposerUI();
      });
    }

    // PR Inputs
    var prTitleIn = el("prTitleInput");
    if (prTitleIn) prTitleIn.addEventListener("input", function () { commitState.prTitle = this.value; updateCommitComposerUI(); });

    var prSummaryIn = el("prSummaryInput");
    if (prSummaryIn) prSummaryIn.addEventListener("input", function () { commitState.prSummary = this.value; updateCommitComposerUI(); });

    var prMotivIn = el("prMotivationInput");
    if (prMotivIn) prMotivIn.addEventListener("input", function () { commitState.prMotivation = this.value; updateCommitComposerUI(); });

    var prTestsIn = el("prTestsInput");
    if (prTestsIn) prTestsIn.addEventListener("input", function () { commitState.prTests = this.value; updateCommitComposerUI(); });

    var prBugFix = el("prBugFixCheck");
    if (prBugFix) prBugFix.addEventListener("change", function () { commitState.prBugFix = this.checked; updateCommitComposerUI(); });

    var prNewFeat = el("prNewFeatCheck");
    if (prNewFeat) prNewFeat.addEventListener("change", function () { commitState.prNewFeat = this.checked; updateCommitComposerUI(); });
  }

  /* =========================================================
     MAIN TAB SWITCHER & HASH ROUTING
     ========================================================= */

  function switchMainTool(toolId) {
    var tabs = document.querySelectorAll(".studio-tab-btn");
    var panels = document.querySelectorAll(".studio-panel");

    tabs.forEach(function (t) {
      var active = (t.getAttribute("data-tool-tab") === toolId);
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", String(active));
    });

    panels.forEach(function (p) {
      var active = (p.id === "tool-" + toolId);
      p.classList.toggle("active", active);
      p.hidden = !active;
    });

    track("studio_tab_switched", { tool: toolId });
  }

  function initStudio() {
    var section = el("builders");
    if (!section) return;

    var tabsBar = el("studioTabsBar");
    if (tabsBar) {
      tabsBar.addEventListener("click", function (ev) {
        var tabBtn = ev.target.closest("[data-tool-tab]");
        if (tabBtn) {
          var toolId = tabBtn.getAttribute("data-tool-tab");
          switchMainTool(toolId);
          try { history.replaceState(null, "", "#tool-" + toolId); } catch (e) { /* ignore */ }
        }
      });
    }

    initLogBuilder();
    initUndoSimulator();
    initIgnoreGenerator();
    initCommitComposer();

    // Check hash for direct tool deep-linking
    if (location.hash) {
      var h = location.hash.slice(1);
      if (h.indexOf("tool-") === 0) {
        var targetTool = h.replace("tool-", "");
        if (["log", "undo", "ignore", "commit"].indexOf(targetTool) !== -1) {
          switchMainTool(targetTool);
        }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStudio);
  } else {
    initStudio();
  }

})();
