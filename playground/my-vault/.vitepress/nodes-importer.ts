import matter from 'gray-matter';
import type {
  VPNode,
  ReadFileFn,
  ReadDirFn
} from './common';

export interface INodesImporter {
  do(): Promise<VPNode.Result[]>;
}

export class DendronNodesImporter implements INodesImporter {
  private readonly readFile: ReadFileFn;
  private readonly readDir: ReadDirFn;
  private readonly filesPath: string;

  constructor(
    bunFile: ReadFileFn,
    readdirImpl: ReadDirFn,
    notesPath: string
  ) {
    this.readFile = bunFile;
    this.readDir = readdirImpl;
    this.filesPath = notesPath;
  }

  public async do(): Promise<VPNode.Result[]> {
    const results: VPNode.Result[] = [];

    const files: string[] = await this.readDir(this.filesPath);
    for (const file of files) {
      if (!file.endsWith('.md') || file === 'root.md') continue;

      results.push(await this.importNodeFromFile(file));
    }

    return results;
  }

  private async importNodeFromFile(fileNameWithExt: string): Promise<VPNode.Result> {
    const fileName: string = fileNameWithExt.replace(/\.md$/, '');
    const filePath: string = DendronNodesImporter.joinPath(this.filesPath, fileNameWithExt);

    // Step 1: Read the file
    let data: any = {};
    try {
      const fileContent = await this.readFile(filePath).text();
      ({ data } = matter(fileContent));
    } catch (e) {
      const fileReadErrorMessage: string = 'Error when reading file ' + (e instanceof Error ? e.message : String(e));
      return { fileName, filePath, errors: [fileReadErrorMessage] } as VPNode.Failed;
    }

    // Step 2: Validate required fields and collect errors
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
      return { fileName, filePath, errors } as VPNode.Failed;
    }

    // Step 3: Parse file data
    return {
      uid: data.id,
      title: data.title,
      createdTimestamp: data.created,
      updatedTimestamp: data.updated,
      docEntrypoint: DendronNodesImporter.resolveDoc(data.vpd),
      order: typeof data.nav_order === 'number' ? data.nav_order : 999,
      level: fileName.split('.').length,
      createdDate,
      updatedDate,
      link: '/' + fileName
    } as VPNode.Imported;
  }

  private static resolveDoc(vpd: any): VPNode.DocEntryInfo | false {
    if (typeof vpd === 'boolean' && vpd) {
      // default behavior for vp.side
      return {
        leafLandingPoint: 'first',
        collapseNonLandingChildren: false
      };
    } else if (typeof vpd === 'object') {
      // custom behavior for vp.side
      return {
        leafLandingPoint: vpd.leafLandingPoint ? 'last' : 'first',
        collapseNonLandingChildren: vpd.collapseOtherFirstLevels || false
      };
    }

    return false;
  }

  // Utility to join paths
  private static joinPath(...parts: string[]): string {
    return parts.join('/').replace(/\\/g, '/');
  }
}