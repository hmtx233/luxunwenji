#!/usr/bin/env node
/**
 * IndexNow 提交（Bing / Yandex / Naver / Seznam / Yep 共用一套协议）
 *
 * 用法：
 *   node scripts/submit-indexnow.mjs --generate        # 只需一次：生成密钥文件 docs/public/<key>.txt
 *   node scripts/submit-indexnow.mjs --dry-run         # 只看会提交哪些 URL，不联网
 *   node scripts/submit-indexnow.mjs                   # 自动识别密钥并全量提交
 *   node scripts/submit-indexnow.mjs --limit 20        # 只提交 20 条
 *
 * 注意：--generate 只生成文件，不提交（密钥未上线时提交必然 403）。
 *
 * 说明：
 * - 密钥文件必须能通过 https 访问，内容就是密钥本身，文件名 <key>.txt。
 *   本脚本约定把它放在 docs/public/<key>.txt，随站点一起部署。
 *   没找到密钥文件时用 --generate 生成一个（32 位十六进制）。
 * - 端点默认 https://api.indexnow.org/indexnow（会把提交转发给所有参与引擎）；
 *   也可 --endpoint=https://www.bing.com/indexnow 只提交给 Bing。
 * - 返回码：200/202 成功（202 表示已接收、待校验密钥），
 *   400 格式错、403 密钥无效、422 URL 不属于该 host、429 提交过于频繁。
 */

import { randomBytes } from 'node:crypto'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  PUBLIC_DIR,
  DEFAULT_SITE,
  parseArgs,
  extractUrls,
  loadSitemap,
  chunk,
} from './lib/cli.mjs'

const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow'

/**
  * 在 docs/public 下找 IndexNow 密钥文件：
  * 文件名（去 .txt）就是密钥，且文件内容与之相同。
  */
async function findKeyFile() {
  if (!existsSync(PUBLIC_DIR)) return null
  const files = await readdir(PUBLIC_DIR)
  for (const file of files) {
    if (!file.endsWith('.txt')) continue
    const name = file.slice(0, -4)
    if (!/^[a-zA-Z0-9-]{8,128}$/.test(name)) continue
    const content = (await readFile(resolve(PUBLIC_DIR, file), 'utf8')).trim()
    if (content === name) return { key: name, file }
  }
  return null
}

/** 生成一个新的密钥文件（不覆盖已有的） */
async function generateKeyFile() {
  const existing = await findKeyFile()
  if (existing) {
    console.log(`已有密钥文件，跳过生成：docs/public/${existing.file}`)
    return existing
  }
  const key = randomBytes(16).toString('hex')
  const file = `${key}.txt`
  await writeFile(resolve(PUBLIC_DIR, file), key + '\n', 'utf8')
  console.log(`已生成密钥文件：docs/public/${file}`)
  return { key, file }
}

function describe(code) {
  switch (code) {
    case 200:
      return '成功'
    case 202:
      return '已接收（密钥待校验，通常稍后生效）'
    case 400:
      return '请求格式错误'
    case 403:
      return '密钥无效（检查 <key>.txt 是否已部署且内容一致）'
    case 422:
      return 'URL 与 host 不匹配，或密钥文件校验失败'
    case 429:
      return '提交过于频繁，请稍后再试'
    default:
      return '未知状态'
  }
}

async function submit(urls, { host, key, keyLocation, endpoint }) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key,
      keyLocation,
      urlList: urls,
    }),
  })
  const text = (await res.text()).trim()
  return { status: res.status, text }
}

async function main() {
  const args = parseArgs(process.argv.slice(2), [
    'key',
    'site',
    'sitemap',
    'batch',
    'limit',
    'endpoint',
  ])
  const site = String(args.site || DEFAULT_SITE).replace(/\/+$/, '')
  const host = new URL(site).host
  const endpoint = args.endpoint || DEFAULT_ENDPOINT
  const batchSize = Number(args.batch || 1000)
  const dryRun = Boolean(args['dry-run'])

  let key = args.key || process.env.INDEXNOW_KEY || ''
  let keyLocation = ''

  if (!key) {
    // --generate：只生成密钥文件，不提交 —— 密钥还没部署，提交必然 403
    if (args.generate) {
      const generated = await generateKeyFile()
      console.log('\n密钥文件已就绪，接下来：')
      console.log('  1. npm run docs:build && 部署（确保密钥文件已上线）')
      console.log(`  2. curl -s ${site}/${generated.file}   # 应返回密钥本身`)
      console.log('  3. node scripts/submit-indexnow.mjs   # 再提交')
      return
    }

    const found = await findKeyFile()
    if (!found) {
      throw new Error(
        '没找到 IndexNow 密钥文件。先生成一个：\n' +
          '  node scripts/submit-indexnow.mjs --generate\n' +
          '（会写入 docs/public/<key>.txt，构建部署后经 https://' +
          host +
          '/<key>.txt 可访问）',
      )
    }
    key = found.key
    keyLocation = `${site}/${key}.txt`
  } else {
    keyLocation = args['key-location'] || `${site}/${key}.txt`
  }

  const sitemap = args.sitemap
  const urls = extractUrls(await loadSitemap(sitemap))
  if (!urls.length) throw new Error('sitemap 中没有解析到 <loc>')

  const limit = args.limit ? Number(args.limit) : urls.length
  const todo = urls.slice(0, limit)
  const batches = chunk(todo, batchSize)

  console.log(`端点      : ${endpoint}`)
  console.log(`host      : ${host}`)
  console.log(`密钥      : ${key.slice(0, 8)}…（共 ${key.length} 位）`)
  console.log(`密钥位置  : ${keyLocation}`)
  console.log(`本次提交  : ${todo.length} 条（sitemap 共 ${urls.length} 条），分 ${batches.length} 批`)

  if (dryRun) {
    console.log('\n[dry-run] 不联网。前 5 条预览：')
    for (const u of todo.slice(0, 5)) console.log('  ' + u)
    console.log('\n请确认密钥文件已部署且可访问：')
    console.log(`  curl -s ${keyLocation}`)
    return
  }

  let ok = 0
  for (let i = 0; i < batches.length; i++) {
    const { status, text } = await submit(batches[i], { host, key, keyLocation, endpoint })
    const fine = status === 200 || status === 202
    console.log(
      `[${i + 1}/${batches.length}] ${batches[i].length} 条 → HTTP ${status} ${describe(status)}` +
        (text ? ` ${text.slice(0, 200)}` : ''),
    )
    if (!fine) {
      process.exitCode = 1
      break
    }
    ok += batches[i].length
    // 端点对频率敏感，批次之间稍作停顿
    if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 1000))
  }

  console.log(`\n完成：提交 ${ok} 条。`)
  console.log('提示：Bing 通常在数小时到数天内抓取；收录情况可在 Bing 网站管理员工具查看。')
}

main().catch((err) => {
  console.error('\n出错了：' + err.message)
  process.exit(1)
})
