import { defineConfig } from 'vitepress'
import type { HeadConfig } from 'vitepress'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const configDir = dirname(fileURLToPath(import.meta.url))
const docsRoot = resolve(configDir, '..')

const SITE_URL = 'https://luxunwenji.com'
const SITE_NAME = '鲁迅文集'

/**
 * 搜索引擎站长平台的所有权验证码。
 *
 * 优先读环境变量，其次用下面写死的值；**两者都为空则不输出该 meta**
 * （空标签会被站长平台判定为验证失败，还不如不输出）。
 *
 * - Google Search Console：选「HTML 标记」方式，取 content="..." 里的值
 * - 百度搜索资源平台：选「HTML 标签验证」，把 code-xxxxxx 整串填进来
 *
 * 例：GOOGLE_SITE_VERIFICATION=abc123 BAIDU_SITE_VERIFICATION=code-xyz789 npm run docs:build
 */
const SEARCH_CONSOLE = {
  google: process.env.GOOGLE_SITE_VERIFICATION || '',
  baidu: process.env.BAIDU_SITE_VERIFICATION || '',
}

/** 生成站长平台验证 meta（缺省则不生成） */
function verificationTags(): HeadConfig[] {
  const tags: HeadConfig[] = []
  if (SEARCH_CONSOLE.google) {
    tags.push([
      'meta',
      { name: 'google-site-verification', content: SEARCH_CONSOLE.google },
    ])
  }
  if (SEARCH_CONSOLE.baidu) {
    tags.push([
      'meta',
      { name: 'baidu-site-verification', content: SEARCH_CONSOLE.baidu },
    ])
  }
  return tags
}

interface Collection {
  dir: string
  text: string
  /** 篇目顺序：按文件名（不含 .md）列出；未列出的排在末尾并按文件名补足 */
  order?: string[]
}

interface Category {
  text: string
  collections: Collection[]
}

