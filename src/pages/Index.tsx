import { useState } from "react";
import { FileExplorer } from "@/components/FileExplorer";
import { EditorTabs } from "@/components/EditorTabs";
import { CodeEditor } from "@/components/CodeEditor";
import { FileNode } from "@/types/file";
import { Button } from "@/components/ui/button";
import { Download, Code2 } from "lucide-react";
import {
  createFileNode,
  findNodeByPath,
  deleteNodeByPath,
  updateNodeContent,
  addNodeToParent,
  exportToZip,
} from "@/utils/fileUtils";
import { toast } from "sonner";

const Index = () => {
  const [files, setFiles] = useState<FileNode[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      path: '/src',
      children: [
        {
          id: '2',
          name: 'index.js',
          type: 'file',
          path: '/src/index.js',
          content: '// Welcome to Razor Code Editor\nconsole.log("Hello, World!");',
        },
      ],
    },
    {
      id: '3',
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      content: '# My Project\n\nStart building something amazing!',
    },
  ]);

  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'folder') return;

    if (!openFiles.find((f) => f.path === file.path)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFile(file.path);
  };

  const handleTabClose = (path: string) => {
    const newOpenFiles = openFiles.filter((f) => f.path !== path);
    setOpenFiles(newOpenFiles);
    
    if (activeFile === path) {
      setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].path : null);
    }
  };

  const handleContentChange = (value: string) => {
    if (!activeFile) return;
    
    setFiles((prevFiles) => updateNodeContent(prevFiles, activeFile, value));
    setOpenFiles((prevOpenFiles) =>
      prevOpenFiles.map((f) => (f.path === activeFile ? { ...f, content: value } : f))
    );
  };

  const handleCreateFile = (parentPath: string) => {
    const name = prompt('Enter file name:');
    if (!name) return;

    const newFile = createFileNode(name, 'file', parentPath);
    setFiles((prevFiles) => addNodeToParent(prevFiles, parentPath, newFile));
    toast.success(`Created ${name}`);
  };

  const handleCreateFolder = (parentPath: string) => {
    const name = prompt('Enter folder name:');
    if (!name) return;

    const newFolder = createFileNode(name, 'folder', parentPath);
    setFiles((prevFiles) => addNodeToParent(prevFiles, parentPath, newFolder));
    toast.success(`Created folder ${name}`);
  };

  const handleDelete = (path: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    setFiles((prevFiles) => deleteNodeByPath(prevFiles, path));
    setOpenFiles((prevOpenFiles) => prevOpenFiles.filter((f) => !f.path.startsWith(path)));
    
    if (activeFile?.startsWith(path)) {
      setActiveFile(openFiles.length > 0 ? openFiles[0].path : null);
    }
    
    toast.success('Deleted successfully');
  };

  const handleExport = async () => {
    try {
      await exportToZip(files, 'razor-project');
      toast.success('Project exported successfully!');
    } catch (error) {
      toast.error('Failed to export project');
      console.error(error);
    }
  };

  const activeFileNode = activeFile ? findNodeByPath(files, activeFile) : null;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg">Razor Editor</h1>
        </div>
        <Button onClick={handleExport} size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export .zip
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 shrink-0">
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDelete={handleDelete}
          />
        </div>

        <div className="flex-1 flex flex-col">
          {openFiles.length > 0 && (
            <EditorTabs
              openFiles={openFiles}
              activeFile={activeFile}
              onTabSelect={handleFileSelect}
              onTabClose={handleTabClose}
            />
          )}
          <div className="flex-1">
            <CodeEditor file={activeFileNode} onChange={handleContentChange} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
