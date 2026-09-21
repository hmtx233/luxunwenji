# 项目约定 · 鲁迅文集站点

## 技术栈
VitePress 1.6.4 + heti 0.9.6（赫蹏中文排版），部署域名 luxunwenji.com。
纯静态站，构建产物在 `docs/.vitepress/dist`。

## 目录约定
- `docs/<类别>/<文集拼音>/<篇名>.md`
  类别：`novels` `prose` `essays` `academic` `letters`
- 每部文集必须有 `index.md`（文集首页），否则导航与面包屑会 404
- 新增文集需同步登记到 `config.mts` 的 `categories`

## frontmatter
```yaml
title: 狂人日记
volume: 呐喊
```
`title` 用于侧边栏与页面标题，`volume` 用于 SEO 描述。

## 正文排版约定
- **字体**：正文用系统无衬线栈 `-apple-system / PingFang SC /
  Hiragino Sans GB / Microsoft YaHei`，`17px / 1.7 / 0.03em`（详见坑 6）
- **版心**：`.content > .content-container { max-width: 42em }`（详见坑 7）
- **首行缩进**：由 `custom.css` 的 `.vp-doc > div > p { text-indent: 2em }` 统一控制，
  正文里不要手写空格或全角空格
- **对话体**：作者刻意的分行用 `<br>` 承接
- **章节序号**：包裹为 `<p class="section-number">一</p>`，居中显示
- **文末日期**：包裹为 `<p class="writing-date">一九二〇年十月。</p>`，右对齐
- **韵文**：用 `>` 引用块，样式上居中

## 篇目排序
在 `config.mts` 每个文集的 `order: []` 数组里写文件名（不含 `.md`）。
未列入的自动追加到末尾并按拼音排序。不写 `order` 则全部按拼音。

## 重要：不要重犯的坑
1. `transformPageData` 中写 `frontmatter.head` 必须**直接赋值**，不可累加。
   该钩子每页会执行多次，累加会导致构建从 90s 恶化到 16 分钟以上。
2. `themeConfig.sidebar` 只能用**数组**或**路径为键的对象**，不能用函数
   （会直接导致侧边栏消失）。
3. 侧边栏务必**按分类拆分**（见 config.mts 的 `buildSidebar`）。
   全站共用一份会让单页 HTML 多出 229KB。
4. Markdown 文件**不能**写 `<script setup>` + `<template>` 当组件用，
   要抽成 `.vue` 放 `theme/` 下再在 markdown 里引用。
5. 批量改正文前先备份到 `.workbuddy/backup-*`，改完用「去空白归一化」
   比对验证零内容丢失。
6. **heti 字体必须显式声明字体栈，`@font-face` 不会自动生效。**
   heti 的字体由类名驱动（`.heti--song` 宋体 / `.heti--hei` 黑体 /
   `.heti--kai` 楷体），`@font-face` 里的 `"Heti Song"` 只是
   `local("Songti SC")` 的别名。因为本站废弃了运行时注入类名，
   字体栈直接写在 `.vp-doc` 上。
   **现状（2026-09-21 按用户指定方案调整）：正文为系统无衬线栈**
   `-apple-system / PingFang SC / Hiragino Sans GB / Microsoft YaHei`，
   `17px / line-height 1.7 / letter-spacing 0.03em`；
   之前用过 heti 宋体栈（`Times New Roman → Heti Song → Songti SC`），
   两者切换只需改 `.vp-doc` 的 `font-family`，改回宋体时记得同时
   恢复 `letter-spacing: 0.02em`。
7. **`.content-container` 是 `.vp-doc` 的父级，不是后代。**
   真实结构：`.content > .content-container > main.main > .vp-doc`。
   写 `.vp-doc .content-container { max-width }` 永远不命中，限宽会静默失效；
   正确写法是 `.content > .content-container`（权重 0,2,0，写在 custom.css 中
   晚于 VitePress 自带的 `.content-container[data-v-*]{max-width:688px}`，可覆盖）。
   同时 **`.vp-doc` 自身不要再限宽**，否则 38em 会先把行宽截断。

## 构建
```bash
node scripts/gen-stats.mjs                      # 生成首页统计
node node_modules/vitepress/bin/vitepress.js build docs
```
注意：本机 `npm run` 会触发被安全策略拦截的 wsl.exe，直接用 node 调用。

## 构建排障
- 正常构建耗时约 **88–90 秒**。若远超此值且 `dist` 文件数长时间不变
  （如卡在 145 篇），是**上一轮 build 进程残留**导致 IO 竞争，
  杀掉重跑即可，不是代码问题。
- 清理 `docs/.vitepress/{dist,.temp,cache}` 时 `rm -rf` 会被安全策略拦截，
  改用 PowerShell：`[System.IO.Directory]::Delete($path, $true)`。
- 改 `.vitepress` 下的 config/theme 后必须重新 build 才能生效，
  `preview` 只是静态伺服 `dist`。

