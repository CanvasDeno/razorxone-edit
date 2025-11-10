import Editor from "@monaco-editor/react";
import { FileNode } from "@/types/file";

interface CodeEditorProps {
  file: FileNode | null;
  onChange: (value: string) => void;
}

export const CodeEditor = ({ file, onChange }: CodeEditorProps) => {
  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-editor text-muted-foreground">
        <p>Select a file to start editing</p>
      </div>
    );
  }

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      sql: 'sql',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      razor: 'razor',
      cshtml: 'razor',
      vbhtml: 'razor',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  return (
    <div className="h-full">
      <Editor
        height="100%"
        language={getLanguage(file.name)}
        value={file.content || ''}
        onChange={(value) => onChange(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};
