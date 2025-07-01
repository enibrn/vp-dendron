import matter from 'gray-matter';
import { VPNode } from './common';
import { readdir, readFile } from 'fs/promises';
import path, { basename, extname } from 'path';

export interface INodesImporter {
  do(): Promise<VPNode.Result[]>;
}

export class DendronNodesImporter implements INodesImporter {
  private readonly nodesPath: string;

  constructor(nodesPath: string) {
    this.nodesPath = nodesPath;
  }

  public async do(): Promise<VPNode.Result[]> {
    const results: VPNode.Result[] = [];

    // Read all md files in the nodes directory except 'root.md'
    const filesToExclude: string[] = ['root.md', 'index.md', 'README.md'];
    const files: string[] = await readdir(this.nodesPath);
    const markdownFiles: string[] = files
      .filter(file => extname(file) === '.md' && !filesToExclude.includes(file));
    for (const file of markdownFiles) {
      results.push(await this.importNodeFromFile(file));
    }

    return results;
  }

  private async importNodeFromFile(fileNameWithExt: string): Promise<VPNode.Result> {
    // Generate base node information
    const fileName: string = basename(fileNameWithExt, extname(fileNameWithExt));
    const filePath: string = path.join(this.nodesPath, fileNameWithExt);
    const lastPart: string = fileName.split('.').pop() || '';
    const baseNode: VPNode.Base = {
      fileName,
      fileNameWithExt,
      filePath,
      lastPart};

    // Read the file and extract front matter
    let data: any = {};
    try {
      const fileContent = await readFile(filePath, 'utf-8');
      ({ data } = matter(fileContent));
    } catch (e) {
      const fileReadErrorMessage: string = 'Error when reading file ' + (e instanceof Error ? e.message : String(e));
      return { ...baseNode, errors: [fileReadErrorMessage] } as VPNode.Failed;
    }

    // Validate required fields and collect errors
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
      return { ...baseNode, errors } as VPNode.Failed;
    }

    // return the imported node object
    return {
      ...baseNode,
      uid: data.id,
      title: data.title,
      createdTimestamp: data.created,
      updatedTimestamp: data.updated,
      docEntrypoint: DendronNodesImporter.resolveDoc(data),
      order: typeof data.nav_order === 'number' ? data.nav_order : 999,
      level: fileName.split('.').length,
      createdDate,
      updatedDate,
      link: '/' + fileName
    } as VPNode.Imported;
  }

  private static resolveDoc(data: any): VPNode.DocEntryInfo | false {
    if (!data.vpd // vpd is not defined
      || typeof data.vpd !== 'object' // vpd is not an object
      || !data.vpd.doc // vpd.doc is not defined
      || (typeof data.vpd.doc !== 'object' && typeof data.vpd.doc !== 'boolean') // vpd.doc is not an expected type
      || (typeof data.vpd.doc === 'boolean' && !data.vpd.doc)) { // vpd.doc explicitly false
      return false;
    }

    // Default values
    let leafLandingPoint: VPNode.LeafLandingPoint = 'first';
    let collapseNonLandingChildren = false;

    if (typeof data.vpd.doc === 'boolean' && data.vpd.doc) { // vpd.doc explicitly true
      return { leafLandingPoint, collapseNonLandingChildren };
    }

    // from this on we know vpd.doc is an object

    // Check for leafLandingPoint
    if (data.vpd.doc.leafLandingPoint && VPNode.isLeafLandingPoint(data.vpd.doc.leafLandingPoint)) {
      leafLandingPoint = data.vpd.doc.leafLandingPoint;
    }

    // Check for collapseOtherFirstLevels
    if (data.vpd.doc.collapseOtherFirstLevels && typeof data.vpd.doc.collapseOtherFirstLevels === 'boolean') {
      collapseNonLandingChildren = data.vpd.doc.collapseOtherFirstLevels;
    }

    return {
      leafLandingPoint,
      collapseNonLandingChildren
    };
  }
}