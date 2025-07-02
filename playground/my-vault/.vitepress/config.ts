import { defineConfig } from 'vitepress'
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { DendronNodesImporter } from './nodes-importer';
import { ConfigResolver } from './config-resolver';

// The directory where your markdown pages are stored
// relative to root folder containing .vitepress folder
const srcDir: string = 'notes';
const base: string = '/my-vault/';

const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
const outputDir = join('manual-tests', `${timestamp}`);
mkdir(outputDir);
const writeMyFile = async (fileName: string, content: any) => 
  await writeFile(join(outputDir, `${fileName}.json`), JSON.stringify(content, null, 2), 'utf-8');

const nodesImporter = new DendronNodesImporter(srcDir);
const nodes = await nodesImporter.importNodesFromFiles();
await writeMyFile('nodes', nodes);

const configResolver = new ConfigResolver(nodesImporter, base);
await configResolver.resolveConfig();
await writeMyFile('nav', configResolver.nav);
await writeMyFile('sidebar', configResolver.sidebar);
await writeMyFile('linksVocabulary', configResolver.linksVocabulary);
await writeMyFile('redirects', configResolver.redirects);
await writeMyFile('leafNodes', configResolver.leafNodes);

const bigFile = {
  nodes,
  nav: configResolver.nav,
  sidebar: configResolver.sidebar,
  linksVocabulary: configResolver.linksVocabulary,
  redirects: configResolver.redirects,
  leafNodes: configResolver.leafNodes
};
await writeMyFile('bigFile', bigFile);


export default defineConfig({
  srcDir,
  base,
  title: "Playground My Vault",
  description: "A VitePress site for testing Dendron nodes import",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' }
    ],
    sidebar: [],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
