#!/usr/bin/env node
/**
 * 生成社交分享卡片（og:image）。
 *
 * 输出到 docs/public/：
 *   og.png                    站点默认卡片（首页 / 关于页用）
 *   og/<category>-<dir>.png   每部文集一张（文章页用所属文集那张）
 *
 * 图片由 scripts/gen-og-image.py 用 Pillow 绘制，本脚本只负责
 * 组织数据并调用它 —— Node 侧没有可用的图像库，不值得为此引入依赖。
 *
 * 用法：npm run og
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { DOCS, loadCategories, SITE_NAME } from './lib/categories.mjs'

const OUT_DIR = resolve(DOCS, 'public')

/** 优先用项目内受管的 Python 解释器，其次用户环境里的 */
const PYTHON_CANDIDATES = [
  process.env.PYTHON,
  'C:/Users/haibo/.workbuddy/binaries/python/envs/default/Scripts/python.exe',
  'python3',
  'python',
].filter(Boolean)

function findPython() {
  for (const p of PYTHON_CANDIDATES) {
    const r = spawnSync(p, ['-c', 'from PIL import Image;'], { encoding: 'utf8' })
    if (r.status === 0) return p
  }
  throw new Error(
    '未找到可用的 Python（需已安装 Pillow）。\n' +
      '  安装：<venv>/Scripts/pip install Pillow\n' +
      '  或指定解释器：PYTHON=/path/to/python npm run og',
  )
}

/** 取文集首页引言（`> ...` 那行）作为卡片副标题 */
function readIntro(dirPath) {
  try {
    const raw = readFileSync(resolve(dirPath, 'index.md'), 'utf8')
    const m = raw.match(/^>\s*(.+)$/m)
    return m ? m[1].trim() : ''
  } catch {
    return ''
  }
}

const categories = loadCategories()

const items = [
  {
    file: 'og.png',
    kicker: '魯迅',
    title: SITE_NAME,
    subtitle: '二十三部文集 · 五百余篇 · 全文在线阅读与检索',
  },
  {
    // 方形应用图标，供 <link rel="apple-touch-icon"> 使用
    file: 'apple-touch-icon.png',
    type: 'icon',
    size: 180,
  },
]

let collections = 0
for (const cat of categories) {
  for (const col of cat.collections) {
    const dirPath = resolve(DOCS, col.dir)
    if (!existsSync(dirPath)) continue
    const count = readdirSync(dirPath).filter((f) => f.endsWith('.md') && f !== 'index.md').length
    const intro = readIntro(dirPath)
    items.push({
      file: `og/${col.dir.replace('/', '-')}.png`,
      kicker: cat.text,
      title: col.text,
      subtitle: intro || `鲁迅 · 共 ${count} 篇`,
    })
    collections++
  }
}

const python = findPython()
const r = spawnSync(python, [resolve(import.meta.dirname, 'gen-og-image.py')], {
  input: JSON.stringify({ outDir: OUT_DIR, items }),
  encoding: 'utf8',
})

if (r.status !== 0) {
  console.error(r.stdout || '')
  console.error(r.stderr || '')
  process.exit(r.status ?? 1)
}

let total = 0
for (const item of items) {
  const p = resolve(OUT_DIR, item.file)
  if (existsSync(p)) total++
}
console.log(
  `已生成 ${total} 个图像（站点卡片 1 + 文集卡片 ${collections} + 应用图标 1），输出到 docs/public/`,
)
