import { FileNode } from "@/types/file";
import JSZip from "jszip";

export const createFileNode = (name: string, type: 'file' | 'folder', parentPath: string): FileNode => {
  const path = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    type,
    content: type === 'file' ? '' : undefined,
    children: type === 'folder' ? [] : undefined,
    path,
  };
};

export const findNodeByPath = (nodes: FileNode[], path: string): FileNode | null => {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

export const deleteNodeByPath = (nodes: FileNode[], path: string): FileNode[] => {
  return nodes.filter((node) => {
    if (node.path === path) return false;
    if (node.children) {
      node.children = deleteNodeByPath(node.children, path);
    }
    return true;
  });
};

export const updateNodeContent = (nodes: FileNode[], path: string, content: string): FileNode[] => {
  return nodes.map((node) => {
    if (node.path === path) {
      return { ...node, content };
    }
    if (node.children) {
      return { ...node, children: updateNodeContent(node.children, path, content) };
    }
    return node;
  });
};

export const addNodeToParent = (nodes: FileNode[], parentPath: string, newNode: FileNode): FileNode[] => {
  if (parentPath === '/') {
    return [...nodes, newNode];
  }
  return nodes.map((node) => {
    if (node.path === parentPath && node.children) {
      return { ...node, children: [...node.children, newNode] };
    }
    if (node.children) {
      return { ...node, children: addNodeToParent(node.children, parentPath, newNode) };
    }
    return node;
  });
};

const addToZip = (zip: JSZip, node: FileNode, basePath: string = '') => {
  const nodePath = basePath ? `${basePath}/${node.name}` : node.name;
  
  if (node.type === 'file') {
    zip.file(nodePath, node.content || '');
  } else if (node.children) {
    node.children.forEach((child) => addToZip(zip, child, nodePath));
  }
};

export const exportToZip = async (files: FileNode[], projectName: string = 'project'): Promise<void> => {
  const zip = new JSZip();
  
  files.forEach((file) => addToZip(zip, file));
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const processZipEntry = async (
  zip: JSZip,
  path: string,
  entry: JSZip.JSZipObject,
  parentPath: string = ''
): Promise<FileNode> => {
  const name = entry.name.split('/').filter(Boolean).pop() || entry.name;
  const fullPath = parentPath ? `${parentPath}/${name}` : `/${name}`;
  
  if (entry.dir) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'folder',
      path: fullPath,
      children: [],
    };
  }

  const isImage = /\.(svg|png|jpg|jpeg|webp)$/i.test(name);
  let content: string;

  if (isImage) {
    const blob = await entry.async('blob');
    content = URL.createObjectURL(blob);
  } else {
    content = await entry.async('text');
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    name,
    type: 'file',
    path: fullPath,
    content,
  };
};

export const importFromZip = async (file: File): Promise<FileNode[]> => {
  const zip = await JSZip.loadAsync(file);
  const fileMap = new Map<string, FileNode>();
  const rootNodes: FileNode[] = [];

  // Process all entries
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.name.startsWith('__MACOSX/') || entry.name.startsWith('.')) continue;
    
    const parts = entry.name.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;

      if (!fileMap.has(currentPath)) {
        const isLastPart = i === parts.length - 1;
        const isFolder = entry.dir || !isLastPart;

        let node: FileNode;
        if (isFolder) {
          node = {
            id: Math.random().toString(36).substr(2, 9),
            name: part,
            type: 'folder',
            path: currentPath,
            children: [],
          };
        } else {
          node = await processZipEntry(zip, path, entry, parentPath);
        }

        fileMap.set(currentPath, node);

        if (parentPath) {
          const parent = fileMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        } else {
          rootNodes.push(node);
        }
      }
    }
  }

  return rootNodes;
};
