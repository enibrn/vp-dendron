// Implementazione concreta per Dendron di IVPNodeProcessor

import matter from 'gray-matter';
import { readdir, readFile } from 'fs/promises';
import path, { basename, extname } from 'path';
import {
  VPNodeImportResult,
  VPNodeImported,
  VPNodeFailed,
  VPNodeDocEntryInfo,
  isError
} from './types';
import { IVPNodeProcessor } from './IVPNode';

export class DendronVPNodeProcessor implements IVPNodeProcessor {
  private readonly nodesPath: string;

  constructor(nodesPath: string) {
    this.nodesPath = nodesPath;
  }

  public async importNodesFromFiles(): Promise<VPNodeImportResult[]> {
    const results: VPNodeImportResult[] = [];
    const filesToExclude: string[] = ['root.md', 'index.md', 'README.md'];
    const files: string[] = await readdir(this.nodesPath);
    const markdownFiles: string[] = files
      .filter(file => extname(file) === '.md' && !filesToExclude.includes(file));
    for (const file of markdownFiles) {
      results.push(await this.importNodeFromFile(file));
    }
    return results;
  }

  private async importNodeFromFile(fileNameWithExt: string): Promise<VPNodeImportResult> {
    const fileName: string = basename(fileNameWithExt, extname(fileNameWithExt));
    const lastPart: string = fileName.split('.').pop() || '';
    const filePath: string = path.join(this.nodesPath, fileNameWithExt);

    let data: any = {};
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      ({ data } = matter(fileContent));
    } catch (e) {
      const fileReadErrorMessage: string = 'Error when reading file ' + (e instanceof Error ? e.message : String(e));
      return {
        fileName, lastPart, fileNameWithExt, filePath,
        errors: [fileReadErrorMessage]
      } as VPNodeFailed;
    }

    const errors: string[] = [];
    const prefix = 'Field missing: ';
    if (!data.id) errors.push(`${prefix}id`);
    if (!data.title) errors.push(`${prefix}title`);

    let createdDate: Date | undefined;
    if (!data.created) {
      errors.push(`${prefix}created`);
    } else {
      createdDate = new Date(data.created);
      if (isNaN(createdDate.getTime())) {
        errors.push('Invalid created date');
      }
    }

    let updatedDate: Date | undefined;
    if (!data.updated) {
      errors.push(`${prefix}updated`);
    } else {
      updatedDate = new Date(data.updated);
      if (isNaN(updatedDate.getTime())) {
        errors.push('Invalid updated date');
      }
    }

    if (errors.length > 0) {
      return { fileName, lastPart, fileNameWithExt, filePath, errors } as VPNodeFailed;
    }

    return {
      fileName, lastPart, fileNameWithExt, filePath,
      uid: data.id,
      title: data.title,
      createdTimestamp: data.created,
      updatedTimestamp: data.updated,
      docEntrypoint: DendronVPNodeProcessor.resolveDoc(data),
      order: typeof data.nav_order === 'number' ? data.nav_order : 999,
      level: fileName.split('.').length,
      createdDate,
      updatedDate,
      link: '/' + fileName
    } as VPNodeImported;
  }

  private static resolveDoc(data: any): VPNodeDocEntryInfo | false {
    if (!data.vpd
      || typeof data.vpd !== 'object'
      || !data.vpd.doc
      || (typeof data.vpd.doc !== 'object' && typeof data.vpd.doc !== 'boolean')
      || (typeof data.vpd.doc === 'boolean' && !data.vpd.doc)) {
      return false;
    }

    let leafLandingPoint: 'first' | 'last' = 'first';
    let collapseNonLandingChildren = false;

    if (typeof data.vpd.doc === 'boolean' && data.vpd.doc) {
      return { leafLandingPoint, collapseNonLandingChildren };
    }

    if (data.vpd.doc.leafLandingPoint && (data.vpd.doc.leafLandingPoint === 'first' || data.vpd.doc.leafLandingPoint === 'last')) {
      leafLandingPoint = data.vpd.doc.leafLandingPoint;
    }

    if (data.vpd.doc.collapseOtherFirstLevels && typeof data.vpd.doc.collapseOtherFirstLevels === 'boolean') {
      collapseNonLandingChildren = data.vpd.doc.collapseOtherFirstLevels;
    }

    return {
      leafLandingPoint,
      collapseNonLandingChildren
    };
  }
}