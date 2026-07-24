/**
 * @file 把可部署的静态页面和资源复制到 Cloudflare Pages 输出目录。
 */

import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("dist");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all([
    copyFile("index.html", resolve(output, "index.html")),
    copyFile("_headers", resolve(output, "_headers")),
    cp("2026", resolve(output, "2026"), { recursive: true }),
    cp("about", resolve(output, "about"), { recursive: true }),
    cp("assets", resolve(output, "assets"), { recursive: true })
]);

console.log(`Static site built at ${output}`);
