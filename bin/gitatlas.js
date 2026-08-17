#!/usr/bin/env node

/**
 * GitAtlas CLI — The zero-dependency terminal companion for GitAtlas.
 * Query 381+ Git commands, troubleshoot errors, and scan for secrets directly in your terminal.
 *
 * Usage:
 *   npx gitatlas <search query>
 *   npx gitatlas --fix "<error message>"
 *   npx gitatlas --scan [path/to/file]
 *   npx gitatlas --flow <name>
 *   npx gitatlas --alias
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ANSI Colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  brightRed: '\x1b[91m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
};

// Load database files
function loadData() {
  const rootDir = path.resolve(__dirname, '..');
  const dataPath = path.join(rootDir, 'data.js');
  const flowsPath = path.join(rootDir, 'flows.js');

  const context = { window: {}, console: console };
  vm.createContext(context);

  let ATLAS = [];
  let PLAYBOOKS = [];

  try {
    if (fs.existsSync(dataPath)) {
      const dataCode = fs.readFileSync(dataPath, 'utf8');
      ATLAS = vm.runInContext(`${dataCode}\n;ATLAS;`, context) || [];
    }
    if (fs.existsSync(flowsPath)) {
      const flowsCode = fs.readFileSync(flowsPath, 'utf8');
      PLAYBOOKS = vm.runInContext(`${flowsCode}\n;PLAYBOOKS;`, context) || [];
    }
  } catch (err) {
    console.error(`${C.red}Error loading GitAtlas data files:${C.reset}`, err.message);
    process.exit(1);
  }

  return { ATLAS, PLAYBOOKS };
}

const { ATLAS, PLAYBOOKS } = loadData();

// Build searchable index
const INDEX = [];
ATLAS.forEach((cat, ci) => {
  (cat.commands || []).forEach((cmd, xi) => {
    INDEX.push({
      ci,
      xi,
      cat,
      cmd,
      section: cat.label,
      tag: cat.tag,
      hay: `${cmd.c} ${cmd.d} ${cmd.e || ''} ${cmd.x || ''} ${cat.label} ${cat.tag}`.toLowerCase()
    });
  });
});

// Risk assessment helper matching GitAtlas risk engine
function getRisk(cmd) {
  const c = cmd.toLowerCase();
  if (c.includes('--hard') || c.includes('--force') || c.includes('filter-repo') || c.includes('filter-branch') || c.includes('push -f') || c.includes('reset --hard')) {
    return { level: 'Destructive', color: C.brightRed, desc: 'Rewrites history / discards changes permanently' };
  }
  if (c.includes('rebase') || c.includes('reset --mixed') || c.includes('cherry-pick') || c.includes('amend') || c.includes('stash drop') || c.includes('branch -D')) {
    return { level: 'Caution', color: C.yellow, desc: 'History modification or uncommitted changes affected' };
  }
  return { level: 'Safe', color: C.green, desc: 'Non-destructive' };
}

// Print banner
function printHeader() {
  console.log(`\n${C.bold}${C.brightCyan}◆ GitAtlas CLI${C.reset} ${C.gray}— The Field Guide to Git${C.reset}\n`);
}

// Search commands
function searchCommands(query) {
  printHeader();
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    showHelp();
    return;
  }

  // 1. First attempt: match ALL terms in haystack
  let hits = INDEX.filter(item => terms.every(t => item.hay.includes(t)));

  // 2. Second attempt: match ANY term if no strict matches
  if (hits.length === 0) {
    hits = INDEX.filter(item => terms.some(t => item.hay.includes(t)));
  }

  if (hits.length === 0) {
    console.log(`${C.yellow}No commands found for "${query}".${C.reset}`);
    console.log(`${C.gray}Try search keywords like: "undo", "rebase", "stash", "squash", or "submodule".${C.reset}\n`);
    return;
  }

  // Rank hits (exact command match first, then description, then tag)
  hits.sort((a, b) => {
    const aCmd = a.cmd.c.toLowerCase();
    const bCmd = b.cmd.c.toLowerCase();
    if (aCmd === q) return -1;
    if (bCmd === q) return 1;
    if (aCmd.includes(q) && !bCmd.includes(q)) return -1;
    if (!aCmd.includes(q) && bCmd.includes(q)) return 1;
    return 0;
  });

  const results = hits.slice(0, 6);
  console.log(`${C.gray}Found ${hits.length} command(s) matching "${query}" (showing top ${results.length}):${C.reset}\n`);

  results.forEach(res => {
    const risk = getRisk(res.cmd.c);
    console.log(`${C.bold}${C.brightGreen}➔ ${res.cmd.c}${C.reset}`);
    console.log(`  ${C.white}${res.cmd.d}${C.reset}`);
    if (res.cmd.e) {
      console.log(`  ${C.gray}When to use:${C.reset} ${C.dim}${res.cmd.e}${C.reset}`);
    }
    console.log(`  ${C.gray}Category:${C.reset} ${C.cyan}${res.section}${C.reset}  ${C.gray}•${C.reset}  ${C.gray}Risk:${C.reset} ${risk.color}${risk.level}${C.reset}`);
    if (res.cmd.x) {
      console.log(`  ${C.gray}Example:${C.reset}\n${res.cmd.x.split('\n').map(l => `    ${C.dim}${l}${C.reset}`).join('\n')}`);
    }
    console.log('');
  });
}

// Troubleshoot errors
function fixError(errorQuery) {
  printHeader();
  const fixesSection = ATLAS.find(s => s.id === 'fixes');
  if (!fixesSection || !fixesSection.commands) {
    console.log(`${C.red}Error catalog not found.${C.reset}\n`);
    return;
  }

  const q = (errorQuery || '').toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);

  let matched = [];
  if (terms.length > 0) {
    matched = fixesSection.commands.filter(item => {
      const hay = `${item.c} ${item.d} ${item.e || ''} ${item.x || ''}`.toLowerCase();
      return terms.some(t => hay.includes(t));
    });
  }

  if (matched.length === 0) {
    console.log(`${C.yellow}No exact match for error: "${errorQuery}"${C.reset}`);
    console.log(`${C.gray}Showing common Git error solutions:${C.reset}\n`);
    fixesSection.commands.slice(0, 4).forEach(item => printFix(item));
    return;
  }

  console.log(`${C.bold}${C.brightCyan}🚨 Troubleshooting Solution for: "${errorQuery}"${C.reset}\n`);
  matched.slice(0, 4).forEach(item => printFix(item));
}

function printFix(item) {
  console.log(`${C.bold}${C.brightRed}Error:${C.reset} ${C.bold}${item.c}${C.reset}`);
  console.log(`  ${C.white}What happened:${C.reset} ${item.d}`);
  if (item.e) {
    console.log(`  ${C.brightGreen}Safe Fix:${C.reset} ${item.e}`);
  }
  if (item.x) {
    console.log(`  ${C.gray}Solution command(s):${C.reset}\n${item.x.split('\n').map(l => `    ${C.cyan}${l}${C.reset}`).join('\n')}`);
  }
  console.log('');
}

// Secret scanner
function scanFileForSecrets(targetPath) {
  printHeader();
  const fileToScan = targetPath || '.env';
  const resolved = path.resolve(process.cwd(), fileToScan);

  if (!fs.existsSync(resolved)) {
    console.log(`${C.red}File not found: ${fileToScan}${C.reset}`);
    console.log(`${C.gray}Provide a file to scan, e.g.: gitatlas --scan .env${C.reset}\n`);
    return;
  }

  const content = fs.readFileSync(resolved, 'utf8');
  const lines = content.split('\n');

  const PATTERNS = [
    { name: 'AWS Access Key ID', regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, sev: 'CRITICAL' },
    { name: 'GitHub Token', regex: /(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82})/g, sev: 'CRITICAL' },
    { name: 'Stripe Secret Key', regex: /(?:sk_live_[0-9a-zA-Z]{24,99}|rk_live_[0-9a-zA-Z]{24,99})/g, sev: 'CRITICAL' },
    { name: 'OpenAI / Claude Key', regex: /(?:sk-proj-[a-zA-Z0-9-_]{48,160}|sk-[a-zA-Z0-9]{48}|sk-ant-api03-[a-zA-Z0-9-_]{90,120})/g, sev: 'CRITICAL' },
    { name: 'Google / Gemini API Key', regex: /AIzaSy[0-9A-Za-z_-]{33}/g, sev: 'HIGH' },
    { name: 'Private SSH / RSA Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, sev: 'CRITICAL' },
    { name: 'Database Connection String', regex: /(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis):\/\/[^:\s"']+:[^@\s"']+@[^/\s"']+\/[^\s"']+/gi, sev: 'CRITICAL' }
  ];

  let detected = [];
  PATTERNS.forEach(pat => {
    lines.forEach((line, idx) => {
      const match = line.match(pat.regex);
      if (match) {
        detected.push({ name: pat.name, sev: pat.sev, line: idx + 1, snippet: line.trim() });
      }
    });
  });

  if (detected.length === 0) {
    console.log(`${C.bold}${C.brightGreen}🛡️  Scan Clean: No known secrets detected in ${fileToScan}${C.reset}\n`);
  } else {
    console.log(`${C.bold}${C.brightRed}🚨 Found ${detected.length} leaked secret(s) in ${fileToScan}:${C.reset}\n`);
    detected.forEach(d => {
      console.log(`  ${C.brightRed}[${d.sev}]${C.reset} ${C.bold}${d.name}${C.reset} ${C.gray}(Line ${d.line})${C.reset}`);
      console.log(`  ${C.dim}${d.snippet.substring(0, 60)}...${C.reset}\n`);
    });
    console.log(`${C.yellow}💡 Run 'gitatlas --flow purge' to scrub exposed secrets from Git history safely.${C.reset}\n`);
  }
}

// Guided Playbook Flow
function showPlaybook(flowName) {
  printHeader();
  const q = (flowName || '').toLowerCase();
  const pb = PLAYBOOKS.find(p => p.id.toLowerCase().includes(q) || p.title.toLowerCase().includes(q));

  if (!pb) {
    console.log(`${C.yellow}Available guided playbooks:${C.reset}\n`);
    PLAYBOOKS.forEach(p => {
      console.log(`  ${C.cyan}gitatlas --flow ${p.id}${C.reset} ${C.gray}— ${p.title}${C.reset}`);
    });
    console.log('');
    return;
  }

  console.log(`${C.bold}${C.brightCyan}📖 Playbook: ${pb.title}${C.reset}`);
  console.log(`${C.gray}Goal: ${pb.goal}${C.reset}\n`);

  pb.steps.forEach((s, idx) => {
    console.log(`${C.bold}${C.brightGreen}Step ${idx + 1}:${C.reset} ${s.do}`);
    if (s.check) {
      console.log(`  ${C.yellow}Pre-flight check:${C.reset} ${C.dim}${s.check.cmd} (${s.check.why})${C.reset}`);
    }
    console.log(`  ${C.bold}${C.cyan}$ ${s.cmd.replace(/\n/g, '\n  $ ')}${C.reset}`);
    if (s.warn) {
      console.log(`  ${C.brightRed}⚠️ Warning:${C.reset} ${C.dim}${s.warn}${C.reset}`);
    }
    console.log('');
  });
}

// Alias snippet
function showAlias() {
  printHeader();
  console.log(`${C.bold}${C.brightCyan}⚙️ Recommended Git Aliases for ~/.gitconfig${C.reset}\n`);
  console.log(`${C.gray}Run this command to bind GitAtlas directly into Git:${C.reset}`);
  console.log(`  ${C.brightGreen}git config --global alias.atlas "!npx gitatlas"${C.reset}\n`);
  console.log(`${C.gray}Now you can search anytime with:${C.reset}`);
  console.log(`  ${C.cyan}git atlas undo commit${C.reset}`);
  console.log(`  ${C.cyan}git atlas rebase abort${C.reset}`);
  console.log(`  ${C.cyan}git atlas --scan .env${C.reset}\n`);
}

// Help manual
function showHelp() {
  printHeader();
  console.log(`${C.bold}USAGE:${C.reset}`);
  console.log(`  ${C.brightGreen}npx gitatlas <query>${C.reset}              Search 381+ Git commands`);
  console.log(`  ${C.brightGreen}npx gitatlas --fix "<error>"${C.reset}      Diagnose and fix a Git error`);
  console.log(`  ${C.brightGreen}npx gitatlas --scan [file]${C.reset}        Scan local file/.env for leaked secrets`);
  console.log(`  ${C.brightGreen}npx gitatlas --flow <name>${C.reset}        Run guided step-by-step playbook`);
  console.log(`  ${C.brightGreen}npx gitatlas --alias${C.reset}              Show Git alias configuration`);
  console.log(`  ${C.brightGreen}npx gitatlas --help${C.reset}               Show this help message\n`);

  console.log(`${C.bold}EXAMPLES:${C.reset}`);
  console.log(`  ${C.dim}$ npx gitatlas undo commit${C.reset}`);
  console.log(`  ${C.dim}$ npx gitatlas squash branch${C.reset}`);
  console.log(`  ${C.dim}$ npx gitatlas discard unstaged changes${C.reset}`);
  console.log(`  ${C.dim}$ npx gitatlas --fix "Updates were rejected"${C.reset}`);
  console.log(`  ${C.dim}$ npx gitatlas --scan .env${C.reset}\n`);
}

// CLI Arg Router
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    showHelp();
    return;
  }

  const first = args[0];

  if (first === '--help' || first === '-h' || first === 'help') {
    showHelp();
  } else if (first === '--fix' || first === '-f') {
    fixError(args.slice(1).join(' '));
  } else if (first === '--scan' || first === '-s') {
    scanFileForSecrets(args[1]);
  } else if (first === '--flow' || first === '-w') {
    showPlaybook(args[1]);
  } else if (first === '--alias') {
    showAlias();
  } else {
    searchCommands(args.join(' '));
  }
}

main();
