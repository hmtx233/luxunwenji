/**
 * 按 config.mts 里的 order 重排两个文集首页的「## 篇目」列表。
 *
 * 只替换 `## 篇目` 之后到文件末尾的列表部分，前言内容原样保留。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..', 'docs')

const targets = [
  {
    file: 'academic/zhongguo-xiaoshuo/index.md',
    dir: 'academic/zhongguo-xiaoshuo',
    linkBase: '/academic/zhongguo-xiaoshuo/',
    order: [
      '序言', '题记',
      '第一篇 史家对于小说之著录及论述', '第二篇 神话与传说', '第三篇 《汉书》《艺文志》所载小说',
      '第四篇 今所见汉人小说', '第五篇 六朝之鬼神志怪书（上）', '第六篇 六朝之鬼神志怪书（下）',
      '第七篇 《世说新语》与其前后', '第八篇 唐之传奇文（上）', '第九篇 唐之传奇文（下）',
      '第十篇 唐之传奇集及杂俎', '第十一篇 宋之志怪及传奇文', '第十二篇 宋之话本',
      '第十三篇 宋元之拟话本', '第十四篇 元明传来之讲史（上）', '第十五篇 元明传来之讲史（下）',
      '第十六篇 明之神魔小说（上）', '第十七篇 明之神魔小说（中）', '第十八篇 明之神魔小说（下）',
      '第十九篇 明之人情小说（上）', '第二十篇 明之人情小说（下）',
      '第二十一篇 明之拟宋市人小说及后来选本', '第二十二篇 清之拟晋唐小说及其支流',
      '第二十三篇 清之讽刺小说', '第二十四篇 清之人情小说', '第二十五篇 清之以小说见才学者',
      '第二十六篇 清之狭邪小说', '第二十七篇 清之侠义小说及公案', '第二十八篇 清末之谴责小说',
    ],
  },
  {
    file: 'letters/liangdi-shu/index.md',
    dir: 'letters/liangdi-shu',
    linkBase: '/letters/liangdi-shu/',
    order: [
      '序言',
      '第一集 北京_一', '第一集 北京_二', '第一集 北京_三', '第一集 北京_四', '第一集 北京_五',
      '第一集 北京_六', '第一集 北京_七', '第一集 北京_八', '第一集 北京_九', '第一集 北京_一〇',
      '第一集 北京_一一', '第一集 北京_一二', '第一集 北京_一三', '第一集 北京_一四',
      '第一集 北京_一五', '第一集 北京_一六', '第一集 北京_一七', '第一集 北京_一八',
      '第一集 北京_一九', '第一集 北京_二〇', '第一集 北京_二一', '第一集 北京_二二',
      '第一集 北京_二三', '第一集 北京_二四', '第一集 北京_二五', '第一集 北京_二六',
      '第一集 北京_二七', '第一集 北京_二八', '第一集 北京_二九', '第一集 北京_三〇',
      '第一集 北京_三一', '第一集 北京_三二', '第一集 北京_三三', '第一集 北京_三四',
      '第一集 北京_三五',
    ],
  },
]

for (const t of targets) {
  const path = resolve(root, t.file)
  const raw = readFileSync(path, 'utf8')

  const marker = '## 篇目'
  const at = raw.indexOf(marker)
  if (at < 0) {
    console.log('!! 未找到「## 篇目」: ' + t.file)
    continue
  }

  const head = raw.slice(0, at)
  // 链接保持明文中文：与其余 21 个文集首页一致，
  // VitePress 会在输出 HTML 时自行编码，手写 encodeURI 反而降低可读性
  const list = t.order
    .map((n) => `- [${n}](${t.linkBase}${n})`)
    .join('\n')

  writeFileSync(path, `${head}${marker}\n\n${list}\n`, 'utf8')
  console.log(`✓ ${t.file} —— 重排 ${t.order.length} 条`)
}
