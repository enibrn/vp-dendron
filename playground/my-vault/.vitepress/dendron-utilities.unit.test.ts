import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateNoteData, parseNoteData, readAndParseNoteFile, getItemsFromDendronNoteFiles } from './dendron-utilities';
import * as fs from 'node:fs/promises';

describe('validateNoteData', () => {
  it('should return no errors for valid data', () => {
    const data = { id: '1', title: 'Test', created: '2023-01-01', updated: '2023-01-02' };
    expect(validateNoteData(data)).toEqual([]);
  });

  it('should return errors for missing fields', () => {
    const data = { id: '', title: '', created: '', updated: '' };
    const errors = validateNoteData(data);
    expect(errors).toContain('Field missing: id');
    expect(errors).toContain('Field missing: title');
    expect(errors).toContain('Field missing: created');
    expect(errors).toContain('Field missing: updated');
  });
});

describe('parseNoteData', () => {
  it('should parse valid data correctly', () => {
    const data = {
      created: '2023-01-01',
      updated: '2023-01-02',
      vp: { side: true },
      nav_order: 5
    };
    const key = 'foo.bar';
    const { parsedData, errors } = parseNoteData(data, key);
    expect(errors).toEqual([]);
    expect(parsedData).toMatchObject({
      side: true,
      order: 5,
      level: 2,
      relativeFilePath: 'notes/foo.bar.md'
    });
    expect(parsedData?.createdDate).toBeInstanceOf(Date);
    expect(parsedData?.updatedDate).toBeInstanceOf(Date);
  });

  it('should return errors for invalid dates', () => {
    const data = {
      created: 'invalid-date',
      updated: 'invalid-date'
    };
    const key = 'foo';
    const { parsedData, errors } = parseNoteData(data, key);
    expect(errors).toContain('Invalid created date');
    expect(errors).toContain('Invalid updated date');
    expect(parsedData).not.toBeNull();
  });
});

describe('readAndParseNoteFile', () => {
  let bunFileMock: any;

  beforeEach(() => {
    bunFileMock = vi.fn();
  });

  it('should parse frontmatter data from file', async () => {
    const fileContent = `---
id: test-id
title: Test Title
created: 2023-01-01
updated: 2023-01-02
---
Body text
`;
    bunFileMock.mockReturnValue({
      text: vi.fn().mockResolvedValue(fileContent)
    });
    const { data, errors } = await readAndParseNoteFile('fake/path.md', bunFileMock);
    expect(errors).toEqual([]);
    expect(data).toMatchObject({
      id: 'test-id',
      title: 'Test Title'
    });
    // Accept both string and Date for created/updated
    if (typeof data.created === 'string') {
      expect(data.created).toBe('2023-01-01');
    } else {
      expect(data.created).toEqual(new Date('2023-01-01'));
    }
    if (typeof data.updated === 'string') {
      expect(data.updated).toBe('2023-01-02');
    } else {
      expect(data.updated).toEqual(new Date('2023-01-02'));
    }
  });

  it('should handle file read errors', async () => {
    bunFileMock.mockReturnValue({
      text: vi.fn().mockRejectedValue(new Error('File not found'))
    });
    const { data, errors } = await readAndParseNoteFile('bad/path.md', bunFileMock);
    expect(errors.length).toBe(1);
    expect(errors[0]).toMatch(/Error when reading file/);
    expect(data).toEqual({});
  });
});

describe('getItemsFromDendronNoteFiles', () => {
  let readdirMock: any;
  let bunFileMock: any;

  beforeEach(() => {
    readdirMock = vi.fn();
    bunFileMock = vi.fn();
  });

  it('should return noteItems for valid markdown files', async () => {
    readdirMock.mockResolvedValue(['foo.md', 'bar.md', 'root.md', 'not-md.txt']);
    bunFileMock
      .mockImplementation((filePath: string) => ({
        text: vi.fn().mockResolvedValueOnce(
          filePath.includes('foo.md')
            ? `---
id: foo-id
title: Foo Title
created: 2023-01-01
updated: 2023-01-02
---
`
            : `---
id: bar-id
title: Bar Title
created: 2023-01-03
updated: 2023-01-04
---
`
        )
      }));
    const result = await getItemsFromDendronNoteFiles(readdirMock, bunFileMock);
    expect(result.noteItems.length).toBe(2);
    expect(result.noteItems[0]).toMatchObject({ key: 'foo', id: 'foo-id', title: 'Foo Title' });
    expect(result.noteItems[1]).toMatchObject({ key: 'bar', id: 'bar-id', title: 'Bar Title' });
    expect(result.noteItemErrors).toEqual({});
  });

  it('should collect errors for files with missing fields', async () => {
    readdirMock.mockResolvedValue(['bad.md']);
    bunFileMock.mockReturnValue({
      text: vi.fn().mockResolvedValueOnce(
        `---
id:
title:
created:
updated:
---
`
      )
    });
    const result = await getItemsFromDendronNoteFiles(readdirMock, bunFileMock);
    expect(result.noteItems).toEqual([]);
    expect(result.noteItemErrors.bad).toEqual([
      'Field missing: id',
      'Field missing: title',
      'Field missing: created',
      'Field missing: updated'
    ]);
  });

  it('should collect errors for file read failures', async () => {
    readdirMock.mockResolvedValue(['fail.md']);
    bunFileMock.mockReturnValue({
      text: vi.fn().mockRejectedValueOnce(new Error('Read error'))
    });
    const result = await getItemsFromDendronNoteFiles(readdirMock, bunFileMock);
    expect(result.noteItems).toEqual([]);
    expect(result.noteItemErrors.fail[0]).toMatch(/Error when reading file/);
  });

  it('should collect errors for parseNoteData errors', async () => {
    readdirMock.mockResolvedValue(['bad-date.md']);
    bunFileMock.mockReturnValue({
      text: vi.fn().mockResolvedValueOnce(
        `---
id: test-id
title: Test Title
created: invalid-date
updated: invalid-date
---
`
      )
    });
    const result = await getItemsFromDendronNoteFiles(readdirMock, bunFileMock);
    expect(result.noteItems).toEqual([]);
    expect(result.noteItemErrors['bad-date']).toContain('Invalid created date');
    expect(result.noteItemErrors['bad-date']).toContain('Invalid updated date');
  });
});
