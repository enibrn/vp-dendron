export namespace VPNode {
  type Base = {
    fileName: string;
    filePath: string;
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

  export type LeafLandingPoint = 'first' | 'last';

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

export type ReadFileFn = (path: string) => { text: () => Promise<string>; };
export type ReadDirFn = (path: string) => Promise<string[]>;
