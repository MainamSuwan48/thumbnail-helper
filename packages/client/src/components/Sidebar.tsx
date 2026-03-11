import { useRef, useState, useCallback } from 'react';
import { FolderOpen, ImagePlus, Trash2 } from 'lucide-react';

export interface LocalFile {
  name: string;
  url: string; // blob URL
}

interface SidebarProps {
  onFilesLoaded: (files: LocalFile[]) => void;
  files: LocalFile[];
  onImageClick?: (file: LocalFile) => void;
  hasSelectedColumn?: boolean;
  usedUrls?: Set<string>;
  onClearUnused?: () => void;
}

export function Sidebar({ onFilesLoaded, files, onImageClick, hasSelectedColumn, usedUrls, onClearUnused }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function readFileList(fileList: FileList | null) {
    if (!fileList) return;
    const images: LocalFile[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;
      images.push({ name: file.name, url: URL.createObjectURL(file) });
    }
    if (images.length > 0) onFilesLoaded(images);
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    readFileList(e.target.files);
    e.target.value = '';
  }

  const handleSidebarDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    readFileList(e.dataTransfer.files);
  }, []);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, file: LocalFile) {
    e.dataTransfer.setData('text/plain', file.url);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <aside className="w-56 shrink-0 bg-surface-raised border-r border-surface-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-surface-border">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          Images
        </p>

        <div className="flex gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-surface border border-surface-border text-gray-400 hover:text-gray-200 hover:border-accent text-xs transition-colors"
          >
            <ImagePlus size={13} />
            Add images
          </button>
          {files.length > 0 && onClearUnused && (
            <button
              onClick={onClearUnused}
              title="Clear unused images"
              className="flex items-center justify-center px-2 py-1.5 rounded bg-surface border border-surface-border text-gray-400 hover:text-red-400 hover:border-red-400 text-xs transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFilePick}
        />
      </div>

      {/* Drop zone + grid */}
      <div
        className={`flex-1 overflow-y-auto p-2 transition-colors ${isDragOver ? 'bg-accent/10' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleSidebarDrop}
      >
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-gray-600 select-none">
            <FolderOpen size={28} />
            <p className="text-xs leading-relaxed">
              Add images or drop<br />files here
            </p>
          </div>
        ) : (
          <>
          {hasSelectedColumn && (
            <p className="text-xs text-accent mb-1.5 text-center">
              Click an image to place it
            </p>
          )}
          <div className="grid grid-cols-2 gap-1.5 content-start">
            {files.map((file) => (
              <div
                key={file.url}
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
                onClick={() => onImageClick?.(file)}
                className={`relative rounded overflow-hidden border transition-colors ${
                  usedUrls?.has(file.url)
                    ? 'border-accent/60 ring-1 ring-accent/40'
                    : 'border-surface-border'
                } ${
                  hasSelectedColumn
                    ? 'cursor-pointer hover:border-accent hover:ring-1 hover:ring-accent'
                    : 'cursor-grab active:cursor-grabbing hover:border-accent'
                }`}
                title={file.name}
              >
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full aspect-square object-cover select-none pointer-events-none"
                  loading="lazy"
                />
                {usedUrls?.has(file.url) && (
                  <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-accent" />
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </aside>
  );
}
