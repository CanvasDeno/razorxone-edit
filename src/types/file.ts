export type FileType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  children?: FileNode[];
  path: string;
}
