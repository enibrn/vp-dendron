import { VPNode } from './common';
import { INodesImporter } from './nodes-importer';
import type { DefaultTheme } from 'vitepress';

export class ConfigResolver {
  public readonly nav: DefaultTheme.NavItem[]= [];
  public readonly sidebar: DefaultTheme.Sidebar = {};
  public readonly linksVocabulary: Record<string, string> = {};
  public readonly redirects: Record<string, string> = {};
  public readonly leafNodes: VPNode.Leaf[] = [];

  private readonly nodesImporter: INodesImporter;
  private readonly baseUrl: string;
  private readonly nodes: VPNode.Resolved[] = [];
  private readonly sidebarLeafLinks: Record<string, string> = {};
  private readonly srcExclude: string[] = [];

  constructor(fileparser: INodesImporter, baseUrl: string) {
    this.nodesImporter = fileparser;
    this.baseUrl = baseUrl;
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

      this.redirects[node.uid] = `${this.baseUrl}${node.fileName}`;
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