/**
 * @file 验证资源卡、结果列表和不可用状态的安全 HTML 输出。
 */

import assert from "node:assert/strict";
import test from "node:test";

import { renderResourceCard, renderResourceGrid } from "../assets/core.mjs";

const availableResource = {
    id: "x-browser",
    title: "X 浏览器",
    summary: "官方页面，提供轻量移动浏览器相关公开信息。",
    category: "浏览器",
    categorySlug: "browser",
    sourceDomain: "xbext.com",
    sourceType: "official",
    status: "available",
    url: "https://www.xbext.com",
    canonicalUrl: "https://www.xbext.com/",
    image: "/assets/images/x-browser.png",
    imageKind: "cover",
    checkedAt: "2026-07-24"
};

test("不可用资源不渲染打开按钮", () => {
    const html = renderResourceCard({
        ...availableResource,
        id: "broken",
        title: "失效条目",
        status: "unavailable",
        image: "",
        imageKind: "placeholder"
    });

    assert.match(html, /暂不可用/);
    assert.doesNotMatch(html, />打开链接</);
    assert.match(html, /data-copy-url/);
});

test("可用资源渲染本地图片和安全外部链接", () => {
    const html = renderResourceCard(availableResource);

    assert.match(html, /loading="lazy"/);
    assert.match(html, /src="\/assets\/images\/x-browser\.png"/);
    assert.match(html, /rel="noopener noreferrer nofollow"/);
    assert.match(html, />打开链接</);
});

test("资源卡会转义不可信文本", () => {
    const html = renderResourceCard({
        ...availableResource,
        title: "<script>alert(1)</script>"
    });

    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
});

test("空结果输出可清除筛选的状态", () => {
    const html = renderResourceGrid([]);

    assert.match(html, /没有找到匹配资源/);
    assert.match(html, /data-clear-filters/);
});
