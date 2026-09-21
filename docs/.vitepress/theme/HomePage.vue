<script setup lang="ts">
import { categories, siteStats } from './home-data.mts'

const { articles, collections, chars, byCategory } = siteStats
const wan = Math.round(chars / 10000)

const intro = [
  { label: '文集', value: collections, unit: '部' },
  { label: '篇目', value: articles, unit: '篇' },
  { label: '字数', value: wan, unit: '万字' },
]
</script>

<template>
  <div class="lx-home">
    <header class="lx-hero">
      <img class="lx-logo" src="/favicon.svg" alt="鲁迅文集" width="72" height="72" />
      <p class="lx-kicker">鲁迅作品 · 在线阅读</p>
      <h1 class="lx-title">鲁迅文集</h1>
      <p class="lx-lede">
        收录小说、散文、杂文、学术与书信共 {{ collections }} 部文集、{{ articles }} 篇作品，
        约 {{ wan }} 万字，按原著篇序编排，支持全文检索。
      </p>

      <dl class="lx-stats">
        <div v-for="s in intro" :key="s.label" class="lx-stat">
          <dt>{{ s.label }}</dt>
          <dd>{{ s.value }}<span>{{ s.unit }}</span></dd>
        </div>
      </dl>

      <div class="lx-actions">
        <a class="lx-btn lx-btn--primary" href="/novels/nahan/狂人日记">从《狂人日记》读起</a>
        <a class="lx-btn" href="/essays/fen/">浏览杂文</a>
      </div>
    </header>

    <section v-for="cat in categories" :key="cat.title" class="lx-section">
      <div class="lx-section-head">
        <h2 class="lx-section-title">{{ cat.title }}</h2>
        <p class="lx-section-meta">
          {{ byCategory[cat.title].collections }} 部 ·
          {{ byCategory[cat.title].articles }} 篇 ·
          约 {{ Math.round(byCategory[cat.title].chars / 10000) }} 万字
        </p>
      </div>

      <p class="lx-section-desc">{{ cat.desc }}</p>

      <div class="lx-cards">
        <a v-for="w in cat.works" :key="w.name" class="lx-card" :href="w.link">
          <span class="lx-card-name">{{ w.name }}</span>
          <span class="lx-card-note">{{ w.note }}</span>
        </a>
      </div>

      <a class="lx-more" :href="cat.link">进入{{ cat.title }} →</a>
    </section>
  </div>
</template>

<style scoped>
.lx-home {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px 104px;
}

.lx-hero {
  padding: 96px 0 64px;
  border-bottom: 0.5px solid var(--vp-c-divider);
}

.lx-logo {
  display: block;
  width: 72px;
  height: 72px;
  margin-bottom: 28px;
  border-radius: 14px;
}

.lx-kicker {
  font-size: 13px;
  letter-spacing: 0.16em;
  color: var(--vp-c-text-3);
  margin: 0 0 18px;
}

.lx-title {
  font-size: 54px;
  font-weight: 500;
  line-height: 1.16;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-1);
  margin: 0 0 22px;
}

.lx-lede {
  font-size: 16px;
  line-height: 1.85;
  color: var(--vp-c-text-2);
  max-width: 40em;
  margin: 0 0 40px;
}

.lx-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 56px;
  margin: 0 0 40px;
  padding: 0;
}

.lx-stat dt {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-bottom: 6px;
}

.lx-stat dd {
  margin: 0;
  font-size: 30px;
  font-weight: 500;
  line-height: 1;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}

.lx-stat dd span {
  font-size: 13px;
  font-weight: 400;
  color: var(--vp-c-text-3);
  margin-left: 5px;
}

.lx-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.lx-btn {
  display: inline-block;
  padding: 10px 24px;
  border-radius: 8px;
  border: 0.5px solid var(--vp-c-divider);
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: border-color 0.2s, background-color 0.2s;
}

.lx-btn:hover {
  border-color: var(--vp-c-text-3);
}

.lx-btn--primary {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}

.lx-btn--primary:hover {
  background: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

.lx-section {
  padding: 56px 0;
  border-bottom: 0.5px solid var(--vp-c-divider);
}

.lx-section:last-of-type {
  border-bottom: none;
}

.lx-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.lx-section-title {
  font-size: 23px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-1);
  margin: 0;
  border: none;
  padding: 0;
}

.lx-section-meta {
  margin: 0;
  font-size: 13px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}

.lx-section-desc {
  font-size: 14.5px;
  line-height: 1.8;
  color: var(--vp-c-text-2);
  max-width: 42em;
  margin: 0 0 24px;
}

.lx-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.lx-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  border: 0.5px solid var(--vp-c-divider);
  border-radius: 10px;
  text-decoration: none;
  transition: border-color 0.2s, background-color 0.2s;
}

.lx-card:hover {
  border-color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
}

.lx-card-name {
  font-size: 15.5px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.lx-card-note {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}

.lx-more {
  font-size: 13.5px;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.lx-more:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .lx-hero {
    padding: 60px 0 44px;
  }
  .lx-title {
    font-size: 36px;
  }
  .lx-stats {
    gap: 32px;
  }
  .lx-stat dd {
    font-size: 24px;
  }
  .lx-section-head {
    flex-direction: column;
    gap: 6px;
  }
  .lx-cards {
    grid-template-columns: 1fr;
  }
}
</style>
