// Utility per la gestione dei virtual vpnode

import { VPNodeImported, VPNodeVirtual } from './types';

/**
 * Crea i virtual vpnode mancanti dati i nodi importati.
 * @param nodes Elenco dei nodi importati (fisici)
 * @returns Array di virtual vpnode intermedi
 */
export function createVirtualNodes(nodes: VPNodeImported[]): VPNodeVirtual[] {
  const existingPaths = new Set(nodes.map(node => node.fileName));
  const virtualNodesToCreate: VPNodeVirtual[] = [];

  for (const node of nodes) {
    const parts = node.fileName.split('.');

    for (let i = 1; i < parts.length; i++) {
      const intermediatePath = parts.slice(0, i + 1).join('.');

      if (!existingPaths.has(intermediatePath)) {
        const lastPart = parts[i];
        const level = i + 1;

        const virtualNode: VPNodeVirtual = {
          fileName: intermediatePath,
          lastPart: lastPart,
          uid: intermediatePath,
          title: lastPart,
          docEntrypoint: false,
          order: 0,
          level: level
        };

        virtualNodesToCreate.push(virtualNode);
        existingPaths.add(intermediatePath);
      }
    }
  }

  return virtualNodesToCreate;
}