/**
 * @file 验证七月资源快照的数量、唯一性和必要字段。
 */

import assert from "node:assert/strict";
import test from "node:test";

import { issues } from "../assets/catalog.mjs";

test("七月 v1.3 包含 81 条唯一资源", () => {
    const issue = issues[0];

    assert.equal(issue.version, "1.3");
    assert.equal(issue.resources.length, 81);
    assert.equal(new Set(issue.resources.map((row) => row.id)).size, 81);
});

test("每条资源都包含渲染和分享所需字段", () => {
    const required = [
        "id",
        "title",
        "summary",
        "category",
        "categorySlug",
        "sourceDomain",
        "sourceType",
        "status",
        "url",
        "canonicalUrl",
        "image",
        "imageKind",
        "checkedAt"
    ];

    for (const resource of issues[0].resources) {
        for (const field of required) {
            assert.equal(typeof resource[field], "string", `${resource.id}.${field}`);
        }
    }
});
