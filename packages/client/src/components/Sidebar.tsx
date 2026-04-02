import { useRef, useState, useCallback } from 'react';
import { ImagePlus, Trash2, Star, X, ImageOff } from 'lucide-react';
import { Tooltip } from './Tooltip';

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
  mode?: 'banner' | 'cover';
  mainImageUrl?: string | null;
  onSetAsMain?: (file: LocalFile) => void;
  onClearAll?: () => void;
  onRemoveFile?: (file: LocalFile) => void;
  cellLabels?: Map<string, string>;
}

export function Sidebar({ onFilesLoaded, files, onImageClick, hasSelectedColumn, usedUrls, onClearUnused, mode = 'banner', mainImageUrl, onSetAsMain, onClearAll, onRemoveFile, cellLabels }: SidebarProps) {
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
      <div className="px-3 py-2.5 border-b border-surface-border">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
          Images
        </p>

        <div className="flex gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-surface border border-surface-border text-gray-400 hover:text-gray-200 hover:border-accent text-xs transition-colors"
          >
            <ImagePlus size={12} />
            Add images
          </button>
          {files.length > 0 && onClearUnused && (
            <Tooltip label="Clear unused">
              <button
                onClick={onClearUnused}
                className="flex items-center justify-center px-2 py-1.5 rounded-md bg-surface border border-surface-border text-gray-500 hover:text-red-400 hover:border-red-400/50 text-xs transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </Tooltip>
          )}
          {files.length > 0 && onClearAll && (
            <Tooltip label="Clear all">
              <button
                onClick={onClearAll}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-surface border border-surface-border text-gray-500 hover:text-red-400 hover:border-red-400/50 text-xs transition-colors"
              >
                <Trash2 size={12} />
                <span>All</span>
              </button>
            </Tooltip>
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
            <ImageOff size={26} strokeWidth={1.5} />
            <p className="text-xs leading-relaxed">
              Add images or drop<br />files here
            </p>
          </div>
        ) : (
          <>
          {(mode === 'banner' || mode === 'cover') && hasSelectedColumn && (
            <p className="text-xs text-accent mb-1.5 text-center">
              Click an image to place it
            </p>
          )}
          {mode === 'cover' && !hasSelectedColumn && (
            <p className="text-xs text-gray-500 mb-1.5 text-center">
              {!mainImageUrl ? 'Click to set main image' : 'Select a cell or click to add'}
            </p>
          )}
          <div className="grid grid-cols-2 gap-1.5 content-start">
            {files.map((file) => {
              const isMain = mode === 'cover' && mainImageUrl === file.url;
              return (
                <div
                  key={file.url}
                  draggable={mode === 'banner'}
                  onDragStart={mode === 'banner' ? (e) => handleDragStart(e, file) : undefined}
                  onClick={() => onImageClick?.(file)}
                  className={`group relative rounded-md overflow-hidden border transition-colors cursor-pointer ${
                    isMain
                      ? 'border-yellow-400 ring-2 ring-yellow-400/50'
                      : usedUrls?.has(file.url)
                        ? 'border-accent/60 ring-1 ring-accent/30'
                        : 'border-surface-border'
                  } ${
                    mode === 'banner' && !hasSelectedColumn
                      ? 'cursor-grab active:cursor-grabbing hover:border-accent/60'
                      : 'hover:border-accent/60 hover:ring-1 hover:ring-accent/20'
                  }`}
                  title={file.name}
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full aspect-square object-cover select-none pointer-events-none"
                    loading="lazy"
                  />
                  {mode === 'cover' && cellLabels?.has(file.url) && (
                    <div className={`absolute top-0.5 left-0.5 rounded px-1 text-[9px] font-bold leading-tight ${
                      cellLabels.get(file.url) === 'MAIN'
                        ? 'bg-yellow-400 text-black'
                        : 'bg-accent text-white'
                    }`}>
                      {cellLabels.get(file.url)}
                    </div>
                  )}
                  {mode === 'banner' && usedUrls?.has(file.url) && (
                    <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-accent group-hover:hidden" />
                  )}
                  {onRemoveFile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(file);
                      }}
                      title="Remove image"
                      className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-500 text-gray-300 hover:text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  )}
                  {mode === 'cover' && !isMain && mainImageUrl && onSetAsMain && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetAsMain(file);
                      }}
                      title="Set as main image"
                      className="absolute bottom-0.5 right-0.5 bg-black/70 hover:bg-yellow-400 hover:text-black text-gray-300 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star size={10} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>
    </aside>
  );
}
