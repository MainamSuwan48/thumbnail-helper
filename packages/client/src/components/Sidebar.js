import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState, useCallback } from 'react';
import { ImagePlus, Trash2, Star, X, ImageOff } from 'lucide-react';
import { Tooltip } from './Tooltip';
export function Sidebar({ onFilesLoaded, files, onImageClick, hasSelectedColumn, usedUrls, onClearUnused, mode = 'banner', mainImageUrl, onSetAsMain, onClearAll, onRemoveFile, cellLabels }) {
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);
    function readFileList(fileList) {
        if (!fileList)
            return;
        const images = [];
        for (const file of Array.from(fileList)) {
            if (!file.type.startsWith('image/'))
                continue;
            images.push({ name: file.name, url: URL.createObjectURL(file) });
        }
        if (images.length > 0)
            onFilesLoaded(images);
    }
    function handleFilePick(e) {
        readFileList(e.target.files);
        e.target.value = '';
    }
    const handleSidebarDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        readFileList(e.dataTransfer.files);
    }, []);
    function handleDragStart(e, file) {
        e.dataTransfer.setData('text/plain', file.url);
        e.dataTransfer.effectAllowed = 'copy';
    }
    return (_jsxs("aside", { className: "w-56 shrink-0 bg-surface-raised border-r border-surface-border flex flex-col overflow-hidden", children: [_jsxs("div", { className: "px-3 py-2.5 border-b border-surface-border", children: [_jsx("p", { className: "text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2", children: "Images" }), _jsxs("div", { className: "flex gap-1.5", children: [_jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-surface border border-surface-border text-gray-400 hover:text-gray-200 hover:border-accent text-xs transition-colors", children: [_jsx(ImagePlus, { size: 12 }), "Add images"] }), files.length > 0 && onClearUnused && (_jsx(Tooltip, { label: "Clear unused", children: _jsx("button", { onClick: onClearUnused, className: "flex items-center justify-center px-2 py-1.5 rounded-md bg-surface border border-surface-border text-gray-500 hover:text-red-400 hover:border-red-400/50 text-xs transition-colors", children: _jsx(Trash2, { size: 12 }) }) })), files.length > 0 && onClearAll && (_jsx(Tooltip, { label: "Clear all", children: _jsxs("button", { onClick: onClearAll, className: "flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-surface border border-surface-border text-gray-500 hover:text-red-400 hover:border-red-400/50 text-xs transition-colors", children: [_jsx(Trash2, { size: 12 }), _jsx("span", { children: "All" })] }) }))] }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, accept: "image/*", className: "hidden", onChange: handleFilePick })] }), _jsx("div", { className: `flex-1 overflow-y-auto p-2 transition-colors ${isDragOver ? 'bg-accent/10' : ''}`, onDragOver: (e) => { e.preventDefault(); setIsDragOver(true); }, onDragLeave: () => setIsDragOver(false), onDrop: handleSidebarDrop, children: files.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center gap-2 text-gray-600 select-none", children: [_jsx(ImageOff, { size: 26, strokeWidth: 1.5 }), _jsxs("p", { className: "text-xs leading-relaxed", children: ["Add images or drop", _jsx("br", {}), "files here"] })] })) : (_jsxs(_Fragment, { children: [(mode === 'banner' || mode === 'cover') && hasSelectedColumn && (_jsx("p", { className: "text-xs text-accent mb-1.5 text-center", children: "Click an image to place it" })), mode === 'cover' && !hasSelectedColumn && (_jsx("p", { className: "text-xs text-gray-500 mb-1.5 text-center", children: !mainImageUrl ? 'Click to set main image' : 'Select a cell or click to add' })), _jsx("div", { className: "grid grid-cols-2 gap-1.5 content-start", children: files.map((file) => {
                                const isMain = mode === 'cover' && mainImageUrl === file.url;
                                return (_jsxs("div", { draggable: mode === 'banner', onDragStart: mode === 'banner' ? (e) => handleDragStart(e, file) : undefined, onClick: () => onImageClick?.(file), className: `group relative rounded-md overflow-hidden border transition-colors cursor-pointer ${isMain
                                        ? 'border-yellow-400 ring-2 ring-yellow-400/50'
                                        : usedUrls?.has(file.url)
                                            ? 'border-accent/60 ring-1 ring-accent/30'
                                            : 'border-surface-border'} ${mode === 'banner' && !hasSelectedColumn
                                        ? 'cursor-grab active:cursor-grabbing hover:border-accent/60'
                                        : 'hover:border-accent/60 hover:ring-1 hover:ring-accent/20'}`, title: file.name, children: [_jsx("img", { src: file.url, alt: file.name, className: "w-full aspect-square object-cover select-none pointer-events-none", loading: "lazy" }), mode === 'cover' && cellLabels?.has(file.url) && (_jsx("div", { className: `absolute top-0.5 left-0.5 rounded px-1 text-[9px] font-bold leading-tight ${cellLabels.get(file.url) === 'MAIN'
                                                ? 'bg-yellow-400 text-black'
                                                : 'bg-accent text-white'}`, children: cellLabels.get(file.url) })), mode === 'banner' && usedUrls?.has(file.url) && (_jsx("div", { className: "absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-accent group-hover:hidden" })), onRemoveFile && (_jsx("button", { onClick: (e) => {
                                                e.stopPropagation();
                                                onRemoveFile(file);
                                            }, title: "Remove image", className: "absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-500 text-gray-300 hover:text-white rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(X, { size: 10 }) })), mode === 'cover' && !isMain && mainImageUrl && onSetAsMain && (_jsx("button", { onClick: (e) => {
                                                e.stopPropagation();
                                                onSetAsMain(file);
                                            }, title: "Set as main image", className: "absolute bottom-0.5 right-0.5 bg-black/70 hover:bg-yellow-400 hover:text-black text-gray-300 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Star, { size: 10 }) }))] }, file.url));
                            }) })] })) })] }));
}
