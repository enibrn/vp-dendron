import { defineConfig } from 'vitepress'
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { DendronNodesImporter } from './nodes-importer';

// The directory where your markdown pages are stored
// relative to root folder containing .vitepress folder
const srcDir = 'notes';

//test
const nodesImporter = new DendronNodesImporter(srcDir);
const result = await nodesImporter.do();
const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
const filename = `${timestamp}_nodes.json`;
const filePath = join('manual-tests', filename);
await writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8');

export default defineConfig({
  srcDir,
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
