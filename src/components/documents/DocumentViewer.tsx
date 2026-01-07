'use client';

import { X, Download, Share2, Clock, User, Folder, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DocumentViewerProps {
    document: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
    if (!isOpen || !document) return null;

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isImage = document.fileType.startsWith('image/');
    const isPDF = document.fileType.includes('pdf');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-neutral-200 bg-neutral-50">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-neutral-900 mb-2">{document.name}</h2>
                            <div className="flex items-center space-x-4 text-sm text-neutral-600">
                                <div className="flex items-center space-x-2">
                                    <FileText size={16} />
                                    <span>{formatFileSize(document.fileSize)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <User size={16} />
                                    <span>{document.uploadedBy.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Clock size={16} />
                                    <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                                </div>
                                {document.folder && (
                                    <div className="flex items-center space-x-2">
                                        <Folder size={16} />
                                        <span>{document.folder.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="p-3 bg-white hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-all">
                                <Download size={20} />
                            </button>
                            <button className="p-3 bg-white hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-all">
                                <Share2 size={20} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
                    {isImage ? (
                        <div className="flex items-center justify-center h-full">
                            <img
                                src={document.filePath}
                                alt={document.name}
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-lg"
                            />
                        </div>
                    ) : isPDF ? (
                        <div className="bg-white rounded-2xl p-8 shadow-lg h-full flex items-center justify-center">
                            <div className="text-center">
                                <FileText size={64} className="mx-auto text-neutral-300 mb-4" />
                                <p className="text-neutral-600 font-medium mb-2">Vista previa de PDF</p>
                                <p className="text-sm text-neutral-400 mb-4">
                                    La vista previa de PDFs estará disponible próximamente
                                </p>
                                <button className="px-6 py-3 bg-olive-600 hover:bg-olive-700 text-white rounded-xl font-bold transition-all">
                                    Descargar PDF
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-8 shadow-lg h-full flex items-center justify-center">
                            <div className="text-center">
                                <FileText size={64} className="mx-auto text-neutral-300 mb-4" />
                                <p className="text-neutral-600 font-medium mb-2">Vista previa no disponible</p>
                                <p className="text-sm text-neutral-400 mb-4">
                                    Este tipo de archivo no tiene vista previa
                                </p>
                                <button className="px-6 py-3 bg-olive-600 hover:bg-olive-700 text-white rounded-xl font-bold transition-all">
                                    Descargar Archivo
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Panel */}
                <div className="p-6 border-t border-neutral-200 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Description */}
                        <div>
                            <h3 className="font-bold text-neutral-900 mb-2">Descripción</h3>
                            <p className="text-sm text-neutral-600">
                                {document.description || 'Sin descripción'}
                            </p>
                        </div>

                        {/* Project */}
                        {document.project && (
                            <div>
                                <h3 className="font-bold text-neutral-900 mb-2">Proyecto</h3>
                                <div className="flex items-center space-x-2">
                                    <span className="px-3 py-1 bg-olive-50 text-olive-700 rounded-lg text-sm font-bold">
                                        {document.project.code}
                                    </span>
                                    <span className="text-sm text-neutral-600">{document.project.name}</span>
                                </div>
                            </div>
                        )}

                        {/* Version */}
                        <div>
                            <h3 className="font-bold text-neutral-900 mb-2">Versión</h3>
                            <p className="text-sm text-neutral-600">
                                Versión {document.version}
                                {document.versions && document.versions.length > 0 && (
                                    <span className="ml-2 text-neutral-400">
                                        ({document.versions.length} versiones)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
