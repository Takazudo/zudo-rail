import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const manifest = JSON.parse(
  readFileSync(new URL("../docs/asset-manifest.json", import.meta.url)),
);
for (const [file, meta] of Object.entries(manifest.meshes))
  assert.equal(
    createHash("sha256")
      .update(readFileSync(new URL("../working/" + file, import.meta.url)))
      .digest("hex"),
    meta.sha256,
    file,
  );
const panels = JSON.parse(
  readFileSync(new URL("../src/panel-contours.json", import.meta.url)),
);
for (const meta of Object.values(panels))
  assert.equal(
    createHash("sha256")
      .update(
        readFileSync(new URL("../public/assets/" + meta.path, import.meta.url)),
      )
      .digest("hex"),
    meta.sha256,
    meta.path,
  );
console.info("Rail and panel source hashes verified");

const { execFileSync } = await import("node:child_process");
const { mkdtempSync, rmSync } = await import("node:fs");
const { tmpdir } = await import("node:os");
const { join } = await import("node:path");
const dir = mkdtempSync(join(tmpdir(), "rail-contours-"));
try {
  const output = join(dir, "contours.json");
  execFileSync("python3", ["scripts/extract-panels.py", "--output", output]);
  assert.deepEqual(
    JSON.parse(readFileSync(output)),
    panels,
    "Generated PCB contours differ from source",
  );
} finally {
  rmSync(dir, { recursive: true });
}
console.info("Generated PCB contours verified against retained sources");
