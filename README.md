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
npm run order         # 按 config.mts 的 order 重排文集首页的「篇目」列表
npm run verify:order  # 校验各文集排序结果与覆盖率
```

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
npm run order        # 重排 index.md 的篇目列表
npm run verify:order # 检查有无遗漏、是否还有靠拼音兜底的条目
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

每部文集目录下均有 `index.md`，包含文集简介、前言（题记/序言/小引）与篇目列表。
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
- `transformPageData` — 为每页生成独立的 `description` 与 `canonical`

部署后请确认 `dist/sitemap.xml` 已生成，并向搜索引擎提交：

- 百度搜索资源平台 <https://ziyuan.baidu.com>
- Google Search Console <https://search.google.com/search-console>

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

文章页顶部的居中标题由 `theme/ArticleTitle.vue` 提供，
挂在 Layout 的 `doc-before` 插槽；首页与文集 index 通过
`layout: home|page` 自动隐藏。

## 许可

鲁迅作品已进入公共领域。站点的整理成果采用
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.zh) 协议共享。
