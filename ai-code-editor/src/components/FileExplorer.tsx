import React, { useState, useEffect } from 'react';
import { open } from '@tauri-apps/api/dialog';
import { readDir, readTextFile } from '@tauri-apps/api/fs';

interface FileExplorerProps {
  onFileSelect: (path: string, content: string) => void;
}

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
  expanded?: boolean;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [rootPath, setRootPath] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileItem[]>([]);

  const openFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      
      if (selected && typeof selected === 'string') {
        setRootPath(selected);
        await loadDirectory(selected);
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  const loadDirectory = async (path: string) => {
    try {
      const entries = await readDir(path, { recursive: false });
      const items: FileItem[] = entries.map(entry => ({
        name: entry.name || '',
        path: entry.path,
        isDirectory: entry.children !== undefined,
        expanded: false,
        children: entry.children ? [] : undefined
      }));
      
      // Sort: directories first, then files
      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      
      setFileTree(items);
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
  };

  const toggleDirectory = async (item: FileItem, itemPath: FileItem[]) => {
    if (!item.isDirectory) return;

    const newTree = [...fileTree];
    let current = newTree;
    
    // Navigate to the item in the tree
    for (let i = 0; i < itemPath.length - 1; i++) {
      const pathItem = itemPath[i];
      const index = current.findIndex(f => f.path === pathItem.path);
      if (index !== -1 && current[index].children) {
        current = current[index].children!;
      }
    }
    
    const index = current.findIndex(f => f.path === item.path);
    if (index !== -1) {
      current[index].expanded = !current[index].expanded;
      
      if (current[index].expanded && (!current[index].children || current[index].children!.length === 0)) {
        try {
          const entries = await readDir(item.path, { recursive: false });
          current[index].children = entries.map(entry => ({
            name: entry.name || '',
            path: entry.path,
            isDirectory: entry.children !== undefined,
            expanded: false,
            children: entry.children ? [] : undefined
          }));
          
          // Sort children
          current[index].children!.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
          });
        } catch (error) {
          console.error('Failed to load subdirectory:', error);
        }
      }
    }
    
    setFileTree(newTree);
  };

  const handleFileClick = async (item: FileItem) => {
    if (item.isDirectory) return;
    
    try {
      const content = await readTextFile(item.path);
      onFileSelect(item.path, content);
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const renderFileTree = (items: FileItem[], depth = 0, path: FileItem[] = []): React.ReactNode => {
    return items.map((item) => {
      const currentPath = [...path, item];
      return (
        <div key={item.path} style={{ marginLeft: `${depth * 16}px` }}>
          <div
            className={`file-item ${item.isDirectory ? 'directory' : 'file'}`}
            onClick={() => item.isDirectory ? toggleDirectory(item, currentPath) : handleFileClick(item)}
          >
            <span className="file-icon">
              {item.isDirectory ? (item.expanded ? '📂' : '📁') : '📄'}
            </span>
            <span className="file-name">{item.name}</span>
          </div>
          {item.isDirectory && item.expanded && item.children && (
            <div className="file-children">
              {renderFileTree(item.children, depth + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h3>Explorer</h3>
        <button onClick={openFolder} className="open-folder-btn">
          Open Folder
        </button>
      </div>
      
      <div className="file-tree">
        {rootPath ? (
          <>
            <div className="root-path">{rootPath.split(/[\\/]/).pop()}</div>
            {renderFileTree(fileTree)}
          </>
        ) : (
          <div className="no-folder">
            <p>No folder opened</p>
            <button onClick={openFolder}>Open Folder</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;