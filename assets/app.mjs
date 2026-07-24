/**
 * @file 将月刊资源数据连接到首页和详情页的浏览器交互。
 */

import { issues } from "./catalog.mjs";
import {
    buildShareUrl,
    filterResources,
    readQuery,
    renderResourceGrid,
    selectVersion
} from "./core.mjs";

const pageType = document.body.dataset.page;
const latestIssue = issues[0];

document.querySelectorAll("[data-issue-version]").forEach((node) => {
    node.textContent = latestIssue.version;
});
document.querySelectorAll("[data-issue-date]").forEach((node) => {
    node.textContent = latestIssue.publishedAt.replaceAll("-", ".");
});
document.querySelectorAll("[data-issue-author]").forEach((node) => {
    node.textContent = latestIssue.author;
});
document.querySelectorAll("[data-resource-count]").forEach((node) => {
    node.textContent = String(latestIssue.resources.length);
});
document.querySelectorAll("[data-current-issue-link]").forEach((node) => {
    node.href = `/2026/07/?v=${encodeURIComponent(latestIssue.version)}`;
});

if (pageType === "issue") {
    const initial = readQuery(window.location.search);
    const state = {
        version: initial.version || latestIssue.version,
        category: initial.category,
        q: initial.q
    };
    const searchInput = document.querySelector("[data-search]");
    const versionSelect = document.querySelector("[data-version]");
    const categoriesNode = document.querySelector("[data-categories]");
    const gridNode = document.querySelector("[data-resource-grid]");
    const resultCountNode = document.querySelector("[data-result-count]");
    const toastNode = document.querySelector("[data-toast]");
    let toastTimer = 0;

    searchInput.value = state.q;
    versionSelect.innerHTML = issues.map((issue) => (
        `<option value="${issue.version}">版本 v${issue.version}</option>`
    )).join("");
    versionSelect.value = selectVersion(issues, state.version).version;

    const showToast = (message) => {
        window.clearTimeout(toastTimer);
        toastNode.textContent = message;
        toastNode.hidden = false;
        toastTimer = window.setTimeout(() => {
            toastNode.hidden = true;
        }, 2200);
    };

    const copyText = async (value) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            const input = document.createElement("textarea");
            input.value = value;
            input.setAttribute("readonly", "");
            input.style.position = "fixed";
            input.style.opacity = "0";
            document.body.append(input);
            input.select();
            const copied = document.execCommand("copy");
            input.remove();
            if (!copied) {
                throw new Error("无法复制到剪贴板");
            }
        }
    };

    const renderCategories = (issue) => {
        const all = { name: "全部", slug: "all", count: issue.resources.length };
        categoriesNode.innerHTML = [all, ...issue.categories].map((category) => {
            const active = category.slug === state.category;
            return `
                <button class="category-chip${active ? " is-active" : ""}" type="button"
                        data-category="${category.slug}" aria-pressed="${active}">
                    ${category.name}<span>${category.count}</span>
                </button>
            `;
        }).join("");
    };

    const render = () => {
        const issue = selectVersion(issues, state.version);
        state.version = issue.version;
        const results = filterResources(issue.resources, state);
        gridNode.innerHTML = renderResourceGrid(results);
        resultCountNode.textContent = String(results.length);
        versionSelect.value = issue.version;
        renderCategories(issue);
        document.querySelector("[data-issue-description]").textContent = issue.description;
        document.querySelector("[data-checked-at]").textContent = issue.checkedAt.replaceAll("-", ".");
        const shareUrl = buildShareUrl(window.location.href, state);
        window.history.replaceState(null, "", shareUrl);
    };

    searchInput.addEventListener("input", (event) => {
        state.q = event.currentTarget.value;
        render();
    });

    versionSelect.addEventListener("change", (event) => {
        state.version = event.currentTarget.value;
        render();
    });

    categoriesNode.addEventListener("click", (event) => {
        const button = event.target.closest("[data-category]");
        if (!button) {
            return;
        }
        state.category = button.dataset.category;
        render();
    });

    document.addEventListener("click", async (event) => {
        const copyButton = event.target.closest("[data-copy-url]");
        const shareButton = event.target.closest("[data-copy-share]");
        const clearButton = event.target.closest("[data-clear-filters]");

        if (clearButton) {
            state.category = "all";
            state.q = "";
            searchInput.value = "";
            render();
            searchInput.focus();
            return;
        }

        const value = copyButton?.dataset.copyUrl
            || (shareButton ? buildShareUrl(window.location.href, state) : "");
        if (!value) {
            return;
        }

        try {
            await copyText(value);
            showToast(shareButton ? "本期链接已复制" : "资源链接已复制");
        } catch {
            showToast("复制失败，请手动复制地址");
        }
    });

    render();
}
