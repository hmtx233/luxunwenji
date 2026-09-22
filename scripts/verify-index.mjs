#!/usr/bin/env node
/**
 * 校验 build-index.mjs 的改动没有丢内容。
 *
 * 对每个文集首页，比较「除 ## 篇目 与序文小节之外的部分」是否与备份完全一致
 * （去空白归一化后比较）。同时确认被移除的序文内容确实存在于同名的独立文章里。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = resolve(ROOT, 'docs')
const BACKUP = resolve(ROOT, '.workbuddy/backup-index2')

const PREFACE_TITLES = new Set(['序言', '自序', '题记', '题辞', '小引', '跋', '后记'])
const norm = (s) => s.replace(/\s+/g, '')

/** 去掉 frontmatter、## 篇目 段、以及序文段，剩下的应当是标题 + 引言 */
function keepHead(raw) {
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
  return body
    .split(/\n(?=## )/)
    .filter((part) => {
      const name = (part.split('\n', 1)[0].match(/^##\s+(.+?)\s*$/) || [])[1]
      return !name || name === '篇目' ? false : !PREFACE_TITLES.has(name)
    })
    .join('\n')
}

let bad = 0
let checked = 0
let prefaceOk = 0

for (const f of readdirSync(BACKUP)) {
  const [cat, dir] = f.replace(/\.md$/, '').split('__')
  const cur = resolve(DOCS, cat, dir, 'index.md')
  const old = readFileSync(resolve(BACKUP, f), 'utf8')
  const now = readFileSync(cur, 'utf8')

  checked++

  if (norm(keepHead(old)) !== norm(keepHead(now))) {
    console.log(`✗ 头部内容有差异: ${cat}/${dir}`)
    bad++
  }

  // 被移除的序文，其正文必须能在同名独立文章里找到
  for (const t of PREFACE_TITLES) {
    const art = resolve(DOCS, cat, dir, `${t}.md`)
    if (!existsSync(art)) continue
    if (!old.includes(`## ${t}`)) continue
    const sec = old.split(/\n(?=## )/).find((p) => p.startsWith(`## ${t}`))
    const secBody = norm(sec.replace(/^##[^\n]*\n/, '').replace(/^-{3,}[\s\S]*$/, ''))
    const artBody = norm(readFileSync(art, 'utf8').replace(/^---[\s\S]*?---/, ''))
    // 首页里被截断/加注的部分不一定完全等同，只要求核心段落能对上
    const probe = secBody.slice(0, 120)
    if (probe && !artBody.includes(probe)) {
      console.log(`  ⚠ ${cat}/${dir} 的序文「${t}」在独立文章中未找到对应正文`)
      bad++
    } else {
      prefaceOk++
    }
  }
}

console.log(`\n检查 ${checked} 个文集首页`)
console.log(`  头部一致性: ${bad === 0 ? '✓ 全部一致' : `✗ ${bad} 处异常`}`)
console.log(`  序文已落到独立文章: ${prefaceOk} 处`)
process.exit(bad === 0 ? 0 : 1)
