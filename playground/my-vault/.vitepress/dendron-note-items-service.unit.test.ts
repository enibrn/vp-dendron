import { describe, it, expect, beforeAll } from 'vitest';
import { DendronNoteItemsService } from './dendron-note-items-service';

const mockFiles = [
  'valid1.md',
  'valid2.md',
  'invalid.md',
  'root.md', // should be ignored
  'notamarkdown.txt', // should be ignored
];

const fileContents: Record<string, string> = {
  'notes/valid1.md': `---
id: note1
title: Note One
created: 2024-01-01T10:00:00Z
updated: 2024-01-02T10:00:00Z
nav_order: 1
vp:
  side: true
---
# Note One
Content here.
`,
  'notes/valid2.md': `---
id: note2
title: Note Two
created: 2024-02-01T10:00:00Z
updated: 2024-02-02T10:00:00Z
---
# Note Two
Content here.
`,
  'notes/invalid.md': `---
id: note3
created: 2024-03-01T10:00:00Z
updated: 2024-03-02T10:00:00Z
---
# Missing title
`,
};

function mockBunFile(path: string) {
  return {
    text: async () => {
      if (fileContents[path]) return fileContents[path];
      throw new Error('File not found: ' + path);
    }
  };
}

async function mockReaddirImpl(path: string) {
  if (path === 'notes') return mockFiles;
  return [];
}

describe('DendronNoteItemsService', () => {
  let service: DendronNoteItemsService;

  beforeAll(async () => {
    service = new DendronNoteItemsService(mockBunFile, mockReaddirImpl);
    await service.ready;
  });

  it('should parse valid notes and expose them in noteItems', () => {
    expect(service.noteItems.length).toBe(2);

    const keys = service.noteItems.map(n => n.key);
    expect(keys).toContain('valid1');
    expect(keys).toContain('valid2');
  });

  it('should expose errors for invalid notes in noteItemErrors', () => {
    expect(Object.keys(service.noteItemErrors)).toContain('invalid');
    expect(service.noteItemErrors['invalid'].some(e => e.includes('title'))).toBe(true);
  });

  it('should ignore root.md and non-markdown files', () => {
    const keys = service.noteItems.map(n => n.key);
    expect(keys).not.toContain('root');
    expect(keys).not.toContain('notamarkdown');
  });
});