const categories: Category[] = [
  {
    text: '小说',
    collections: [
      {
        dir: 'novels/nahan',
        text: '《呐喊》',
        order: [
          '自序', '狂人日记', '孔乙己', '药', '明天', '一件小事', '头发的故事',
          '风波', '故乡', '阿Q正传', '端午节', '白光', '兔和猫', '鸭的喜剧', '社戏',
        ],
      },
      {
        dir: 'novels/panghuang',
        text: '《彷徨》',
        order: [
          '祝福', '在酒楼上', '幸福的家庭', '肥皂', '长明灯', '示众', '高老夫子',
          '孤独者', '伤逝', '弟兄', '离婚',
        ],
      },
      {
        dir: 'novels/gushi-xinbian',
        text: '《故事新编》',
        order: ['序言', '补天', '奔月', '理水', '采薇', '铸剑', '出关', '非攻', '起死'],
      },
    ],
  },
  {
    text: '散文',
    collections: [
      {
        dir: 'prose/zhaohua-xishi',
        text: '《朝花夕拾》',
        order: [
          '小引', '狗·猫·鼠', '阿长与《山海经》', '《二十四孝图》', '五猖会',
          '无常', '从百草园到三味书屋', '父亲的病', '琐记', '藤野先生', '范爱农', '后记',
        ],
      },
      {
        dir: 'prose/yecao',
        text: '《野草》',
        order: [
          '题辞', '秋夜', '影的告别', '求乞者', '我的失恋', '复仇', '复仇（其二）',
          '希望', '雪', '风筝', '好的故事', '过客', '死火', '狗的驳诘', '失掉的好地狱',
          '墓碣文', '颓败线的颤动', '立论', '死后', '这样的战士', '聪明人和傻子和奴才', '腊叶', '淡淡的血痕中', '一觉',
        ],
      },
    ],
  },
  {
    text: '杂文',
    collections: [
      {
        dir: 'essays/fen',
        text: '《坟》',
        order: [
          '题记', '人之历史', '科学史教篇', '文化偏至论', '摩罗诗力说', '我之节烈观',
          '我们现在怎样做父亲', '宋民间之所谓小说及其后来', '娜拉走后怎样', '未有天才之前',
          '论雷峰塔的倒掉', '说胡须', '论照相之类', '再论雷峰塔的倒掉', '看镜有感',
          '春末闲谈', '灯下漫笔', '杂忆', '论“他妈的！”', '论睁了眼看', '从胡须说到牙齿',
          '坚壁清野主义', '寡妇主义', '论“费厄泼赖”应该缓行', '写在《坟》后面',
        ],
      },
      {
        dir: 'essays/refeng',
        text: '《热风》',
        order: ['题记'],
      },
      { dir: 'essays/huagai', text: '《华盖集》', order: ['题记'] },
      { dir: 'essays/huagai-xubian', text: '《华盖集续编》', order: ['小引'] },
      { dir: 'essays/erji', text: '《而已集》' },
      { dir: 'essays/sanxian', text: '《三闲集》', order: ['序言'] },
      { dir: 'essays/erxin', text: '《二心集》', order: ['序言'] },
      { dir: 'essays/nanqiang-beidiao', text: '《南腔北调集》', order: ['题记'] },
      { dir: 'essays/wei-ziyou', text: '《伪自由书》' },
      { dir: 'essays/zhun-fengyue', text: '《准风月谈》' },
      { dir: 'essays/huabian', text: '《花边文学》', order: ['序言'] },
      { dir: 'essays/qiejieting', text: '《且介亭杂文》', order: ['序言'] },
      { dir: 'essays/qiejieting-2', text: '《且介亭杂文二集》', order: ['序言'] },
      { dir: 'essays/qiejieting-mo', text: '《且介亭杂文末编》' },
      { dir: 'essays/jiwaiji', text: '《集外集》', order: ['序言'] },
      { dir: 'essays/jiwaiji-shiyi', text: '《集外集拾遗》' },
    ],
  },
  {
    text: '学术',
    collections: [
      {
        dir: 'academic/zhongguo-xiaoshuo',
        text: '《中国小说史略》',
        // 文件名用中文数字编号，按文件名排序会乱序
        // （第七篇 < 第三篇 < 第九篇 < 第二十一篇），故显式列出
        order: [
          '序言', '题记',
          '第一篇 史家对于小说之著录及论述', '第二篇 神话与传说', '第三篇 《汉书》《艺文志》所载小说',
          '第四篇 今所见汉人小说', '第五篇 六朝之鬼神志怪书（上）', '第六篇 六朝之鬼神志怪书（下）',
          '第七篇 《世说新语》与其前后', '第八篇 唐之传奇文（上）', '第九篇 唐之传奇文（下）',
          '第十篇 唐之传奇集及杂俎', '第十一篇 宋之志怪及传奇文', '第十二篇 宋之话本',
          '第十三篇 宋元之拟话本', '第十四篇 元明传来之讲史（上）', '第十五篇 元明传来之讲史（下）',
          '第十六篇 明之神魔小说（上）', '第十七篇 明之神魔小说（中）', '第十八篇 明之神魔小说（下）',
          '第十九篇 明之人情小说（上）', '第二十篇 明之人情小说（下）',
          '第二十一篇 明之拟宋市人小说及后来选本', '第二十二篇 清之拟晋唐小说及其支流',
          '第二十三篇 清之讽刺小说', '第二十四篇 清之人情小说', '第二十五篇 清之以小说见才学者',
          '第二十六篇 清之狭邪小说', '第二十七篇 清之侠义小说及公案', '第二十八篇 清末之谴责小说',
        ],
      },
    ],
  },
  {
    text: '书信',
    collections: [
      {
        dir: 'letters/liangdi-shu',
        text: '《两地书》',
        // 同上：序号为中文数字，须显式排序
        order: [
          '序言',
          '第一集 北京_一', '第一集 北京_二', '第一集 北京_三', '第一集 北京_四', '第一集 北京_五',
          '第一集 北京_六', '第一集 北京_七', '第一集 北京_八', '第一集 北京_九', '第一集 北京_一〇',
          '第一集 北京_一一', '第一集 北京_一二', '第一集 北京_一三', '第一集 北京_一四',
          '第一集 北京_一五', '第一集 北京_一六', '第一集 北京_一七', '第一集 北京_一八',
          '第一集 北京_一九', '第一集 北京_二〇', '第一集 北京_二一', '第一集 北京_二二',
          '第一集 北京_二三', '第一集 北京_二四', '第一集 北京_二五', '第一集 北京_二六',
          '第一集 北京_二七', '第一集 北京_二八', '第一集 北京_二九', '第一集 北京_三〇',
          '第一集 北京_三一', '第一集 北京_三二', '第一集 北京_三三', '第一集 北京_三四',
          '第一集 北京_三五',
        ],
      },
    ],
  },
]

