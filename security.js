/**
 * GitAtlas — Git Security & Secret Leak Emergency Response Suite
 * 100% in-browser offline secret detection scanner, emergency purge playbooks,
 * pre-commit hook generator, and incident remediation checklist.
 */

(function () {
  'use strict';

  /* =========================================================
     Secret Signatures & Detection Patterns
     ========================================================= */
  var SECRET_PATTERNS = [
    {
      id: 'aws_key',
      name: 'AWS Access Key ID',
      severity: 'critical',
      regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
      desc: 'Amazon Web Services IAM access key identifier.',
      action: 'Revoke key in AWS IAM Console immediately. Attackers scan GitHub continuously for AWS keys to provision unauthorized compute.'
    },
    {
      id: 'aws_secret',
      name: 'AWS Secret Access Key',
      severity: 'critical',
      regex: /(?:aws_secret_access_key|aws_secret_key|secret_key|aws_access_secret_key)\s*[:=]\s*["']?([A-Za-z0-9\/+=]{40})["']?/gi,
      desc: 'Amazon Web Services IAM Secret Access Key.',
      action: 'Rotate and delete this secret key in AWS Security Credentials Console.'
    },
    {
      id: 'github_pat',
      name: 'GitHub Access Token',
      severity: 'critical',
      regex: /(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}|gho_[a-zA-Z0-9]{36}|ghu_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{36})/g,
      desc: 'GitHub Personal Access Token (Classic or Fine-Grained).',
      action: 'Revoke token in GitHub Settings > Developer Settings > Personal Access Tokens.'
    },
    {
      id: 'stripe_key',
      name: 'Stripe Secret API Key',
      severity: 'critical',
      regex: /(?:sk_live_[0-9a-zA-Z]{24,99}|rk_live_[0-9a-zA-Z]{24,99})/g,
      desc: 'Stripe Live Secret Key with charge and financial permissions.',
      action: 'Roll key immediately in Stripe Dashboard > Developers > API Keys.'
    },
    {
      id: 'openai_key',
      name: 'OpenAI / Anthropic API Key',
      severity: 'critical',
      regex: /(?:sk-proj-[a-zA-Z0-9-_]{48,160}|sk-[a-zA-Z0-9]{48}|sk-ant-api03-[a-zA-Z0-9-_]{90,120})/g,
      desc: 'LLM API secret token (OpenAI, Anthropic Claude).',
      action: 'Revoke token in OpenAI / Anthropic dashboard to prevent unauthorized billing consumption.'
    },
    {
      id: 'google_key',
      name: 'Google / Gemini API Key',
      severity: 'high',
      regex: /AIzaSy[0-9A-Za-z_-]{33}/g,
      desc: 'Google Cloud Platform or Gemini API Key.',
      action: 'Delete or restrict key in Google Cloud Console > Credentials.'
    },
    {
      id: 'private_key',
      name: 'Private SSH / RSA Key',
      severity: 'critical',
      regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/g,
      desc: 'Cryptographic private key (SSH, RSA, or SSL Certificate).',
      action: 'Remove public key from `~/.ssh/authorized_keys` or GitHub SSH keys and generate a new key pair (`ssh-keygen -t ed25519`).'
    },
    {
      id: 'database_uri',
      name: 'Database Connection String',
      severity: 'critical',
      regex: /(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis):\/\/[^:\s"']+:[^@\s"']+@[^/\s"']+\/[^\s"']+/gi,
      desc: 'Database connection URI containing username and plaintext password.',
      action: 'Change database user password in RDS, Atlas, Supabase, or self-hosted DB.'
    },
    {
      id: 'slack_webhook',
      name: 'Slack Webhook URL',
      severity: 'high',
      regex: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/g,
      desc: 'Slack Incoming Webhook URL.',
      action: 'Invalidate webhook in Slack App Settings > Incoming Webhooks.'
    },
    {
      id: 'jwt_secret',
      name: 'High-Entropy Secret in .env',
      severity: 'high',
      regex: /(?:API_KEY|SECRET_KEY|DATABASE_URL|ACCESS_TOKEN|PRIVATE_KEY|AUTH_SECRET|JWT_SECRET)\s*=\s*["']?([^'"\s]{12,})["']?/gi,
      desc: 'Sensitive environment variable assignment.',
      action: 'Ensure `.env` is added to `.gitignore` and rotate the secret value.'
    }
  ];

  /* =========================================================
     Sample Test Strings for Developers (Constructed dynamically to prevent false-positive push protection)
     ========================================================= */
  var SAMPLES = {
    aws: 'export AWS_ACCESS_KEY_ID="' + 'AKIA' + 'IOSFODNN7EXAMPLE"\nexport AWS_SECRET_ACCESS_KEY="' + 'wJalrXUtnFEMI/K7MDENG/bPxRfiCY' + 'EXAMPLEKEY"',
    github: 'const GITHUB_TOKEN = "' + 'ghp_' + 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789";\nconst headers = { Authorization: `Bearer ${GITHUB_TOKEN}` };',
    stripe: 'const stripe = require("stripe")("' + 'sk_live_' + '51AbCdEfGhIjKlMnOpQrStUvWxYz0123456789");',
    openai: 'OPENAI_API_KEY="' + 'sk-proj-' + 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567"\nCLAUDE_KEY="' + 'sk-ant-api03-' + 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12"',
    ssh: '-----BEGIN ' + 'OPENSSH PRIVATE KEY-----\n' + 'b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\nQyNTUxOQAAACD4K2x5Q1X7EXAMPLEKEYEXAMPLEKEYEXAMPLEKEYAAAA\n' + '-----END ' + 'OPENSSH PRIVATE KEY-----',
    database: 'DATABASE_URL="postgresql://postgres:p@ssw0rd123!@db.production.supabase.co:5432/main_db"'
  };

  /* =========================================================
     Pre-commit Hook Script Templates
     ========================================================= */
  var HOOK_SCRIPTS = {
    native: `#!/usr/bin/env bash
# GitAtlas Pre-Commit Secret Shield Hook
# Place in: .git/hooks/pre-commit and run: chmod +x .git/hooks/pre-commit

echo "🛡️  Running GitAtlas Pre-Commit Secret Shield..."

# 1. Block .env files
ENV_FILES=$(git diff --cached --name-only | grep -E '^(\.env|\.env\..*|.*\.pem|.*\.key|id_rsa)$')
if [ -n "$ENV_FILES" ]; then
  echo "❌ COMMIT BLOCKED: Attempting to commit secret file(s):"
  echo "$ENV_FILES"
  echo "💡 Add these to your .gitignore or run: git reset HEAD <file>"
  exit 1
fi

# 2. Scan staged content for secret signatures
STAGED_DIFF=$(git diff --cached)

# AWS Access Key
if echo "$STAGED_DIFF" | grep -qE '(AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}'; then
  echo "❌ COMMIT BLOCKED: Found potential AWS Access Key ID in staged diff!"
  exit 1
fi

# GitHub Token
if echo "$STAGED_DIFF" | grep -qE 'ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}'; then
  echo "❌ COMMIT BLOCKED: Found potential GitHub Personal Access Token in staged diff!"
  exit 1
fi

# Stripe Secret Key
if echo "$STAGED_DIFF" | grep -qE 'sk_live_[0-9a-zA-Z]{24}'; then
  echo "❌ COMMIT BLOCKED: Found potential Stripe Live Secret Key in staged diff!"
  exit 1
fi

# Private SSH Key
if echo "$STAGED_DIFF" | grep -qE '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'; then
  echo "❌ COMMIT BLOCKED: Found Private SSH / RSA cryptographic key in staged diff!"
  exit 1
fi

echo "✅ Secret Shield Check Passed: Clean staged diff."
exit 0
`,
    husky: `# 1. Install Husky & lint-staged (if not already installed):
npm install --save-dev husky lint-staged
npx husky init

# 2. Add secret scanning hook to .husky/pre-commit:
cat << 'EOF' > .husky/pre-commit
# Check for .env files
if git diff --cached --name-only | grep -qE '^\.env|\.pem$|\.key$|id_rsa$'; then
  echo "❌ COMMIT REJECTED: Leaked secret or .env file detected in staged files!"
  exit 1
fi
EOF
chmod +x .husky/pre-commit
`
  };

  /* =========================================================
     Emergency Purge Scenarios
     ========================================================= */
  var PURGE_SCENARIOS = {
    unpushed: {
      title: 'Case 1: Secret committed locally (NOT pushed yet)',
      risk: 'Safe (No remote history affected)',
      riskClass: 'good',
      steps: [
        {
          label: 'Step 1: Soft-reset the commit (keeps all your file edits intact)',
          cmd: 'git reset --soft HEAD~1',
          why: 'Moves HEAD back one commit. All file changes remain staged in your index.'
        },
        {
          label: 'Step 2: Unstage the secret file',
          cmd: 'git restore --staged .env path/to/secret_file.json',
          why: 'Removes the secret file from the staging area so it will not be committed.'
        },
        {
          label: 'Step 3: Add the secret file to .gitignore',
          cmd: 'echo ".env" >> .gitignore\n# or append specific secret path',
          why: 'Ensures Git will never track this file again in future commits.'
        },
        {
          label: 'Step 4: Re-commit your clean files',
          cmd: 'git add .gitignore\ngit commit -m "feat: clean commit without sensitive credentials"',
          why: 'Creates a clean commit that never contained the secret.'
        }
      ]
    },
    pushed: {
      title: 'Case 2: Secret PUSHED to remote repository (History Scrubbing)',
      risk: 'Destructive (Rewrites git history — notify team members)',
      riskClass: 'bad',
      steps: [
        {
          label: 'Step 1: CRITICAL — Invalidate the exposed secret immediately!',
          cmd: '# Go to your service dashboard (AWS / Stripe / GitHub / OpenAI) and revoke the token now.',
          why: 'Automated bots scan GitHub public commits in under 5 seconds. Revoking the token stops active exploitation.'
        },
        {
          label: 'Step 2: Install git-filter-repo (recommended by Git & GitHub)',
          cmd: 'pip install git-filter-repo',
          why: '`git-filter-repo` is faster, safer, and cleaner than legacy `git filter-branch`.'
        },
        {
          label: 'Step 3: Purge the file from all commits, branches, and tags',
          cmd: 'git filter-repo --invert-paths --path .env --path path/to/secret.key',
          why: 'Rewrites entire repository history to remove every trace of the specified file.'
        },
        {
          label: 'Step 4: Re-add remote origin (filter-repo clears remotes for safety)',
          cmd: 'git remote add origin https://github.com/username/repository.git',
          why: '`git-filter-repo` removes remotes to prevent accidental premature pushes.'
        },
        {
          label: 'Step 5: Force push the sanitized history to all remote branches',
          cmd: 'git push origin --force --all\ngit push origin --force --tags',
          why: 'Overwrites the remote branches with the cleaned, secret-free history.'
        }
      ]
    },
    untrack: {
      title: 'Case 3: Stop tracking an active file (Keep file locally on disk)',
      risk: 'Safe (Modifies repository tracking only)',
      riskClass: 'good',
      steps: [
        {
          label: 'Step 1: Untrack the file without deleting it from your computer',
          cmd: 'git rm --cached .env',
          why: 'Deletes the file from Git\'s index while keeping your local `.env` file untouched on your hard drive.'
        },
        {
          label: 'Step 2: Add the file to .gitignore',
          cmd: 'echo ".env" >> .gitignore',
          why: 'Prevents Git from detecting the file as an untracked change.'
        },
        {
          label: 'Step 3: Commit the removal',
          cmd: 'git add .gitignore\ngit commit -m "chore: stop tracking local environment secrets"',
          why: 'Records the removal in the repository history.'
        }
      ]
    }
  };

  /* =========================================================
     State & Checklist Storage
     ========================================================= */
  var CHECKLIST_STORAGE_KEY = 'gitatlas-security-checklist';

  function $(id) { return document.getElementById(id); }

  function escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function maskSecret(str) {
    if (!str || str.length <= 8) return '********';
    return str.substring(0, 4) + '••••••••••••' + str.substring(str.length - 4);
  }

  /* =========================================================
     Scanner Engine
     ========================================================= */
  function scanText(text) {
    if (!text || !text.trim()) return [];
    var results = [];
    var lines = text.split('\n');

    SECRET_PATTERNS.forEach(function (pattern) {
      // Test across full text
      var regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      var match;
      while ((match = regex.exec(text)) !== null) {
        var matchValue = match[1] || match[0];
        if (!matchValue || matchValue.length < 8) continue;

        // Determine line number
        var matchIndex = match.index;
        var lineNumber = text.substring(0, matchIndex).split('\n').length;
        var lineContent = lines[lineNumber - 1] || '';

        results.push({
          id: pattern.id,
          name: pattern.name,
          severity: pattern.severity,
          desc: pattern.desc,
          action: pattern.action,
          matchText: matchValue,
          maskedText: maskSecret(matchValue),
          line: lineNumber,
          lineSnippet: lineContent.trim()
        });

        if (!regex.global) break;
      }
    });

    return results;
  }

  function runScanner() {
    var inputEl = $('secScannerInput');
    var resultEl = $('secScanResults');
    var badgeEl = $('secScanBadge');
    if (!inputEl || !resultEl) return;

    var text = inputEl.value;
    if (!text.trim()) {
      resultEl.innerHTML = '<div class="sec-empty-state"><p>Paste a commit diff, code snippet, or <code>.env</code> file above to scan for leaked secrets.</p></div>';
      if (badgeEl) badgeEl.hidden = true;
      return;
    }

    var leaks = scanText(text);

    if (leaks.length === 0) {
      if (badgeEl) {
        badgeEl.textContent = '0 Leaks Found';
        badgeEl.className = 'sec-badge sec-badge-clean';
        badgeEl.hidden = false;
      }
      resultEl.innerHTML =
        '<div class="sec-clean-state">' +
          '<div class="sec-clean-icon">🛡️</div>' +
          '<h4 class="sec-clean-title">No Known Secrets Detected</h4>' +
          '<p class="sec-clean-desc">Scanned against AWS, GitHub, Stripe, OpenAI, Claude, SSH keys, Database URLs, and high-entropy patterns. 100% evaluated offline in your browser.</p>' +
        '</div>';
    } else {
      if (badgeEl) {
        badgeEl.textContent = leaks.length + (leaks.length === 1 ? ' Secret Detected!' : ' Secrets Detected!');
        badgeEl.className = 'sec-badge sec-badge-danger';
        badgeEl.hidden = false;
      }

      var html = '<div class="sec-leaks-list">';
      leaks.forEach(function (leak, idx) {
        html +=
          '<div class="sec-leak-card ' + leak.severity + '">' +
            '<div class="sec-leak-head">' +
              '<div class="sec-leak-title-group">' +
                '<span class="sec-severity-tag ' + leak.severity + '">' + leak.severity.toUpperCase() + '</span>' +
                '<strong class="sec-leak-name">' + escapeHTML(leak.name) + '</strong>' +
                '<span class="sec-leak-line">Line ' + leak.line + '</span>' +
              '</div>' +
              '<code class="sec-leak-match">' + escapeHTML(leak.maskedText) + '</code>' +
            '</div>' +
            '<div class="sec-leak-snippet"><code>' + escapeHTML(leak.lineSnippet) + '</code></div>' +
            '<div class="sec-leak-action">' +
              '<strong>Immediate Action:</strong> ' + escapeHTML(leak.action) +
            '</div>' +
          '</div>';
      });
      html += '</div>';

      resultEl.innerHTML = html;
    }
  }

  /* =========================================================
     Purge Playbook Loader
     ========================================================= */
  function loadPurgeScenario(key) {
    var scenario = PURGE_SCENARIOS[key];
    var container = $('secPurgeContainer');
    if (!scenario || !container) return;

    // Update active tab buttons
    var tabs = document.querySelectorAll('[data-sec-purge]');
    tabs.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-sec-purge') === key);
    });

    var html =
      '<div class="sec-purge-card">' +
        '<div class="sec-purge-head">' +
          '<h3 class="sec-purge-title">' + escapeHTML(scenario.title) + '</h3>' +
          '<span class="risk ' + scenario.riskClass + '">' + escapeHTML(scenario.risk) + '</span>' +
        '</div>' +
        '<div class="sec-purge-steps">';

    scenario.steps.forEach(function (step, i) {
      html +=
        '<div class="sec-purge-step">' +
          '<div class="sec-pstep-head">' +
            '<span class="sec-pstep-num">' + (i + 1) + '</span>' +
            '<p class="sec-pstep-label">' + escapeHTML(step.label) + '</p>' +
          '</div>' +
          '<div class="sec-code-box">' +
            '<pre><code>' + escapeHTML(step.cmd) + '</code></pre>' +
            '<button type="button" class="mini-copy" data-sec-copy="' + escapeHTML(step.cmd) + '">Copy</button>' +
          '</div>' +
          '<p class="sec-pstep-why">' + escapeHTML(step.why) + '</p>' +
        '</div>';
    });

    html += '</div></div>';
    container.innerHTML = html;
  }

  /* =========================================================
     Pre-commit Hook Generator
     ========================================================= */
  function updateHookOutput() {
    var type = $('secHookType') ? $('secHookType').value : 'native';
    var codeEl = $('secHookPreviewCode');
    var downloadBtn = $('secHookDownloadBtn');
    if (!codeEl) return;

    var scriptContent = HOOK_SCRIPTS[type] || HOOK_SCRIPTS.native;
    codeEl.textContent = scriptContent;

    if (downloadBtn) {
      downloadBtn.hidden = (type !== 'native');
    }
  }

  function downloadHookFile() {
    var scriptContent = HOOK_SCRIPTS.native;
    var blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pre-commit';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* =========================================================
     Checklist Persistence
     ========================================================= */
  function loadChecklistState() {
    try {
      var saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (!saved) return;
      var checkedMap = JSON.parse(saved);
      var inputs = document.querySelectorAll('.sec-check-item input[type="checkbox"]');
      inputs.forEach(function (inp) {
        var key = inp.getAttribute('data-check-id');
        if (key && checkedMap[key]) {
          inp.checked = true;
          inp.closest('.sec-check-item').classList.add('completed');
        }
      });
    } catch (e) { /* ignore */ }
  }

  function saveChecklistState() {
    try {
      var checkedMap = {};
      var inputs = document.querySelectorAll('.sec-check-item input[type="checkbox"]');
      inputs.forEach(function (inp) {
        var key = inp.getAttribute('data-check-id');
        if (key) checkedMap[key] = inp.checked;
      });
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checkedMap));
    } catch (e) { /* ignore */ }
  }

  /* =========================================================
     Main Init
     ========================================================= */
  function init() {
    var container = $('security');
    if (!container) return;

    // 1. Scanner Event Bindings
    var scanInput = $('secScannerInput');
    if (scanInput) {
      scanInput.addEventListener('input', runScanner);
    }

    var scanClearBtn = $('secScanClear');
    if (scanClearBtn) {
      scanClearBtn.addEventListener('click', function () {
        if (scanInput) {
          scanInput.value = '';
          runScanner();
          scanInput.focus();
        }
      });
    }

    // Sample buttons
    var sampleBtns = document.querySelectorAll('[data-sec-sample]');
    sampleBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sampleKey = btn.getAttribute('data-sec-sample');
        if (SAMPLES[sampleKey] && scanInput) {
          scanInput.value = SAMPLES[sampleKey];
          runScanner();
        }
      });
    });

    // 2. Tab switcher between tools (Scanner, Purge, Hook Shield, Checklist)
    var navTabs = document.querySelectorAll('[data-sec-tab]');
    navTabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetTab = btn.getAttribute('data-sec-tab');
        navTabs.forEach(function (t) {
          t.classList.toggle('active', t.getAttribute('data-sec-tab') === targetTab);
          t.setAttribute('aria-selected', String(t.getAttribute('data-sec-tab') === targetTab));
        });
        var panels = document.querySelectorAll('.sec-panel');
        panels.forEach(function (p) {
          var isMatch = p.id === 'sec-panel-' + targetTab;
          p.classList.toggle('active', isMatch);
          p.hidden = !isMatch;
        });
      });
    });

    // 3. Purge scenario switcher
    var purgeTabs = document.querySelectorAll('[data-sec-purge]');
    purgeTabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var scenarioKey = btn.getAttribute('data-sec-purge');
        loadPurgeScenario(scenarioKey);
      });
    });

    // Delegated copy buttons inside purge steps
    if ($('secPurgeContainer')) {
      $('secPurgeContainer').addEventListener('click', function (ev) {
        var copyBtn = ev.target.closest('[data-sec-copy]');
        if (copyBtn) {
          var cmd = copyBtn.getAttribute('data-sec-copy');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(cmd).then(function () {
              copyBtn.textContent = 'Copied!';
              setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
              if (window.GitAtlasToolkit && typeof window.GitAtlasToolkit.recordCopy === 'function') {
                window.GitAtlasToolkit.recordCopy(cmd, 'Secret Purge Playbook');
              }
            });
          }
        }
      });
    }

    // 4. Hook Generator
    if ($('secHookType')) {
      $('secHookType').addEventListener('change', updateHookOutput);
    }
    if ($('secHookCopyBtn')) {
      $('secHookCopyBtn').addEventListener('click', function () {
        var codeEl = $('secHookPreviewCode');
        if (!codeEl) return;
        var text = codeEl.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            var btn = $('secHookCopyBtn');
            btn.classList.add('done');
            setTimeout(function () { btn.classList.remove('done'); }, 1500);
            if (window.GitAtlasToolkit && typeof window.GitAtlasToolkit.recordCopy === 'function') {
              window.GitAtlasToolkit.recordCopy(text, 'Pre-Commit Secret Shield');
            }
          });
        }
      });
    }
    if ($('secHookDownloadBtn')) {
      $('secHookDownloadBtn').addEventListener('click', downloadHookFile);
    }

    // 5. Checklist Event Bindings
    var checkInputs = document.querySelectorAll('.sec-check-item input[type="checkbox"]');
    checkInputs.forEach(function (inp) {
      inp.addEventListener('change', function () {
        var parentItem = inp.closest('.sec-check-item');
        if (parentItem) parentItem.classList.toggle('completed', inp.checked);
        saveChecklistState();
      });
    });

    if ($('secResetChecklistBtn')) {
      $('secResetChecklistBtn').addEventListener('click', function () {
        checkInputs.forEach(function (inp) {
          inp.checked = false;
          var parentItem = inp.closest('.sec-check-item');
          if (parentItem) parentItem.classList.remove('completed');
        });
        localStorage.removeItem(CHECKLIST_STORAGE_KEY);
      });
    }

    // Initialize defaults
    loadPurgeScenario('unpushed');
    updateHookOutput();
    loadChecklistState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GitAtlasSecurity = {
    scanText: scanText,
    runScanner: runScanner,
    loadPurgeScenario: loadPurgeScenario
  };

})();
