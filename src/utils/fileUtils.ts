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
