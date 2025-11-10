import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2 } from "lucide-react";
import { FileNode } from "@/types/file";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface FileExplorerProps {
  files: FileNode[];
  activeFile: string | null;
  onFileSelect: (file: FileNode) => void;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onDelete: (path: string) => void;
}

export const FileExplorer = ({
  files,
  activeFile,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDelete,
}: FileExplorerProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = activeFile === node.path;

    if (node.type === 'folder') {
      return (
        <div key={node.id}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-hover text-sm ${
                  isActive ? 'bg-tab-active text-primary' : ''
                }`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => toggleFolder(node.path)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 shrink-0 text-primary" />
                ) : (
                  <Folder className="w-4 h-4 shrink-0 text-primary" />
                )}
                <span className="truncate">{node.name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-card border-border">
              <ContextMenuItem onClick={() => onCreateFile(node.path)} className="cursor-pointer">
                <File className="w-4 h-4 mr-2" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onCreateFolder(node.path)} className="cursor-pointer">
                <Folder className="w-4 h-4 mr-2" />
                New Folder
              </ContextMenuItem>
              {node.path !== '/' && (
                <ContextMenuItem onClick={() => onDelete(node.path)} className="cursor-pointer text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          </ContextMenu>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <ContextMenu key={node.id}>
        <ContextMenuTrigger>
          <div
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-hover text-sm ${
              isActive ? 'bg-tab-active text-primary' : ''
            }`}
            style={{ paddingLeft: `${depth * 12 + 24}px` }}
            onClick={() => onFileSelect(node)}
          >
            <File className="w-4 h-4 shrink-0" />
            <span className="truncate">{node.name}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-card border-border">
          <ContextMenuItem onClick={() => onDelete(node.path)} className="cursor-pointer text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className="h-full bg-sidebar border-r border-border flex flex-col">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Explorer</h2>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-hover"
            onClick={() => onCreateFile('/')}
          >
            <File className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-hover"
            onClick={() => onCreateFolder('/')}
          >
            <Folder className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        {files.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
};
