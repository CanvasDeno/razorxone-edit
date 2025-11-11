import { useState } from "react";
import { FileExplorer } from "@/components/FileExplorer";
import { EditorTabs } from "@/components/EditorTabs";
import { CodeEditor } from "@/components/CodeEditor";
import { FileNode } from "@/types/file";
import { Button } from "@/components/ui/button";
import { Download, Code2, Upload } from "lucide-react";
import {
  createFileNode,
  findNodeByPath,
  deleteNodeByPath,
  updateNodeContent,
  addNodeToParent,
  exportToZip,
  importFromZip,
  renameNode,
  searchFiles,
  filterHiddenFiles,
} from "@/utils/fileUtils";
import { toast } from "sonner";
import { useRef } from "react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileNode[]>([]);

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

  const handleRename = (path: string) => {
    const node = findNodeByPath(files, path);
    if (!node) return;

    const newName = prompt(`Rename ${node.type}:`, node.name);
    if (!newName || newName === node.name) return;

    setFiles((prevFiles) => renameNode(prevFiles, path, newName));
    toast.success(`Renamed to ${newName}`);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchFiles(files, query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast.error('Please select a .zip file');
      return;
    }

    try {
      const importedFiles = await importFromZip(file);
      setFiles((prevFiles) => [...prevFiles, ...importedFiles]);
      toast.success('Project imported successfully!');
    } catch (error) {
      toast.error('Failed to import project');
      console.error(error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>, parentPath: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const isImage = /\.(svg|png|jpg|jpeg|webp)$/i.test(file.name);
      let content: string;

      if (isImage) {
        content = URL.createObjectURL(file);
      } else {
        content = await file.text();
      }

      const newFile = createFileNode(file.name, 'file', parentPath);
      newFile.content = content;
      setFiles((prevFiles) => addNodeToParent(prevFiles, parentPath, newFile));
      toast.success(`Imported ${file.name}`);
    } catch (error) {
      toast.error('Failed to import file');
      console.error(error);
    }
  };

  const handleExportFile = (path: string) => {
    const node = findNodeByPath(files, path);
    if (!node || node.type !== 'file') return;

    const isImage = /\.(svg|png|jpg|jpeg|webp)$/i.test(node.name);
    let blob: Blob;

    if (isImage && node.content?.startsWith('blob:')) {
      fetch(node.content)
        .then(res => res.blob())
        .then(b => {
          const url = URL.createObjectURL(b);
          const a = document.createElement('a');
          a.href = url;
          a.download = node.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      return;
    }

    blob = new Blob([node.content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = node.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${node.name}`);
  };

  const activeFileNode = activeFile ? findNodeByPath(files, activeFile) : null;
  const filteredFiles = filterHiddenFiles(files);
  const filteredSearchResults = filterHiddenFiles(searchResults);
  const displayFiles = searchQuery ? filteredSearchResults : filteredFiles;

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <h1 className="font-semibold text-lg">RazorXone edit</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import .zip
          </Button>
          <Button onClick={handleExport} size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export .zip
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 shrink-0">
          <FileExplorer
            files={displayFiles}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDelete={handleDelete}
            onRename={handleRename}
            onImportFile={handleImportFile}
            onExportFile={handleExportFile}
            searchResults={searchResults}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
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
