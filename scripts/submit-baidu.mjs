#!/usr/bin/env node
/**
 * 百度搜索资源平台「普通收录 → API 提交（主动推送）」
 *
 * 用法：
 *   node scripts/submit-baidu.mjs --token=<你的token>          # 正式推送
 *   node scripts/submit-baidu.mjs --token=xxx --limit=20       # 只推 20 条（省配额）
 *   node scripts/submit-baidu.mjs --dry-run                    # 只看看会推哪些，不联网
 *   BAIDU_TOKEN=xxx node scripts/submit-baidu.mjs              # token 也可走环境变量
 *
 * 说明：
 * - 默认从构建产物 docs/.vitepress/dist/sitemap.xml 读 URL；
 *   也可用 --sitemap=<本地路径|https 地址>。
 * - 百度接口：POST http://data.zz.baidu.com/urls?site=<site>&token=<token>
 *   请求体为纯文本，每行一个 URL；返回 JSON 里 remain 是当日剩余配额。
 * - 配额有限，先小批量试推（--limit 10），确认返回 success 后再全量。
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEFAULT_SITEMAP = resolve(ROOT, 'docs/.vitepress/dist/sitemap.xml')
const DEFAULT_SITE = 'https://luxunwenji.com'
const ENDPOINT = 'http://data.zz.baidu.com/urls'

/** 需要取值的参数；其余按开关处理（也兼容 --key=value 写法） */
const VALUE_KEYS = new Set(['token', 'site', 'sitemap', 'batch', 'limit'])

function parseArgs(argv) {
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
    } else if (VALUE_KEYS.has(key) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args[key] = argv[++i]
    } else {
      args[key] = true
    }
  }
  return args
}

/** 从 sitemap 文本里抽出所有 <loc>，并还原 XML 实体 */
function extractUrls(xml) {
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
  return urls
}

async function loadSitemap(source) {
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

async function pushBatch(urls, { site, token }) {
  const res = await fetch(
    `${ENDPOINT}?site=${encodeURIComponent(site)}&token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        // 百度要求带上 Host 对应的 UA 无明显约束，但显式声明更稳
        'User-Agent': 'luxunwenji-baidu-push/1.0',
      },
      body: urls.join('\n'),
    },
  )
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`百度返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`)
  }
  return { status: res.status, json }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const site = args.site || DEFAULT_SITE
  const token = args.token || process.env.BAIDU_TOKEN || ''
  const sitemap = args.sitemap || DEFAULT_SITEMAP
  const batchSize = Number(args.batch || 100)
  const dryRun = Boolean(args['dry-run'])

  const xml = await loadSitemap(sitemap)
  let urls = extractUrls(xml)
  if (!urls.length) throw new Error(`sitemap 中没有解析到 <loc>：${sitemap}`)

  // 去重并保序
  urls = [...new Set(urls)]

  const limit = args.limit ? Number(args.limit) : urls.length
  const todo = urls.slice(0, limit)

  console.log(`站点      : ${site}`)
  console.log(`sitemap   : ${sitemap}`)
  console.log(`解析到    : ${urls.length} 条 URL`)
  console.log(`本次提交  : ${todo.length} 条（--limit ${limit}）`)
  console.log(`分批      : 每批 ${batchSize} 条`)

  if (dryRun) {
    console.log('\n[dry-run] 不联网。前 5 条预览：')
    for (const u of todo.slice(0, 5)) console.log('  ' + u)
    return
  }

  if (!token) {
    throw new Error(
      '缺少 token。用法：node scripts/submit-baidu.mjs --token=<token>\n' +
        'token 在百度搜索资源平台 → 普通收录 → API 提交 页面获取。',
    )
  }

  let success = 0
  let remain = null

  for (let i = 0; i < todo.length; i += batchSize) {
    const batch = todo.slice(i, i + batchSize)
    const label = `[${i + 1}-${i + batch.length}/${todo.length}]`
    process.stdout.write(`${label} 提交中… `)
    const { status, json } = await pushBatch(batch, { site, token })

    if (json.error) {
      console.log(`失败 (HTTP ${status})`)
      console.error(`  错误码 ${json.error}：${json.message || ''}`)
      if (json.error === 401) {
        console.error('  401 一般是 site 或 token 不对：site 必须与站长平台绑定的一致（含 https://）')
      }
      process.exitCode = 1
      break
    }

    success += json.success ?? 0
    remain = json.remain ?? remain
    console.log(`成功 ${json.success ?? 0} 条，当日剩余配额 ${json.remain ?? '未知'}`)

    // 配额用尽就停，避免后续请求全部 4xx
    if (remain === 0) {
      console.log('当日配额已用尽，停止提交。')
      break
    }
  }

  console.log(`\n完成：成功提交 ${success} 条${remain !== null ? `，剩余配额 ${remain}` : ''}。`)
  console.log('提示：百度收录有延迟（数天到数周），可在站长平台「普通收录 → 提交记录」查看处理情况。')
}

main().catch((err) => {
  console.error('\n出错了：' + err.message)
  process.exit(1)
})
