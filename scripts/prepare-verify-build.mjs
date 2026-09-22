/**
 * 把 docs 复制到隔离目录，用于在 dev server 运行期间做生产构建验证。
 *
 * 原因：`vitepress dev` 与 `vitepress build` 共用 docs/.vitepress/cache
 * 与 .temp，并发跑会互相锁死。隔离一份副本即可让构建使用自己的缓存。
 *
 * 只复制内容（4MB 左右），跳过 dist / cache / .temp。
 */
import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const src = resolve(import.meta.dirname, '..')
const dst = process.argv[2] || resolve(src, '..', '_lx-verify')

if (existsSync(dst)) rmSync(dst, { recursive: true, force: true })
mkdirSync(dst, { recursive: true })

const SKIP = ['.vitepress\\dist', '.vitepress\\cache', '.vitepress\\.temp',
              '.vitepress/dist', '.vitepress/cache', '.vitepress/.temp']

cpSync(resolve(src, 'docs'), resolve(dst, 'docs'), {
  recursive: true,
  filter: (s) => !SKIP.some((k) => s.includes(k)),
})

cpSync(resolve(src, 'package.json'), resolve(dst, 'package.json'))
writeFileSync(resolve(dst, '.gitignore'), 'node_modules/\n')

console.log('已复制到: ' + dst)
console.log('（node_modules 稍后用 junction 链接过去）')
