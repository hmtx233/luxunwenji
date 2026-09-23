#!/usr/bin/env node
/**
 * 校验构建产物的 SEO 元数据。
 *
 * 检查项：
 *   - canonical 是否存在、是否与 sitemap 里的写法一致（百分号编码、文集页带尾斜杠）
 *   - Open Graph 该有的标签是否齐全，且 **同一属性只出现一次**
 *   - Twitter Card 是否齐全
 *   - og:image 指向的文件是否真的存在
 *   - JSON-LD 是否可解析、@type 是否符合页面类型
 *   - 每页是否只有一个 <h1>
 *   - 访问统计埋点（GA_ID 非空时）是否覆盖了全部页面
 *
 * 用法：node scripts/verify-seo.mjs [构建目录，默认 docs]
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { DOCS } from './lib/categories.mjs'

const BUILD = process.argv[2] ? resolve(process.argv[2]) : resolve(DOCS, '..')
// 参数既可能是「项目根」也可能是「docs 目录」，两种都兼容
const DIST = existsSync(resolve(BUILD, 'docs/.vitepress/dist'))
  ? resolve(BUILD, 'docs/.vitepress/dist')
  : resolve(BUILD, '.vitepress/dist')

/** 待检查的代表性页面：首页 / 关于 / 文集首页 / 文章 / 带空格篇名的文章 */
const PAGES = [
  ['首页', 'index.html', 'website'],
  ['关于页', 'about.html', 'website'],
  ['文集首页', 'novels/nahan/index.html', 'website'],
  ['文章页', 'novels/nahan/狂人日记.html', 'article'],
  ['含空格篇名', 'academic/zhongguo-xiaoshuo/第一篇 史家对于小说之著录及论述.html', 'article'],
]

const REQUIRED_OG = [
  'og:type',
  'og:site_name',
  'og:locale',
  'og:title',
  'og:description',
  'og:url',
  'og:image',
  'og:image:width',
  'og:image:height',
]

const REQUIRED_TW = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']

function readHead(file) {
  const h = readFileSync(file, 'utf8')
  return h.slice(0, h.indexOf('</head>'))
}

function metas(head, attr) {
  const re = new RegExp(`<meta ${attr}="([^"]+)" content="([^"]*)"`, 'g')
  const out = []
  let m
  while ((m = re.exec(head))) out.push([m[1], m[2]])
  return out
}

let problems = 0
const fail = (msg) => {
  problems++
  console.log(`  ✗ ${msg}`)
}
const ok = (msg) => console.log(`  ✓ ${msg}`)

console.log(`校验目录: ${DIST}\n`)

