#!/usr/bin/env node
/**
 * 重建各文集首页（docs/<类别>/<文集>/index.md）。
 *
 * 做两件事：
 *   1. 删掉首页里整段照抄的序文（序言 / 自序 / 题记 / 题辞 / 小引）——
 *      这些内容都另有独立文章，首页再抄一遍属于重复内容，
 *      既稀释了首页的关键词，也让同一篇文章有两个可访问 URL。
 *   2. 按 config.mts 里各文集的 order 重写「## 篇目」列表，
 *      序号即书序，链接指向独立文章。
 *
 * 幂等：可反复执行，结果一致。
 *
 * 用法：node scripts/build-index.mjs [--dry]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { DOCS, loadCategories } from './lib/categories.mjs'

const DRY = process.argv.includes('--dry')

/** 会被整段移出首页的序文小节名 */
const PREFACE_TITLES = new Set(['序言', '自序', '题记', '题辞', '小引', '跋', '后记'])

/** 文件名 → 带 %20 的链接段（中文保持明文，只编码空格） */
const toHref = (name) => name.replace(/ /g, '%20')

/** 按 order 排列篇目；未列入的按文件名（zh-CN）追加在后 */
function orderNames(order, names) {
  if (!order?.length) return [...names].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  const ranked = order.filter((n) => names.includes(n))
  const rest = names
    .filter((n) => !order.includes(n))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
  return [...ranked, ...rest]
}

/** 拆出 frontmatter 与正文 */
function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
  return m ? { fm: m[0], body: raw.slice(m[0].length) } : { fm: '', body: raw }
}

/**
 * 拆出「标题 + 引言」，丢掉需要重建的小节。
 *
 * 丢弃两类：
 *   - 序文（序言 / 自序 / 题记 / 题辞 / 小引）—— 另有独立文章，首页不再照抄
 *   - 旧的「篇目」—— 随后统一按 config 的 order 重新生成
 */
function stripSections(body) {
  const removed = []
  const parts = body.split(/\n(?=## )/)
  const kept = parts.filter((part, idx) => {
    if (idx === 0) return true
    // 取该段第一行的小节名；此处不能用 /^## (.+?)\s*$/（无 m 时 $ 会吞掉整段）
    const firstLine = part.split('\n', 1)[0]
    const name = (firstLine.match(/^##\s+(.+?)\s*$/) || [])[1]
    if (!name) return true
    if (name === '篇目') return false
    if (PREFACE_TITLES.has(name)) {
      removed.push(name)
      return false
    }
    return true
  })
  return { head: kept.join('\n').replace(/\s+$/, ''), removed }
}

const categories = loadCategories()
let changed = 0
let removedTotal = 0

for (const cat of categories) {
  for (const col of cat.collections) {
    const dirPath = resolve(DOCS, col.dir)
    const indexPath = resolve(dirPath, 'index.md')
    if (!existsSync(indexPath)) {
      console.warn(`  ⚠ 跳过（无 index.md）: ${col.dir}`)
      continue
    }

    const raw = readFileSync(indexPath, 'utf8')
    const { fm, body } = splitFrontmatter(raw)

    const names = readdirSync(dirPath)
      .filter((f) => f.endsWith('.md') && f !== 'index.md')
      .map((f) => f.replace(/\.md$/, ''))

    const { head, removed } = stripSections(body)
    const ordered = orderNames(col.order, names)
    const list = ordered.map((n) => `- [${n}](/${col.dir}/${toHref(n)})`).join('\n')

    const next = `${fm}${head}\n\n## 篇目\n\n${list}\n`

    if (next !== raw) {
      changed++
      removedTotal += removed.length
      if (!DRY) writeFileSync(indexPath, next, 'utf8')
      const missing = names.filter((n) => !ordered.includes(n))
      console.log(
        `  ${DRY ? '(dry) ' : ''}${col.dir.padEnd(30)} 篇目 ${String(ordered.length).padStart(3)}/${names.length} 条` +
          (removed.length ? `  移除序文: ${removed.join('/')}` : '') +
          (missing.length ? `  ⚠ 漏 ${missing.length}: ${missing.slice(0, 3).join(', ')}` : ''),
      )
    }
  }
}

console.log(`\n${DRY ? '[dry-run] ' : ''}共更新 ${changed} 个文集首页，移除序文小节 ${removedTotal} 处`)
