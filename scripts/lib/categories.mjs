/**
 * 从 docs/.vitepress/config.mts 里读取 categories 数组。
 *
 * 直接正则匹配 `order: [...]` 很脆：数组里含中文书名号、注释、换行，
 * 稍有不慎就截断。这里改为括号配对扫描（跳过字符串与行注释），
 * 取出完整的数组字面量后交给 Function 求值 —— 该字面量只有字符串与
 * 对象，不含任何外部引用，求值是安全的。
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export const DOCS = resolve(ROOT, 'docs')
export const CONFIG = resolve(DOCS, '.vitepress/config.mts')
export const SITE_URL = 'https://luxunwenji.com'
export const SITE_NAME = '鲁迅文集'

/** 分类名 → URL 前缀 */
export const CATEGORY_PREFIX = {
  小说: '/novels/',
  散文: '/prose/',
  杂文: '/essays/',
  学术: '/academic/',
  书信: '/letters/',
}

export function loadCategories() {
  const src = readFileSync(CONFIG, 'utf8')
  const marker = 'const categories: Category[] = ['
  const at = src.indexOf(marker)
  if (at < 0) throw new Error('未能在 config.mts 中定位 categories 数组')

  // 注意：必须从 `=` 之后再找 '['——`Category[]` 本身就含一对方括号，
  // 若直接 indexOf('[', at) 会命中类型标注，取到空的数组字面量。
  const eq = src.indexOf('=', at)
  const start = src.indexOf('[', eq)
  if (eq < 0 || start < 0) throw new Error('未能在 config.mts 中定位 categories 数组')

  let depth = 0
  let quote = null
  let i = start

  for (; i < src.length; i++) {
    const ch = src[i]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
      continue
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i)
      if (i < 0) break
      continue
    }
    if (ch === '[') depth++
    else if (ch === ']') {
      depth--
      if (depth === 0) break
    }
  }

  const literal = src.slice(start, i + 1)
  // eslint-disable-next-line no-new-func
  return new Function(`return ${literal}`)()
}
