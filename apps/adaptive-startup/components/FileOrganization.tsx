import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from "../convex/_generated/api";
import { useCreateFolder, useGenerateUploadUrl, useSaveFile } from '../hooks/useCreate';
import { useDeleteFolder, useDeleteFile } from '../hooks/useDelete';
import { useMoveFile } from '../hooks/useUpdate';
import { StartupData, ViewState, Folder, File as FileDoc, RolePermissions } from '../types';
import TabNavigation from './TabNavigation';
import ProjectSelector from './ProjectSelector';
import { Logo } from './Logo';
import { Folder as FolderIcon, Plus, Upload, Check } from 'lucide-react';
import { toast } from "sonner";
import { UploadModal } from './file-organization/UploadModal';
import { DeleteConfirmDialog } from './file-organization/DeleteConfirmDialog';
import { FilePreviewPanel } from './file-organization/FilePreviewPanel';
import { FileGrid } from './file-organization/FileGrid';
import { Toolbar } from './file-organization/Toolbar';
import { EmptyState } from './file-organization/EmptyState';
import { formatSize, getFileIcon } from './file-organization/utils';

interface FileOrganizationProps {
    data: StartupData;
    currentView: ViewState;
    onNavigate: (view: ViewState) => void;
    onUpdateProject: (updates: Partial<StartupData> | ((prev: StartupData) => Partial<StartupData>)) => void;
    allProjects: StartupData[];
    onSwitchProject: (projectId: string) => void;
    onNewProject: () => void;
    allowedPages?: string[];
    permissions?: RolePermissions;
}

