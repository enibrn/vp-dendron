import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import { Theme } from 'vitepress'

const customTheme: Theme = {
  extends: DefaultTheme,
  Layout: Layout,
  enhanceApp({ app, router, siteData }) {
    // You can extend the app context here if needed
    // For example: app.component('CustomComponent', CustomComponent)
  }
}

export default customTheme