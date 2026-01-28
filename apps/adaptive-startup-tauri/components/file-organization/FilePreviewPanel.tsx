import React from 'react';
import { X, Music, File as FileIcon, Download } from 'lucide-react';
import { getFileIcon, formatSize } from './utils';
import { File as FileDoc } from '../../types';

interface FilePreviewPanelProps {
    selectedFile: FileDoc | null;
    onClose: () => void;
    handleDownload: (file: FileDoc) => void;
}

export const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({
    selectedFile,
    onClose,
    handleDownload
}) => {
    return (
        <div className={`absolute top-0 right-0 h-full w-full md:w-[60%] lg:w-[50%] xl:w-[40%] bg-white border-l border-stone-200 shadow-2xl transform transition-transform duration-300 z-40 flex flex-col ${selectedFile ? 'translate-x-0' : 'translate-x-full'}`}>
            {selectedFile && (
                <>
                    <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50 flex-shrink-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {getFileIcon(selectedFile.type)}
                            {/* Removed font-serif to match user request */}
                            <h2 className="text-lg font-bold text-stone-900 truncate" title={selectedFile.name}>{selectedFile.name}</h2>
                        </div>
                        <button onClick={onClose} className="text-stone-400 hover:text-stone-900">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-grow flex flex-col min-h-0 bg-stone-50/50">
                        {/* Preview Area */}
                        <div className="flex-grow relative overflow-hidden flex items-center justify-center bg-stone-100">
                            {selectedFile.type.startsWith('image/') ? (
                                <img src={selectedFile.url} alt={selectedFile.name} className="max-w-full max-h-full object-contain p-4" />
                            ) : selectedFile.type.startsWith('video/') ? (
                                <video src={selectedFile.url} controls className="max-w-full max-h-full" />
                            ) : selectedFile.type.startsWith('audio/') ? (
                                <div className="w-full p-8 flex flex-col items-center justify-center">
                                    <Music className="w-16 h-16 text-stone-300 mb-4" />
                                    <audio src={selectedFile.url} controls className="w-full max-w-md" />
                                </div>
                            ) : selectedFile.type === 'application/pdf' ? (
                                <iframe src={selectedFile.url} className="w-full h-full border-none" title="PDF Preview" />
                            ) : (
                                <div className="text-center p-8">
                                    <FileIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                                    <p className="text-stone-500">Preview not available for this file type.</p>
                                </div>
                            )}
                        </div>

                        {/* Details Area */}
                        <div className="p-6 bg-white border-t border-stone-200 flex-shrink-0">
                            <div className="mb-4">
                                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 block">File Details</label>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-stone-500 block text-xs">Size</span>
                                        <span className="font-medium text-stone-900">{formatSize(selectedFile.size)}</span>
                                    </div>
                                    <div>
                                        <span className="text-stone-500 block text-xs">Type</span>
                                        <span className="font-medium text-stone-900 truncate" title={selectedFile.type}>{selectedFile.type}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-stone-500 block text-xs">Uploaded</span>
                                        <span className="font-medium text-stone-900">{new Date(selectedFile.createdAt).toLocaleDateString()} {new Date(selectedFile.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDownload(selectedFile)}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 text-white rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-nobel-gold transition-colors"
                            >
                                <Download className="w-4 h-4" /> Download File
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
