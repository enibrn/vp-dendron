// Interfaccia generica per un processore di VPNode

import {
  VPNodeImportResult
} from './types';

export interface IVPNodeProcessor {
  importNodesFromFiles(): Promise<VPNodeImportResult[]>;
}