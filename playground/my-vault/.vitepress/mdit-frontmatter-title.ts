// mdit-frontmatter-title.ts
import matter from 'gray-matter';
import type MarkdownIt from 'markdown-it';

interface FrontmatterTitleOptions {
  exclude?: string[]; // Array of paths to exclude
  titleKey?: string;  // Name of the title property in frontmatter
}

// Define the correct plugin type for VitePress
type MarkdownItPlugin = (md: MarkdownIt, options?: FrontmatterTitleOptions) => void;

const frontmatterTitlePlugin: MarkdownItPlugin = (md, options = {}) => {
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
  
  // Type assertion for renderAsync as VitePress extends MarkdownIt with this method
  if ('renderAsync' in md && typeof (md as any).renderAsync === 'function') {
    (md as any).renderAsync = async (src: string, env: any) => processSource(src, env);
  }
};

export default frontmatterTitlePlugin;
