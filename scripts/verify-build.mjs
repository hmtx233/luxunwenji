/**
 * 校验隔离构建的产物：文章页的阅读信息、文集首页的链接与 h1 唯一性。
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(process.argv[2] || 'D:/_lx-verify', 'docs', '.vitepress', 'dist')

function html(rel) {
  return readFileSync(resolve(dist, rel), 'utf8')
}
function pick(re, s) {
  return (s.match(re) || [])[1]
}
function count(re, s) {
  return (s.match(re) || []).length
}
function decode(s) {
  return s.replace(/%20/g, '␠')
}

console.log('===== 一、文章页阅读信息 =====')
for (const rel of [
  'novels/nahan/狂人日记.html',
  'novels/nahan/孔乙己.html',
  'prose/yecao/秋夜.html',
  'essays/fen/摩罗诗力说.html',
]) {
  const h = html(rel)
  const vol = pick(/class="article-volume"[^>]*>([^<]*)</, h)
  const title = pick(/class="article-title"[^>]*>([^<]*)</, h)
  const read = pick(/class="article-reading"[^>]*>([^<]*)</, h)
  const h1 = count(/<h1/g, h)
  console.log(
    `  ${title || rel}\n    卷名: ${vol}   阅读: ${read}   h1=${h1} ${h1 === 1 ? '✓' : '✗'}`
  )
}

console.log('\n===== 二、文集首页（h1 应为 1，链接应可点击） =====')
for (const [label, rel, dir] of [
  ['学术', 'academic/zhongguo-xiaoshuo/index.html', '/academic/zhongguo-xiaoshuo/'],
  ['书信', 'letters/liangdi-shu/index.html', '/letters/liangdi-shu/'],
  ['小说·呐喊', 'novels/nahan/index.html', '/novels/nahan/'],
]) {
  const h = html(rel)
  const h1 = count(/<h1/g, h)
  const at = h.indexOf('篇目')
  const seg = h.slice(at, at + 80000)

  const anchors = [...seg.matchAll(/<a[^>]+href="([^"]*)"[^>]*>([^<]*)<\/a>/g)]
    .map((m) => ({ href: m[1], text: m[2] }))
    .filter((a) => a.href.startsWith(dir))

  const encoded = anchors.filter((a) => a.href.includes('%20')).length
  const leftover = count(/\]\(\/academic\/|\]\(\/letters\//g, seg)

  console.log(
    `  ${label}: h1=${h1} ${h1 === 1 ? '✓' : '✗ 重复'} | 锚点=${anchors.length} 含%20=${encoded} | 残留裸 markdown=${leftover} ${leftover === 0 ? '✓' : '✗'}`
  )
  const first = anchors[0]
  const last = anchors[anchors.length - 1]
  if (first) console.log(`     ${first.text} → ${decode(first.href)}`)
  if (last) console.log(`     ${last.text} → ${decode(last.href)}`)
}
