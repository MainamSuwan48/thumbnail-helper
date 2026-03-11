import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState, useCallback } from 'react';
import { FolderOpen, ImagePlus, Trash2 } from 'lucide-react';
export function Sidebar({ onFilesLoaded, files, onImageClick, hasSelectedColumn, usedUrls, onClearUnused }) {
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
    return (_jsxs("aside", { className: "w-56 shrink-0 bg-surface-raised border-r border-surface-border flex flex-col overflow-hidden", children: [_jsxs("div", { className: "px-3 py-2 border-b border-surface-border", children: [_jsx("p", { className: "text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2", children: "Images" }), _jsxs("div", { className: "flex gap-1.5", children: [_jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-surface border border-surface-border text-gray-400 hover:text-gray-200 hover:border-accent text-xs transition-colors", children: [_jsx(ImagePlus, { size: 13 }), "Add images"] }), files.length > 0 && onClearUnused && (_jsx("button", { onClick: onClearUnused, title: "Clear unused images", className: "flex items-center justify-center px-2 py-1.5 rounded bg-surface border border-surface-border text-gray-400 hover:text-red-400 hover:border-red-400 text-xs transition-colors", children: _jsx(Trash2, { size: 13 }) }))] }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, accept: "image/*", className: "hidden", onChange: handleFilePick })] }), _jsx("div", { className: `flex-1 overflow-y-auto p-2 transition-colors ${isDragOver ? 'bg-accent/10' : ''}`, onDragOver: (e) => { e.preventDefault(); setIsDragOver(true); }, onDragLeave: () => setIsDragOver(false), onDrop: handleSidebarDrop, children: files.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center gap-2 text-gray-600 select-none", children: [_jsx(FolderOpen, { size: 28 }), _jsxs("p", { className: "text-xs leading-relaxed", children: ["Add images or drop", _jsx("br", {}), "files here"] })] })) : (_jsxs(_Fragment, { children: [hasSelectedColumn && (_jsx("p", { className: "text-xs text-accent mb-1.5 text-center", children: "Click an image to place it" })), _jsx("div", { className: "grid grid-cols-2 gap-1.5 content-start", children: files.map((file) => (_jsxs("div", { draggable: true, onDragStart: (e) => handleDragStart(e, file), onClick: () => onImageClick?.(file), className: `relative rounded overflow-hidden border transition-colors ${usedUrls?.has(file.url)
                                    ? 'border-accent/60 ring-1 ring-accent/40'
                                    : 'border-surface-border'} ${hasSelectedColumn
                                    ? 'cursor-pointer hover:border-accent hover:ring-1 hover:ring-accent'
                                    : 'cursor-grab active:cursor-grabbing hover:border-accent'}`, title: file.name, children: [_jsx("img", { src: file.url, alt: file.name, className: "w-full aspect-square object-cover select-none pointer-events-none", loading: "lazy" }), usedUrls?.has(file.url) && (_jsx("div", { className: "absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-accent" }))] }, file.url))) })] })) })] }));
}
