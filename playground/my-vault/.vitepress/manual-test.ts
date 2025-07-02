import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { VPLogic } from './vp-logic';
import {VPTheme} from './vp-theme';

export async function doManualTest(srcDir: string, base: string) {
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const outputDir = join('manual-tests', `${timestamp}`);
  mkdir(outputDir);
  const writeMyFile = async (fileName: string, content: any) =>
    await writeFile(join(outputDir, `${fileName}.json`), JSON.stringify(content, null, 2), 'utf-8');

  const nodesImporter = new VPLogic.DendronNodesProcessor(srcDir);
  const nodes = await nodesImporter.importNodesFromFiles();
  await writeMyFile('nodes', nodes);

  const configResolver = new VPLogic.ConfigBuilder(nodesImporter);
  await configResolver.resolveConfig();
  await writeMyFile('nav', configResolver.nav);
  await writeMyFile('sidebar', configResolver.sidebar);
  await writeMyFile('linksVocabulary', configResolver.linksVocabulary);
  await writeMyFile('leafNodes', configResolver.leafNodes);

  const themeProvider = new VPTheme.ThemeProvider({
    baseUrl: base,
    blog: {
      lastCreatedItemsToTake: 4,
      lastUpdatedItemsToTake: 4,
      maxExcerptLength: 200
    }
  }, configResolver.leafNodes);
  await themeProvider.resolveThemeData();
  await writeMyFile('redirects', themeProvider.redirects);
  await writeMyFile('newlyCreatedBlogPosts', themeProvider.newlyCreatedBlogPosts);
  await writeMyFile('newlyUpdatedBlogPosts', themeProvider.newlyUpdatedBlogPosts);

  const bigFile = {
    nodes,
    nav: configResolver.nav,
    sidebar: configResolver.sidebar,
    linksVocabulary: configResolver.linksVocabulary,
    redirects: themeProvider.redirects,
    leafNodes: configResolver.leafNodes,
    newlyCreatedBlogPosts: themeProvider.newlyCreatedBlogPosts,
    newlyUpdatedBlogPosts: themeProvider.newlyUpdatedBlogPosts
  };
  await writeMyFile('bigFile', bigFile);
}