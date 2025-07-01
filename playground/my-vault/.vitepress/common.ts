export namespace VPNode {
  export type Base = {
    fileName: string; // "cs.web-dev.jamstack"
    lastPart: string; // "jamstack"
  };

  export type Physical = {
    fileNameWithExt: string; // "cs.web-dev.jamstack.md"
    filePath: string; // "/path/to/cs.web-dev.jamstack.md"
  }

  export type Failed = Base & Physical & {
    errors: string[];
  };

  export type Virtual = Base & {
    uid: string;
    title: string;
    order: number;
    level: number;
    link: string; // "/cs.web-dev.jamstack"
  };

  export type Imported = Virtual & Physical & {
    createdTimestamp: string;
    updatedTimestamp: string;
    docEntrypoint: DocEntryInfo | false;
    createdDate: Date;
    updatedDate: Date;
  };

  export type Result = Imported | Failed | Virtual;

  export type Leaf = Imported & {
    breadcrumbs: string[];
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

  export function isSuccess(node: Result): node is Imported {
    return 'uid' in node;
  }

  export function isError(node: Result): node is Failed {
    return 'errors' in node;
  }
}