const FileOrganization: React.FC<FileOrganizationProps> = ({
    data,
    currentView,
    onNavigate,
    onUpdateProject,
    allProjects,
    onSwitchProject,
    onNewProject,
    allowedPages,
    permissions
}) => {
    // Permission Verification
    const canCreate = permissions ? (permissions.global?.create ?? false) : true;
    const canDelete = permissions ? (permissions.global?.delete ?? false) : true;

    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
    const [folderPath, setFolderPath] = useState<{ id: string, name: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState<FileDoc | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderTags, setNewFolderTags] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'folder' | 'file', id: string, name: string } | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadQueue, setUploadQueue] = useState<{ file: File, progress: number, status: 'pending' | 'uploading' | 'done' | 'error', tags: { name: string, color: string }[] }[]>([]);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const { folders, files } = useQuery(api.files.list, {
        projectId: data.id as any,
        parentId: currentFolderId as any
    }) || { folders: [], files: [] };

    // Query for folder contents when deleting a folder
    const folderContents = useQuery(api.files.list,
        deleteConfirm?.type === 'folder'
            ? { projectId: data.id as any, parentId: deleteConfirm.id as any }
            : "skip"
    ) || { folders: [], files: [] };

    const createFolder = useCreateFolder();
    const generateUploadUrl = useGenerateUploadUrl();
    const saveFile = useSaveFile();
    const deleteFolder = useDeleteFolder();
    const deleteFile = useDeleteFile();
    const moveFile = useMoveFile();

    const handleDownload = async (file: FileDoc) => {
        if (!file.url) return;
        try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback to direct link if fetch fails
            window.open(file.url, '_blank');
        }
    };

    const handleDragStart = (e: React.DragEvent, fileId: string) => {
        if (!canCreate) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('fileId', fileId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!canCreate) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDropOnFolder = async (e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        if (!canCreate) return;
        const fileId = e.dataTransfer.getData('fileId');
        if (!fileId) return;

        try {
            await moveFile({
                fileId: fileId as any,
                folderId: folderId as any
            });
        } catch (error) {
            console.error("Failed to move file:", error);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        const tags = newFolderTags.split(',').map(t => t.trim()).filter(Boolean).map(name => ({ name, color: '#6B7280' }));
        await createFolder({
            projectId: data.id as any,
            name: newFolderName,
            parentId: currentFolderId as any,
            tags: tags.length > 0 ? tags : undefined
        });
        toast.success("Folder created", { icon: <FolderIcon className="w-4 h-4 text-black" /> });
        setNewFolderName('');
        setNewFolderTags('');
        setIsCreatingFolder(false);
    };

    const handleFilesSelected = (files: FileList | null) => {
        if (!files) return;
        const newQueue = Array.from(files).map(file => ({
            file,
            progress: 0,
            status: 'pending' as const,
            tags: [] as { name: string; color: string }[]
        }));
        setUploadQueue((prev: typeof uploadQueue) => [...prev, ...newQueue]);
        setUploadModalOpen(true);
    };

    const handleUploadAll = async () => {
        const pendingUploads = uploadQueue.filter(u => u.status === 'pending');

        for (const item of pendingUploads) {
            setUploadQueue(prev => prev.map(u => u.file === item.file ? { ...u, status: 'uploading' } : u));

            try {
                const postUrl = await generateUploadUrl();

                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("POST", postUrl, true);
                    xhr.setRequestHeader("Content-Type", item.file.type);

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percentComplete = (event.loaded / event.total) * 100;
                            setUploadQueue(prev => prev.map(u => u.file === item.file ? { ...u, progress: percentComplete } : u));
                        }
                    };

                    xhr.onload = async () => {
                        if (xhr.status === 200) {
                            try {
                                const { storageId } = JSON.parse(xhr.responseText);
                                await saveFile({
                                    projectId: data.id as any,
                                    folderId: currentFolderId as any,
                                    name: item.file.name,
                                    title: item.file.name,
                                    description: '',
                                    tags: item.tags,
                                    type: item.file.type,
                                    storageId,
                                    size: item.file.size,
                                });
                                setUploadQueue(prev => prev.map(u => u.file === item.file ? { ...u, status: 'done', progress: 100 } : u));
                                toast.success("File uploaded successfully", { icon: <Check className="w-4 h-4 text-black" /> });
                                resolve();
                            } catch (err) {
                                console.error("Save file failed:", err);
                                setUploadQueue(prev => prev.map(u => u.file === item.file ? { ...u, status: 'error' } : u));
                                reject(err);
                            }
                        } else {
                            setUploadQueue(prev => prev.map(u => u.file === item.file ? { ...u, status: 'error' } : u));
                            reject(new Error("Upload failed"));
                        }
                    };

                    xhr.onerror = () => {
                        setUploadQueue(prev => prev.map(u => u.file === item.file ? { ...u, status: 'error' } : u));
                        reject(new Error("Upload error"));
                    };

                    xhr.send(item.file);
                });

            } catch (error) {
                console.error("Upload failed for", item.file.name, error);
            }
        }
    };

    const updateItemTags = (file: File, newTags: { name: string, color: string }[]) => {
        setUploadQueue(prev => prev.map(u => u.file === file ? { ...u, tags: newTags } : u));
    };

    const removeQueueItem = (file: File) => {
        setUploadQueue(prev => prev.filter(u => u.file !== file));
    };

    const handleFolderClick = (folder: Folder) => {
        setCurrentFolderId(folder._id);
        setFolderPath([...folderPath, { id: folder._id, name: folder.name }]);
        setSelectedTag(null);
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setCurrentFolderId(undefined);
            setFolderPath([]);
        } else {
            const newPath = folderPath.slice(0, index + 1);
            setCurrentFolderId(newPath[newPath.length - 1].id);
            setFolderPath(newPath);
        }
        setSelectedTag(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;

        if (deleteConfirm.type === 'folder') {
            await deleteFolder({ folderId: deleteConfirm.id as any });
            toast.success("Folder deleted");
        } else {
            await deleteFile({ fileId: deleteConfirm.id as any });
            toast.success("File deleted");
            if (selectedFile?._id === deleteConfirm.id) setSelectedFile(null);
        }
        setDeleteConfirm(null);
    };

    // Extract all unique tags from current folders
    const allTags = Array.from(new Set(folders.flatMap(f => f.tags?.map(t => t.name) || []))).sort() as string[];

    const filteredFolders = folders.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (selectedTag) {
            return f.tags?.some(t => t.name === selectedTag);
        }
        return true;
    });

    const filteredFiles = files.filter(f => {
        const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
        if (selectedTag) {
            return f.tags?.some(t => t.name === selectedTag);
        }
        return true;
    });

    return (
        <div className="min-h-screen flex flex-col bg-nobel-cream canvas-pattern text-stone-900 font-sans overflow-hidden" style={{ backgroundSize: '24px 24px' }}>
            {/* Header */}
            <header className="px-6 py-3 bg-white/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between border-b border-stone-200">
                <div className="flex items-center gap-4">
                    <Logo imageClassName="h-8 w-auto" />
                    <div className="h-6 w-px bg-stone-200" />
                    <ProjectSelector
                        projects={allProjects}
                        currentProjectId={data.id}
                        onSelectProject={onSwitchProject}
                        onCreateNew={onNewProject}
                    />
                    <div className="h-6 w-px bg-stone-200" />
                    <TabNavigation
                        currentView={currentView}
                        onNavigate={onNavigate}
                        allowedPages={allowedPages}
                        projectFeatures={{
                            canvasEnabled: data.canvasEnabled,
                            marketResearchEnabled: data.marketResearchEnabled
                        }}
                    />
                </div>
                <div className="flex items-center gap-3">
                    {canCreate && (
                        <>
                            <button
                                onClick={() => setUploadModalOpen(true)}
                                className="bg-stone-900 text-white px-5 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider hover:bg-nobel-gold transition-all flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" /> Upload
                            </button>
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                className="bg-white border border-stone-200 text-stone-900 px-5 py-2 rounded-full shadow-sm text-xs font-bold uppercase tracking-wider hover:bg-stone-50 transition-all flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> New Folder
                            </button>
                        </>
                    )}
                </div>
            </header >

            <main className="flex-grow flex relative overflow-hidden">
                <UploadModal
                    isOpen={uploadModalOpen}
                    onClose={() => setUploadModalOpen(false)}
                    uploadQueue={uploadQueue}
                    setUploadQueue={setUploadQueue}
                    handleUploadAll={handleUploadAll}
                    handleFilesSelected={handleFilesSelected}
                    updateItemTags={updateItemTags}
                    removeQueueItem={removeQueueItem}
                />

                <DeleteConfirmDialog
                    item={deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={handleDeleteConfirm}
                    folderContents={folderContents}
                />

                <div className={`flex-grow flex flex-col transition-all duration-300 ${selectedFile ? 'mr-[40%]' : ''}`}>
                    {/* Scrollable Container for Toolbar + Content */}
                    <div className="flex-grow overflow-y-auto">
                        {/* Hero Image Header */}
                        <div className="relative h-64 w-full bg-stone-900 shrink-0">
                            <img
                                src="/images/EnergeticWorkspace.png"
                                alt="Files & Documents"
                                className="absolute inset-0 w-full h-full object-cover object-bottom opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-900/80 to-transparent"></div>
                            <div className="relative z-10 px-12 h-full flex flex-col justify-center max-w-7xl mx-auto w-full">
                                <span className="text-nobel-gold font-medium tracking-wider uppercase text-xs mb-2 block">Repository</span>
                                {/* Removed font-serif to match user request */}
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-2">Files & Documents</h2>
                                <p className="text-gray-300 text-lg">Manage your project files and assets.</p>
                                {canCreate && (
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setUploadModalOpen(true)}
                                            className="px-6 py-3 bg-nobel-gold text-white rounded-full font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-stone-900 transition-colors shadow-lg"
                                        >
                                            Upload File
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="max-w-[1400px] mx-auto w-full p-8 md:p-12">
                            <Toolbar
                                folderPath={folderPath}
                                handleBreadcrumbClick={handleBreadcrumbClick}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                selectedTag={selectedTag}
                                setSelectedTag={setSelectedTag}
                                allTags={allTags}
                            />

                            {/* Drag & Drop Hint */}
                            <div className="mb-6 flex items-center gap-2 text-xs text-stone-500 bg-stone-100/50 p-2 rounded-lg border border-stone-200/50 w-fit">
                                <span className="bg-stone-200 px-1.5 rounded text-stone-600 font-bold">TIP</span>
                                <span>You can drag and drop files directly onto folders to organize them.</span>
                            </div>

                            {/* Content */}
                            <div className="relative min-h-[500px]">
                                <FileGrid
                                    folders={filteredFolders}
                                    files={filteredFiles}
                                    onFolderClick={handleFolderClick}
                                    onFileClick={setSelectedFile}
                                    selectedFile={selectedFile}
                                    handleDragOver={handleDragOver}
                                    handleDropOnFolder={handleDropOnFolder}
                                    handleDragStart={handleDragStart}
                                    setDeleteConfirm={setDeleteConfirm}
                                    canDelete={canDelete}
                                    isCreatingFolder={isCreatingFolder}
                                    setIsCreatingFolder={setIsCreatingFolder}
                                    newFolderName={newFolderName}
                                    setNewFolderName={setNewFolderName}
                                    newFolderTags={newFolderTags}
                                    setNewFolderTags={setNewFolderTags}
                                    handleCreateFolder={handleCreateFolder}
                                    canCreate={canCreate}
                                />

                                {filteredFolders.length === 0 && filteredFiles.length === 0 && !isCreatingFolder && (
                                    <EmptyState
                                        canCreate={canCreate}
                                        setUploadModalOpen={setUploadModalOpen}
                                        setIsCreatingFolder={setIsCreatingFolder}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <FilePreviewPanel
                    selectedFile={selectedFile}
                    onClose={() => setSelectedFile(null)}
                    handleDownload={handleDownload}
                />
            </main>
        </div >
    );
};

export default FileOrganization;
