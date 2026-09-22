import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', 'docs')

const files = []
;(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.md')) files.push(p)
  }
})(root)

// 找出所有 markdown 链接目标中含空格/制表符的
const bad = []
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  const lines = src.split(/\r?\n/)
  lines.forEach((line, i) => {
    const re = /\]\((\/[^)]*[ \t][^)]*)\)/g
    let m
    while ((m = re.exec(line))) {
      bad.push({ file: f.replace(root + '\\', '').replace(/\\/g, '/'), line: i + 1, url: m[1] })
    }
  })
}

const byFile = new Map()
for (const b of bad) byFile.set(b.file, (byFile.get(b.file) || 0) + 1)

console.log('总 md 文件:', files.length)
console.log('受影响文件:', byFile.size)
for (const [f, n] of byFile) console.log('  ' + n + ' 处  ' + f)
console.log()
console.log('受影响链接总数:', bad.length)
console.log()
console.log('样例（前 3 条将被截断为）:')
for (const b of bad.slice(0, 3)) {
  const truncated = b.url.split(/[ \t]/)[0]
  console.log('  原: ' + b.url)
  console.log('  实际指向: ' + truncated + '   ← 断了')
}
