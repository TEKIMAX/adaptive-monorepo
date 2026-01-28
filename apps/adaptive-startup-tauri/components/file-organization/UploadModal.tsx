import React, { useRef, useState } from 'react';
import { Upload, X, Plus, Check } from 'lucide-react';
import { getFileIcon, formatSize } from './utils';
import { toast } from "sonner";

interface UploadQueueItem {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'done' | 'error';
    tags: { name: string; color: string }[];
}

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    uploadQueue: UploadQueueItem[];
    setUploadQueue: React.Dispatch<React.SetStateAction<UploadQueueItem[]>>;
    handleUploadAll: () => void;
    handleFilesSelected: (files: FileList | null) => void;
    updateItemTags: (file: File, newTags: { name: string, color: string }[]) => void;
    removeQueueItem: (file: File) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
    isOpen,
    onClose,
    uploadQueue,
    setUploadQueue,
    handleUploadAll,
    handleFilesSelected,
    updateItemTags,
    removeQueueItem
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTagPopover, setActiveTagPopover] = useState<number | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [tagError, setTagError] = useState<string | null>(null);

    const TAG_COLORS = [
        '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white">
                    {/* Removed font-serif to match user request */}
                    <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Upload Files</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    {/* Dropzone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                        onDrop={(e) => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-stone-300 rounded-xl p-12 flex flex-col items-center justify-center text-stone-400 hover:border-stone-400 hover:bg-stone-50 cursor-pointer transition-all mb-8"
                    >
                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-3">
                            <Upload className="w-5 h-5 text-stone-500" />
                        </div>
                        <p className="text-sm font-medium text-stone-600">Drag & Drop files here or click to browse</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFilesSelected(e.target.files)}
                        />
                    </div>

                    {/* Queue List */}
                    <div className="space-y-4">
                        {uploadQueue.map((item, idx) => (
                            <div key={idx} className="bg-white border-b border-stone-100 py-3 flex items-center gap-4 last:border-0">
                                <div className="p-2 bg-stone-100 rounded-lg">
                                    {getFileIcon(item.file.type)}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-sm text-stone-900 truncate">{item.file.name}</h4>
                                        <button onClick={() => removeQueueItem(item.file)} className="text-stone-300 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-stone-500 mb-2">{formatSize(item.file.size)}</p>

                                    {/* Progress Bar */}
                                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-3">
                                        <div
                                            className={`h-full transition-all duration-300 ${item.status === 'error' ? 'bg-red-500' : item.status === 'done' ? 'bg-emerald-500' : 'bg-nobel-gold'}`}
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>

                                    {/* Tag Editor */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {item.tags.map((tag, tIdx) => (
                                            <span key={tIdx} className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white flex items-center gap-1" style={{ backgroundColor: tag.color }}>
                                                {tag.name}
                                                <button
                                                    onClick={() => updateItemTags(item.file, item.tags.filter((_, i) => i !== tIdx))}
                                                    className="hover:text-stone-200"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    if (activeTagPopover === idx) {
                                                        setActiveTagPopover(null);
                                                    } else {
                                                        setActiveTagPopover(idx);
                                                        setTagInput('');
                                                    }
                                                }}
                                                className={`text-[10px] font-bold uppercase tracking-wider hover:text-stone-600 flex items-center gap-1 border rounded px-2 py-0.5 transition-colors ${activeTagPopover === idx ? 'bg-stone-100 border-stone-300 text-stone-900' : 'border-stone-200 text-stone-400'}`}
                                            >
                                                <Plus className="w-3 h-3" /> Add Tag
                                            </button>

                                            {/* Persistent Tag Picker Popover */}
                                            {activeTagPopover === idx && (
                                                <div className="absolute top-full left-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-2xl p-4 z-50 w-64 animate-in fade-in zoom-in-95 duration-200">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">New Tag</span>
                                                        <button onClick={() => { setActiveTagPopover(null); setTagError(null); }} className="text-stone-300 hover:text-stone-500">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={tagInput}
                                                        onChange={(e) => { setTagInput(e.target.value); setTagError(null); }}
                                                        placeholder="Type tag name..."
                                                        className={`w-full px-3 py-2 bg-stone-50 border rounded-lg text-sm mb-2 outline-none transition-colors ${tagError ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-nobel-gold'}`}
                                                        autoFocus
                                                    />

                                                    {tagError && (
                                                        <p className="text-[10px] text-red-500 font-medium mb-3 animate-in slide-in-from-top-1">{tagError}</p>
                                                    )}

                                                    <div className={`grid grid-cols-5 gap-2 ${tagError ? '' : 'mt-3'}`}>
                                                        {TAG_COLORS.map(color => (
                                                            <button
                                                                key={color}
                                                                className="w-8 h-8 rounded-full hover:scale-110 transition-transform border-2 border-transparent hover:border-stone-200 shadow-sm"
                                                                style={{ backgroundColor: color }}
                                                                title="Select color to add tag"
                                                                onClick={() => {
                                                                    if (!tagInput.trim()) {
                                                                        setTagError("Please enter a tag name first");
                                                                        return;
                                                                    }
                                                                    updateItemTags(item.file, [...item.tags, { name: tagInput.trim(), color }]);
                                                                    setTagInput('');
                                                                    setTagError(null);
                                                                    setActiveTagPopover(null);
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end justify-center self-center">
                                    {item.status === 'done' && <Check className="w-5 h-5 text-emerald-500" />}
                                    {item.status === 'error' && <span className="text-xs text-red-500 font-bold">Failed</span>}
                                    {item.status === 'uploading' && <span className="text-xs text-stone-400">{Math.round(item.progress)}%</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-stone-500 hover:bg-stone-200 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleUploadAll}
                        disabled={uploadQueue.length === 0 || uploadQueue.every(u => u.status === 'done')}
                        className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-stone-900 text-white hover:bg-nobel-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadQueue.some(u => u.status === 'uploading') ? 'Uploading...' : 'Start Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};
