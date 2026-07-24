/**
 * @file 月刊资源筛选、版本选择、分享地址和安全 HTML 渲染的纯函数。
 */

const HTML_ESCAPES = Object.freeze({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
});

/**
 * 返回版本列表中的最新快照。
 *
 * @param {Array<object>} versions 按新到旧排列的版本。
 * @returns {object | null} 最新版本；空列表返回 null。
 */
export function getLatestIssue(versions) {
    return versions[0] ?? null;
}

/**
 * 选择请求的版本，未知版本回退到最新版。
 *
 * @param {Array<{version: string}>} versions 按新到旧排列的版本。
 * @param {string} requestedVersion 查询参数中的版本号。
 * @returns {object | null} 匹配或最新的版本。
 */
export function selectVersion(versions, requestedVersion) {
    return versions.find((issue) => issue.version === requestedVersion) ?? getLatestIssue(versions);
}

/**
 * 按单一分类和关键词筛选资源。
 *
 * @param {Array<object>} resources 资源记录。
 * @param {{category?: string, q?: string}} state 当前筛选状态。
 * @returns {Array<object>} 保持原有顺序的筛选结果。
 */
export function filterResources(resources, state) {
    const category = state.category || "all";
    const query = (state.q || "").trim().toLocaleLowerCase("zh-CN");

    return resources.filter((resource) => {
        const categoryMatches = category === "all" || resource.categorySlug === category;
        const haystack = `${resource.title} ${resource.summary} ${resource.sourceDomain}`
            .toLocaleLowerCase("zh-CN");
        return categoryMatches && (!query || haystack.includes(query));
    });
}

/**
 * 从查询字符串读取安全、稳定的页面状态。
 *
 * @param {string} search 包含或不包含问号的查询字符串。
 * @returns {{version: string, category: string, q: string}} 页面状态。
 */
export function readQuery(search) {
    const params = new URLSearchParams(search);
    return {
        version: params.get("v")?.trim() || "",
        category: params.get("category")?.trim() || "all",
        q: params.get("q")?.trim() || ""
    };
}

/**
 * 创建包含当前版本和筛选条件的可分享地址。
 *
 * @param {string} baseUrl 详情页绝对地址。
 * @param {{version?: string, category?: string, q?: string}} state 页面状态。
 * @returns {string} 可复制的绝对地址。
 */
export function buildShareUrl(baseUrl, state) {
    const url = new URL(baseUrl);
    url.search = "";

    if (state.version) {
        url.searchParams.set("v", state.version);
    }
    if (state.category && state.category !== "all") {
        url.searchParams.set("category", state.category);
    }
    if (state.q) {
        url.searchParams.set("q", state.q.trim());
    }

    return url.toString();
}

/**
 * 转义不可信文本，确保可以安全写入 HTML 字符串。
 *
 * @param {unknown} value 外部或数据层内容。
 * @returns {string} 转义后的文本。
 */
export function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

/**
 * 渲染单个资源卡片。
 *
 * @param {object} resource 资源记录。
 * @returns {string} 安全的卡片 HTML。
 */
export function renderResourceCard(resource) {
    const title = escapeHtml(resource.title);
    const summary = escapeHtml(resource.summary);
    const category = escapeHtml(resource.category);
    const domain = escapeHtml(resource.sourceDomain);
    const sourceLabel = resource.sourceType === "official" ? "官方" : "第三方";
    const statusLabel = resource.status === "available" ? "" : "<span class=\"status-badge\">暂不可用</span>";
    const image = resource.image
        ? `<img src="${escapeHtml(resource.image)}" alt="" loading="lazy" decoding="async">`
        : `<span class="resource-visual__glyph" aria-hidden="true">${category.slice(0, 1)}</span>
            <span class="resource-visual__label">IMAGE SLOT</span>`;
    const openAction = resource.status === "available"
        ? `<a class="text-action text-action--primary" href="${escapeHtml(resource.canonicalUrl || resource.url)}"
                target="_blank" rel="noopener noreferrer nofollow">打开链接</a>`
        : "";
    const copyLabel = resource.status === "available" ? "复制链接" : "复制原始链接";

    return `
        <article class="resource-card" data-resource-id="${escapeHtml(resource.id)}">
            <div class="resource-visual resource-visual--${escapeHtml(resource.imageKind)}">
                ${image}
            </div>
            <div class="resource-card__body">
                <div class="resource-card__badges">
                    <span>${category}</span>
                    <span class="source-badge source-badge--${escapeHtml(resource.sourceType)}">${sourceLabel}</span>
                    ${statusLabel}
                </div>
                <h3>${title}</h3>
                <p class="resource-card__summary">${summary}</p>
                <p class="resource-card__domain">${domain} · 核对于 ${escapeHtml(resource.checkedAt)}</p>
                <div class="resource-card__actions">
                    ${openAction}
                    <button class="text-action" type="button"
                            data-copy-url="${escapeHtml(resource.url)}">${copyLabel}</button>
                </div>
            </div>
        </article>
    `;
}

/**
 * 渲染资源结果列表或空状态。
 *
 * @param {Array<object>} resources 当前筛选结果。
 * @returns {string} 结果网格 HTML。
 */
export function renderResourceGrid(resources) {
    if (resources.length === 0) {
        return `
            <section class="empty-state" aria-labelledby="empty-title">
                <h2 id="empty-title">没有找到匹配资源</h2>
                <p>尝试缩短关键词，或清除当前分类筛选。</p>
                <button class="button button--secondary" type="button" data-clear-filters>清除筛选</button>
            </section>
        `;
    }

    return resources.map(renderResourceCard).join("");
}
