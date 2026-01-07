'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2, X } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
    fileUrl: string;
    fileName: string;
}

export default function PDFViewer({ fileUrl, fileName }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    };

    const previousPage = () => {
        changePage(-1);
    };

    const nextPage = () => {
        changePage(1);
    };

    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.2, 3.0));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.2, 0.5));
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.click();
    };

    return (
        <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-neutral-900' : 'h-full'}`}>
            {/* Toolbar */}
            <div className={`flex items-center justify-between p-4 border-b ${isFullscreen ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={previousPage}
                        disabled={pageNumber <= 1}
                        className="p-2 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={20} className={isFullscreen ? 'text-white' : 'text-neutral-600'} />
                    </button>
                    <span className={`text-sm font-medium ${isFullscreen ? 'text-white' : 'text-neutral-900'}`}>
                        Página {pageNumber} de {numPages}
                    </span>
                    <button
                        onClick={nextPage}
                        disabled={pageNumber >= numPages}
                        className="p-2 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={20} className={isFullscreen ? 'text-white' : 'text-neutral-600'} />
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={zoomOut}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                    >
                        <ZoomOut size={20} className={isFullscreen ? 'text-white' : 'text-neutral-600'} />
                    </button>
                    <span className={`text-sm font-medium ${isFullscreen ? 'text-white' : 'text-neutral-900'}`}>
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                    >
                        <ZoomIn size={20} className={isFullscreen ? 'text-white' : 'text-neutral-600'} />
                    </button>
                    <div className="w-px h-6 bg-neutral-300 mx-2"></div>
                    <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                    >
                        <Download size={20} className={isFullscreen ? 'text-white' : 'text-neutral-600'} />
                    </button>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                    >
                        {isFullscreen ? (
                            <X size={20} className="text-white" />
                        ) : (
                            <Maximize2 size={20} className="text-neutral-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* PDF Display */}
            <div className={`flex-1 overflow-auto ${isFullscreen ? 'bg-neutral-900' : 'bg-neutral-50'} flex items-center justify-center p-4`}>
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex flex-col items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent mb-4"></div>
                            <p className={isFullscreen ? 'text-white' : 'text-neutral-600'}>Cargando PDF...</p>
                        </div>
                    }
                    error={
                        <div className="flex flex-col items-center justify-center p-12">
                            <p className="text-error-600 font-bold mb-2">Error al cargar el PDF</p>
                            <p className={isFullscreen ? 'text-neutral-300' : 'text-neutral-500'}>
                                No se pudo cargar el archivo. Intenta descargarlo.
                            </p>
                        </div>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-2xl"
                    />
                </Document>
            </div>
        </div>
    );
}
