/**
 * @file 验证资源筛选、版本选择和分享参数等纯函数行为。
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
    buildShareUrl,
    escapeHtml,
    filterResources,
    readQuery,
    selectVersion
} from "../assets/core.mjs";

test("按分类与关键词筛选名称、简介和域名", () => {
    const rows = [
        {
            title: "X 浏览器",
            summary: "轻量浏览器",
            sourceDomain: "xbext.com",
            categorySlug: "browser"
        },
        {
            title: "地铁繁花",
            summary: "解谜游戏",
            sourceDomain: "3dmgame.com",
            categorySlug: "game"
        }
    ];

    assert.deepEqual(filterResources(rows, { category: "browser", q: "xbext" }), [rows[0]]);
});

test("查询参数使用安全默认值", () => {
    assert.deepEqual(readQuery("?v=1.3&category=game&q=%E6%B5%8F%E8%A7%88%E5%99%A8"), {
        version: "1.3",
        category: "game",
        q: "浏览器"
    });
    assert.deepEqual(readQuery("?v=&category=&q="), {
        version: "",
        category: "all",
        q: ""
    });
});

test("未知版本回退到最新版", () => {
    const versions = [{ version: "1.3" }, { version: "1.2" }];

    assert.equal(selectVersion(versions, "9.9"), versions[0]);
    assert.equal(selectVersion(versions, "1.2"), versions[1]);
});

test("分享地址保留版本、分类和搜索词", () => {
    assert.equal(
        buildShareUrl("https://example.com/2026/07/", {
            version: "1.3",
            category: "game",
            q: "浏览器"
        }),
        "https://example.com/2026/07/?v=1.3&category=game&q=%E6%B5%8F%E8%A7%88%E5%99%A8"
    );
});

test("外部内容在进入 HTML 前被转义", () => {
    const expected = "&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;";

    assert.equal(escapeHtml("<script>\"x\" & 'y'</script>"), expected);
});