for (const [label, rel, expectType] of PAGES) {
  const file = resolve(DIST, rel)
  console.log(`【${label}】${rel}`)
  if (!existsSync(file)) {
    fail('页面不存在')
    console.log()
    continue
  }
  const head = readHead(file)

  // --- canonical ---
  const canon = (head.match(/<link rel="canonical" href="([^"]*)"/) || [])[1]
  if (!canon) fail('缺少 canonical')
  else {
    const badTail = /\/index$/.test(canon)
    if (badTail) fail(`canonical 指向 index：${canon}`)
    else if (/[^\x00-\x7F]/.test(canon.replace(/^https?:\/\//, ''))) fail(`canonical 未编码：${canon}`)
    else ok(`canonical ${canon}`)
  }

  // --- Open Graph ---
  const og = metas(head, 'property')
  const ogMap = new Map()
  for (const [k, v] of og) ogMap.set(k, (ogMap.get(k) || 0) + 1)
  const missing = REQUIRED_OG.filter((k) => !ogMap.has(k))
  const dup = [...ogMap.entries()].filter(([, n]) => n > 1).map(([k]) => k)
  if (missing.length) fail(`缺 OG 标签: ${missing.join(', ')}`)
  if (dup.length) fail(`OG 标签重复: ${dup.join(', ')}`)
  if (!missing.length && !dup.length) ok(`Open Graph 齐全且无重复（${REQUIRED_OG.length} 项）`)

  const type = (head.match(/og:type" content="([^"]*)"/) || [])[1]
  if (type !== expectType) fail(`og:type 应为 ${expectType}，实际 ${type}`)
  else ok(`og:type = ${type}`)

  // --- Twitter ---
  const tw = metas(head, 'name')
  const twSet = new Set(tw.map(([k]) => k))
  const twMissing = REQUIRED_TW.filter((k) => !twSet.has(k))
  if (twMissing.length) fail(`缺 Twitter 标签: ${twMissing.join(', ')}`)
  else ok('Twitter Card 齐全')

  // --- og:image 文件是否存在 ---
  const img = (head.match(/og:image" content="([^"]*)"/) || [])[1] || ''
  const imgPath = img.replace(/^https?:\/\/[^/]+/, '')
  const local = resolve(DIST, decodeURIComponent(imgPath).replace(/^\//, ''))
  if (!img || !existsSync(local)) fail(`og:image 文件不存在: ${img}`)
  else ok(`og:image → ${imgPath}`)

  // --- JSON-LD ---
  const ld = (head.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
  ) || [])[1]
  if (!ld) fail('缺少 JSON-LD')
  else {
    try {
      const data = JSON.parse(ld.replace(/\\u003c/g, '<'))
      const types = (data['@graph'] || []).map((n) => n['@type'])
      if (!types.length) fail('JSON-LD @graph 为空')
      else ok(`JSON-LD @type = ${types.join(' + ')}`)
      if (expectType === 'article' && !types.includes('Article')) fail('文章页缺少 Article')
      // 首页只有一条 WebSite，不需要面包屑
      if (label !== '首页' && !types.includes('BreadcrumbList')) fail('缺少 BreadcrumbList')
    } catch (e) {
      fail(`JSON-LD 解析失败: ${e.message}`)
    }
  }

  // --- h1 唯一 ---
  const body = readFileSync(file, 'utf8')
  const h1 = (body.match(/<h1[^>]*>/g) || []).length
  if (h1 !== 1) fail(`<h1> 数量为 ${h1}，应为 1`)
  else ok('<h1> 唯一')

  console.log()
}

// --- canonical 与 sitemap 的一致性 ---
const smPath = resolve(DIST, 'sitemap.xml')
if (existsSync(smPath)) {
  const sm = readFileSync(smPath, 'utf8')
  const locs = new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
  let mismatch = 0
  for (const [, rel] of PAGES) {
    const file = resolve(DIST, rel)
    if (!existsSync(file)) continue
    const canon = (readHead(file).match(/<link rel="canonical" href="([^"]*)"/) || [])[1]
    if (canon && !locs.has(canon)) {
      fail(`canonical 不在 sitemap 中: ${canon}`)
      mismatch++
    }
  }
  if (!mismatch) ok(`canonical 与 sitemap 一致（sitemap 共 ${locs.size} 条）`)
}

// --- 访问统计埋点是否覆盖全站 ---
// GA_ID 从 config.mts 里读，留空时视为「未启用」直接跳过，
// 免得关掉统计之后校验脚本反而报错。
const configFile = resolve(DOCS, '.vitepress/config.mts')
const gaId = existsSync(configFile)
  ? (readFileSync(configFile, 'utf8').match(/const GA_ID = '([^']*)'/) || [])[1] || ''
  : ''
if (!gaId) {
  ok('访问统计未启用（config.mts 的 GA_ID 为空），跳过埋点检查')
} else {
  const pages = []
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = resolve(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (p.endsWith('.html')) pages.push(p)
    }
  }
  walk(DIST)
  const miss = pages.filter((p) => {
    const s = readFileSync(p, 'utf8')
    return !s.includes(gaId) || !s.includes('googletagmanager.com/gtag/js')
  })
  if (miss.length) {
    fail(`${miss.length}/${pages.length} 个页面缺少 ${gaId} 埋点，例：${miss[0].slice(DIST.length + 1)}`)
  } else {
    ok(`访问统计 ${gaId} 覆盖全部 ${pages.length} 个页面`)
  }
}

console.log(problems === 0 ? '\n全部通过 ✓' : `\n发现 ${problems} 个问题 ✗`)
process.exit(problems === 0 ? 0 : 1)
