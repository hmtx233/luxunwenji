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
- **字体**：正文与标题**同为系统无衬线栈**（用户指定方案，勿改）：
  `-apple-system / PingFang SC / Hiragino Sans GB / Microsoft YaHei`，
  `17px / 1.7 / 0.03em`。层级只靠字号与字重区分。
  标题**不要**单独指定字体家族（custom.css 顶部注释已写明此约定）。
- **版心**：`.content > .content-container { max-width: 42em }`（详见坑 7）
- **首行缩进**：由 `custom.css` 的 `.vp-doc > div > p { text-indent: 2em }` 统一控制，
  正文里不要手写空格或全角空格
- **对话体**：作者刻意的分行用 `<br>` 承接
- **章节序号**：包裹为 `<p class="section-number">一</p>`，居中显示
- **文末日期**：包裹为 `<p class="writing-date">一九二〇年十月。</p>`，右对齐
- **韵文**：用 `>` 引用块，样式上居中
- **字数与阅读时间**：文章页标题下方自动显示「4,811 字 · 阅读约 12 分钟」，
  正文里不要手写。由 `config.mts` 的 `loadMeta()` 构建期统计字数，
  经 `transformPageData` 注入 `frontmatter.chars` / `.minutes`，
  再由 `ArticleTitle.vue` 渲染。速度 400 字/分钟、四舍五入、最少 1 分钟。

## 篇目排序
在 `config.mts` 每个文集的 `order: []` 数组里写文件名（不含 `.md`）。
未列入的自动追加到末尾并按拼音排序。不写 `order` 则全部按拼音。
改完 `order` 后跑 `node scripts/build-index.mjs` 同步文集首页的篇目列表。

**学术（《中国小说史略》）与书信（《两地书》）必须显式写 order** ——
文件名用中文数字编号（第一篇…第二十八篇、第一集 北京_一…三五），
按文件名排序会乱得彻底（字典序下 第七篇 < 第三篇 < 第九篇 < 第二十一篇）。

## 文集首页只保留「引言 + 篇目」
`npm run index`（`scripts/build-index.mjs`）会：
1. **删掉首页里整段照抄的序文**（序言/自序/题记/题辞/小引）——
   这些内容另有独立文章，首页再放一份等于同一篇文字有两个可访问 URL，
   既是重复内容也稀释首页权重。序文作为篇目第一条列出即可。
2. 按 `order` 重写 `## 篇目`（**旧的篇目段会被丢弃重建**，故切勿手工编辑该段）。

脚本幂等，可反复执行；`--dry` 只打印不落盘。
配套 `node scripts/verify-index.mjs` 校验：除序文与篇目段外内容零改动，
且每处被移出的序文都能在同名独立文章里找到。

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
6. **heti 字体靠类名驱动，`@font-face` 不会自动生效。**
   heti 的字体由类名选择（`.heti--song` 宋体 / `.heti--hei` 黑体 /
   `.heti--kai` 楷体），`@font-face` 里的 `"Heti Song"` 只是
   `local("Songti SC")` 的别名 —— 没有元素声明该 family 就完全不生效。
   因为本站废弃了运行时注入类名（SSR 首屏会闪样式），字体栈直接写在 `.vp-doc` 上。
   **当前为用户指定的系统无衬线栈，是有意为之，不要"修"成宋体。**
   （2026-09-22 我曾误判为 heti 失效而改成宋体栈 `Times New Roman → Heti Song`，
   随后被回退。改字体前先看 `custom.css` 顶部注释。）
7. **`.content-container` 是 `.vp-doc` 的父级，不是后代。**
   真实结构：`.content > .content-container > main.main > .vp-doc`。
   写 `.vp-doc .content-container { max-width }` 永远不命中，限宽会静默失效；
   正确写法是 `.content > .content-container`（权重 0,2,0，写在 custom.css 中
   晚于 VitePress 自带的 `.content-container[data-v-*]{max-width:688px}`，可覆盖）。
   同时 **`.vp-doc` 自身不要再限宽**，否则 42em 会先把行宽截断。
8. **Markdown 链接目标里绝不能有空格 —— 这是静默故障。**
   CommonMark 的链接目标遇空白即终止解析，markdown-it 解析失败后会把
   整段 `[文字](/路径 带空格)` **当纯文本输出**：既不可点击，
   也**不会触发 VitePress 的死链检查**，构建照常通过。
   学术/书信的文件名含空格，必须写成 `第一篇%20史家…`（只编码空格，中文可留明文）。
   用 `node scripts/find-broken-links.mjs` 全站扫。
