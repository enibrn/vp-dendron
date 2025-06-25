
export type DendronNoteData = {
  id: string;
  title: string;
  created: string;
  updated: string;
};

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
  noteItemErrors: { [key: string]: string[]; };
};
