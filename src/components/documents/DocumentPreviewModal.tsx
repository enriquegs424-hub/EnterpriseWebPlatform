'use client';

import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, FileSpreadsheet, File } from 'lucide-react';
import { useState } from 'react';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
    fileType: string;
}

export default function DocumentPreviewModal({ isOpen, onClose, fileUrl, fileName, fileType }: DocumentPreviewModalProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation(prev => prev + 90);

    if (!isOpen || !fileUrl) return null;

    const isImage = fileType.includes('image');
    const isPDF = fileType.includes('pdf');
    const isOffice = fileType.includes('spreadsheet') || fileType.includes('sheet') ||
        fileType.includes('excel') || fileType.includes('word') ||
        fileType.includes('document') || fileType.includes('officedocument');

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/90 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                    <h3 className="font-bold text-neutral-900 dark:text-white truncate flex-1 mr-4">{fileName}</h3>

                    <div className="flex items-center space-x-2">
                        {isImage && (
                            <>
                                <button onClick={handleZoomOut} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg" title="Alejar">
                                    <ZoomOut size={20} />
                                </button>
                                <span className="text-sm font-mono text-neutral-600 dark:text-neutral-400">{Math.round(scale * 100)}%</span>
                                <button onClick={handleZoomIn} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg" title="Acercar">
                                    <ZoomIn size={20} />
                                </button>
                                <button onClick={handleRotate} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg" title="Rotar">
                                    <RotateCw size={20} />
                                </button>
                                <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600 mx-2"></div>
                            </>
                        )}
                        <button onClick={handleDownload} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg" title="Descargar">
                            <Download size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
                    {isImage && (
                        <div
                            style={{ transform: `rotate(${rotation}deg) scale(${scale})`, transition: 'transform 0.2s ease' }}
                            className="flex items-center justify-center p-4"
                        >
                            <img
                                src={fileUrl}
                                alt={fileName}
                                className="max-w-full max-h-full object-contain shadow-lg"
                            />
                        </div>
                    )}

                    {isPDF && (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full border-0"
                            title={fileName}
                        />
                    )}

                    {isOffice && (
                        <div className="text-center p-12">
                            <FileSpreadsheet className="w-24 h-24 mx-auto text-success-500 mb-6" />
                            <h4 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                Vista previa no disponible
                            </h4>
                            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                                Los archivos de Excel/Word no se pueden previsualizar directamente en el navegador.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="px-6 py-3 bg-olive-600 text-white rounded-xl font-bold hover:bg-olive-700 inline-flex items-center space-x-2"
                            >
                                <Download size={20} />
                                <span>Descargar para ver</span>
                            </button>
                        </div>
                    )}

                    {!isImage && !isPDF && !isOffice && (
                        <div className="text-center p-12">
                            <File className="w-24 h-24 mx-auto text-neutral-400 mb-6" />
                            <h4 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                                Vista previa no disponible
                            </h4>
                            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                                Este tipo de archivo no se puede previsualizar.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="px-6 py-3 bg-olive-600 text-white rounded-xl font-bold hover:bg-olive-700 inline-flex items-center space-x-2"
                            >
                                <Download size={20} />
                                <span>Descargar archivo</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
