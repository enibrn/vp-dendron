import matter from 'gray-matter';
import type { DendronNoteItem, DendronNoteData, ParsedNoteData } from './types';

type BunFileFn = (path: string) => { text: () => Promise<string> };
type ReaddirImplFn = (path: string) => Promise<string[]>;

export class DendronNoteItemsService {
  public noteItems: DendronNoteItem[] = [];
  public noteItemErrors: { [key: string]: string[] } = {};
  public ready: Promise<void>;

  private bunFile: BunFileFn;
  private readdirImpl: ReaddirImplFn;

  private notesPath: string;

  constructor(
    bunFile?: BunFileFn,
    readdirImpl?: ReaddirImplFn,
    notesPath: string = 'notes'
  ) {
    this.bunFile = bunFile ?? ((path) => Bun.file(path));
    this.readdirImpl = readdirImpl ?? (async (path) => await import('node:fs/promises').then(m => m.readdir(path)));

    this.notesPath = notesPath;

    // Start parsing process and expose a ready promise
    this.ready = this.init();
  }

  private async init() {
    const files = await this.readdirImpl(this.notesPath);

    this.noteItems = [];
    this.noteItemErrors = {};

    for (const file of files) {
      if (!file.endsWith('.md') || file === 'root.md') continue;

      const key = file.replace(/\.md$/, '');
      const filePath = this.joinPath(this.notesPath, file);

      // Step 1: Read and parse file
      const { data, errors: readErrors } = await this.readAndParseNoteFile(filePath);
      const errors: string[] = [...readErrors];

      // Step 2: Validate required fields
      errors.push(...this.validateNoteData(data));
      if (errors.length > 0) {
        this.noteItemErrors[key] = errors;
        continue;
      }

      // Build base data object
      const noteData: DendronNoteData = {
        id: data.id,
        title: data.title,
        created: data.created,
        updated: data.updated
      };

      // Step 3: Parse computed data
      const { parsedData, errors: parseErrors } = this.parseNoteData(data, key);
      errors.push(...parseErrors);
      if (errors.length > 0 || !parsedData) {
        this.noteItemErrors[key] = errors;
        continue;
      }

      // Add valid note to result array
      this.noteItems.push({ key, ...noteData, ...parsedData });
    }
  }

  // Utility to join paths (since Bun does not have 'path' like Node)
  private joinPath(...parts: string[]): string {
    return parts.join('/').replace(/\\/g, '/');
  }

  // Reads and parses the file, returns data and errors
  private async readAndParseNoteFile(
    filePath: string
  ): Promise<{ data: any, errors: string[] }> {
    const errors: string[] = [];
    let data: any = {};

    try {
      const fileContent = await this.bunFile(filePath).text();
      ({ data } = matter(fileContent));
    } catch (e) {
      errors.push('Error when reading file ' + (e instanceof Error ? e.message : String(e)));
    }

    return { data, errors };
  }

  // Validates required fields
  private validateNoteData(data: any): string[] {
    const errors: string[] = [];
    const prefix = 'Field missing: ';

    if (!data.id) errors.push(`${prefix}id`);
    if (!data.title) errors.push(`${prefix}title`);
    if (!data.created) errors.push(`${prefix}created`);
    if (!data.updated) errors.push(`${prefix}updated`);

    return errors;
  }

  // Parses computed data from frontmatter and file name
  private parseNoteData(data: any, key: string): { parsedData: ParsedNoteData | null, errors: string[] } {
    const errors: string[] = [];
    let parsedData: ParsedNoteData | null = null;

    try {
      const createdDate = new Date(data.created);
      const updatedDate = new Date(data.updated);

      if (isNaN(createdDate.getTime())) errors.push('Invalid created date');
      if (isNaN(updatedDate.getTime())) errors.push('Invalid updated date');

      parsedData = {
        side: typeof data.vp?.side === 'boolean' ? data.vp.side : false,
        order: typeof data.nav_order === 'number' ? data.nav_order : 999,
        level: key.split('.').length,
        createdDate,
        updatedDate,
        relativeFilePath: this.joinPath(this.notesPath, `${key}.md`)
      };
    } catch (e) {
      errors.push('Error parsing parsedData: ' + (e instanceof Error ? e.message : String(e)));
    }

    return { parsedData, errors };
  }
}