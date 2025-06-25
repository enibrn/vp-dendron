import { describe, it, expect } from 'vitest';
import { validateNoteData, parseNoteData } from './dendron-utilities';

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