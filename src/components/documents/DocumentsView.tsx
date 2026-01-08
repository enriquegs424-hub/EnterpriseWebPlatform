'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllDocuments, getAllFolders, deleteDocument, getDocumentStats, uploadDocument } from '@/app/(protected)/documents/actions';
import {
    FileText, Upload, Folder, Grid, List, Search, Filter,
    Download, Share2, Trash2, Eye, MoreVertical, Plus,
    File, FileSpreadsheet, Image as ImageIcon, FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import ImagePreviewModal from './ImagePreviewModal';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';
import { DocumentGridSkeleton } from '@/components/ui/Skeleton';
import EmptyState, { NoResultsState } from '@/components/ui/EmptyState';

type ViewMode = 'grid' | 'list';

interface DocumentsViewProps {
    projectId?: string;
}

export default function DocumentsView({ projectId }: DocumentsViewProps) {
    const toast = useToast();
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [documents, setDocuments] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');
    const [previewDoc, setPreviewDoc] = useState<any | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (projectId) formData.append('projectId', projectId);
        if (selectedFolder) formData.append('folderId', selectedFolder);

        const result = await uploadDocument(formData);

        if (result.success) {
            await fetchData();
            setShowUploadModal(false);
            toast.success('Documento subido', 'El archivo se ha subido correctamente');
        } else {
            toast.error('Error al subir archivo', result.error || 'Ocurrió un error inesperado');
        }
        setUploading(false);
    };

    useEffect(() => {
        fetchData();
    }, [selectedFolder, projectId]);

    const fetchData = async () => {
        setLoading(true);
        // We need to update getAllDocuments to support projectId filtering in actions.ts if not supported
        // Assuming getAllDocuments accepts a filter object
        const [docsData, foldersData, statsData] = await Promise.all([
            getAllDocuments({ folderId: selectedFolder || undefined, projectId: projectId || undefined }),
            getAllFolders(projectId),
            getDocumentStats(projectId)
        ]);
        setDocuments(docsData);
        setFolders(foldersData);
        setStats(statsData);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este documento?')) {
            await deleteDocument(id);
            fetchData();
        }
    };

    const handleDownload = (doc: any) => {
        // En un entorno real, esto usaría doc.fileUrl
        toast.info('Descargando documento', `Iniciando descarga de ${doc.name}`);
        // window.open(doc.fileUrl, '_blank');
    };

    const handleView = (doc: any) => {
        if (doc.fileType.includes('image')) {
            setPreviewDoc(doc);
        } else {
            toast.info('Vista previa', `Abriendo visor para ${doc.name}`);
            // window.open(doc.fileUrl, '_blank');
        }
    };

    const handleShare = (doc: any) => {
        // Simular copiado al portapapeles
        navigator.clipboard.writeText(`${window.location.origin}/documents/${doc.id}`);
        toast.success('Enlace copiado', 'El enlace se ha copiado al portapapeles');
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return <FileText className="w-8 h-8" />;
        if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="w-8 h-8" />;
        if (fileType.includes('image')) return <ImageIcon className="w-8 h-8" />;
        if (fileType.includes('dwg') || fileType.includes('cad')) return <FileCode className="w-8 h-8" />;
        return <File className="w-8 h-8" />;
    };

    const getFileColor = (fileType: string) => {
        if (fileType.includes('pdf')) return 'bg-error-50 dark:bg-error-900/40 text-error-700 dark:text-error-300 border-error-200 dark:border-error-800';
        if (fileType.includes('sheet') || fileType.includes('excel')) return 'bg-success-50 dark:bg-success-900/40 text-success-700 dark:text-success-300 border-success-200 dark:border-success-800';
        if (fileType.includes('image')) return 'bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
        if (fileType.includes('dwg') || fileType.includes('cad')) return 'bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
        return 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };


    // Optimized filtering with useMemo to avoid re-computation on every render
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.description?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (filterType === 'all') return true;
            if (filterType === 'pdf') return doc.fileType.includes('pdf');
            if (filterType === 'image') return doc.fileType.includes('image');
            if (filterType === 'spreadsheet') return doc.fileType.includes('sheet') || doc.fileType.includes('excel');
            if (filterType === 'other') return !doc.fileType.includes('pdf') && !doc.fileType.includes('image') && !doc.fileType.includes('sheet') && !doc.fileType.includes('excel');

            return true;
        });
    }, [documents, searchQuery, filterType]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 flex items-center">
                        <FileText className="w-8 h-8 mr-3 text-olive-600" />
                        Documentos {projectId ? ' del Proyecto' : ''}
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Gestiona archivos y documentos</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* View Toggle */}
                    <div className="flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-700/50'
                                }`}
                        >
                            <Grid size={20} className={viewMode === 'grid' ? 'text-olive-600' : 'text-neutral-600 dark:text-neutral-400'} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-700/50'
                                }`}
                        >
                            <List size={20} className={viewMode === 'list' ? 'text-olive-600' : 'text-neutral-600 dark:text-neutral-400'} />
                        </button>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center space-x-2 bg-olive-600 hover:bg-olive-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-olive-600/20"
                    >
                        <Upload size={20} />
                        <span>Subir Archivo</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{stats.total}</p>
                    </div>
                    <div className="bg-error-50 dark:bg-red-900/30 rounded-2xl p-5 border border-error-200 dark:border-red-800">
                        <p className="text-xs font-bold text-error-600 dark:text-red-400 uppercase tracking-wider mb-1">PDFs</p>
                        <p className="text-3xl font-black text-error-700 dark:text-red-400">
                            {stats.byType.find((t: any) => t.fileType.includes('pdf'))?._count || 0}
                        </p>
                    </div>
                    <div className="bg-success-50 dark:bg-green-900/30 rounded-2xl p-5 border border-success-200 dark:border-green-800">
                        <p className="text-xs font-bold text-success-600 dark:text-green-400 uppercase tracking-wider mb-1">Excel</p>
                        <p className="text-3xl font-black text-success-700 dark:text-green-400">
                            {stats.byType.find((t: any) => t.fileType.includes('sheet'))?._count || 0}
                        </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-5 border border-purple-200 dark:border-purple-800">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Imágenes</p>
                        <p className="text-3xl font-black text-purple-700 dark:text-purple-400">
                            {stats.byType.find((t: any) => t.fileType.includes('image'))?._count || 0}
                        </p>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar documentos..."
                            className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center space-x-2 px-6 py-3 border rounded-xl transition-all ${filterType !== 'all' ? 'bg-olive-50 dark:bg-olive-900/30 border-olive-200 dark:border-olive-800 text-olive-800 dark:text-olive-400' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100'}`}
                        >
                            <Filter size={20} />
                            <span className="font-bold">
                                {filterType === 'all' ? 'Todos' :
                                    filterType === 'pdf' ? 'PDFs' :
                                        filterType === 'image' ? 'Imágenes' :
                                            filterType === 'spreadsheet' ? 'Excel' : 'Otros'}
                            </span>
                        </button>

                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 z-20 overflow-hidden"
                                >
                                    {[
                                        { id: 'all', label: 'Todos' },
                                        { id: 'pdf', label: 'PDFs' },
                                        { id: 'image', label: 'Imágenes' },
                                        { id: 'spreadsheet', label: 'Hojas de Cálculo' },
                                        { id: 'other', label: 'Otros' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => {
                                                setFilterType(type.id);
                                                setIsFilterOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm font-medium transition-colors ${filterType === type.id ? 'text-olive-600 dark:text-olive-400 bg-olive-50 dark:bg-olive-900/30' : 'text-neutral-600 dark:text-neutral-300'}`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {projectId && (
                        <div className="px-4 py-2 bg-olive-100 text-olive-800 rounded-xl font-bold text-sm">
                            Proyecto Activo
                        </div>
                    )}
                </div>
            </div>

            {/* Folders */}
            {folders.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Carpetas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {folders.map((folder) => (
                            <button
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                className={`p-4 rounded-2xl border-2 transition-all ${selectedFolder === folder.id
                                    ? 'bg-olive-50 dark:bg-olive-900/30 border-olive-600'
                                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-olive-300'
                                    }`}
                            >
                                <Folder className={`w-12 h-12 mx-auto mb-2 ${selectedFolder === folder.id ? 'text-olive-600' : 'text-neutral-400'
                                    }`} />
                                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">{folder.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{folder._count.documents} archivos</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Documents */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-500 dark:text-neutral-400 font-medium">Cargando documentos...</p>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            {selectedFolder ? 'Documentos en carpeta' : 'Todos los documentos'}
                        </h3>
                        {selectedFolder && (
                            <button
                                onClick={() => setSelectedFolder(null)}
                                className="text-sm text-olive-600 hover:text-olive-700 font-bold"
                            >
                                Ver todos
                            </button>
                        )}
                    </div>

                    {filteredDocuments.length === 0 ? (
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-3xl p-20 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-700">
                            <FileText size={64} className="mx-auto text-neutral-200 dark:text-neutral-600 mb-4" />
                            <h3 className="text-xl font-bold text-neutral-400 dark:text-neutral-500 mb-2">Sin documentos</h3>
                            <p className="text-neutral-400 dark:text-neutral-500">Sube el primer archivo para empezar</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredDocuments.map((doc) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${getFileColor(doc.fileType)}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        {getFileIcon(doc.fileType)}
                                        <button className="p-1 hover:bg-white/50 rounded-lg">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                    <h4 className="font-bold text-sm mb-1 truncate">{doc.name}</h4>
                                    <p className="text-xs opacity-70 mb-3">{formatFileSize(doc.fileSize)}</p>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleView(doc)}
                                            className="flex-1 p-2 bg-white/50 hover:bg-white rounded-lg transition-all"
                                            title="Ver"
                                        >
                                            <Eye size={16} className="mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="flex-1 p-2 bg-white/50 hover:bg-white rounded-lg transition-all"
                                            title="Descargar"
                                        >
                                            <Download size={16} className="mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => handleShare(doc)}
                                            className="flex-1 p-2 bg-white/50 hover:bg-white rounded-lg transition-all"
                                            title="Compartir"
                                        >
                                            <Share2 size={16} className="mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="flex-1 p-2 bg-white/50 hover:bg-white rounded-lg transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} className="mx-auto" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-all flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className={`p-3 rounded-xl ${getFileColor(doc.fileType)}`}>
                                            {getFileIcon(doc.fileType)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-neutral-900 dark:text-neutral-100">{doc.name}</h4>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {formatFileSize(doc.fileSize)} • {doc.uploadedBy.name} • {new Date(doc.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleView(doc)}
                                            className="p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-all"
                                            title="Ver"
                                        >
                                            <Eye size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-all"
                                            title="Descargar"
                                        >
                                            <Download size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleShare(doc)}
                                            className="p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-lg transition-all"
                                            title="Compartir"
                                        >
                                            <Share2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="p-2 hover:bg-error-50 text-error-600 rounded-lg transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8">
                        <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mb-4">Subir Archivo {projectId ? 'al Proyecto' : ''}</h3>

                        {!uploading ? (
                            <div
                                className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-2xl p-12 text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file) handleFileUpload(file);
                                }}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                />
                                <Upload size={48} className="mx-auto text-neutral-400 mb-4" />
                                <p className="text-neutral-600 dark:text-neutral-300 font-medium">Arrastra archivos aquí o haz click para seleccionar</p>
                                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">Máximo 50MB por archivo</p>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent mb-4"></div>
                                <p className="text-lg font-bold text-olive-600">Subiendo archivo...</p>
                            </div>
                        )}

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                disabled={uploading}
                                className="flex-1 px-6 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 font-bold disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Image Preview Modal */}
            <ImagePreviewModal
                isOpen={!!previewDoc}
                onClose={() => setPreviewDoc(null)}
                imageUrl={previewDoc?.fileUrl || ''}
                title={previewDoc?.name || ''}
            />
        </div>
    );
}
