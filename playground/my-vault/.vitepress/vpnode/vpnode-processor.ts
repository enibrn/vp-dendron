import { VPNodeImportResult } from './types';

export interface IVPNodeProcessor {
  importNodesFromFiles(): Promise<VPNodeImportResult[]>;
}