/**
 * @file 使用 Node.js 标准库预览构建后的静态网站。
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const host = "127.0.0.1";
const port = 4173;
const root = resolve("dist");
const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".png": "image/png",
    ".webp": "image/webp"
};

const server = createServer(async (request, response) => {
    try {
        const pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
        let filePath = resolve(root, `.${pathname}`);

        if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
            response.writeHead(403).end("Forbidden");
            return;
        }

        if (pathname.endsWith("/") || (await stat(filePath).catch(() => null))?.isDirectory()) {
            filePath = resolve(filePath, "index.html");
        }

        const body = await readFile(filePath);
        response.writeHead(200, {
            "cache-control": "no-cache",
            "content-type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream"
        });
        response.end(body);
    } catch {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not Found");
    }
});

server.listen(port, host, () => {
    console.log(`Preview: http://${host}:${port}`);
});

process.on("SIGINT", () => {
    server.close(() => process.exit(0));
});
