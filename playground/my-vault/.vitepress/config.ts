import { defineConfig } from 'vitepress'
import { VPLogic } from './vp-logic';
import markdownItWikilinksFn from 'markdown-it-wikilinks';
import frontmatterTitlePlugin from './mdit-frontmatter-title';
import { doManualTest } from './manual-test';

// The directory where your markdown pages are stored
// relative to root folder containing .vitepress folder
const srcDir: string = 'notes';
const base: string = '/my-vault/';
const dendronNodeProcessor = new VPLogic.DendronNodesProcessor(srcDir);
const configurationBuilder = new VPLogic.ConfigBuilder(dendronNodeProcessor);
await configurationBuilder.resolveConfig();

// If you want to run manual test, uncomment the line below
await doManualTest(srcDir, base);

export default defineConfig({
  srcDir,
  base,
  title: "Playground My Vault",
  description: "A VitePress site for testing Dendron nodes import",
  themeConfig: {
    nav: configurationBuilder.nav,
    sidebar: configurationBuilder.sidebar,
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
          configurationBuilder.linksVocabulary[label] ?? label
      };
      md.use(markdownItWikilinksFn(options));
      md.use(frontmatterTitlePlugin);
    }
  },
  srcExclude: configurationBuilder.srcExclude
});
