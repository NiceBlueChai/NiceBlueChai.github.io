/**
 * @file 验证静态构建会生成 Cloudflare Pages 所需入口和共享资源。
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import test from "node:test";

test("构建生成 Cloudflare Pages 页面和静态资源", () => {
    rmSync("dist", { recursive: true, force: true });
    execFileSync(process.execPath, ["scripts/build.mjs"], {
        cwd: process.cwd(),
        stdio: "pipe"
    });

    assert.equal(existsSync("dist/index.html"), true);
    assert.equal(existsSync("dist/2026/07/index.html"), true);
    assert.equal(existsSync("dist/assets/app.mjs"), true);
    assert.equal(existsSync("dist/assets/catalog.mjs"), true);
});