/* ---------------------------------------------------------------------------
   元数据读取
   构建期间同一文件会被多次查询（侧边栏一次、transformPageData 每页若干次），
   这里做一层进程内缓存，避免重复读盘，也保证返回值稳定。
   --------------------------------------------------------------------------- */
const metaCache = new Map<string, { title: string; volume: string; excerpt: string }>()

function loadMeta(dir: string, file: string) {
  const key = `${dir}/${file}`
  const hit = metaCache.get(key)
  if (hit) return hit

  let title = file.replace(/\.md$/, '')
  let volume = ''
  let excerpt = ''

  try {
    const raw = readFileSync(resolve(docsRoot, dir, file), 'utf8')
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (fm) {
      const t = fm[1].match(/^title:\s*(.+)$/m)
      const v = fm[1].match(/^volume:\s*(.+)$/m)
      if (t) title = t[1].trim().replace(/^["']|["']$/g, '')
      if (v) volume = v[1].trim().replace(/^["']|["']$/g, '')
    }
    const body = raw
      .replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
      .replace(/<br\s*\/?>/gi, '')
      .replace(/[#*>`[\]()]/g, '')
      .replace(/\s+/g, '')
      .trim()
    excerpt = body.slice(0, 80)
  } catch {
    /* 读不到就用文件名兜底 */
  }

  const value = { title, volume, excerpt }
  metaCache.set(key, value)
  return value
}

/**
 * 按目录排序篇目。
 * 若文集配置了 order，则严格按 order 排列，未列入的按文件名追加在后。
 */
function orderFiles(col: Collection, files: string[]) {
  const names = files.filter((f) => f !== 'index.md').map((f) => f.replace(/\.md$/, ''))
  if (!col.order?.length) {
    return names.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }
  const ranked = col.order.filter((n) => names.includes(n))
  const rest = names
    .filter((n) => !col.order!.includes(n))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
  return [...ranked, ...rest]
}

/**
 * 按分类生成 MultiSidebar 配置。
 *
 * VitePress 的 sidebar 只接受「数组」或「以路径为键的对象」两种形式，
 * 不接受函数。用对象形式（键为路径前缀）可以让每一页只携带
 * 自己所属分类的侧边栏 —— 若全站共用一份 570 条的列表，
 * 单页 HTML 会白白多出 200KB+，构建也明显变慢。
 */
function buildSidebar() {
  const sidebar: Record<string, unknown[]> = {}

  const prefixes: Record<string, string> = {
    小说: '/novels/',
    散文: '/prose/',
    杂文: '/essays/',
    学术: '/academic/',
    书信: '/letters/',
  }

  for (const cat of categories) {
    const prefix = prefixes[cat.text]
    if (!prefix) continue

    sidebar[prefix] = [
      {
        text: cat.text,
        items: cat.collections.map((col) => {
          let files: string[] = []
          try {
            files = readdirSync(resolve(docsRoot, col.dir)).filter((f) => f.endsWith('.md'))
          } catch {
            return { text: col.text, collapsed: false, items: [] }
          }

          const hasIndex = files.includes('index.md')
          const items = orderFiles(col, files).map((name) => {
            const { title } = loadMeta(col.dir, `${name}.md`)
            return { text: title, link: `/${col.dir}/${name}` }
          })

          return {
            text: col.text,
            link: hasIndex ? `/${col.dir}/` : undefined,
            collapsed: false,
            items,
          }
        }),
      },
    ]
  }

  // 注意：不要加 '/' 键。VitePress 按路径前缀匹配，
  // '/' 会匹配所有页面；首页本就不需要侧边栏
  // （已在 index.md 的 frontmatter 中设 sidebar: false）。
  return sidebar
}

/** 构建期统计不在此计算，由 scripts/gen-stats.mjs 生成给首页使用 */

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: SITE_NAME,
  description:
    '鲁迅作品在线阅读：《呐喊》《彷徨》《故事新编》《朝花夕拾》《野草》及十六部杂文集全文。',
  cleanUrls: true,
  sitemap: { hostname: SITE_URL },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['meta', { name: 'author', content: '鲁迅' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    // 站长平台验证（Google / 百度），未配置验证码时不输出
    ...verificationTags(),
  ],
  markdown: {
    theme: { light: 'github-light', dark: 'github-dark' },
  },
  themeConfig: {
    siteTitle: SITE_NAME,
    outline: { level: [2, 3], label: '本页目录' },
    nav: [
      { text: '首页', link: '/' },
      { text: '小说', link: '/novels/nahan/' },
      { text: '散文', link: '/prose/yecao/' },
      { text: '杂文', link: '/essays/fen/' },
      { text: '学术', link: '/academic/zhongguo-xiaoshuo/' },
      { text: '书信', link: '/letters/liangdi-shu/' },
      { text: '关于', link: '/about' },
    ],
    // 顶栏站点标题左侧的方形标识
    logo: '/favicon.svg',
    sidebar: buildSidebar(),
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 1 },
          },
        },
      },
    },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: false,
    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    outlineTitle: '本页目录',
    externalLinkIcon: false,
    footer: {
      message: '本站内容为鲁迅作品，属公共领域 · <a href="/about">关于本站</a>',
      copyright: '仅供学习研究',
    },
  },
  transformPageData(pageData) {
    // 注意：本钩子对同一页面会被调用多次（客户端与 SSR 各一次），
    // 因此所有写入都必须幂等 —— 不可累加数组。
    const relPath = pageData.relativePath.replace(/\.md$/, '')
    const dir = relPath.includes('/') ? relPath.slice(0, relPath.lastIndexOf('/')) : ''
    const name = relPath.split('/').pop() || ''

    const meta = dir ? loadMeta(dir, `${name}.md`) : { title: '', volume: '', excerpt: '' }

    if (!pageData.frontmatter.title && meta.title) {
      pageData.frontmatter.title = meta.title
    }

    if (!pageData.description) {
      const fmTitle = (pageData.frontmatter.title as string) || pageData.title || ''
      const fmVolume = (pageData.frontmatter.volume as string) || meta.volume
      const parts: string[] = []
      if (fmVolume) parts.push(`《${fmVolume.replace(/^《|》$/g, '')}》`)
      if (fmTitle) parts.push(fmTitle)
      const head = parts.length ? parts.join(' · ') : SITE_NAME
      pageData.description = meta.excerpt
        ? `${head}。${meta.excerpt}`
        : `${head} — ${SITE_NAME}，鲁迅作品在线阅读。`
    }

    // 首页不必输出文章型的 canonical
    if (relPath === 'index') {
      pageData.frontmatter.head = [['link', { rel: 'canonical', href: `${SITE_URL}/` }]]
      return
    }

    // canonical 直接赋值而非追加，保证多次调用结果一致
    pageData.frontmatter.head = [
      ['link', { rel: 'canonical', href: `${SITE_URL}/${relPath}` }],
    ]
  },
})
