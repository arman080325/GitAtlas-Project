/* Regenerates api/_lib/commands.js from data.js.
   Run this whenever you add or edit commands:  node tools/build-allowlist.js  */
const fs = require("fs");
const path = require("path");
const ATLAS = require(path.join(__dirname, "..", "data.js"));

const commands = [];
ATLAS.forEach(function (cat) {
  cat.commands.forEach(function (cmd) { commands.push(cmd.c); });
});
const sections = ATLAS.map(function (cat) { return cat.id; });

const out =
  "/* Generated from data.js — the only command strings the API will count.\n" +
  "   Regenerate with: node tools/build-allowlist.js */\n\n" +
  "const COMMANDS = new Set(" + JSON.stringify(commands) + ");\n\n" +
  "const SECTIONS = new Set(" + JSON.stringify(sections) + ");\n\n" +
  "module.exports = { COMMANDS, SECTIONS };\n";

fs.writeFileSync(path.join(__dirname, "..", "api", "_lib", "commands.js"), out);
console.log("Wrote allowlist: " + commands.length + " commands, " + sections.length + " sections.");