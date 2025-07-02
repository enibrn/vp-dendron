export namespace VPNode {
  type Base = {
    fileName: string; // "cs.web-dev.jamstack"
    lastPart: string; // "jamstack"
  };

  type Physical = {
    fileNameWithExt: string; // "cs.web-dev.jamstack.md"
    filePath: string; // "/path/to/cs.web-dev.jamstack.md"
  }

  type Common = Base & {
    uid: string;
    title: string;
    order: number;
    level: number;
  }

  export type Failed = Base & Physical & {
    errors: string[];
  };

  export type Virtual = Common & {
    docEntrypoint: false;
  };

  export type Imported = Common & Physical & {
    createdTimestamp: number; // Unix timestamp
    updatedTimestamp: number; // Unix timestamp
    docEntrypoint: DocEntryInfo | false;
    createdDate: Date;
    updatedDate: Date;
    link: string; // "/cs.web-dev.jamstack"
  };

  export type ImportResult = Imported | Failed;
  export type Resolved = Imported | Virtual;
  export type Leaf = Imported & {
    breadcrumbs: string[];
  }
  export type BlogPost = Leaf & {
    excerpt: string;
  }

  export type DocEntryInfo = {
    leafLandingPoint: LeafLandingPoint;
    collapseNonLandingChildren: boolean;
  }

  const LeafLandingPointValues = <const>['first', 'last'];
  export type LeafLandingPoint = typeof LeafLandingPointValues[number];
  export function isLeafLandingPoint(value: string): value is LeafLandingPoint {
    return LeafLandingPointValues.includes(value as LeafLandingPoint);
  }

  export function isImported(node: ImportResult | Resolved): node is Imported {
    return 'uid' in node;
  }

  export function isError(node: ImportResult): node is Failed {
    return 'errors' in node;
  }
}
