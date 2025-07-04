// Tipi e utility comuni per VPNode

export type VPNodeBase = {
  fileName: string; // "cs.web-dev.jamstack"
  lastPart: string; // "jamstack"
};

export type VPNodePhysical = {
  fileNameWithExt: string; // "cs.web-dev.jamstack.md"
  filePath: string; // "/path/to/cs.web-dev.jamstack.md"
};

export type VPNodeCommon = VPNodeBase & {
  uid: string;
  title: string;
  order: number;
  level: number;
};

export type VPNodeFailed = VPNodeBase & VPNodePhysical & {
  errors: string[];
};

export type VPNodeVirtual = VPNodeCommon & {
  docEntrypoint: false;
};

export type VPNodeImported = VPNodeCommon & VPNodePhysical & {
  createdTimestamp: number; // Unix timestamp
  updatedTimestamp: number; // Unix timestamp
  docEntrypoint: VPNodeDocEntryInfo | false;
  createdDate: Date;
  updatedDate: Date;
  link: string; // "/cs.web-dev.jamstack"
};

export type VPNodeImportResult = VPNodeImported | VPNodeFailed;
export type VPNodeResolved = VPNodeImported | VPNodeVirtual;
export type VPNodeLeaf = VPNodeImported & {
  breadcrumbs: string[];
};
export type VPNodeBlogPost = VPNodeLeaf & {
  excerpt: string;
};

export type VPNodeDocEntryInfo = {
  leafLandingPoint: VPNodeLeafLandingPoint;
  collapseNonLandingChildren: boolean;
};

export const LeafLandingPointValues = ['first', 'last'] as const;
export type VPNodeLeafLandingPoint = typeof LeafLandingPointValues[number];

export function isLeafLandingPoint(value: string): value is VPNodeLeafLandingPoint {
  return LeafLandingPointValues.includes(value as VPNodeLeafLandingPoint);
}

export function isImported(node: VPNodeImportResult | VPNodeResolved): node is VPNodeImported {
  return 'uid' in node;
}

export function isError(node: VPNodeImportResult): node is VPNodeFailed {
  return 'errors' in node;
}