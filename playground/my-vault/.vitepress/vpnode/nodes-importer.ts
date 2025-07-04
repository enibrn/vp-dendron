import { VPNodeImportResult } from './types';

export interface INodesImporter {
  do(): Promise<VPNodeImportResult[]>;
}