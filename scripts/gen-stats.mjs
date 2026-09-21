import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'D:/git-rep/luxunwenji/docs'

/** 与 config.mts 中的 categories 保持一致 */
const dirs = [
  'novels/nahan', 'novels/panghuang', 'novels/gushi-xinbian',
  'prose/zhaohua-xishi', 'prose/yecao',
  'essays/fen', 'essays/refeng', 'essays/huagai', 'essays/huagai-xubian',
  'essays/erji', 'essays/sanxian', 'essays/erxin', 'essays/nanqiang-beidiao',
  'essays/wei-ziyou', 'essays/zhun-fengyue', 'essays/huabian',
  'essays/qiejieting', 'essays/qiejieting-2', 'essays/qiejieting-mo',
  'essays/jiwaiji', 'essays/jiwaiji-shiyi',
  'academic/zhongguo-xiaoshuo', 'letters/liangdi-shu',
]

let articles = 0
let chars = 0
const byCategory = {}

const CATEGORY_OF = (d) => {
  const top = d.split('/')[0]
  return { novels: '小说', prose: '散文', essays: '杂文', academic: '学术', letters: '书信' }[top] || '其他'
}

for (const d of dirs) {
  let files = []
  try { files = readdirSync(join(ROOT, d)).filter((f) => f.endsWith('.md') && f !== 'index.md') }
  catch { continue }

  const cat = CATEGORY_OF(d)
  byCategory[cat] = byCategory[cat] || { collections: 0, articles: 0, chars: 0 }
  byCategory[cat].collections++

  for (const f of files) {
    articles++
    byCategory[cat].articles++
    const n = readFileSync(join(ROOT, d, f), 'utf8').replace(/\s/g, '').length
    chars += n
    byCategory[cat].chars += n
  }
}

const out = `/* 由 scripts/gen-stats.mjs 自动生成，请勿手动编辑 */
export const siteStats = ${JSON.stringify(
  { articles, collections: dirs.length, chars, byCategory },
  null,
  2,
)}
`
writeFileSync('D:/git-rep/luxunwenji/docs/.vitepress/theme/site-stats.mjs', out, 'utf8')
console.log(`统计: ${dirs.length} 部文集 / ${articles} 篇 / ${(chars / 10000).toFixed(1)} 万字`)
console.log(JSON.stringify(byCategory, null, 1))
