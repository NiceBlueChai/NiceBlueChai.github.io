/**
 * @file 验证静态构建会生成 Cloudflare Pages 所需入口和共享资源。
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import test from "node:test";

test("构建生成 Cloudflare Pages 页面和静态资源", () => {
    rmSync("dist", { recursive: true, force: true });
    execFileSync(process.execPath, ["scripts/build.mjs"], {
        cwd: process.cwd(),
        stdio: "pipe"
    });

    assert.equal(existsSync("dist/index.html"), true);
    assert.equal(existsSync("dist/2026/07/index.html"), true);
    assert.equal(existsSync("dist/about/index.html"), true);
    assert.equal(existsSync("dist/assets/app.mjs"), true);
    assert.equal(existsSync("dist/assets/catalog.mjs"), true);
    assert.equal(existsSync("dist/assets/favicon.svg"), true);

    for (const page of ["dist/index.html", "dist/2026/07/index.html", "dist/about/index.html"]) {
        assert.match(readFileSync(page, "utf8"), /<link rel="icon" href="\/assets\/favicon\.svg"/);
    }
});

test("Worker 部署配置声明名称、兼容日期和静态资源目录", () => {
    assert.equal(existsSync("wrangler.jsonc"), true, "缺少 wrangler.jsonc");

    const source = readFileSync("wrangler.jsonc", "utf8").replace(/^\s*\/\/.*\r?\n/, "");
    const config = JSON.parse(source);

    assert.equal(config.name, "blue-surf-97a1");
    assert.match(config.compatibility_date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(config.assets.directory, "./dist");
});

test("本地预览使用正确的 SVG MIME 类型", () => {
    const source = readFileSync("scripts/serve.mjs", "utf8");

    assert.match(source, /"\.svg":\s*"image\/svg\+xml"/);
});
