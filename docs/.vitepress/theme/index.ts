import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import 'heti/umd/heti.min.css'
import './custom.css'
import HomePage from './HomePage.vue'
import ArticleTitle from './ArticleTitle.vue'

/**
 * 主题扩展。
 *
 * 排版全部交给 custom.css，直接命中 VitePress 的 `.vp-doc > div > p`
 * 结构。之前尝试在 enhanceApp 里给 .vp-doc 加 .heti 类，有两个问题：
 *   1) 只在客户端执行，SSR 产物里没有这个类，首屏会闪一下未排版样式；
 *   2) heti 挂在 <html> 上会波及导航与侧边栏里的段落。
 * 因此改为纯 CSS 覆盖，既不依赖运行时，也不影响正文以外的区域。
 * heti 的样式表仍然引入，用于其中西混排与标点挤压的规则。
 */
export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 文章标题：位于 <Content class="vp-doc"> 之前、版心之内
      'doc-before': () => h(ArticleTitle),
    })
  },
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
  },
}
