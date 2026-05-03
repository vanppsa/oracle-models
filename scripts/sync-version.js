const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;

const serverTs = path.join(root, "src", "server.ts");
let server = fs.readFileSync(serverTs, "utf8");
server = server.replace(/version:\s*"[^"]+"/, `version: "${version}"`);
fs.writeFileSync(serverTs, server);

const metadataJson = path.join(root, "metadata.json");
const metadata = JSON.parse(fs.readFileSync(metadataJson, "utf8"));
metadata.version = version;
fs.writeFileSync(metadataJson, JSON.stringify(metadata, null, 2) + "\n");

const skillMd = path.join(root, "SKILL.md");
let skill = fs.readFileSync(skillMd, "utf8");
skill = skill.replace(/version:\s*"[^"]+"/, `version: "${version}"`);
skill = skill.replace(/Version:\s*[\d.]+/, `Version: ${version}`);
fs.writeFileSync(skillMd, skill);

console.log(`synced version ${version} across all files`);
