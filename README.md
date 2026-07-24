<!-- 月度资源整合网站的开发与 Cloudflare Pages 部署说明。 -->
# 月度资源整合

一个按月发布游戏、软件、工具与学习资源的响应式静态网站。当前收录七月 v1.3，共 81 条资源。

## 本地开发

需要 Node.js 22 或更高版本。

```bash
npm test
npm run build
npm run serve
```

本地地址为 `http://127.0.0.1:4173`。

## Cloudflare Pages

连接本仓库后使用以下配置：

- 构建命令：`npm run build`
- 构建输出目录：`dist`
- 根目录：`/`

项目不需要环境变量、数据库或服务端运行时。

## 内容更新

月刊快照位于 `assets/catalog.mjs`。新增版本时追加完整快照，并保持版本按新到旧排列；不要直接修改历史快照。

设计稿：[Figma / cf](https://www.figma.com/design/MB8wVYQAgLBZjGa54IeJYA/cf)
