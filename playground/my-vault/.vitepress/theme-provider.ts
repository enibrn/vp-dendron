import { VPNode } from './common'; 

export class ThemeProvider {
  public readonly redirects: Record<string, string> = {};
  private readonly baseUrl: string;
  public readonly leafNodes: VPNode.Leaf[] = [];

  constructor(baseUrl: string, leafNodes: VPNode.Leaf[]) {
    this.baseUrl = baseUrl;
    this.leafNodes = leafNodes;
  }

  public async resolveThemeData(): Promise<void> {
    this.leafNodes.forEach(node => {
      this.redirects[node.uid] = `${this.baseUrl}${node.fileName}`;
    });


  }

}
