import matter from 'gray-matter';
import type { FileResult, FileResultData, FileResultError, FileParsed, ReadDirFn, ReadFileFn } from './types';

export interface IFilesParser {
  parseFiles(): Promise<FileResult[]>;
}

export class DendronFilesParser implements IFilesParser {
  private readFile: ReadFileFn;
  private readDir: ReadDirFn;

  private notesPath: string;

  constructor(
    bunFile: ReadFileFn,
    readdirImpl: ReadDirFn,
    notesPath: string
  ) {
    this.readFile = bunFile;
    this.readDir = readdirImpl;

    this.notesPath = notesPath;
  }

  public async parseFiles(): Promise<FileResult[]> {
    const results: FileResult[] = [];

    const files: string[] = await this.readDir(this.notesPath);
    for (const file of files) {
      if (!file.endsWith('.md') || file === 'root.md') continue;

      results.push(await this.parseFile(file));
    }

    return results;
  }

  private async parseFile(fileNameWithExt: string): Promise<FileResult> {
    const fileName: string = fileNameWithExt.replace(/\.md$/, '');
    const filePath: string = DendronFilesParser.joinPath(this.notesPath, fileNameWithExt);

    // Step 1: Read the file
    let data: any = {};
    try {
      const fileContent = await this.readFile(filePath).text();
      ({ data } = matter(fileContent));
    } catch (e) {
      const fileReadErrorMessage: string = 'Error when reading file ' + (e instanceof Error ? e.message : String(e));
      return {
        fileName, filePath,
        status: 'error', errors: [fileReadErrorMessage]
      };
    }

    // Step 2: Validate required fields
    const errors: string[] = [];
    const prefix = 'Field missing: ';
    if (!data.id) errors.push(`${prefix}id`);
    if (!data.title) errors.push(`${prefix}title`);
    if (!data.created) errors.push(`${prefix}created`);
    if (!data.updated) errors.push(`${prefix}updated`);
    if (errors.length > 0) {
      return {
        fileName, filePath,
        status: 'error', errors
      };
    }

    // Step 3: Parse file data
    return {
      fileName,
      filePath,
      ...await this.parseFileData(data, fileName)
    };
  }

  private async parseFileData(frontmatter: any, fileName: string): Promise<FileResultData | FileResultError> {
    const errors: string[] = [];

    const createdDate = new Date(frontmatter.created);
    const updatedDate = new Date(frontmatter.updated);
    if (isNaN(createdDate.getTime())) errors.push('Invalid created date');
    if (isNaN(updatedDate.getTime())) errors.push('Invalid updated date');
    if (errors.length > 0) {
      return {
        status: 'error',
        errors
      };
    }

    return {
      status: 'parsed',
      data: {
        uid: frontmatter.id,
        title: frontmatter.title,
        createdTimestamp: frontmatter.created,
        updatedTimestamp: frontmatter.updated,
        side: typeof frontmatter.vp?.side === 'boolean' ? frontmatter.vp.side : false,
        order: typeof frontmatter.nav_order === 'number' ? frontmatter.nav_order : 999,
        level: fileName.split('.').length,
        createdDate,
        updatedDate,
        link: '/' + fileName
      }
    };
  }

  // Utility to join paths
  private static joinPath(...parts: string[]): string {
    return parts.join('/').replace(/\\/g, '/');
  }
}