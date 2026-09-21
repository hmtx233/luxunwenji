/**
 * 站点统计与首页文集数据。
 *
 * 这里用静态模块而非 Vite define：
 * define 的替换值会进入每个页面的模块作用域，首页模板若直接引用
 * 全局常量，在 SSR 阶段会因作用域不同而取不到（报 undefined）。
 * 显式 import 一个普通模块最稳妥，且统计数字在构建前一次性算好。
 */

export interface WorkItem {
  name: string
  note: string
  link: string
}

export interface CategoryItem {
  title: string
  desc: string
  link: string
  works: WorkItem[]
}

export const categories: CategoryItem[] = [
  {
    title: '小说',
    desc: '三部长短篇小说集，从《狂人日记》到《故事新编》，中国现代小说的开端。',
    link: '/novels/nahan/',
    works: [
      { name: '呐喊', note: '一九一八年—一九二二年', link: '/novels/nahan/' },
      { name: '彷徨', note: '一九二四年—一九二五年', link: '/novels/panghuang/' },
      { name: '故事新编', note: '一九二二年—一九三五年', link: '/novels/gushi-xinbian/' },
    ],
  },
  {
    title: '散文',
    desc: '回忆与独语。前者温润如《朝花夕拾》，后者幽深如《野草》。',
    link: '/prose/yecao/',
    works: [
      { name: '朝花夕拾', note: '回忆散文十篇', link: '/prose/zhaohua-xishi/' },
      { name: '野草', note: '散文诗二十三篇', link: '/prose/yecao/' },
    ],
  },
  {
    title: '杂文',
    desc: '十六部杂文集，横跨三十年，是鲁迅投向社会的最锋利的刀。',
    link: '/essays/fen/',
    works: [
      { name: '坟', note: '一九〇七年—一九二五年', link: '/essays/fen/' },
      { name: '热风', note: '一九一八年—一九二四年', link: '/essays/refeng/' },
      { name: '华盖集', note: '一九二五年', link: '/essays/huagai/' },
      { name: '且介亭杂文', note: '一九三四年', link: '/essays/qiejieting/' },
    ],
  },
  {
    title: '学术',
    desc: '中国第一部小说史专著，梳理两千年小说源流。',
    link: '/academic/zhongguo-xiaoshuo/',
    works: [
      { name: '中国小说史略', note: '二十八篇', link: '/academic/zhongguo-xiaoshuo/' },
    ],
  },
  {
    title: '书信',
    desc: '与许广平的往来通信，三集百余封，私人笔墨里的时代侧影。',
    link: '/letters/liangdi-shu/',
    works: [
      {
        name: '两地书',
        note: '第一集·北京  第二集·厦门—广州  第三集·北平—上海',
        link: '/letters/liangdi-shu/',
      },
    ],
  },
]

/** 由构建脚本注入的统计数字（见 scripts/stats.mjs） */
export { siteStats } from './site-stats.mjs'
