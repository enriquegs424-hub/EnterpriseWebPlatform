'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    projectId?: string;
    folderId?: string;
}

interface FileWithPreview extends File {
    preview?: string;
    progress?: number;
    status?: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

export default function UploadModal({ isOpen, onClose, onSuccess, projectId, folderId }: UploadModalProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            addFiles(selectedFiles);
        }
    };

    const addFiles = (newFiles: File[]) => {
        const filesWithPreview: FileWithPreview[] = newFiles.map(file => {
            const fileWithPreview = file as FileWithPreview;
            fileWithPreview.status = 'pending';
            fileWithPreview.progress = 0;

            // Create preview for images
            if (file.type.startsWith('image/')) {
                fileWithPreview.preview = URL.createObjectURL(file);
            }

            return fileWithPreview;
        });

        setFiles(prev => [...prev, ...filesWithPreview]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            if (newFiles[index].preview) {
                URL.revokeObjectURL(newFiles[index].preview!);
            }
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    const uploadFiles = async () => {
        setUploading(true);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Update status to uploading
            setFiles(prev => {
                const newFiles = [...prev];
                newFiles[i].status = 'uploading';
                return newFiles;
            });

            try {
                // Create FormData
                const formData = new FormData();
                formData.append('file', file);
                if (projectId) formData.append('projectId', projectId);
                if (folderId) formData.append('folderId', folderId);
                formData.append('description', file.name);

                // Upload file
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                // Simulate progress for better UX
                for (let progress = 0; progress <= 100; progress += 20) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                    setFiles(prev => {
                        const newFiles = [...prev];
                        newFiles[i].progress = progress;
                        return newFiles;
                    });
                }

                // Update status to success
                setFiles(prev => {
                    const newFiles = [...prev];
                    newFiles[i].status = 'success';
                    newFiles[i].progress = 100;
                    return newFiles;
                });
            } catch (error) {
                // Update status to error
                setFiles(prev => {
                    const newFiles = [...prev];
                    newFiles[i].status = 'error';
                    newFiles[i].error = 'Error al subir el archivo';
                    return newFiles;
                });
            }
        }

        setUploading(false);

        // Wait a bit to show success state
        setTimeout(() => {
            onSuccess();
            handleClose();
        }, 1000);
    };

    const handleClose = () => {
        // Clean up previews
        files.forEach(file => {
            if (file.preview) {
                URL.revokeObjectURL(file.preview);
            }
        });
        setFiles([]);
        onClose();
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const canUpload = files.length > 0 && !uploading && files.every(f => f.status !== 'uploading');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-neutral-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black text-neutral-900">Subir Archivos</h3>
                        <button
                            onClick={handleClose}
                            disabled={uploading}
                            className="text-neutral-400 hover:text-neutral-600 p-2 hover:bg-neutral-100 rounded-lg transition-all disabled:opacity-50"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${isDragging
                            ? 'border-olive-600 bg-olive-50'
                            : 'border-neutral-300 hover:border-olive-400'
                            }`}
                    >
                        <Upload size={48} className={`mx-auto mb-4 ${isDragging ? 'text-olive-600' : 'text-neutral-400'}`} />
                        <p className="text-neutral-600 font-medium mb-2">
                            Arrastra archivos aquí o haz click para seleccionar
                        </p>
                        <p className="text-sm text-neutral-400 mb-4">
                            Máximo 50MB por archivo • PDF, Excel, Word, Imágenes, DWG
                        </p>
                        <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                            disabled={uploading}
                        />
                        <label
                            htmlFor="file-upload"
                            className="inline-block px-6 py-3 bg-olive-600 hover:bg-olive-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                        >
                            Seleccionar Archivos
                        </label>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h4 className="font-bold text-neutral-900">Archivos ({files.length})</h4>
                            <AnimatePresence>
                                {files.map((file, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        className="bg-neutral-50 rounded-xl p-4 border border-neutral-200"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3 flex-1">
                                                {file.preview ? (
                                                    <img
                                                        src={file.preview}
                                                        alt={file.name}
                                                        className="w-12 h-12 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center">
                                                        <FileText size={24} className="text-neutral-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-neutral-900 truncate">{file.name}</p>
                                                    <p className="text-sm text-neutral-500">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {file.status === 'success' && (
                                                    <CheckCircle size={20} className="text-success-600" />
                                                )}
                                                {file.status === 'error' && (
                                                    <AlertCircle size={20} className="text-error-600" />
                                                )}
                                                {file.status === 'pending' && !uploading && (
                                                    <button
                                                        onClick={() => removeFile(index)}
                                                        className="p-1 hover:bg-neutral-200 rounded-lg transition-all"
                                                    >
                                                        <X size={20} className="text-neutral-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        {file.status === 'uploading' && (
                                            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    className="bg-olive-600 h-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${file.progress}%` }}
                                                    transition={{ duration: 0.3 }}
                                                />
                                            </div>
                                        )}

                                        {/* Error Message */}
                                        {file.status === 'error' && file.error && (
                                            <p className="text-sm text-error-600 mt-1">{file.error}</p>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-200">
                    <div className="flex space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={uploading}
                            className="flex-1 px-6 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 font-bold transition-all disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={uploadFiles}
                            disabled={!canUpload}
                            className="flex-1 px-6 py-3 bg-olive-600 text-white rounded-xl hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Subiendo...' : `Subir ${files.length} archivo${files.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
