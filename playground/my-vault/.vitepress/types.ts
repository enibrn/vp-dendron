
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
};export type NavItem = {
  text: string;
  link?: string;
  items?: NavItem[];
};
export type SidebarItem = {
  key: string;
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
};
export type HomeCard = {
  title: string;
  details: string;
  link: string;
};

