/**
 * 验证「学术 / 书信」的侧边栏顺序。
 * 直接读取 config.mts 中对应文集块，解析 order 数组，再套用 orderFiles 逻辑。
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const docsRoot = resolve(import.meta.dirname, '..', 'docs')
const cfg = readFileSync(resolve(docsRoot, '.vitepress', 'config.mts'), 'utf8')

/** 截取某个 dir 到下一个 `dir:` 之前的配置块 */
function blockOf(text, dir) {
  const at = text.indexOf(`dir: '${dir}'`)
  if (at < 0) return null
  const next = text.indexOf("dir: '", at + 5)
  return text.slice(at, next < 0 ? undefined : next)
}

function orderOf(block) {
  const at = block.indexOf('order:')
  if (at < 0) return []
  const open = block.indexOf('[', at)
  const close = block.lastIndexOf(']')
  return [...block.slice(open + 1, close).matchAll(/'([^']*)'/g)].map((m) => m[1])
}

function orderFiles(order, files) {
  const names = files.filter((f) => f !== 'index.md').map((f) => f.replace(/\.md$/, ''))
  if (!order.length) return names.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  const ranked = order.filter((n) => names.includes(n))
  const rest = names.filter((n) => !order.includes(n)).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  return [...ranked, ...rest]
}

for (const [label, dir] of [
  ['学术', 'academic/zhongguo-xiaoshuo'],
  ['书信', 'letters/liangdi-shu'],
]) {
  const block = blockOf(cfg, dir)
  if (!block) {
    console.log('!! 未找到配置块: ' + dir)
    continue
  }
  const order = orderOf(block)
  const files = readdirSync(resolve(docsRoot, dir)).filter((f) => f.endsWith('.md'))
  const final = orderFiles(order, files)
  const total = files.filter((f) => f !== 'index.md').length

  console.log('=== ' + label + '：' + final.length + ' 条 ===')
  final.slice(0, 6).forEach((t, i) => console.log('  ' + (i + 1) + '. ' + t))
  if (final.length > 8) {
    console.log('  …')
    final.slice(-2).forEach((t, i) => console.log('  ' + (final.length - 1 + i) + '. ' + t))
  }
  const fallback = final.filter((n) => !order.includes(n))
  console.log(
    '  order 条目 ' + order.length + ' / 实际 ' + total +
    ' 篇，拼音兜底 ' + fallback.length + (fallback.length ? ' → ' + fallback.join('、') : ' ✓')
  )
  console.log()
}
