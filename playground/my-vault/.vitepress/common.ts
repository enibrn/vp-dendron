export namespace VPNode {
  type Base = {
    fileName: string; // "cs.web-dev.jamstack"
    fileNameWithExt: string; // "cs.web-dev.jamstack.md"
  };

  export type Imported = Base & {
    uid: string;
    title: string;
    createdTimestamp: string;
    updatedTimestamp: string;
    docEntrypoint: DocEntryInfo | false;
    order: number;
    level: number;
    createdDate: Date;
    updatedDate: Date;
    link: string;
  };

  export type DocEntryInfo = {
    leafLandingPoint: LeafLandingPoint;
    collapseNonLandingChildren: boolean;
  }

  const LeafLandingPointValues = <const>['first', 'last'];
  export type LeafLandingPoint = typeof LeafLandingPointValues[number];
  export function isLeafLandingPoint(value: string): value is LeafLandingPoint {
    return LeafLandingPointValues.includes(value as LeafLandingPoint);
  }

  export type Leaf = Imported & {
    breadcrumbs: string[];
  }

  export type Failed = Base & {
    errors: string[];
  };

  export type Result = Imported | Failed;

  export function isSuccess(node: Result): node is Imported {
    return 'uid' in node;
  }

  export function isError(node: Result): node is Failed {
    return 'errors' in node;
  }
}
