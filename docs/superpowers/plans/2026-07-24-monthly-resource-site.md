<!-- 月度资源整合网站的可执行实现计划。 -->
# 月度资源整合网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现并验证可托管到 Cloudflare Pages 的月刊首页和七月 v1.3 资源详情页。

**Architecture:** 使用无运行时依赖的 HTML、CSS 和 ES Modules。资源快照保存在一个只读数据模块中，纯函数模块负责
查询参数、筛选和 HTML 片段，浏览器入口只负责把状态连接到 DOM；Node 内置测试运行器验证核心行为。

**Tech Stack:** HTML5、CSS、JavaScript ES Modules、Node.js 内置 `node:test`、Cloudflare Pages 静态产物。

## Global Constraints

- 所有文本文件使用 UTF-8 无 BOM、CRLF、4 空格缩进。
- 源码单行不超过 120 字符；每个文件必须有文件说明注释。
- 不添加框架、图标包、运行时依赖、登录、收藏、评论、后台或深色模式。
- 主要控件高度至少 48px，正文对比度至少 4.5:1。
- 完整资源数据只进入网站代码，不进入 Figma。

---

### Task 1: 资源快照与筛选核心

**Files:**
- Create: `package.json`
- Create: `assets/catalog.mjs`
- Create: `assets/core.mjs`
- Create: `tests/core.test.mjs`
- Create: `tests/catalog.test.mjs`

**Interfaces:**
- Produces: `issues`, `getLatestIssue()`, `selectVersion()`, `filterResources()`, `readQuery()`,
  `buildShareUrl()` 和 `escapeHtml()`。

- [ ] **Step 1: 写失败测试**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { buildShareUrl, filterResources, readQuery, selectVersion } from "../assets/core.mjs";

test("按分类与关键词筛选名称、简介和域名", () => {
    const rows = [
        { title: "X 浏览器", summary: "轻量浏览器", sourceDomain: "xbext.com", category: "浏览器" },
        { title: "地铁繁花", summary: "解谜游戏", sourceDomain: "3dmgame.com", category: "游戏" }
    ];
    assert.deepEqual(filterResources(rows, { category: "浏览器", q: "xbext" }), [rows[0]]);
});

test("查询参数使用安全默认值", () => {
    assert.deepEqual(readQuery("?v=1.3&category=game&q=%E6%B5%8F%E8%A7%88%E5%99%A8"), {
        version: "1.3",
        category: "game",
        q: "浏览器"
    });
});

test("未知版本回退到最新版", () => {
    const versions = [{ version: "1.3" }, { version: "1.2" }];
    assert.equal(selectVersion(versions, "9.9"), versions[0]);
});

test("分享地址保留版本、分类和搜索词", () => {
    assert.equal(
        buildShareUrl("https://example.com/2026/07/", { version: "1.3", category: "game", q: "浏览器" }),
        "https://example.com/2026/07/?v=1.3&category=game&q=%E6%B5%8F%E8%A7%88%E5%99%A8"
    );
});

test("七月 v1.3 包含 81 条唯一资源", () => {
    const issue = issues[0];
    assert.equal(issue.resources.length, 81);
    assert.equal(new Set(issue.resources.map((row) => row.id)).size, 81);
});
```

- [ ] **Step 2: 运行测试并确认因模块不存在而失败**

Run: `npm test`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: 写最小实现与 81 条 v1.3 快照**

```javascript
export function filterResources(resources, state) {
    const q = state.q.trim().toLocaleLowerCase("zh-CN");
    return resources.filter((resource) => {
        const categoryMatches = !state.category || state.category === "all"
            || resource.categorySlug === state.category;
        const haystack = `${resource.title} ${resource.summary} ${resource.sourceDomain}`
            .toLocaleLowerCase("zh-CN");
        return categoryMatches && (!q || haystack.includes(q));
    });
}
```

`catalog.mjs` 导出一个 issue，其中 `version` 为 `"1.3"`，资源数组长度严格为 81。

- [ ] **Step 4: 运行测试并确认通过**

Run: `npm test`
Expected: 5 tests pass.

### Task 2: 页面渲染与浏览器交互

**Files:**
- Create: `index.html`
- Create: `2026/07/index.html`
- Create: `assets/site.css`
- Create: `assets/app.mjs`
- Modify: `assets/core.mjs`
- Create: `tests/render.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `issues` 和核心纯函数。
- Produces: `renderResourceCard()`、`renderIssue()`，以及可操作的首页和详情页。

