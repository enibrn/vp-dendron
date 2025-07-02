import { VPNode } from './common';
import matter from 'gray-matter';
import removeMd from 'remove-markdown';
import { readFile } from 'fs/promises';

export namespace VPTheme {
  export type BlogConfig = {
    lastCreatedItemsToTake: number;
    lastUpdatedItemsToTake: number;
    maxExcerptLength: number;
  }

  export type ThemeConfig = {
    baseUrl: string;
    blog: BlogConfig;
  }

  export class ThemeProvider {
    public readonly redirects: Record<string, string> = {};
    public readonly newlyCreatedBlogPosts: VPNode.BlogPost[] = [];
    public readonly newlyUpdatedBlogPosts: VPNode.BlogPost[] = [];

    private readonly config: ThemeConfig;
    private readonly leafNodes: VPNode.Leaf[] = [];

    constructor(config: ThemeConfig, leafNodes: VPNode.Leaf[]) {
      this.config = config;
      this.leafNodes = leafNodes;
    }

    public async resolveThemeData(): Promise<void> {
      this.populateRedirects();
      await this.fetchNewlyCreatedBlogPosts();
      await this.fetchNewlyUpdatedBlogPosts();

    }

    private async fetchNewlyCreatedBlogPosts() {
      const promises: Promise<VPNode.BlogPost>[] = this.leafNodes
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
        .slice(0, this.config.blog.lastCreatedItemsToTake)
        .map(async (node) => this.resolveBlogCard(node));

      this.newlyCreatedBlogPosts.push(...await Promise.all(promises));
    }

    private async fetchNewlyUpdatedBlogPosts() {
      const promises: Promise<VPNode.BlogPost>[] = this.leafNodes
        .filter(x => !this.newlyCreatedBlogPosts.some(y => y.fileName === x.fileName)) //exclude newly created items
        .sort((a, b) => b.updatedTimestamp - a.updatedTimestamp)
        .slice(0, this.config.blog.lastUpdatedItemsToTake)
        .map(async (node) => this.resolveBlogCard(node));

      this.newlyUpdatedBlogPosts.push(...await Promise.all(promises));
    }

    private async resolveBlogCard(node: VPNode.Leaf): Promise<VPNode.BlogPost> {
      const fcontent = await readFile(node.filePath, 'utf-8');
      const { content } = matter(fcontent);
      const excerpt = this.getExcerpt(content);
      return {
        ...node,
        excerpt: excerpt
      } as VPNode.BlogPost;
    }

    private populateRedirects() {
      this.leafNodes.forEach(node => {
        this.redirects[node.uid] = `${this.config.baseUrl}${node.fileName}`;
      });
    }

    private getExcerpt(fcontent: string) {
      let contentText = removeMd(fcontent).trim().replace(/\s+/g, ' ');
      const excerpt = contentText.slice(0, this.config.blog.maxExcerptLength);

      if (contentText.length > this.config.blog.maxExcerptLength) {
        return excerpt + '...';
      }

      return excerpt;
    }
  }
}