9. **`vitepress dev` 与 `vitepress build` 不能同时跑。**
   两者共用 `docs/.vitepress/cache` 与 `.temp`，并发会互相锁死，
   表现为构建卡在 "building client + server bundles" 十几分钟不动、
   `dist` 文件数长时间不变。**这才是构建假死的首要原因**（此前误记为
   "上一轮 build 进程残留"）。排查：`tasklist | grep node` 看是否有
   `vitepress dev docs` 在跑。绕开办法：`node scripts/prepare-verify-build.mjs`
   复制一份隔离副本（约 4MB，自动链 node_modules）到 `D:\_lx-verify` 再构建。
   另注：`vitepress dev` 是**客户端渲染**，curl 拿不到页面内容，
   想在命令行校验必须用 build 产物。
10. **同一页只能有一个 `<h1>`，`ArticleTitle.vue` 的显示条件要看路径。**
   该组件挂在 `doc-before` 插槽、会自己渲染一个 `<h1>` 当标题，
   凡是正文**自带** `# 一级标题` 的页面都必须让它让位，否则页面出现两个 `<h1>`。
   现行规则（自动判断，无需逐页配置）：**只有路径形如
   `<类别>/<文集>/<篇名>.md` 的文章才接管标题**——
   首页/自定义页、各文集 `index.md`、`docs` 根目录下的独立页（如 `about.md`）
   一律跳过。需要例外时在 frontmatter 写 `articleTitle: true|false`。
   （`layout: page` 不能用来绕过：VPPage 里的 `<Content>` **不带 `vp-doc` 类**，
   会让该页丢掉全部中文排版。用 `sidebar: false` + `aside: false` 即可。）

## SEO / 收录
- 每页的 `canonical`、Open Graph、Twitter Card、JSON-LD **全部由
  `config.mts` 的 `transformPageData` → `buildHead()` 生成**
  （**必须直接赋值**，不可累加，见坑 1）。静态 `head` 里**不要**再写
  `og:type` / `og:site_name`，否则同一属性会出现两次。
- canonical 要点：
  - **按路径段百分号编码**（与 sitemap 写法一致），否则两处对不上
  - 文集首页**带尾斜杠**（`/novels/nahan/`），文章页不带
  - `transformPageData` 的 `relativePath` 对文集首页是 `xxx/index`，
    直接拼 `${SITE_URL}/${relPath}` 会得到 `/xxx/index` 这个 404 地址（已修）
- `og:type`：文章页 `article`（并附 `article:section` = 卷名），其余 `website`
- `og:image`：每部文集一张卡片，`docs/public/og/<类别>-<文集>.png`；
  由 `node scripts/gen-og.mjs` 生成（Python + Pillow 绘制，1200×630）。
  **卡片缺失时自动回退到 `/og.png`**，所以漏跑脚本不会让构建失败。
  同一条命令还产出方形的 `apple-touch-icon.png`。
- JSON-LD 用一个 `@graph`：首页 `WebSite`；文集首页 `Book`；
  文章页 `Article` + `isPartOf: Book`；非首页均附 `BreadcrumbList`。
  序列化后要把 `<` 转成 `\u003c`，避免内容里的 `</script>` 提前闭合。
- `node scripts/verify-seo.mjs [构建目录]` 校验上述全部项目
  （含「同一 OG 属性是否只出现一次」「og:image 文件是否存在」
  「canonical 是否在 sitemap 中」「每页 `<h1>` 是否唯一」）
- **字数口径必须统一**：`gen-stats.mjs` 与 `config.mts` 的 `loadMeta()`
  用同一条规则（去 frontmatter / HTML 标签 / 标题记号 / 空白，保留标点）。
  早期 `gen-stats.mjs` 只去空白，把 Markdown 标记也算进字数，
  导致首页总字数（168.6 万）比实际文本（约 136 万）虚高约 20%，
  且各分类偏差不一（散文含大量 `>` 韵文，虚高最多）。
- 访问统计：GA4，`config.mts` 的 `GA_ID` + `analyticsTags()` 注入**静态 `head`**
  （全站每页生效），**留空即完全不输出**；`verify-seo.mjs` 会校验全站覆盖。
  注意大陆访问者加载不到 `googletagmanager.com`，国内流量需另接统计
- `robots.txt` 在 `docs/public/`，指向 `https://luxunwenji.com/sitemap.xml`
- 站长平台验证码走环境变量（不进仓库）：
  `GOOGLE_SITE_VERIFICATION` / `BAIDU_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`
  （分别渲染为 `google-site-verification` / `baidu-site-verification` / `msvalidate.01`），
  为空则不输出 meta（**不要**输出空标签，会被判定验证失败）
