import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { DendronFilesParser } from './files-parser';
import type { ReadFileFn, ReadDirFn, FileResult, FileParsed } from './types';

describe('DendronFilesParser', () => {
  let parser: DendronFilesParser;
  let mockReadFile: Mock<ReadFileFn>;
  let mockReadDir: Mock<ReadDirFn>;
  let mockFileObj: { text: Mock<() => Promise<string>> };
  const testNotesPath = '/test/notes';

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Create mock for file object with text method
    mockFileObj = {
      text: vi.fn()
    };
    
    // Create mocks for the read functions
    mockReadFile = vi.fn().mockReturnValue(mockFileObj);
    mockReadDir = vi.fn();
    
    // Initialize parser with mocks
    parser = new DendronFilesParser(mockReadFile, mockReadDir, testNotesPath);
  });

  describe('Constructor', () => {
    it('should initialize with provided dependencies', () => {
      expect(parser).toBeInstanceOf(DendronFilesParser);
      expect(parser).toBeDefined();
    });

    it('should implement IFilesParser interface', () => {
      expect(typeof parser.parseFiles).toBe('function');
    });
  });

  describe('parseFiles()', () => {
    describe('Happy Path', () => {
      it('should parse valid markdown files with complete frontmatter', async () => {
        const files = ['note1.md', 'note2.md'];
        const validFrontmatter = `---
id: wg23mvczwa9nrghkmjf8y8i
title: Test Note 1
created: 1672574400000
updated: 1672660800000
vp:
  side: true
nav_order: 5
---
# Test Content`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(validFrontmatter);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(2);
        expect(results[0].status).toBe('parsed');
        if (results[0].status === 'parsed') {
          expect(results[0].data.uid).toBe('wg23mvczwa9nrghkmjf8y8i');
          expect(results[0].data.title).toBe('Test Note 1');
          expect(results[0].data.side).toBe(true);
          expect(results[0].data.order).toBe(5);
          expect(results[0].data.level).toBe(1);
          expect(results[0].data.link).toBe('/note1');
        }
      });

      it('should parse files with minimal required frontmatter', async () => {
        const files = ['simple.note.md'];
        const minimalFrontmatter = `---
id: abc123def456ghi789jkl012
title: Simple Note
created: 1672574400000
updated: 1672660800000
---
# Simple Content`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(minimalFrontmatter);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('parsed');
        if (results[0].status === 'parsed') {
          expect(results[0].data.side).toBe(false); // default value
          expect(results[0].data.order).toBe(999); // default value
          expect(results[0].data.level).toBe(2); // simple.note = 2 levels
        }
      });

      it('should calculate correct level from file name dots', async () => {
        const files = ['root.level1.level2.level3.md'];
        const frontmatter = `---
id: deep-id
title: Deep Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('parsed');
        if (results[0].status === 'parsed') {
          expect(results[0].data.level).toBe(4); // 4 dot-separated parts
        }
      });

      it('should handle optional vp.side with different types', async () => {
        const files = ['test1.md', 'test2.md', 'test3.md'];
        const frontmatterTrue = `---
id: test-1
title: Test 1
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
vp:
  side: true
---`;
        const frontmatterFalse = `---
id: test-2
title: Test 2
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
vp:
  side: false
---`;
        const frontmatterString = `---
id: test-3
title: Test 3
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
vp:
  side: "not-boolean"
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text
          .mockResolvedValueOnce(frontmatterTrue)
          .mockResolvedValueOnce(frontmatterFalse)
          .mockResolvedValueOnce(frontmatterString);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(3);
        if (results[0].status === 'parsed') expect(results[0].data.side).toBe(true);
        if (results[1].status === 'parsed') expect(results[1].data.side).toBe(false);
        if (results[2].status === 'parsed') expect(results[2].data.side).toBe(false); // non-boolean defaults to false
      });

      it('should handle optional nav_order with different types', async () => {
        const files = ['test1.md', 'test2.md', 'test3.md'];
        const frontmatterValid = `---
id: test-1
title: Test 1
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
nav_order: 10
---`;
        const frontmatterString = `---
id: test-2
title: Test 2
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
nav_order: "not-number"
---`;
        const frontmatterMissing = `---
id: test-3
title: Test 3
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text
          .mockResolvedValueOnce(frontmatterValid)
          .mockResolvedValueOnce(frontmatterString)
          .mockResolvedValueOnce(frontmatterMissing);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(3);
        if (results[0].status === 'parsed') expect(results[0].data.order).toBe(10);
        if (results[1].status === 'parsed') expect(results[1].data.order).toBe(999); // non-number defaults to 999
        if (results[2].status === 'parsed') expect(results[2].data.order).toBe(999); // missing defaults to 999
      });
    });

    describe('File Filtering', () => {
      it('should exclude root.md files', async () => {
        const files = ['note1.md', 'root.md', 'note2.md'];
        const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(2);
        expect(results.map(r => r.fileName)).toEqual(['note1', 'note2']);
      });

      it('should exclude non-markdown files', async () => {
        const files = ['note1.md', 'image.jpg', 'doc.txt', 'note2.md', 'config.json'];
        const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(2);
        expect(results.map(r => r.fileName)).toEqual(['note1', 'note2']);
      });

      it('should handle empty directory', async () => {
        mockReadDir.mockResolvedValue([]);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(0);
      });

      it('should handle directory with only excluded files', async () => {
        mockReadDir.mockResolvedValue(['root.md', 'image.jpg', 'config.json']);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(0);
      });
    });

    describe('Error Handling', () => {
      it('should handle directory read errors', async () => {
        const dirError = new Error('Directory not found');
        mockReadDir.mockRejectedValue(dirError);

        await expect(parser.parseFiles()).rejects.toThrow('Directory not found');
      });

      it('should handle file read errors', async () => {
        const files = ['error-file.md', 'good-file.md'];
        const goodFrontmatter = `---
id: good-id
title: Good File
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text
          .mockRejectedValueOnce(new Error('File read failed'))
          .mockResolvedValueOnce(goodFrontmatter);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(2);
        expect(results[0].status).toBe('error');
        expect(results[0].status === 'error' && results[0].errors).toContain('Error when reading file File read failed');
        expect(results[1].status).toBe('parsed');
      });

      it('should handle file read errors with non-Error objects', async () => {
        const files = ['error-file.md'];
        
        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockRejectedValue('String error');

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        expect(results[0].status === 'error' && results[0].errors).toContain('Error when reading file String error');
      });

      it('should handle missing required field: id', async () => {
        const files = ['missing-id.md'];
        const frontmatter = `---
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        expect(results[0].status === 'error' && results[0].errors).toContain('Field missing: id');
      });

      it('should handle missing required field: title', async () => {
        const files = ['missing-title.md'];
        const frontmatter = `---
id: test-id
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        expect(results[0].status === 'error' && results[0].errors).toContain('Field missing: title');
      });

      it('should handle missing required field: created', async () => {
        const files = ['missing-created.md'];
        const frontmatter = `---
id: test-id
title: Test Note
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        expect(results[0].status === 'error' && results[0].errors).toContain('Field missing: created');
      });

      it('should handle missing required field: updated', async () => {
        const files = ['missing-updated.md'];
        const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        expect(results[0].status === 'error' && results[0].errors).toContain('Field missing: updated');
      });

      it('should handle multiple missing required fields', async () => {
        const files = ['missing-multiple.md'];
        const frontmatter = `---
title: Test Note
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        if (results[0].status === 'error') {
          expect(results[0].errors).toHaveLength(3);
          expect(results[0].errors).toContain('Field missing: id');
          expect(results[0].errors).toContain('Field missing: created');
          expect(results[0].errors).toContain('Field missing: updated');
        }
      });

      it('should handle invalid created date format', async () => {
        const files = ['invalid-created.md'];
        const frontmatter = `---
id: test-id
title: Test Note
created: invalid-date
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        expect(results[0].status === 'error' && results[0].errors).toContain('Invalid created date');
      });

      it('should handle invalid updated date format', async () => {
        const files = ['invalid-updated.md'];
        const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: not-a-date
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        expect(results[0].status === 'error' && results[0].errors).toContain('Invalid updated date');
      });

      it('should handle both invalid date formats', async () => {
        const files = ['invalid-dates.md'];
        const frontmatter = `---
id: test-id
title: Test Note
created: bad-date
updated: also-bad-date
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        if (results[0].status === 'error') {
          expect(results[0].errors).toHaveLength(2);
          expect(results[0].errors).toContain('Invalid created date');
          expect(results[0].errors).toContain('Invalid updated date');
        }
      });

      it('should handle empty frontmatter', async () => {
        const files = ['empty-frontmatter.md'];
        const frontmatter = `---
---
# Just content, no frontmatter fields`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        if (results[0].status === 'error') {
          expect(results[0].errors).toHaveLength(4);
          expect(results[0].errors).toContain('Field missing: id');
          expect(results[0].errors).toContain('Field missing: title');
          expect(results[0].errors).toContain('Field missing: created');
          expect(results[0].errors).toContain('Field missing: updated');
        }
      });

      it('should handle file without frontmatter', async () => {
        const files = ['no-frontmatter.md'];
        const content = `# Just a regular markdown file
No frontmatter at all`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(content);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('error');
        expect(results[0].status === 'error' && results[0].errors.length).toBe(4);
      });
    });

    describe('Data Validation and Parsing', () => {
      it('should correctly parse and convert date strings to Date objects', async () => {
        const files = ['date-test.md'];
        // Unix timestamps: 1686839400000 = 2023-06-15T14:30:00.000Z, 1686906930000 = 2023-06-16T09:15:30.000Z
        const frontmatter = `---
id: xyz789abc123def456ghi012
title: Date Test
created: 1686839400000
updated: 1686906930000
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results[0].status).toBe('parsed');
        if (results[0].status === 'parsed') {
          expect(results[0].data.createdDate).toBeInstanceOf(Date);
          expect(results[0].data.updatedDate).toBeInstanceOf(Date);
          expect(results[0].data.createdDate.toISOString()).toBe('2023-06-15T14:30:00.000Z');
          expect(results[0].data.updatedDate.toISOString()).toBe('2023-06-16T09:15:30.000Z');
          // The timestamps are numbers (gray-matter parses numeric values as numbers)
          expect(results[0].data.createdTimestamp).toBe(1686839400000);
          expect(results[0].data.updatedTimestamp).toBe(1686906930000);
        }
      });

      it('should handle various valid date formats', async () => {
        const files = ['iso-date.md', 'timestamp-date.md'];
        const isoFrontmatter = `---
id: iso-test
title: ISO Date Test
created: 2023-01-01T10:00:00.000Z
updated: 2023-01-02T15:30:45.123Z
---`;
        const timestampFrontmatter = `---
id: timestamp-test
title: Timestamp Test
created: 1672574400000
updated: 1672660800000
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text
          .mockResolvedValueOnce(isoFrontmatter)
          .mockResolvedValueOnce(timestampFrontmatter);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(2);
        expect(results[0].status).toBe('parsed');
        expect(results[1].status).toBe('parsed');
        
        if (results[0].status === 'parsed') {
          expect(results[0].data.createdDate).toBeInstanceOf(Date);
          expect(results[0].data.updatedDate).toBeInstanceOf(Date);
        }
        
        if (results[1].status === 'parsed') {
          expect(results[1].data.createdDate).toBeInstanceOf(Date);
          expect(results[1].data.updatedDate).toBeInstanceOf(Date);
        }
      });

      it('should correctly generate file paths and links', async () => {
        const files = ['simple.md', 'complex.nested.file.md'];
        const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(2);
        expect(results[0].fileName).toBe('simple');
        expect(results[0].filePath).toBe('/test/notes/simple.md');
        if (results[0].status === 'parsed') {
          expect(results[0].data.link).toBe('/simple');
        }

        expect(results[1].fileName).toBe('complex.nested.file');
        expect(results[1].filePath).toBe('/test/notes/complex.nested.file.md');
        if (results[1].status === 'parsed') {
          expect(results[1].data.link).toBe('/complex.nested.file');
        }
      });

      it('should correctly calculate level from filename structure', async () => {
        const files = [
          'single.md',           // level 1
          'two.parts.md',        // level 2
          'three.dot.parts.md',  // level 3
          'very.deep.nested.structure.file.md' // level 5
        ];
        const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(4);
        if (results[0].status === 'parsed') expect(results[0].data.level).toBe(1);
        if (results[1].status === 'parsed') expect(results[1].data.level).toBe(2);
        if (results[2].status === 'parsed') expect(results[2].data.level).toBe(3);
        if (results[3].status === 'parsed') expect(results[3].data.level).toBe(5);
      });
    });

    describe('Integration Scenarios', () => {
      it('should handle mixed valid and invalid files in same directory', async () => {
        const files = ['valid.md', 'missing-fields.md', 'invalid-dates.md', 'another-valid.md'];
        const validFrontmatter = `---
id: valid-id
title: Valid Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;
        const missingFieldsFrontmatter = `---
id: missing-id
title: Missing Fields
---`;
        const invalidDatesFrontmatter = `---
id: invalid-id
title: Invalid Dates
created: not-a-date
updated: also-not-a-date
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text
          .mockResolvedValueOnce(validFrontmatter)
          .mockResolvedValueOnce(missingFieldsFrontmatter)
          .mockResolvedValueOnce(invalidDatesFrontmatter)
          .mockResolvedValueOnce(validFrontmatter);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(4);
        expect(results[0].status).toBe('parsed');
        expect(results[1].status).toBe('error');
        expect(results[1].status === 'error' && results[1].errors).toContain('Field missing: created');
        expect(results[2].status).toBe('error');
        expect(results[2].status === 'error' && results[2].errors).toContain('Invalid created date');
        expect(results[3].status).toBe('parsed');
      });

      it('should handle complex vp.side structure variations', async () => {
        const files = ['nested-true.md', 'nested-false.md', 'flat-vp.md', 'no-vp.md'];
        const nestedTrue = `---
id: test-1
title: Test 1
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
vp:
  side: true
  other: value
---`;
        const nestedFalse = `---
id: test-2
title: Test 2
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
vp:
  side: false
---`;
        const flatVp = `---
id: test-3
title: Test 3
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
vp: not-object
---`;
        const noVp = `---
id: test-4
title: Test 4
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text
          .mockResolvedValueOnce(nestedTrue)
          .mockResolvedValueOnce(nestedFalse)
          .mockResolvedValueOnce(flatVp)
          .mockResolvedValueOnce(noVp);

        const results = await parser.parseFiles();

        expect(results).toHaveLength(4);
        if (results[0].status === 'parsed') expect(results[0].data.side).toBe(true);
        if (results[1].status === 'parsed') expect(results[1].data.side).toBe(false);
        if (results[2].status === 'parsed') expect(results[2].data.side).toBe(false); // vp is not an object
        if (results[3].status === 'parsed') expect(results[3].data.side).toBe(false); // no vp field
      });
    });

    describe('Path Handling', () => {
      it('should call readFile with correct path constructed from notesPath', async () => {
        const files = ['test.md'];
        const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        await parser.parseFiles();

        expect(mockReadFile).toHaveBeenCalledWith('/test/notes/test.md');
        expect(mockReadDir).toHaveBeenCalledWith('/test/notes');
      });

      it('should handle paths with backslashes by converting to forward slashes', async () => {
        const windowsStyleParser = new DendronFilesParser(mockReadFile, mockReadDir, 'C:\\test\\notes');
        const files = ['test.md'];
        const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

        mockReadDir.mockResolvedValue(files);
        mockFileObj.text.mockResolvedValue(frontmatter);

        await windowsStyleParser.parseFiles();

        expect(mockReadFile).toHaveBeenCalledWith('C:/test/notes/test.md');
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero-length file names edge case', async () => {
      const files = ['.md']; // Edge case: just the extension
      
      mockReadDir.mockResolvedValue(files);
      
      await parser.parseFiles();
      
      // Should still attempt to process even unusual filenames
      expect(mockReadFile).toHaveBeenCalledWith('/test/notes/.md');
    });

    it('should handle files with multiple consecutive dots', async () => {
      const files = ['file..with...dots.md'];
      const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

      mockReadDir.mockResolvedValue(files);
      mockFileObj.text.mockResolvedValue(frontmatter);

      const results = await parser.parseFiles();

      expect(results[0].fileName).toBe('file..with...dots');
      if (results[0].status === 'parsed') {
        expect(results[0].data.level).toBe(6); // Split by dots: 'file', '', 'with', '', '', 'dots'
        expect(results[0].data.link).toBe('/file..with...dots');
      }
    });

    it('should handle extremely long file names', async () => {
      const longFileName = 'a'.repeat(100) + '.md';
      const files = [longFileName];
      const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

      mockReadDir.mockResolvedValue(files);
      mockFileObj.text.mockResolvedValue(frontmatter);

      const results = await parser.parseFiles();

      expect(results[0].fileName).toBe('a'.repeat(100));
      expect(results[0].status).toBe('parsed');
    });

    it('should handle files with special characters in names', async () => {
      const files = ['file-with_special@chars.md', 'file with spaces.md'];
      const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

      mockReadDir.mockResolvedValue(files);
      mockFileObj.text.mockResolvedValue(frontmatter);

      const results = await parser.parseFiles();

      expect(results).toHaveLength(2);
      expect(results[0].fileName).toBe('file-with_special@chars');
      expect(results[1].fileName).toBe('file with spaces');
    });

    it('should handle very large numbers of files', async () => {
      const files = Array.from({ length: 1000 }, (_, i) => `file${i}.md`);
      const frontmatter = `---
id: test-id
title: Test Note
created: 2023-01-01T10:00:00Z
updated: 2023-01-02T10:00:00Z
---`;

      mockReadDir.mockResolvedValue(files);
      mockFileObj.text.mockResolvedValue(frontmatter);

      const results = await parser.parseFiles();

      expect(results).toHaveLength(1000);
      expect(results.every(r => r.status === 'parsed')).toBe(true);
    });
  });
});