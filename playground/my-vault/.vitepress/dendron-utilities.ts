import matter from 'gray-matter';
import { readdir } from "node:fs/promises";

export const notesPath = 'notes';

export type DendronNoteData = {
  id: string;
  title: string;
  created: string;
  updated: string;
}

export type ParsedNoteData = {
  side: boolean;
  order: number;
  level: number;
  createdDate: Date;
  updatedDate: Date;
  relativeFilePath: string;
};

export type DendronNoteItem = {
  key: string;
} & DendronNoteData & ParsedNoteData;

export type NoteItemsResult = {
  noteItems: DendronNoteItem[];
  noteItemErrors: { [key: string]: string[] };
};

// Utility to join paths (since Bun does not have 'path' like Node)
function joinPath(...parts: string[]): string {
  return parts.join('/').replace(/\\/g, '/');
}

// Reads and parses the file, returns data and errors
export async function readAndParseNoteFile(
  filePath: string,
  bunFile: (path: string) => { text: () => Promise<string> } = (path) => Bun.file(path)
): Promise<{ data: any, errors: string[] }> {
  const errors: string[] = [];
  let data: any = {};
  try {
    const fileContent = await bunFile(filePath).text();
    ({ data } = matter(fileContent));
  } catch (e) {
    errors.push('Error when reading file ' + (e instanceof Error ? e.message : String(e)));
  }
  return { data, errors };
}

// Validates required fields
export function validateNoteData(data: any): string[] {
  // Array to collect possible errors
  const errors: string[] = [];
  const prefix = 'Field missing: ';

  // Check for required fields
  if (!data.id) errors.push(`${prefix}id`);
  if (!data.title) errors.push(`${prefix}title`);
  if (!data.created) errors.push(`${prefix}created`);
  if (!data.updated) errors.push(`${prefix}updated`);

  return errors;
}

// Parses computed data from frontmatter and file name
export function parseNoteData(data: any, key: string): { parsedData: ParsedNoteData | null, errors: string[] } {
  // Array to collect possible errors
  const errors: string[] = [];
  let parsedData: ParsedNoteData | null = null;

  try {
    // Parse dates
    const createdDate = new Date(data.created);
    const updatedDate = new Date(data.updated);

    // Validate dates
    if (isNaN(createdDate.getTime())) errors.push('Invalid created date');
    if (isNaN(updatedDate.getTime())) errors.push('Invalid updated date');

    // Build ParsedNoteData object
    parsedData = {
      side: typeof data.vp?.side === 'boolean' ? data.vp.side : false,
      order: typeof data.nav_order === 'number' ? data.nav_order : 999,
      level: key.split('.').length,
      createdDate,
      updatedDate,
      relativeFilePath: joinPath(notesPath, `${key}.md`)
    };
  } catch (e) {
    errors.push('Error parsing parsedData: ' + (e instanceof Error ? e.message : String(e)));
  }

  return { parsedData, errors };
}

export async function getItemsFromDendronNoteFiles(
  readdirImpl: (path: string) => Promise<string[]> = readdir,
  bunFile: (path: string) => { text: () => Promise<string> } = (path) => Bun.file(path)
): Promise<NoteItemsResult> {
  // Read file list in notes folder
  const files = await readdirImpl(notesPath);

  // Final result object
  const noteItemsResult: NoteItemsResult = {
    noteItems: [],
    noteItemErrors: {}
  };

  // Iterate over all found files
  for (const file of files) {
    // Only consider markdown files different from root.md
    if (!file.endsWith('.md') || file === 'root.md') continue;

    const key = file.replace(/\.md$/, '');
    const filePath = joinPath(notesPath, file);

    // Step 1: Read and parse file
    const { data, errors: readErrors } = await readAndParseNoteFile(filePath, bunFile);
    const errors: string[] = [...readErrors];

    // Step 2: Validate required fields
    errors.push(...validateNoteData(data));
    if (errors.length > 0) {
      noteItemsResult.noteItemErrors[key] = errors;
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
    const { parsedData, errors: parseErrors } = parseNoteData(data, key);
    errors.push(...parseErrors);
    if (errors.length > 0 || !parsedData) {
      noteItemsResult.noteItemErrors[key] = errors;
      continue;
    }

    // Add valid note to result array
    noteItemsResult.noteItems.push({ key, ...noteData, ...parsedData });
  }

  return noteItemsResult;
}
