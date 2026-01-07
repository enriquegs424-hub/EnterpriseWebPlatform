'use client';

import { useState, useEffect } from 'react';
import { getAllDocuments, getAllFolders, deleteDocument, getDocumentStats } from './actions';
import {
    FileText, Upload, Folder, Grid, List, Search, Filter,
    Download, Share2, Trash2, Eye, MoreVertical, Plus,
    File, FileSpreadsheet, Image as ImageIcon, FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type ViewMode = 'grid' | 'list';

export default function DocumentsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [documents, setDocuments] = useState<any[]>([]);
    const [folders, setFolders] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedFolder]);

    const fetchData = async () => {
        setLoading(true);
        const [docsData, foldersData, statsData] = await Promise.all([
            getAllDocuments({ folderId: selectedFolder || undefined }),
            getAllFolders(),
            getDocumentStats()
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

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return <FileText className="w-8 h-8" />;
        if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="w-8 h-8" />;
        if (fileType.includes('image')) return <ImageIcon className="w-8 h-8" />;
        if (fileType.includes('dwg') || fileType.includes('cad')) return <FileCode className="w-8 h-8" />;
        return <File className="w-8 h-8" />;
    };

    const getFileColor = (fileType: string) => {
        if (fileType.includes('pdf')) return 'bg-error-50 text-error-700 border-error-200';
        if (fileType.includes('sheet') || fileType.includes('excel')) return 'bg-success-50 text-success-700 border-success-200';
        if (fileType.includes('image')) return 'bg-purple-50 text-purple-700 border-purple-200';
        if (fileType.includes('dwg') || fileType.includes('cad')) return 'bg-orange-50 text-orange-700 border-orange-200';
        return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const filteredDocuments = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 flex items-center">
                        <FileText className="w-8 h-8 mr-3 text-olive-600" />
                        Documentos
                    </h1>
                    <p className="text-neutral-500 mt-1 font-medium">Gestiona archivos y documentos del proyecto</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* View Toggle */}
                    <div className="flex items-center space-x-2 bg-neutral-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                                }`}
                        >
                            <Grid size={20} className={viewMode === 'grid' ? 'text-olive-600' : 'text-neutral-600'} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                                }`}
                        >
                            <List size={20} className={viewMode === 'list' ? 'text-olive-600' : 'text-neutral-600'} />
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
                    <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Documentos</p>
                        <p className="text-3xl font-black text-neutral-900">{stats.total}</p>
                    </div>
                    <div className="bg-error-50 rounded-2xl p-5 border border-error-200">
                        <p className="text-xs font-bold text-error-600 uppercase tracking-wider mb-1">PDFs</p>
                        <p className="text-3xl font-black text-error-700">
                            {stats.byType.find((t: any) => t.fileType.includes('pdf'))?._count || 0}
                        </p>
                    </div>
                    <div className="bg-success-50 rounded-2xl p-5 border border-success-200">
                        <p className="text-xs font-bold text-success-600 uppercase tracking-wider mb-1">Excel</p>
                        <p className="text-3xl font-black text-success-700">
                            {stats.byType.find((t: any) => t.fileType.includes('sheet'))?._count || 0}
                        </p>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-5 border border-purple-200">
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Imágenes</p>
                        <p className="text-3xl font-black text-purple-700">
                            {stats.byType.find((t: any) => t.fileType.includes('image'))?._count || 0}
                        </p>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                <div className="flex items-center space-x-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar documentos..."
                            className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                        />
                    </div>
                    <button className="flex items-center space-x-2 px-6 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-all">
                        <Filter size={20} />
                        <span className="font-bold">Filtros</span>
                    </button>
                </div>
            </div>

            {/* Folders */}
            {folders.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">Carpetas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {folders.map((folder) => (
                            <button
                                key={folder.id}
                                onClick={() => setSelectedFolder(folder.id)}
                                className={`p-4 rounded-2xl border-2 transition-all ${selectedFolder === folder.id
                                        ? 'bg-olive-50 border-olive-600'
                                        : 'bg-white border-neutral-200 hover:border-olive-300'
                                    }`}
                            >
                                <Folder className={`w-12 h-12 mx-auto mb-2 ${selectedFolder === folder.id ? 'text-olive-600' : 'text-neutral-400'
                                    }`} />
                                <p className="text-sm font-bold text-neutral-900 truncate">{folder.name}</p>
                                <p className="text-xs text-neutral-500">{folder._count.documents} archivos</p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Documents */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-500 font-medium">Cargando documentos...</p>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-neutral-900">
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
                        <div className="bg-neutral-50 rounded-3xl p-20 text-center border-2 border-dashed border-neutral-200">
                            <FileText size={64} className="mx-auto text-neutral-200 mb-4" />
                            <h3 className="text-xl font-bold text-neutral-400 mb-2">Sin documentos</h3>
                            <p className="text-neutral-400">Sube el primer archivo para empezar</p>
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
                                        <button className="flex-1 p-2 bg-white/50 hover:bg-white rounded-lg transition-all">
                                            <Eye size={16} className="mx-auto" />
                                        </button>
                                        <button className="flex-1 p-2 bg-white/50 hover:bg-white rounded-lg transition-all">
                                            <Download size={16} className="mx-auto" />
                                        </button>
                                        <button className="flex-1 p-2 bg-white/50 hover:bg-white rounded-lg transition-all">
                                            <Share2 size={16} className="mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="flex-1 p-2 bg-white/50 hover:bg-white rounded-lg transition-all"
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
                                    className="bg-white rounded-xl p-4 border border-neutral-200 hover:shadow-md transition-all flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className={`p-3 rounded-xl ${getFileColor(doc.fileType)}`}>
                                            {getFileIcon(doc.fileType)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-neutral-900">{doc.name}</h4>
                                            <p className="text-sm text-neutral-500">
                                                {formatFileSize(doc.fileSize)} • {doc.uploadedBy.name} • {new Date(doc.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button className="p-2 hover:bg-neutral-50 rounded-lg transition-all">
                                            <Eye size={20} />
                                        </button>
                                        <button className="p-2 hover:bg-neutral-50 rounded-lg transition-all">
                                            <Download size={20} />
                                        </button>
                                        <button className="p-2 hover:bg-neutral-50 rounded-lg transition-all">
                                            <Share2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="p-2 hover:bg-error-50 text-error-600 rounded-lg transition-all"
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

            {/* Upload Modal - Placeholder */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
                        <h3 className="text-2xl font-black text-neutral-900 mb-4">Subir Archivo</h3>
                        <div className="border-2 border-dashed border-neutral-300 rounded-2xl p-12 text-center">
                            <Upload size={48} className="mx-auto text-neutral-400 mb-4" />
                            <p className="text-neutral-600 font-medium">Arrastra archivos aquí o haz click para seleccionar</p>
                            <p className="text-sm text-neutral-400 mt-2">Máximo 50MB por archivo</p>
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 px-6 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 font-bold"
                            >
                                Cancelar
                            </button>
                            <button className="flex-1 px-6 py-3 bg-olive-600 text-white rounded-xl hover:bg-olive-700 font-bold">
                                Subir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
