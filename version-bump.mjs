import { readFileSync, writeFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const versions = JSON.parse(readFileSync("versions.json", "utf8"));

// Sync metadata from package.json to manifest.json
// Note: manifest.json "id" is the Obsidian plugin identifier and is NOT synced
// from package.json "name" — they serve different purposes.
manifest.version = pkg.version;
manifest.author = pkg.author;
manifest.description = pkg.description;

// Only add a versions.json entry when the version actually changed
if (!versions[pkg.version]) {
  versions[pkg.version] = manifest.minAppVersion;
}

writeFileSync("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync("versions.json", `${JSON.stringify(versions, null, 2)}\n`);