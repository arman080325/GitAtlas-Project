/* =========================================================
   GitAtlas — toolkit.js
   Developer Personalization & Local Toolkit
   - Starred / Pinned Commands (localStorage)
   - Custom Alias & Snippet Vault with JSON Backup (localStorage)
   - Recent Copy History Tray (sessionStorage)
   - Curated .gitconfig Shortcut Exporter
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
    t._timer = setTimeout(function () { t.classList.remove("show"); }, 2200);
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

  var ICONS = {
    starOutline: '<svg class="star-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25zm0 2.245L6.687 5.163a.75.75 0 0 1-.564.41l-3.328.483 2.408 2.347a.75.75 0 0 1 .216.664l-.568 3.313 2.977-1.564a.75.75 0 0 1 .698 0l2.978 1.564-.569-3.314a.75.75 0 0 1 .216-.664l2.409-2.347-3.328-.484a.75.75 0 0 1-.564-.41L8 2.495z" fill="currentColor"/></svg>',
    starFilled: '<svg class="star-icon star-filled" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" fill="currentColor"/></svg>',
    sheet: '<svg class="sheet" viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="1.5" width="9" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 14.5h-8a1 1 0 0 1-1-1v-9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    tick: '<svg class="tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8.5 6 12l7.5-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trash: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5h11M5.5 3.5v-1a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1M6 6.5v5M10 6.5v5M3.5 3.5l.8 9.5a1.5 1.5 0 0 0 1.5 1.5h4.4a1.5 1.5 0 0 0 1.5-1.5l.8-9.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    edit: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  };

  /* =========================================================
     1. STARRED / FAVORITES MANAGER
     ========================================================= */

  var starredRefs = [];

  function loadStarred() {
    try {
      var raw = localStorage.getItem("gitatlas-starred");
      starredRefs = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(starredRefs)) starredRefs = [];
    } catch (e) {
      starredRefs = [];
    }
  }

  function saveStarred() {
    try {
      localStorage.setItem("gitatlas-starred", JSON.stringify(starredRefs));
    } catch (e) { /* ignore */ }
    updateStarUI();
  }

  function isStarred(ref) {
    return starredRefs.indexOf(ref) !== -1;
  }

  function toggleStar(ref) {
    var idx = starredRefs.indexOf(ref);
    if (idx === -1) {
      starredRefs.push(ref);
      toast("Saved to favorites");
      track("command_starred", { ref: ref });
    } else {
      starredRefs.splice(idx, 1);
      toast("Removed from favorites");
      track("command_unstarred", { ref: ref });
    }
    saveStarred();
    return isStarred(ref);
  }

  function getCommandByRef(ref) {
    if (typeof ATLAS === "undefined") return null;
    var parts = ref.split(":");
    var ci = parseInt(parts[0], 10);
    var xi = parseInt(parts[1], 10);
    if (ATLAS[ci] && ATLAS[ci].commands && ATLAS[ci].commands[xi]) {
      return {
        cat: ATLAS[ci],
        cmd: ATLAS[ci].commands[xi],
        ref: ref
      };
    }
    return null;
  }

  function updateStarUI() {
    // Update all star buttons on cards across the page
    document.querySelectorAll("[data-star]").forEach(function (btn) {
      var ref = btn.getAttribute("data-star");
      var active = isStarred(ref);
      btn.classList.toggle("starred", active);
      btn.innerHTML = active ? ICONS.starFilled : ICONS.starOutline;
      btn.setAttribute("aria-label", active ? "Remove from favorites" : "Save to favorites");
      btn.setAttribute("title", active ? "Remove from favorites" : "Save to favorites");
    });

    // Update topbar badges
    var badge = el("toolkitBadge");
    if (badge) {
      badge.textContent = starredRefs.length;
      badge.hidden = (starredRefs.length === 0);
    }

    renderPinnedSection();
    renderDrawerFavorites();
  }

  function renderPinnedSection() {
    var container = el("pinnedSection");
    if (!container) return;

    if (starredRefs.length === 0) {
      container.innerHTML = "";
      container.hidden = true;
      return;
    }

    container.hidden = false;
    var itemsHtml = starredRefs.map(function (ref) {
      var item = getCommandByRef(ref);
      if (!item) return "";
      var c = item.cmd;
      return '<div class="pinned-card" data-ref="' + ref + '">' +
               '<div class="pinned-card-head">' +
                 '<span class="pinned-cat-tag">' + esc(item.cat.label) + '</span>' +
                 '<div class="pinned-actions">' +
                   '<button type="button" class="copy-btn" data-copy="' + ref + '" aria-label="Copy command">' +
                     ICONS.sheet + ICONS.tick + '<span>Copy</span>' +
                   '</button>' +
                   '<button type="button" class="pinned-unpin-btn" data-star="' + ref + '" aria-label="Unpin from favorites" title="Unpin">' +
                     '&times;' +
                   '</button>' +
                 '</div>' +
               '</div>' +
               '<div class="pinned-cmd"><code>' + esc(c.c) + '</code></div>' +
               '<p class="pinned-desc">' + esc(c.d) + '</p>' +
             '</div>';
    }).join("");

    container.innerHTML =
      '<div class="pinned-banner">' +
        '<div class="pinned-header">' +
          '<div class="pinned-title-group">' +
            '<span class="pinned-icon">⭐</span>' +
            '<h3 class="pinned-title">Pinned Favorites</h3>' +
            '<span class="pinned-count">' + starredRefs.length + '</span>' +
          '</div>' +
          '<button type="button" class="text-btn" id="openToolkitDrawerBtn">Manage in Toolkit &rarr;</button>' +
        '</div>' +
        '<div class="pinned-grid">' + itemsHtml + '</div>' +
      '</div>';
  }

  function renderDrawerFavorites() {
    var listEl = el("drawerFavoritesList");
    if (!listEl) return;

    if (starredRefs.length === 0) {
      listEl.innerHTML = '<div class="toolkit-empty">' +
                           '<p class="toolkit-empty-icon">⭐</p>' +
                           '<p class="toolkit-empty-title">No pinned commands yet</p>' +
                           '<p class="toolkit-empty-desc">Click the star button (☆) on any command card in GitAtlas to pin your favorite shortcuts here.</p>' +
                         '</div>';
      return;
    }

    listEl.innerHTML = starredRefs.map(function (ref) {
      var item = getCommandByRef(ref);
      if (!item) return "";
      var c = item.cmd;
      return '<div class="toolkit-item-card">' +
               '<div class="toolkit-item-head">' +
                 '<span class="toolkit-item-tag">' + esc(item.cat.label) + '</span>' +
                 '<div class="toolkit-item-btns">' +
                   '<button type="button" class="mini-copy" data-toolkit-copy="' + esc(c.c) + '">Copy</button>' +
                   '<button type="button" class="text-btn" data-star="' + ref + '">Unpin</button>' +
                 '</div>' +
               '</div>' +
               '<pre class="toolkit-item-code"><code>' + esc(c.c) + '</code></pre>' +
               '<p class="toolkit-item-desc">' + esc(c.d) + '</p>' +
             '</div>';
    }).join("");
  }

  /* =========================================================
     2. CUSTOM ALIAS & SNIPPET VAULT
     ========================================================= */

  var vaultEntries = [];

  function loadVault() {
    try {
      var raw = localStorage.getItem("gitatlas-vault");
      vaultEntries = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(vaultEntries)) vaultEntries = [];
    } catch (e) {
      vaultEntries = [];
    }
  }

  function saveVault() {
    try {
      localStorage.setItem("gitatlas-vault", JSON.stringify(vaultEntries));
    } catch (e) { /* ignore */ }
    renderVault();
  }

  function renderVault() {
    var listEl = el("vaultList");
    if (!listEl) return;

    var countBadge = el("vaultCountBadge");
    if (countBadge) countBadge.textContent = vaultEntries.length;

    if (vaultEntries.length === 0) {
      listEl.innerHTML = '<div class="toolkit-empty">' +
                           '<p class="toolkit-empty-icon">📦</p>' +
                           '<p class="toolkit-empty-title">Your vault is empty</p>' +
                           '<p class="toolkit-empty-desc">Save your own custom team commands, complex multi-line Git scripts, or personal aliases below.</p>' +
                         '</div>';
      return;
    }

    listEl.innerHTML = vaultEntries.map(function (entry, i) {
      return '<div class="toolkit-item-card" data-vault-idx="' + i + '">' +
               '<div class="toolkit-item-head">' +
                 '<b>' + esc(entry.title) + '</b>' +
                 '<div class="toolkit-item-btns">' +
                   '<button type="button" class="mini-copy" data-toolkit-copy="' + esc(entry.cmd) + '">Copy</button>' +
                   '<button type="button" class="toolkit-icon-btn" data-vault-edit="' + i + '" title="Edit snippet">' + ICONS.edit + '</button>' +
                   '<button type="button" class="toolkit-icon-btn" data-vault-delete="' + i + '" title="Delete snippet">' + ICONS.trash + '</button>' +
                 '</div>' +
               '</div>' +
               '<pre class="toolkit-item-code"><code>' + esc(entry.cmd) + '</code></pre>' +
               (entry.desc ? '<p class="toolkit-item-desc">' + esc(entry.desc) + '</p>' : '') +
             '</div>';
    }).join("");
  }

  function exportVault() {
    var data = JSON.stringify({
      gitatlas_vault_version: 1,
      exported_at: new Date().toISOString(),
      starred: starredRefs,
      vault: vaultEntries
    }, null, 2);
    downloadFile("gitatlas-toolkit-backup.json", data);
    toast("Exported toolkit backup (JSON)");
    track("toolkit_backup_exported", { items: vaultEntries.length });
  }

  function importVault(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var parsed = JSON.parse(e.target.result);
        if (parsed.vault && Array.isArray(parsed.vault)) {
          vaultEntries = parsed.vault;
          saveVault();
        }
        if (parsed.starred && Array.isArray(parsed.starred)) {
          starredRefs = parsed.starred;
          saveStarred();
        }
        toast("Toolkit imported successfully");
        track("toolkit_backup_imported", { items: vaultEntries.length });
      } catch (err) {
        toast("Error reading backup file — invalid JSON");
      }
    };
    reader.readAsText(file);
  }

  /* =========================================================
     3. RECENT COPY HISTORY
     ========================================================= */

  var copyHistory = [];

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem("gitatlas-copy-history");
      copyHistory = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(copyHistory)) copyHistory = [];
    } catch (e) {
      copyHistory = [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem("gitatlas-copy-history", JSON.stringify(copyHistory));
    } catch (e) { /* ignore */ }
    renderHistory();
  }

  function timeAgo(dateIso) {
    var diffMs = Date.now() - new Date(dateIso).getTime();
    var sec = Math.floor(diffMs / 1000);
    if (sec < 5) return "just now";
    if (sec < 60) return sec + "s ago";
    var min = Math.floor(sec / 60);
    if (min < 60) return min + "m ago";
    var hr = Math.floor(min / 60);
    return hr + "h ago";
  }

  function recordCopy(cmd, label) {
    if (!cmd || !cmd.trim()) return;
    cmd = cmd.trim();

    // Prevent immediate duplicate
    if (copyHistory.length && copyHistory[0].cmd === cmd) {
      copyHistory[0].time = new Date().toISOString();
      saveHistory();
      return;
    }

    copyHistory.unshift({
      cmd: cmd,
      label: label || "Command",
      time: new Date().toISOString()
    });

    if (copyHistory.length > 15) {
      copyHistory = copyHistory.slice(0, 15);
    }
    saveHistory();
  }

  function renderHistory() {
    var listEl = el("historyList");
    if (!listEl) return;

    var countBadge = el("historyCountBadge");
    if (countBadge) countBadge.textContent = copyHistory.length;

    if (copyHistory.length === 0) {
      listEl.innerHTML = '<div class="toolkit-empty">' +
                           '<p class="toolkit-empty-icon">🕒</p>' +
                           '<p class="toolkit-empty-title">No recent copies</p>' +
                           '<p class="toolkit-empty-desc">Any command you copy in GitAtlas will automatically appear here for easy re-copying.</p>' +
                         '</div>';
      return;
    }

    listEl.innerHTML = copyHistory.map(function (item, i) {
      return '<div class="toolkit-history-item">' +
               '<div class="toolkit-history-head">' +
                 '<span class="toolkit-history-time">' + timeAgo(item.time) + '</span>' +
                 '<button type="button" class="mini-copy" data-toolkit-copy="' + esc(item.cmd) + '">Re-copy</button>' +
               '</div>' +
               '<pre class="toolkit-history-code"><code>' + esc(item.cmd) + '</code></pre>' +
             '</div>';
    }).join("");
  }

  /* =========================================================
     4. CURATED .gitconfig ALIAS EXPORTER
     ========================================================= */

  var GITCONFIG_ALIASES = [
    {
      name: "lg",
      desc: "Pretty colored commit graph with relative dates & author tags",
      val: "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit --date=relative"
    },
    {
      name: "uncommit",
      desc: "Undo the last commit keeping all modified files staged in index",
      val: "reset --soft HEAD~1"
    },
    {
      name: "discard",
      desc: "Nuke and discard all uncommitted modifications across the repo",
      val: "restore --staged --worktree ."
    },
    {
      name: "standup",
      desc: "List all commits authored by you since yesterday for daily standup",
      val: '!git log --since="yesterday" --author="$(git config user.name)" --pretty=format:"%Cred%h%Creset %s (%cr)"'
    },
    {
      name: "amend",
      desc: "Merge staged files into the previous commit without changing message",
      val: "commit --amend --no-edit"
    },
    {
      name: "cleanup",
      desc: "Delete all local branches that have already been merged into current",
      val: "!git branch --merged | grep -v '\\*' | xargs -n 1 git branch -d"
    },
    {
      name: "wip",
      desc: "Quickly commit all current changes as WIP without prompt",
      val: "!git add -A && git commit -m 'wip'"
    },
    {
      name: "unwip",
      desc: "Undo the WIP commit and put changes back into working tree",
      val: "reset HEAD~1"
    },
    {
      name: "sync",
      desc: "Pull remote changes with rebase and push current branch cleanly",
      val: "!git pull --rebase && git push"
    },
    {
      name: "branches",
      desc: "Show detailed list of branches with upstream tracking status",
      val: "branch -vv"
    },
    {
      name: "last",
      desc: "Inspect full details and diff of the most recent commit",
      val: "log -1 HEAD --stat -p"
    }
  ];

  var aliasSelected = {
    lg: true,
    uncommit: true,
    discard: true,
    standup: true,
    amend: true,
    cleanup: true,
    sync: true,
    branches: true
  };

  function buildGitconfigSnippet() {
    var lines = [
      "# ========================================================",
      "# GitAtlas Curated Aliases",
      "# Place in your ~/.gitconfig or run: git config --global alias.<name> '<command>'",
      "# ========================================================",
      "",
      "[alias]"
    ];

    GITCONFIG_ALIASES.forEach(function (item) {
      if (aliasSelected[item.name]) {
        lines.push("    " + item.name + " = " + item.val);
      }
    });

    return lines.join("\n") + "\n";
  }

  function renderGitconfigAliases() {
    var wrap = el("gitconfigCheckboxes");
    if (!wrap) return;

    wrap.innerHTML = GITCONFIG_ALIASES.map(function (item) {
      var checked = aliasSelected[item.name] ? " checked" : "";
      return '<label class="toolkit-alias-card">' +
               '<input type="checkbox" data-alias-name="' + esc(item.name) + '"' + checked + '> ' +
               '<div>' +
                 '<div class="toolkit-alias-name"><code>git ' + esc(item.name) + '</code></div>' +
                 '<p class="toolkit-alias-desc">' + esc(item.desc) + '</p>' +
               '</div>' +
             '</label>';
    }).join("");

    var preview = el("gitconfigPreviewCode");
    if (preview) preview.textContent = buildGitconfigSnippet();
  }

  /* =========================================================
     DRAWER CONTROLLER & TAB SWITCHING
     ========================================================= */

  function openDrawer(tabId) {
    var drawer = el("toolkitDrawer");
    var scrim = el("toolkitScrim");
    if (!drawer) return;

    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (scrim) scrim.hidden = false;

    if (tabId) switchDrawerTab(tabId);
    track("toolkit_drawer_opened", { tab: tabId || "favorites" });
  }

  function closeDrawer() {
    var drawer = el("toolkitDrawer");
    var scrim = el("toolkitScrim");
    if (!drawer) return;

    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    if (scrim) scrim.hidden = true;
  }

  function switchDrawerTab(tabId) {
    var tabs = document.querySelectorAll(".toolkit-tab-btn");
    var panels = document.querySelectorAll(".toolkit-tab-panel");

    tabs.forEach(function (t) {
      var active = (t.getAttribute("data-toolkit-tab") === tabId);
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", String(active));
    });

    panels.forEach(function (p) {
      var active = (p.id === "toolkit-tab-" + tabId);
      p.classList.toggle("active", active);
      p.hidden = !active;
    });
  }

  /* =========================================================
     INITIALIZATION & EVENT BINDINGS
     ========================================================= */

  function initToolkit() {
    loadStarred();
    loadVault();
    loadHistory();

    updateStarUI();
    renderVault();
    renderHistory();
    renderGitconfigAliases();

    // Topbar Toolkit Button
    var topbarBtn = el("toolkitBtn");
    if (topbarBtn) {
      topbarBtn.addEventListener("click", function () {
        openDrawer("favorites");
      });
    }

    // Scrim click to close
    var scrim = el("toolkitScrim");
    if (scrim) {
      scrim.addEventListener("click", closeDrawer);
    }

    // Close button
    var closeBtn = el("toolkitCloseBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeDrawer);
    }

    // Drawer Tabs
    var tabGroup = el("toolkitTabsGroup");
    if (tabGroup) {
      tabGroup.addEventListener("click", function (ev) {
        var tabBtn = ev.target.closest("[data-toolkit-tab]");
        if (tabBtn) {
          switchDrawerTab(tabBtn.getAttribute("data-toolkit-tab"));
        }
      });
    }

    // Pinned section banner "Manage in Toolkit"
    document.addEventListener("click", function (ev) {
      var manageBtn = ev.target.closest("#openToolkitDrawerBtn");
      if (manageBtn) {
        openDrawer("favorites");
        return;
      }

      var starBtn = ev.target.closest("[data-star]");
      if (starBtn) {
        var ref = starBtn.getAttribute("data-star");
        toggleStar(ref);
        return;
      }

      var copyBtn = ev.target.closest("[data-toolkit-copy]");
      if (copyBtn) {
        var text = copyBtn.getAttribute("data-toolkit-copy");
        copyText(text).then(function () {
          flash(copyBtn);
          toast("Copied command");
          recordCopy(text, "Toolkit");
        }).catch(function () { toast("Could not copy — select text manually"); });
        return;
      }

      // Vault deletion
      var delBtn = ev.target.closest("[data-vault-delete]");
      if (delBtn) {
        var delIdx = parseInt(delBtn.getAttribute("data-vault-delete"), 10);
        if (confirm("Delete this snippet from your vault?")) {
          vaultEntries.splice(delIdx, 1);
          saveVault();
          toast("Deleted snippet");
        }
        return;
      }

      // Vault edit
      var editBtn = ev.target.closest("[data-vault-edit]");
      if (editBtn) {
        var editIdx = parseInt(editBtn.getAttribute("data-vault-edit"), 10);
        var item = vaultEntries[editIdx];
        if (item) {
          el("vaultTitleIn").value = item.title;
          el("vaultCmdIn").value = item.cmd;
          el("vaultDescIn").value = item.desc || "";
          el("vaultEditingIdx").value = editIdx;
          el("vaultFormTitle").textContent = "Edit Snippet";
          el("vaultSubmitBtn").textContent = "Update Snippet";
          el("vaultCancelEditBtn").hidden = false;
          el("vaultFormWrap").scrollIntoView({ behavior: "smooth" });
        }
        return;
      }
    });

    // Vault Form Submission
    var vaultForm = el("vaultForm");
    if (vaultForm) {
      vaultForm.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var title = el("vaultTitleIn").value.trim();
        var cmd = el("vaultCmdIn").value.trim();
        var desc = el("vaultDescIn").value.trim();
        var editIdxVal = el("vaultEditingIdx").value;

        if (!title || !cmd) {
          toast("Please provide both a title and command");
          return;
        }

        if (editIdxVal !== "") {
          var editIdx = parseInt(editIdxVal, 10);
          vaultEntries[editIdx] = { title: title, cmd: cmd, desc: desc, updated_at: new Date().toISOString() };
          toast("Updated vault snippet");
        } else {
          vaultEntries.unshift({ title: title, cmd: cmd, desc: desc, created_at: new Date().toISOString() });
          toast("Saved snippet to vault");
        }

        saveVault();
        vaultForm.reset();
        el("vaultEditingIdx").value = "";
        el("vaultFormTitle").textContent = "Add Custom Snippet";
        el("vaultSubmitBtn").textContent = "Save to Vault";
        el("vaultCancelEditBtn").hidden = true;
      });
    }

    var cancelEditBtn = el("vaultCancelEditBtn");
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener("click", function () {
        vaultForm.reset();
        el("vaultEditingIdx").value = "";
        el("vaultFormTitle").textContent = "Add Custom Snippet";
        el("vaultSubmitBtn").textContent = "Save to Vault";
        cancelEditBtn.hidden = true;
      });
    }

    // Vault Export & Import
    var exportBtn = el("vaultExportBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", exportVault);
    }

    var importFileInput = el("vaultImportFile");
    if (importFileInput) {
      importFileInput.addEventListener("change", function (ev) {
        if (ev.target.files && ev.target.files[0]) {
          importVault(ev.target.files[0]);
          ev.target.value = "";
        }
      });
    }

    var importBtn = el("vaultImportBtn");
    if (importBtn && importFileInput) {
      importBtn.addEventListener("click", function () {
        importFileInput.click();
      });
    }

    // History Clear
    var clearHistoryBtn = el("clearHistoryBtn");
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener("click", function () {
        copyHistory = [];
        saveHistory();
        toast("Copy history cleared");
      });
    }

    // .gitconfig checkboxes & actions
    var gitconfigWrap = el("gitconfigCheckboxes");
    if (gitconfigWrap) {
      gitconfigWrap.addEventListener("change", function (ev) {
        var aliasCheck = ev.target.closest("[data-alias-name]");
        if (aliasCheck) {
          aliasSelected[aliasCheck.getAttribute("data-alias-name")] = aliasCheck.checked;
          var preview = el("gitconfigPreviewCode");
          if (preview) preview.textContent = buildGitconfigSnippet();
        }
      });
    }

    var copyGitconfigBtn = el("copyGitconfigBtn");
    if (copyGitconfigBtn) {
      copyGitconfigBtn.addEventListener("click", function () {
        var text = buildGitconfigSnippet();
        copyText(text).then(function () {
          flash(copyGitconfigBtn);
          toast("Copied .gitconfig snippet");
          recordCopy(text, ".gitconfig");
        }).catch(function () { toast("Could not copy — select text manually"); });
      });
    }

    var downloadGitconfigBtn = el("downloadGitconfigBtn");
    if (downloadGitconfigBtn) {
      downloadGitconfigBtn.addEventListener("click", function () {
        downloadFile(".gitconfig", buildGitconfigSnippet());
        toast("Downloaded .gitconfig");
        track("gitconfig_downloaded");
      });
    }

    // Keyboard shortcut: Alt+T or Escape
    document.addEventListener("keydown", function (ev) {
      if (ev.altKey && (ev.key === "t" || ev.key === "T")) {
        ev.preventDefault();
        var drawer = el("toolkitDrawer");
        if (drawer && drawer.classList.contains("open")) {
          closeDrawer();
        } else {
          openDrawer("favorites");
        }
      } else if (ev.key === "Escape") {
        var drawer = el("toolkitDrawer");
        if (drawer && drawer.classList.contains("open")) {
          closeDrawer();
        }
      }
    });
  }

  // Expose Toolkit to global window
  window.GitAtlasToolkit = {
    isStarred: isStarred,
    toggleStar: toggleStar,
    recordCopy: recordCopy,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    updateStarUI: updateStarUI
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToolkit);
  } else {
    initToolkit();
  }

})();
