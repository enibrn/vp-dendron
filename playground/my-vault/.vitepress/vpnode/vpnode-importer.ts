import { VPNodeImportResult } from './types';

export interface IVPNodeImporter {
  do(): Promise<VPNodeImportResult[]>;
}