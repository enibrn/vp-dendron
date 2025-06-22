// mdit-frontmatter-title.ts
import matter from 'gray-matter';
import type { PluginWithOptions } from 'markdown-it-async';

interface FrontmatterTitleOptions {
  exclude?: string[]; // Array of paths to exclude
  titleKey?: string;  // Name of the title property in frontmatter
}

const frontmatterTitlePlugin: PluginWithOptions<FrontmatterTitleOptions> = (md, options = {}) => {
  const defaultRender = md.render;
  const exclude = options.exclude || [];
  const titleKey = options.titleKey || 'title';

  function processSource(src: string, env: any): string {
    // Exclude paths if specified
    if (env?.path && exclude.some((p) => env.path.includes(p))) {
      return defaultRender.call(md, src, env);
    }

    const { data, content } = matter(src);
    const title = data[titleKey];
    let newContent = content;
    if (title) {
      const titleHeader = `# ${title}\n\n`;
      newContent = titleHeader + content;
    }
    // Recombine frontmatter data and content
    src = matter.stringify(newContent, data);
    return defaultRender.call(md, src, env);
  }

  md.render = (src, env) => processSource(src, env);
  md.renderAsync = async (src, env) => processSource(src, env);
};

export default frontmatterTitlePlugin;
