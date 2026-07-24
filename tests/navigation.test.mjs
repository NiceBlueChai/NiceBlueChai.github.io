/**
 * @file 验证共享分段导航和精简关于页的静态页面契约。
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pages = ["index.html", "2026/07/index.html", "about/index.html"];

test("所有页面提供最新一期、往期和关于入口", () => {
    for (const path of pages) {
        const html = readFileSync(path, "utf8");

        assert.match(html, /class="global-nav"/);
        assert.match(html, /href="\/2026\/07\/\?v=1\.3"/);
        assert.match(html, /href="\/#history"/);
        assert.match(html, /href="\/about\/"/);
    }
});

test("关于页只保留标题、三个入口和署名", () => {
    const html = readFileSync("about/index.html", "utf8");

    assert.match(html, /关于这个月刊/);
    assert.match(html, /GitHub 仓库/);
    assert.match(html, /查看最新一期/);
    assert.match(html, /浏览往期/);
    assert.match(html, /Powered by Cloudflare/);
    assert.doesNotMatch(html, /每月更新|版本留档|第三方链接需自行核对/);
});

test("分段导航中间项无圆角且文字居中", () => {
    const css = readFileSync("assets/site.css", "utf8");

    assert.match(css, /\.global-nav\s*>\s*:not\(:first-child\):not\(:last-child\)\s*\{[^}]*border-radius:\s*0/s);
    assert.match(css, /\.global-nav__item\s*\{[^}]*justify-content:\s*center/s);
});