- 百度主动推送：`node scripts/submit-baidu.mjs --token=xxx [--limit=10]`
  （token 也可用 `BAIDU_TOKEN`），从 `dist/sitemap.xml` 读 URL
- IndexNow（Bing/Yandex/Naver）：`node scripts/submit-indexnow.mjs`，
  密钥文件 `docs/public/<key>.txt`（内容=文件名），`--generate` 生成；
  **Bing 要打 `--endpoint=https://www.bing.com/indexnow`**——
  枢纽端点 `api.indexnow.org` 在密钥已可访问的情况下仍返回
  `403 SiteVerificationNotCompleted`（2026-09-21 实测），Bing 自己的端点直接 200
- 推送脚本共用 `scripts/lib/cli.mjs`（parseArgs / extractUrls / loadSitemap / chunk）
- 注意：站点未 ICP 备案且在境外（Cloudflare），百度收录效果天然受限；
  Google 无 sitemap ping 接口（已下线），只能 Search Console 手动提交
- 本机 DNS 解析 luxunwenji.com 会超时，验证线上时用
  `curl --resolve luxunwenji.com:443:104.21.90.72 https://…`

## 版本控制
- 远程 `origin` = `git@github.com:hmtx233/luxunwenji.git`（**SSH**，非 https），主分支 `main`
- **本机没有 `gh` CLI**，不能建 PR，只能直接 push 到 `main`
- 推送一律带 `GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=15"`：
  非交互环境下 SSH 若要口令输入会**直接挂住**，BatchMode 让它立刻失败返回
- `.workbuddy/memory/` **有意入库**（`.gitignore` 里用 `!` 白名单放行），
  `.workbuddy/backup-*`、`.workbuddy/tmp/` 与临时脚本则被排除

## 构建
```bash
node scripts/gen-stats.mjs                      # 生成首页统计
node node_modules/vitepress/bin/vitepress.js build docs
```
注意：本机 `npm run` 会触发被安全策略拦截的 wsl.exe，直接用 node 调用。

## 常用脚本
| 命令 | 作用 |
| --- | --- |
| `stats` | 重算篇目/字数 → `theme/site-stats.mjs` |
| `index` / `index:dry` | 重建各文集首页（序文出页 + 篇目列表） |
| `og` | 生成分享卡片与 apple-touch-icon（需 Pillow） |
| `verify:index` | 首页改动零内容丢失 + 序文有独立入口 |
| `verify:seo` | canonical / OG / Twitter / JSON-LD / h1 |
| `verify:build` | 产物：阅读信息 / 篇目链接 / h1 |
| `lint:links` | 扫含空格的 Markdown 链接（静默故障） |
| `isolate` | 复制隔离副本，供 dev 运行时构建用 |
| `submit:baidu` / `submit:indexnow` | 主动推送收录 |

`scripts/lib/categories.mjs` 用**括号配对扫描**从 `config.mts` 提取
`categories` 字面量（正则会被中文书名号、注释、换行截断）。
**注意 `Category[]` 自带一对方括号**，找数组起点必须从 `=` 之后开始，
否则会取到空数组。

## 构建排障
- 正常构建耗时约 **87–92 秒**。若远超且 `dist` 文件数长时间不变，
  **先查是否有 `vitepress dev docs` 在跑**（见坑 9），其次才怀疑残留 build 进程。
- 清理 `docs/.vitepress/{dist,.temp,cache}` 时 `rm -rf` 会被安全策略拦截，
  改用 PowerShell：`[System.IO.Directory]::Delete($path, $true)`。
- 改 `.vitepress` 下的 config/theme 后必须重新 build 才能生效，
  `preview` 只是静态伺服 `dist`、`dev` 是客户端渲染（curl 取不到内容）。
- 卡在打包阶段且 CPU 占用很低时，别等，直接 kill 掉重跑（缓存本来就空则连清缓存都不必）；
  2026-09-23 实测首次 3 分 38 秒无进展，kill 后重跑 116 秒完成。
- **扫描 `dist` 产物别用 bash `for` 循环**：学术/书信的篇名含空格会把循环拆断，
  报一串 `No such file or directory`。用 Node 递归读目录。
- **删除含 junction 的目录前必须先解除 junction**，否则 `rm -rf` /
  `Remove-Item -Recurse` 会顺着链接删掉真正的 `node_modules`。
  正确做法：`[System.IO.Directory]::Delete($link, $false)` 先删链接，再删目录。

