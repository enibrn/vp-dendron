export type FileParsed = {
  uid: string;
  title: string;
  createdTimestamp: string;
  updatedTimestamp: string;

  side: boolean;
  order: number;
  level: number;
  createdDate: Date;
  updatedDate: Date;
  link: string;
};

export type FileResult = {
  fileName: string;
  filePath: string;
} & (FileResultData | FileResultError);

export type FileResultData = { status: 'parsed'; data: FileParsed };
export type FileResultError = { status: 'error'; errors: string[] };

export type ReadFileFn = (path: string) => { text: () => Promise<string>; };
export type ReadDirFn = (path: string) => Promise<string[]>;
