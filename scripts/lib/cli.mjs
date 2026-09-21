/**
 * 推送脚本共用的几个小工具：参数解析、sitemap 读取、URL 提取。
 * 目前被 scripts/submit-baidu.mjs 与 scripts/submit-indexnow.mjs 使用。
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const PUBLIC_DIR = resolve(ROOT, 'docs/public')
export const DEFAULT_SITEMAP = resolve(ROOT, 'docs/.vitepress/dist/sitemap.xml')
export const DEFAULT_SITE = 'https://luxunwenji.com'

/**
 * 解析命令行参数，同时支持 `--limit 5` 与 `--limit=5`。
 * 不在 VALUE_KEYS 里的参数按布尔开关处理（如 --dry-run）。
 */
export function parseArgs(argv, valueKeys = []) {
  const keys = new Set(valueKeys)
  const args = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i]
    const m = /^--([^=]+)(?:=(.*))?$/.exec(raw)
    if (!m) {
      args._.push(raw)
      continue
    }
    const key = m[1]
    if (m[2] !== undefined) {
      args[key] = m[2]
    } else if (keys.has(key) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args[key] = argv[++i]
    } else {
      args[key] = true
    }
  }
  return args
}

/** 从 sitemap XML 里抽出所有 <loc>，并还原 XML 实体，去重保序 */
export function extractUrls(xml) {
  const urls = []
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    urls.push(
      m[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'"),
    )
  }
  return [...new Set(urls)]
}

/**
 * 读取 sitemap：支持本地路径（默认构建产物）与 http(s) 地址。
 */
export async function loadSitemap(source = DEFAULT_SITEMAP) {
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source)
    if (!res.ok) throw new Error(`拉取 sitemap 失败：HTTP ${res.status} ${source}`)
    return res.text()
  }
  if (!existsSync(source)) {
    throw new Error(
      `找不到 ${source}\n请先构建：node node_modules/vitepress/bin/vitepress.js build docs`,
    )
  }
  return readFile(source, 'utf8')
}

/** 把 URL 列表切成若干批 */
export function chunk(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}
