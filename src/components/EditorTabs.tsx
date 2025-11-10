import { X } from "lucide-react";
import { FileNode } from "@/types/file";

interface EditorTabsProps {
  openFiles: FileNode[];
  activeFile: string | null;
  onTabSelect: (file: FileNode) => void;
  onTabClose: (path: string) => void;
}

export const EditorTabs = ({ openFiles, activeFile, onTabSelect, onTabClose }: EditorTabsProps) => {
  return (
    <div className="flex items-center bg-tab border-b border-border overflow-x-auto">
      {openFiles.map((file) => (
        <div
          key={file.path}
          className={`flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer min-w-[120px] max-w-[200px] group ${
            activeFile === file.path ? 'bg-tab-active text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onTabSelect(file)}
        >
          <span className="truncate text-sm flex-1">{file.name}</span>
          <X
            className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:bg-hover rounded shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(file.path);
            }}
          />
        </div>
      ))}
    </div>
  );
};
