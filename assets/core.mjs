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
