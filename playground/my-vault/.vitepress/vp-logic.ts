import type { DefaultTheme } from 'vitepress';
import {
  VPNodeImportResult,
  VPNodeImported,
  VPNodeVirtual,
  VPNodeFailed,
  VPNodeResolved,
  VPNodeLeaf,
  isImported,
  isError,
  VPNodeLeafLandingPoint
} from './vpnode/types';
import { IVPNodeProcessor } from './vpnode/IVPNode';
import { DendronVPNodeProcessor } from './vpnode/DendronVPNode';
import { VPNodeFactory } from './vpnode/VPNodeFactory';

export namespace VPLogic {
  export class ConfigBuilder {
    public readonly nav: DefaultTheme.NavItem[] = [];
    public readonly sidebar: DefaultTheme.SidebarMulti = {};
    public readonly linksVocabulary: Record<string, string> = {};
    public readonly leafNodes: VPNodeLeaf[] = [];
    public readonly srcExclude: string[] = [];

    private readonly nodesImporter: IVPNodeProcessor;
    private readonly nodes: VPNodeResolved[] = [];
    private readonly sidebarLeafLinks: Record<string, string> = {};

    constructor(fileparser: IVPNodeProcessor) {
      this.nodesImporter = fileparser;
    }

    public async resolveConfig(): Promise<void> {
      await this.resolveNodes();
      this.traverseItemsHierarchically();
    }

    private async resolveNodes() {
      const parsedNodes: VPNodeImportResult[] = await this.nodesImporter.importNodesFromFiles();

      const failedNodes: VPNodeFailed[] = parsedNodes.filter(isError);
      if (failedNodes.length > 0) {
        failedNodes.forEach(node => {
          console.error(`Error in node ${node.fileName}:`, node.errors.join(', '));
        });
      }

      const successfulNodes: VPNodeImported[] = parsedNodes.filter(isImported);

      if (successfulNodes.length === 0) {
        throw new Error('No valid nodes found to build the configuration.');
      }

      this.nodes.push(...successfulNodes);

      // Crea i virtual vpnode tramite la factory
      const virtualNodes = VPNodeFactory.createVirtualNodes(successfulNodes);
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
      node: VPNodeResolved,
      breadcrumbs: string[]
    ): DefaultTheme.NavItem {
      breadcrumbs.push(node.title);

      if (isImported(node))
        this.srcExclude.push(node.fileNameWithExt);

      const childNodes: VPNodeResolved[] = this.getChildsOrdered(node);

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
      node: VPNodeResolved,
      navKey: string,
      landingPoint: VPNodeLeafLandingPoint,
      breadcrumbs: string[]
    ): DefaultTheme.SidebarItem {
      const result = { key: node.fileName, text: node.title } as DefaultTheme.SidebarItem;
      const childItems: VPNodeResolved[] = this.getChildsOrdered(node);

      if (isImported(node) && childItems.length == 0) {
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

        if (isImported(node))
          this.srcExclude.push(node.fileNameWithExt);
      }

      return result;
    }

    private getChildsOrdered(father: VPNodeResolved): VPNodeResolved[] {
      const childs = this.nodes
        .filter(node => {
          const regex = new RegExp(`^${father.fileName}\\.([^\\.]+)$`);
          return regex.test(node.fileName);
        });

      return childs.sort((a, b) => a.order - b.order);
    }
  }
}