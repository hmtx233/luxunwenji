<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'

/**
 * 文章页顶部的标题。
 *
 * 挂在 Layout 的 `doc-before` 插槽里 —— 该位置正好在 <Content class="vp-doc">
 * 之前、正文容器之内，因此既能跟随版心宽度，又不会进入正文的
 * 首行缩进规则。
 *
 * 只对文章页生效：首页（layout: page / home）与各文集 index 不显示，
 * 因为那些页面的标题已由页面自身或文集名承担。
 */
const { frontmatter, page } = useData()

const show = computed(() => {
  const fm = frontmatter.value
  if (fm.layout === 'home' || fm.layout === 'page') return false
  if (fm.homeTitle === false) return false
  return Boolean(page.value.title)
})

const title = computed(() => page.value.title || '')
const volume = computed(() => {
  const v = frontmatter.value.volume as string | undefined
  return v ? `《${v.replace(/^《|》$/g, '')}》` : ''
})
</script>

<template>
  <div v-if="show" class="article-head">
    <p v-if="volume" class="article-volume">{{ volume }}</p>
    <h1 class="article-title">{{ title }}</h1>
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
  font-family: 'Helvetica Neue', helvetica, arial, 'Heti Hei', 'PingFang SC',
               'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 32px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-1);
  margin: 0;
  border: none;
  padding: 0;
}

@media (max-width: 640px) {
  .article-head {
    margin-bottom: 28px;
    padding-bottom: 20px;
  }
  .article-title {
    font-size: 25px;
  }
}
</style>
