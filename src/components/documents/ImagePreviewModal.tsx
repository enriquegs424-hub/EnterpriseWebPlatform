'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    title: string;
}

export default function ImagePreviewModal({ isOpen, onClose, imageUrl, title }: ImagePreviewModalProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
    const handleRotate = () => setRotation(prev => prev + 90);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-5xl h-[80vh] bg-transparent rounded-2xl overflow-hidden shadow-2xl flex flex-col pointer-events-none"
                >
                    {/* Toolbar */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full z-10 pointer-events-auto border border-white/10">
                        <button onClick={handleZoomOut} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" title="Alejar">
                            <ZoomOut size={20} />
                        </button>
                        <span className="text-white text-xs font-mono min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" title="Acercar">
                            <ZoomIn size={20} />
                        </button>
                        <div className="w-px h-4 bg-white/20 mx-2"></div>
                        <button onClick={handleRotate} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" title="Rotar">
                            <RotateCw size={20} />
                        </button>
                        <div className="w-px h-4 bg-white/20 mx-2"></div>
                        <a href={imageUrl} download className="p-2 text-white hover:bg-white/20 rounded-full transition-colors" title="Descargar">
                            <Download size={20} />
                        </a>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors z-10 pointer-events-auto backdrop-blur-md border border-white/10"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex-1 flex items-center justify-center overflow-hidden pointer-events-auto">
                        <motion.div
                            animate={{ rotate: rotation, scale: scale }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="relative w-full h-full flex items-center justify-center"
                        >
                            {/* Use standard img tag for external URLs if Next/Image config is tricky, or ensure domains are allowed */}
                            <img
                                src={imageUrl}
                                alt={title}
                                className="max-w-full max-h-full object-contain"
                            />
                        </motion.div>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                        <span className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10">
                            {title}
                        </span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
