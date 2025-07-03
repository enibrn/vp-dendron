import matter from 'gray-matter';
import { VPNode } from './vp-node';
import { readdir, readFile } from 'fs/promises';
import path, { basename, extname } from 'path';
import type { DefaultTheme } from 'vitepress';

export namespace VPLogic {
  export interface INodesProcessor {
    importNodesFromFiles(): Promise<VPNode.ImportResult[]>;
    createVirtualNodes(nodes: VPNode.Imported[]): VPNode.Virtual[];
  }

  export class DendronNodesProcessor implements INodesProcessor {
    private readonly nodesPath: string;

    constructor(nodesPath: string) {
      this.nodesPath = nodesPath;
    }

    public async importNodesFromFiles(): Promise<VPNode.ImportResult[]> {
      const results: VPNode.ImportResult[] = [];

      // Read all md files in the nodes directory except 'root.md'
      const filesToExclude: string[] = ['root.md', 'index.md', 'README.md'];
      const files: string[] = await readdir(this.nodesPath);
      const markdownFiles: string[] = files
        .filter(file => extname(file) === '.md' && !filesToExclude.includes(file));
      for (const file of markdownFiles) {
        results.push(await this.importNodeFromFile(file));
      }

      return results;
    }

    public createVirtualNodes(nodes: VPNode.Imported[]): VPNode.Virtual[] {
      const existingPaths = new Set(nodes.map(node => node.fileName));
      const virtualNodesToCreate: VPNode.Virtual[] = [];

      // Analyze all existing nodes to find missing intermediate levels
      for (const node of nodes) {
        const parts = node.fileName.split('.');

        // Check each possible intermediate path
        for (let i = 1; i < parts.length; i++) {
          const intermediatePath = parts.slice(0, i + 1).join('.');

          // If this intermediate path doesn't exist, we need to create a virtual node
          if (!existingPaths.has(intermediatePath)) {
            const lastPart = parts[i];
            const level = i + 1;

            // Create virtual node
            const virtualNode: VPNode.Virtual = {
              fileName: intermediatePath,
              lastPart: lastPart,
              uid: intermediatePath,
              title: lastPart,
              docEntrypoint: false,
              order: 0,
              level: level
            };

            virtualNodesToCreate.push(virtualNode);
            existingPaths.add(intermediatePath);
          }
        }
      }

      return virtualNodesToCreate;
    }

    private async importNodeFromFile(fileNameWithExt: string): Promise<VPNode.ImportResult> {
      const fileName: string = basename(fileNameWithExt, extname(fileNameWithExt));
      const lastPart: string = fileName.split('.').pop() || '';
      const filePath: string = path.join(this.nodesPath, fileNameWithExt);

      // Read the file and extract front matter
      let data: any = {};
      try {
        const fileContent = await readFile(filePath, 'utf-8');
        ({ data } = matter(fileContent));
      } catch (e) {
        const fileReadErrorMessage: string = 'Error when reading file ' + (e instanceof Error ? e.message : String(e));
        return {
          fileName, lastPart, fileNameWithExt, filePath,
          errors: [fileReadErrorMessage]
        } as VPNode.Failed;
      }

      // Validate required fields and collect errors
      const errors: string[] = [];
      const prefix = 'Field missing: ';
      if (!data.id) errors.push(`${prefix}id`);
      if (!data.title) errors.push(`${prefix}title`);

      let createdDate: Date | undefined;
      if (!data.created) {
        errors.push(`${prefix}created`);
      } else {
        createdDate = new Date(data.created);

        if (isNaN(createdDate.getTime())) {
          errors.push('Invalid created date');
        }
      }

      let updatedDate: Date | undefined;
      if (!data.updated) {
        errors.push(`${prefix}updated`);
      } else {
        updatedDate = new Date(data.updated);

        if (isNaN(updatedDate.getTime())) {
          errors.push('Invalid updated date');
        }
      }

      if (errors.length > 0) {
        return { fileName, lastPart, fileNameWithExt, filePath, errors } as VPNode.Failed;
      }

      // return the imported node object
      return {
        fileName, lastPart, fileNameWithExt, filePath,
        uid: data.id,
        title: data.title,
        createdTimestamp: data.created,
        updatedTimestamp: data.updated,
        docEntrypoint: DendronNodesProcessor.resolveDoc(data),
        order: typeof data.nav_order === 'number' ? data.nav_order : 999,
        level: fileName.split('.').length,
        createdDate,
        updatedDate,
        link: '/' + fileName
      } as VPNode.Imported;
    }

    private static resolveDoc(data: any): VPNode.DocEntryInfo | false {
      if (!data.vpd // vpd is not defined
        || typeof data.vpd !== 'object' // vpd is not an object
        || !data.vpd.doc // vpd.doc is not defined
        || (typeof data.vpd.doc !== 'object' && typeof data.vpd.doc !== 'boolean') // vpd.doc is not an expected type
        || (typeof data.vpd.doc === 'boolean' && !data.vpd.doc)) { // vpd.doc explicitly false
        return false;
      }

      // Default values
      let leafLandingPoint: VPNode.LeafLandingPoint = 'first';
      let collapseNonLandingChildren = false;

      if (typeof data.vpd.doc === 'boolean' && data.vpd.doc) { // vpd.doc explicitly true
        return { leafLandingPoint, collapseNonLandingChildren };
      }

      // from this on we know vpd.doc is an object

      // Check for leafLandingPoint
      if (data.vpd.doc.leafLandingPoint && VPNode.isLeafLandingPoint(data.vpd.doc.leafLandingPoint)) {
        leafLandingPoint = data.vpd.doc.leafLandingPoint;
      }

      // Check for collapseOtherFirstLevels
      if (data.vpd.doc.collapseOtherFirstLevels && typeof data.vpd.doc.collapseOtherFirstLevels === 'boolean') {
        collapseNonLandingChildren = data.vpd.doc.collapseOtherFirstLevels;
      }

      return {
        leafLandingPoint,
        collapseNonLandingChildren
      };
    }
  }

