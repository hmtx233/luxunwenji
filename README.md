# 鲁迅文集

鲁迅作品在线阅读站点，基于 [VitePress](https://vitepress.dev) 构建，正文排版采用 [赫蹏（heti）](https://github.com/sivan/heti)。

线上地址：<https://luxunwenji.com>

## 收录内容

| 类别 | 文集 |
| --- | --- |
| 小说 | 《呐喊》《彷徨》《故事新编》 |
| 散文 | 《朝花夕拾》《野草》 |
| 杂文 | 《坟》《热风》《华盖集》《华盖集续编》《而已集》《三闲集》《二心集》《南腔北调集》《伪自由书》《准风月谈》《花边文学》《且介亭杂文》《且介亭杂文二集》《且介亭杂文末编》《集外集》《集外集拾遗》 |
| 学术 | 《中国小说史略》 |
| 书信 | 《两地书》 |

共计 23 部文集、570 余篇。

## 本地开发

```bash
npm install
npm run docs:dev      # 启动开发服务器
npm run docs:build    # 构建生产产物到 docs/.vitepress/dist
npm run docs:preview  # 本地预览构建产物

npm run stats         # 重新统计篇目/字数，写入首页数据
npm run index         # 由 config.mts 重建各文集首页（序文出页 + 篇目列表）
npm run index:dry     # 同上，只打印改动不落盘
npm run og            # 生成社交分享卡片 og:image 与方形应用图标（需 Pillow）
npm run verify:index  # 校验首页改动无内容丢失、序文仍有独立入口
npm run verify:seo    # 校验 canonical / Open Graph / Twitter / JSON-LD
npm run lint:links    # 扫描链接目标含空格的写法（会在 Markdown 里静默失效）
npm run verify:build  # 校验构建产物：阅读信息、篇目链接、h1 唯一性
npm run isolate       # 复制一份隔离副本，供 dev server 运行时构建用
npm run submit:baidu  # 向百度主动推送 sitemap 里的 URL（需 token，见「搜索引擎收录」）
npm run submit:indexnow  # 向 Bing/Yandex 等推送（IndexNow 协议，见「搜索引擎收录」）
```

> `npm run og` 需要 Python + Pillow。Node 侧没有可用的图像库，不值得为此引依赖；
> 安装：`pip install Pillow`，或用 `PYTHON=/path/to/python npm run og` 指定解释器。
> 卡片缺失时会自动回退到站点默认图，不影响构建。

> ⚠️ **`vitepress dev` 与 `vitepress build` 不能同时运行。**
> 两者共用 `docs/.vitepress/cache` 与 `.temp`，并发会互相锁死，
> 表现为构建卡在 "building client + server bundles" 十几分钟不动。
> 若开发服务器正在跑又要构建，用 `npm run isolate` 复制一份到
> `D:\_lx-verify`（约 4MB，自动链好 node_modules）再在那里构建。
>
> 另：正常构建约 90 秒。若远超此值且 `dist` 文件数长时间不变，
> 先排查是否有残留的 build/dev 进程在抢占缓存。

> 注：本机 `npm run` 可能因安全策略拦截 `wsl.exe` 而失败，
> 此时直接用 `node node_modules/vitepress/bin/vitepress.js build docs` 亦可。
> 正常构建耗时约 90 秒；若远超此值且 `dist` 文件数长时间不变，
> 多为上一轮构建进程残留造成 IO 竞争，杀掉重跑即可。

## 目录结构

```
docs/
├── .vitepress/
│   ├── config.mts        # 站点配置（导航、侧边栏、排序、SEO、搜索）
│   └── theme/
│       ├── index.ts      # 注册 HomePage 与文章标题组件
│       ├── custom.css    # 中文阅读版式（字体、缩进、标题、表格）
│       ├── HomePage.vue  # 首页
│       ├── ArticleTitle.vue  # 文章页居中标题
│       └── home-data.mts / site-stats.mjs  # 首页数据
├── public/
│   ├── robots.txt
│   └── favicon.svg
├── index.md              # 首页
├── about.md              # 关于本站（建站初心 / 编排原则 / 版权）
├── novels/               # 小说
├── prose/                # 散文
├── essays/               # 杂文
├── academic/             # 学术
└── letters/              # 书信
```

## 内容约定

每篇 Markdown 使用如下 frontmatter：

```yaml
---
title: 狂人日记
volume: 呐喊
---
```

- `title` — 篇名，用于侧边栏与页面标题
- `volume` — 所属文集，用于 SEO 描述

### 段落与换行

原始文本源自 txt 转录，正文中存在三类结构，编辑时请注意区分：

- **普通段落** — 段内直接书写即可，源文件已按自然段分好（段间空行）
- **对话体** — 作者刻意的分行节奏，用 `<br>` 承接连贯对白
- **韵文 / 诗歌** — 使用 `>` 引用块，样式上居中呈现

### 文末写作日期

落款形如「一九二〇年十月。」的段落，已统一包裹为：

```html
<p class="writing-date">一九二〇年十月。</p>
```

由 `custom.css` 控制为另起一行、右对齐。新增文章时照此写法即可；
若日期是嵌在长段落末尾（如同一段叙述的结尾），则保持内联，不做包裹。

### 字数与阅读时间

文章页标题下方会自动显示「4,811 字 · 阅读约 12 分钟」，**无需在正文里手写**：

- **字数** — 由 `config.mts` 的 `loadMeta()` 在构建期统计
  （去掉 frontmatter、HTML 标签与空白后的字符数，保留标点）
- **阅读时间** — 按 400 字/分钟四舍五入，最少 1 分钟
- 两者经 `transformPageData` 注入 `frontmatter.chars` / `frontmatter.minutes`，
  再由 `ArticleTitle.vue` 渲染

想调整速度，改 `config.mts` 里 `Math.round(meta.chars / 400)` 的除数即可。

## 链接写法（重要）

**链接目标里不能出现空格。** CommonMark 的链接目标遇到空白即终止解析，
markdown-it 解析失败后会**把整段 `[文字](/路径 带空格)` 当成纯文本输出** ——
既不可点击，也不会进 VitePress 的死链检查，属于静默故障。

学术（`第一篇 史家…`）与书信（`第一集 北京_一`）的文件名含空格，必须写成：

```markdown
- [第一篇 史家对于小说之著录及论述](/academic/zhongguo-xiaoshuo/第一篇%20史家对于小说之著录及论述)
```

即把空格编码成 `%20`（中文本身保持明文即可，与其余文集一致）。
`scripts/build-index.mjs` 已自动处理；改动后可运行 `npm run lint:links` 全站复检。

## 自定义篇目顺序

侧边栏顺序由 `docs/.vitepress/config.mts` 中每个文集的 `order` 数组控制：

```ts
{
  dir: 'novels/nahan',
  text: '《呐喊》',
  order: ['自序', '狂人日记', '孔乙己', /* … 按实际篇序排列 */],
}
```

- 数组里写**文件名**（不含 `.md`），按书写顺序渲染
- 未列入 `order` 的文件自动追加在末尾，按拼音排序
- 想调整篇序，只改这一处即可，无需重命名文件

改了 `order` 之后要同步更新文集首页的「篇目」列表，运行：

```bash
npm run index         # 由 order 重建各文集首页的篇目列表
npm run verify:index  # 检查有无遗漏、标题与引言是否被误改
```

### 中文数字命名的文集（重要）

学术（《中国小说史略》）与书信（《两地书》）的文件名用**中文数字**编号。
这类文件名按拼音/字典序排会乱得很彻底：

```
第七篇 < 第三篇 < 第九篇 < 第二十一篇   ← 字典序，错的
第一篇 < 第二篇 < 第三篇 < … < 第二十八篇 ← 期望顺序
```

因此这两部文集**必须显式写 `order`**，不能依赖文件名排序。
新增同类命名（如「第八十一篇」）时，记得同时补进 `order` 数组，
否则它会掉到列表末尾。

### 文集首页

每部文集目录下均有 `index.md`，只保留两件事：文集简介（引言）与篇目列表。

**序文不在首页出现。** 题记、序言、小引一类内容都另有独立文章，
首页若再整段照抄，等于同一篇文字有两个可访问 URL —— 既是重复内容，
也会稀释首页的搜索权重。序文作为篇目的第一条列出，点进去就是独立页面。

这两件事都由 `npm run index` 生成，**不要手工编辑**：

```bash
npm run index         # 移除首页序文段 + 按 order 重建篇目列表
npm run verify:index  # 校验：标题与引言零改动，被移出的序文都有独立入口
```

新增文集时需同步在 `config.mts` 的 `categories` 中登记，否则不会出现在导航与侧边栏。

## 关于页

`docs/about.md` 介绍建站初心、编排原则、版权说明与反馈方式。
版权部分对「原著内容」（公有领域）与「整理成果」（CC BY-NC 4.0）分别作了说明。
导航栏与页脚均有入口。修改收录规模后记得同步更新页内的统计表。

## 部署

站点为纯静态产物，构建后把 `docs/.vitepress/dist` 整个目录部署到静态托管即可。

已在配置中启用：

- `cleanUrls: true` — 链接不带 `.html` 后缀
- `sitemap` — 构建时自动生成 `sitemap.xml`
- `transformPageData` — 为每页生成独立的 `description`、`canonical`，
  以及 Open Graph / Twitter Card / JSON-LD（见「社交分享与结构化数据」）

部署后请确认 `dist/sitemap.xml` 已生成（约 595 条 URL，见下文「搜索引擎收录」）。

## 社交分享与结构化数据

`transformPageData` 会为每一页产出完整的一组社交与结构化数据，
全部**直接赋值而非累加**（该钩子每页会执行多次，累加会让构建从 90 秒涨到十几分钟）：

| 项目 | 说明 |
| --- | --- |
| `canonical` | 百分号编码、与 sitemap 写法一致；文集首页带尾斜杠，文章页不带 |
| Open Graph | `og:type`（文章页为 `article`）、`og:title/description/url`、`og:image` 含尺寸与 alt |
| Twitter Card | `summary_large_image`，复用同一张图 |
| JSON-LD | 首页 `WebSite`；文集首页 `Book`；文章页 `Article` + `isPartOf: Book`；均附 `BreadcrumbList` |

`og:image` 指向 `docs/public/og/` 下的卡片，**每部文集一张**，
由 `npm run og` 生成（1200×630，纸白底 + 鲁迅红，标题用宋体）。
同一条命令还会生成方形的 `apple-touch-icon.png`。

卡片文件不存在时自动回退到站点默认图 `/og.png`，因此**漏跑该脚本不会导致构建失败**。

改完 SEO 相关代码后跑一次：

```bash
npm run og           # 需要时重新生成卡片
npm run verify:seo   # 校验 canonical / OG / Twitter / JSON-LD / h1 唯一性
```

## 搜索引擎收录

### 已就绪的部分

- `docs/public/robots.txt` — `Allow: /` 并指向 sitemap，构建后位于站点根目录
- `sitemap.xml` — 构建时由 `sitemap: { hostname }` 自动生成，约 595 条 URL
- 每页独立 `description` 与 `canonical`（由 `transformPageData` 生成）
- 站长平台验证 meta（默认**不输出**，需配置验证码，见下）

### 1. 填验证码

验证码支持环境变量（推荐，不进仓库）或直接写在 `config.mts` 的 `SEARCH_CONSOLE`：

```bash
GOOGLE_SITE_VERIFICATION=<GSC 给的 content 值> \
BAIDU_SITE_VERIFICATION=<code-xxxxxx> \
BING_SITE_VERIFICATION=<Bing 给的 content 值> \
  node node_modules/vitepress/bin/vitepress.js build docs
```

- **Google Search Console**：添加资源选「网址前缀」`https://luxunwenji.com` →
  验证方式选「HTML 标记」→ 复制 `content="…"` 里的值
- **百度搜索资源平台**：添加站点 `https://luxunwenji.com` →
  验证方式选「HTML 标签验证」→ 把 `code-xxxxxx` 整串填进来
- **Bing 网站管理员工具**：选「HTML Meta 标签」→ 复制 `content="…"` 里的值
  （它渲染为 `msvalidate.01`）。也可改用「从 Google Search Console 导入」，
  那种方式不需要本 meta

三者都留空时不会渲染空 meta 标签（空标签会被判定为验证失败）。
改完记得重新 build 并部署，再回站长平台点「验证」。

### 2. 提交 sitemap / 链接

**Google**

- Search Console →「站点地图」提交 `sitemap.xml`（完整地址 `https://luxunwenji.com/sitemap.xml`）
- 新站收录慢，可用「网址检查 → 请求编入索引」手动催几个核心页
  （如 `/`、`/novels/nahan/狂人日记`）

**百度**（三种方式，建议全开）

1. 「普通收录 → sitemap」提交 `https://luxunwenji.com/sitemap.xml`
2. 「普通收录 → API 提交」拿 token，用本站脚本主动推送：

   ```bash
   npm run submit:baidu -- --token=<token> --limit 10   # 先用 10 条试
   npm run submit:baidu -- --token=<token>              # 确认无误再全量（595 条）
   npm run submit:baidu -- --dry-run                    # 只看会推什么，不联网
   ```

   脚本从 `dist/sitemap.xml` 读 URL（也可 `--sitemap=<本地路径|URL>`），
   每批 100 条推送，并打印当日剩余配额 `remain`；配额为 0 会自动停。
3. 「普通收录 → 手动提交」把几个重点页面贴进去（新站配额通常只有几条/天）

**Bing**（推荐直接用 IndexNow，见下一节）

- Bing 网站管理员工具 →「站点地图」提交 `https://luxunwenji.com/sitemap.xml`
- 「URL 提交」有每日配额，用 IndexNow 更省事

> ⚠️ **百度收录的现实情况**：百度对**未 ICP 备案**的站点收录意愿很低，
> 且本站托管在境外（Cloudflare），百度爬虫抓取速度和频次都会打折。
> 想认真做百度，需要域名备案 + 国内节点；否则以 Google / Bing 为主更实际。

### 3. IndexNow（Bing / Yandex / Naver / Seznam 共用）

IndexNow 只需提交一次，参与协议的引擎会互通；**Google 不支持 IndexNow**，
其 sitemap ping 接口也已在 2023 年下线，所以 Google 侧只能靠 Search Console 手动提交。

原理：把一个密钥文本放在站点根（`https://luxunwenji.com/<key>.txt`，内容即密钥），
之后向接口 POST 就能宣告「这些 URL 变了」。本站把它放在 `docs/public/`，随站点一起部署。

```bash
npm run submit:indexnow -- --generate   # 只需一次：生成 docs/public/<key>.txt 密钥文件
# → 构建并部署，确认密钥可访问：
curl -s https://luxunwenji.com/<key>.txt   # 应原样返回密钥

npm run submit:indexnow -- --dry-run    # 只看会提交什么，不联网
npm run submit:indexnow --              # 全量提交（595 条，单批完成）
npm run submit:indexnow -- --limit 20   # 或只提交前 20 条
```

- 端点默认 `https://api.indexnow.org/indexnow`（协议枢纽，会转发给所有参与引擎）；
  实际用 Bing 时建议直接打 `--endpoint=https://www.bing.com/indexnow`
- 返回码：`200` / `202` 成功（202 = 已接收，密钥待校验）、
  `403` 密钥无效（密钥文件未部署或内容不一致）、`422` URL 不属于该 host、
  `429` 提交过于频繁
- 密钥文件没部署就提交会返回 `403 SiteVerificationNotCompleted`，属预期

> ⚠️ **本站实测（2026-09-21）**：密钥文件已可访问（`curl` 返回密钥本身，
> bingbot / IndexNow UA 都是 200）的情况下，
> `api.indexnow.org` 仍持续返回 `403 SiteVerificationNotCompleted`，
> 而改用 `--endpoint=https://www.bing.com/indexnow` **立即 200 成功**（595 条已全部提交）。
> 结论：Bing 走它自己的端点，枢纽端点可以晚些再试。

## 版面与字体

正文排版由 `theme/custom.css` 统一定义，**不依赖运行时 JS**（避免 SSR 首屏闪样式）：

- **正文字体** — 系统无衬线栈 `-apple-system → PingFang SC → Hiragino Sans GB → Microsoft YaHei`
- **字号 / 行高 / 字距** — `17px / 1.7 / 0.03em`（移动端 16.5px）
- **版心宽度** — `.content > .content-container { max-width: 42em }`，每行约 30–40 字
- **首行缩进** — `.vp-doc > div > p { text-indent: 2em }`，正文里不要手写空格

> ⚠️ 两个易错点：
>
> 1. **限宽要写在 `.content-container` 上**，它是 `.vp-doc` 的**父级**
>    （`.content > .content-container > main.main > .vp-doc`）。
>    写成 `.vp-doc .content-container` 是后代选择器，**永远不命中**；
>    同时 `.vp-doc` 自身不能再限宽，否则会先一步把行宽截断。
> 2. heti 的字体靠**类名**驱动（`.heti--song` / `.heti--kai` / `.heti--hei`），
>    `@font-face` 里的 `"Heti Song"` 只是 `local("Songti SC")` 的别名，**不声明不生效**。
>    本站已废弃运行时注入 `.heti` 类的方案，字体栈直接写在 `.vp-doc` 上。
>    若要改回宋体正文，把 `.vp-doc` 的 `font-family` 换成
>    `'Times New Roman', times, 'Heti Song', 'Songti SC', 'SimSun', serif` 即可。

文章页顶部的居中标题由 `theme/ArticleTitle.vue` 提供，挂在 Layout 的
`doc-before` 插槽，结构为「卷名 · 标题 · 字数与阅读时间」。

**只在「目录下的文章」上出现**（路径形如 `<类别>/<文集>/<篇名>.md`），
因此以下页面自动跳过，不会出现两个 `<h1>`：

- 首页与自定义页（`layout: home|page`）
- 各文集的 `index.md` —— 正文自带 `# 文集名`
- `docs` 根目录下的独立页（如 `about.md`）—— 用各自的 markdown 标题

需要例外时在 frontmatter 写 `articleTitle: true` / `false` 即可覆盖。

## 许可

鲁迅作品已进入公共领域。站点的整理成果采用
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh) 协议共享。
