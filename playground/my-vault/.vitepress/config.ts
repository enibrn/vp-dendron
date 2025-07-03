import { defineConfig } from 'vitepress'
import { VPLogic } from './vp-logic';
import { VPTheme } from './vp-theme';
import markdownItWikilinksFn from 'markdown-it-wikilinks';
import frontmatterTitlePlugin from './mdit-frontmatter-title';
import { doManualTest } from './manual-test';

// 
const srcDir: string = 'notes';
const base: string = '/my-vault/';
const lastCreatedItemsToTake: number = 4;
const lastUpdatedItemsToTake: number = 4;
const maxExcerptLength: number = 200;

const dendronNodeProcessor = new VPLogic.DendronNodesProcessor(srcDir);
const configBuilder = new VPLogic.ConfigBuilder(dendronNodeProcessor);
await configBuilder.resolveConfig();

const themeConfig = {
  baseUrl: base,
  blog: {
    lastCreatedItemsToTake,
    lastUpdatedItemsToTake,
    maxExcerptLength
  }
};
const themeProvider = new VPTheme.ThemeProvider(themeConfig, configBuilder.leafNodes);
await themeProvider.resolveThemeData();

// If you want to run manual test, uncomment the line below
//await doManualTest(srcDir, base);

export default defineConfig({
  srcDir,
  base,
  title: "Playground My Vault",
  description: "A VitePress site for testing Dendron nodes import",
  themeConfig: {
    nav: configBuilder.nav,
    sidebar: configBuilder.sidebar,
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/enibrn/vp-dendron' }
    ]
  },
  markdown: {
    config: (md) => {
      const options = {
        postProcessLabel: (label: string | number) =>
          configBuilder.linksVocabulary[label] ?? label
      };
      md.use(markdownItWikilinksFn(options));
      md.use(frontmatterTitlePlugin);
    }
  },
  srcExclude: configBuilder.srcExclude,

});