  export class ConfigBuilder {
    public readonly nav: DefaultTheme.NavItem[] = [];
    public readonly sidebar: DefaultTheme.SidebarMulti = {};
    public readonly linksVocabulary: Record<string, string> = {};
    public readonly leafNodes: VPNode.Leaf[] = [];
    public readonly srcExclude: string[] = [];

    private readonly nodesImporter: INodesProcessor;
    private readonly nodes: VPNode.Resolved[] = [];
    private readonly sidebarLeafLinks: Record<string, string> = {};

    constructor(fileparser: INodesProcessor) {
      this.nodesImporter = fileparser;
    }

    public async resolveConfig(): Promise<void> {
      await this.resolveNodes();
      this.traverseItemsHierarchically();
    }

    private async resolveNodes() {
      const parsedNodes: VPNode.ImportResult[] = await this.nodesImporter.importNodesFromFiles();

      const failedNodes: VPNode.Failed[] = parsedNodes.filter(VPNode.isError);
      if (failedNodes.length > 0) {
        failedNodes.forEach(node => {
          console.error(`Error in node ${node.fileName}:`, node.errors.join(', '));
        });
      }

      const successfulNodes: VPNode.Imported[] = parsedNodes.filter(VPNode.isImported);

      if (successfulNodes.length === 0) {
        throw new Error('No valid nodes found to build the configuration.');
      }

      this.nodes.push(...successfulNodes);

      // Create virtual nodes using the nodes importer
      const virtualNodes = this.nodesImporter.createVirtualNodes(successfulNodes);
      this.nodes.push(...virtualNodes);
    }

    private traverseItemsHierarchically() {
      const highestNodesOrdered = this.nodes
        .filter(x => x.level === 1)
        .sort((a, b) => a.order - b.order);

      highestNodesOrdered.forEach(node => {
        this.nav.push(this.traverseUntilDocEntry(node, []));
      });
    }

    private traverseUntilDocEntry(
      node: VPNode.Resolved,
      breadcrumbs: string[]
    ): DefaultTheme.NavItem {
      breadcrumbs.push(node.title);

      if (VPNode.isImported(node))
        this.srcExclude.push(node.fileNameWithExt);

      const childNodes: VPNode.Resolved[] = this.getChildsOrdered(node);

      if (node.docEntrypoint) {
        const landingPoint = node.docEntrypoint.leafLandingPoint;
        const sidebarItems = [] as DefaultTheme.SidebarItem[];
        childNodes.forEach(childNode => {
          sidebarItems.push(this.traverseAfterDocEntry(childNode, node.fileName, landingPoint, [...breadcrumbs]));
        });
        this.sidebar[node.fileName] = sidebarItems;

        //gets the proper preselected leaf page
        const link: string = this.sidebarLeafLinks[node.fileName];

        //manage the collapse of non-landing children
        if (node.docEntrypoint.collapseNonLandingChildren) {
          const nodeToExpandLink = childNodes
            .map(x => x.fileName)
            .find(x => link.startsWith('/' + x + '.'));

          for (let sidebarItem of sidebarItems) {
            if (sidebarItem.link === nodeToExpandLink) {
              sidebarItem.collapsed = false;
            } else {
              sidebarItem.collapsed = true;
            }
          }
        }

        return {
          text: node.title,
          link
        } as DefaultTheme.NavItemWithLink;
      } else {
        const items: DefaultTheme.NavItem[] = [];
        childNodes.forEach(childNode => {
          items.push(this.traverseUntilDocEntry(childNode, [...breadcrumbs]));
        });

        return {
          text: node.title,
          items
        } as DefaultTheme.NavItemWithChildren;
      }
    }

    private traverseAfterDocEntry(
      node: VPNode.Resolved,
      navKey: string,
      landingPoint: VPNode.LeafLandingPoint,
      breadcrumbs: string[]
    ): DefaultTheme.SidebarItem {
      const result = { key: node.fileName, text: node.title } as DefaultTheme.SidebarItem;
      const childItems: VPNode.Resolved[] = this.getChildsOrdered(node);

      if (VPNode.isImported(node) && childItems.length == 0) {
        // If the node has no children, it is a leaf node
        result.link = node.link;
        this.linksVocabulary[node.fileName] = node.title;
        this.leafNodes.push({ ...node, breadcrumbs: [...breadcrumbs] });

        // if landingPoint is 'last', always overwrite the link so the last one remains
        // if landingPoint is 'first', only set if there is no link yet, so it wont be overwritten and the first one remains
        if (landingPoint === 'last' || !this.sidebarLeafLinks[navKey])
          this.sidebarLeafLinks[navKey] = result.link;
      } else {
        breadcrumbs.push(node.title);
        // If the node still has children, we need to traverse them
        result.items = [] as DefaultTheme.SidebarItem[];
        childItems.forEach(childItem => {
          result.items?.push(
            this.traverseAfterDocEntry(childItem, navKey, landingPoint, [...breadcrumbs]));
        });

        if (VPNode.isImported(node))
          this.srcExclude.push(node.fileNameWithExt);
      }

      return result;
    }

    private getChildsOrdered(father: VPNode.Resolved): VPNode.Resolved[] {
      const childs = this.nodes
        .filter(node => {
          const regex = new RegExp(`^${father.fileName}\\.([^\\.]+)$`);
          return regex.test(node.fileName);
        });

      return childs.sort((a, b) => a.order - b.order);
    }
  }
}