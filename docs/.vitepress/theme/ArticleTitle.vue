<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'

/**
 * 文章页顶部的标题区。
 *
 * 挂在 Layout 的 `doc-before` 插槽里 —— 该位置正好在 <Content class="vp-doc">
 * 之前、正文容器之内，因此既能跟随版心宽度，又不会进入正文的
 * 首行缩进规则。
 *
 * 结构：卷名（小字）→ 标题（居中放大）→ 字数与阅读时间。
 *
 * 显示条件（自动判断，无需逐页配置）：
 *   只有**文集目录下的文章**才接管标题，即路径形如 `<类别>/<文集>/<篇名>.md`。
 *   - 首页与自定义页（layout: home / page）—— 不显示
 *   - 各文集的 index.md —— 正文已自带 `# 文集名`，再渲染一次会出现两个 <h1>
 *   - docs 根目录下的独立页面（如 about.md）—— 同理，用自己的 markdown 标题
 *   如需例外，可在 frontmatter 写 `articleTitle: true|false` 覆盖。
 */
const { frontmatter, page } = useData()

const show = computed(() => {
  const fm = frontmatter.value
  const override = fm.articleTitle
  if (typeof override === 'boolean') return override && Boolean(page.value.title)
  if (fm.layout === 'home' || fm.layout === 'page') return false

  const relPath = page.value.relativePath
  // 必须是「目录下的文章」：既非根级页面，也非文集首页
  const isNested = relPath.includes('/')
  const isCollectionIndex = relPath.endsWith('index.md')
  return isNested && !isCollectionIndex && Boolean(page.value.title)
})

const title = computed(() => page.value.title || '')

const volume = computed(() => {
  const v = frontmatter.value.volume as string | undefined
  return v ? `《${v.replace(/^《|》$/g, '')}》` : ''
})

/** 「4,730 字 · 阅读约 12 分钟」，构建期注入，缺失则不显示 */
const reading = computed(() => {
  const chars = frontmatter.value.chars as number | undefined
  const minutes = frontmatter.value.minutes as number | undefined
  if (!chars) return ''
  const parts = [`${chars.toLocaleString('zh-CN')} 字`]
  if (minutes) parts.push(`阅读约 ${minutes} 分钟`)
  return parts.join(' · ')
})
</script>

<template>
  <div v-if="show" class="article-head">
    <p v-if="volume" class="article-volume">{{ volume }}</p>
    <h1 class="article-title">{{ title }}</h1>
    <p v-if="reading" class="article-reading">{{ reading }}</p>
  </div>
</template>

<style scoped>
.article-head {
  margin: 8px 0 40px;
  padding-bottom: 28px;
  border-bottom: 0.5px solid var(--vp-c-divider);
  text-align: center;
}

.article-volume {
  font-size: 13px;
  letter-spacing: 0.16em;
  color: var(--vp-c-text-3);
  margin: 0 0 14px;
}

.article-title {
  /* 不单独指定字体：按项目约定正文与标题同为无衬线，
     层级只靠字号与字重区分（见 custom.css 顶部说明） */
  font-size: 32px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-1);
  margin: 0;
  border: none;
  padding: 0;
}

.article-reading {
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
  margin: 16px 0 0;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 640px) {
  .article-head {
    margin-bottom: 28px;
    padding-bottom: 20px;
  }
  .article-title {
    font-size: 25px;
  }
  .article-reading {
    margin-top: 13px;
  }
}
</style>
