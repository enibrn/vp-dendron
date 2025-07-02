// mdit-frontmatter-title.ts
import matter from 'gray-matter';

interface FrontmatterTitleOptions {
  exclude?: string[]; // Array of paths to exclude
  titleKey?: string;  // Name of the title property in frontmatter
}

// VitePress 2.0 plugin - simplified approach focusing only on renderAsync
const frontmatterTitlePlugin = (md: any, options: FrontmatterTitleOptions = {}) => {
  const exclude = options.exclude || [];
  const titleKey = options.titleKey || 'title';

  // VitePress 2.0 uses renderAsync - override only this method as recommended
  if (md.renderAsync) {
    const originalRenderAsync = md.renderAsync.bind(md);
    
    md.renderAsync = async (src: string, env: any) => {
      // Exclude paths if specified
      if (env?.path && exclude.some((p) => env.path.includes(p))) {
        return await originalRenderAsync(src, env);
      }

      const { data, content } = matter(src);
      const title = data[titleKey];
      
      let processedSrc = src;
      if (title) {
        // Check if content already starts with an H1 title
        const trimmedContent = content.trim();
        const hasH1Title = trimmedContent.startsWith('# ');
        
        // Only add title if content doesn't already have an H1
        if (!hasH1Title) {
          const titleHeader = `# ${title}\n\n`;
          const newContent = titleHeader + content;
          processedSrc = matter.stringify(newContent, data);
        }
      }
      
      return await originalRenderAsync(processedSrc, env);
    };
  }
};

export default frontmatterTitlePlugin;