- [ ] **Step 1: 写失败的渲染测试**

```javascript
test("不可用资源不渲染打开按钮", () => {
    const html = renderResourceCard({
        title: "失效条目",
        summary: "链接当前无法稳定访问。",
        category: "工具",
        sourceDomain: "example.com",
        sourceType: "third-party",
        status: "unavailable",
        url: "https://example.com",
        image: "",
        imageKind: "placeholder"
    });
    assert.match(html, /暂不可用/);
    assert.doesNotMatch(html, />打开链接</);
});
```

- [ ] **Step 2: 运行单测并确认缺少导出而失败**

Run: `node --test tests/render.test.mjs`
Expected: FAIL because `renderResourceCard` is not exported.

- [ ] **Step 3: 实现语义化页面、响应式样式和浏览器状态连接**

`renderResourceCard()` 必须转义外部文本；`app.mjs` 监听搜索、分类、版本和复制操作，使用
`history.replaceState()` 同步 URL，并通过 `aria-live` 提示结果数和复制状态。

- [ ] **Step 4: 运行全部测试**

Run: `npm test`
Expected: all tests pass.

### Task 3: 静态构建与内容完整性

**Files:**
- Create: `scripts/build.mjs`
- Create: `scripts/serve.mjs`
- Create: `.gitignore`
- Create: `README.md`
- Create: `tests/build.test.mjs`

**Interfaces:**
- Consumes: 源 HTML、CSS、模块和图片。
- Produces: `dist/` Cloudflare Pages 静态目录和本地预览服务。

- [ ] **Step 1: 写失败的静态构建测试**

```javascript
test("构建生成 Cloudflare Pages 入口", () => {
    execFileSync(process.execPath, ["scripts/build.mjs"]);
    assert.equal(existsSync("dist/index.html"), true);
    assert.equal(existsSync("dist/2026/07/index.html"), true);
});
```

- [ ] **Step 2: 运行测试并确认缺少构建脚本会失败**

Run: `node --test tests/build.test.mjs`
Expected: FAIL because `scripts/build.mjs` does not exist.

- [ ] **Step 3: 完成资源素材、构建脚本和 Cloudflare 说明**

`npm run build` 清空并重建 `dist/`，复制 `index.html`、`2026/` 和 `assets/`。README 说明 Cloudflare Pages
使用 `npm run build` 与输出目录 `dist`。

- [ ] **Step 4: 运行完整验证**

Run: `npm test`
Expected: all tests pass.

Run: `npm run build`
Expected: exit 0 and `dist/2026/07/index.html` exists.

### Task 4: 响应式验收与 GitHub 推送

**Files:**
- Modify only files with verified visual or interaction defects.

**Interfaces:**
- Consumes: Task 3 的本地预览。
- Produces: 已验证并推送到 `origin/main` 的提交。

- [ ] **Step 1: 启动本地预览**

Run: `npm run serve`
Expected: prints `http://127.0.0.1:4173`.

- [ ] **Step 2: 验证桌面与 390px 手机视口**

检查 `/` 和 `/2026/07/?v=1.3&category=browser&q=浏览器`；确认无横向溢出、搜索和分类结果正确、
图片不拉伸、不可用条目状态清晰。

- [ ] **Step 3: 运行最终命令**

Run: `npm test && npm run build`
Expected: exit 0.

- [ ] **Step 4: 提交并推送**

```bash
git add .
git commit -m "feat(site): 实现月度资源整合网站"
git push -u origin main
```

Expected: local `main` tracks `origin/main`.
