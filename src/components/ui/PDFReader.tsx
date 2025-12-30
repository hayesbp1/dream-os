import { useState, useEffect, useRef } from 'react';
import { X, CaretLeft as ChevronLeft, CaretRight as ChevronRight, MagnifyingGlassPlus as ZoomIn, MagnifyingGlassMinus as ZoomOut } from '@phosphor-icons/react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFReaderProps {
    url: string;
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialPage?: number;
}

export function PDFReader({ url, isOpen, onClose, title, initialPage = 1 }: PDFReaderProps) {
    const [pageNumber, setPageNumber] = useState(initialPage);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1.2);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<any>(null);

    useEffect(() => {
        if (isOpen) {
            loadDocument();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, url]);

    useEffect(() => {
        if (isOpen && numPages > 0) {
            renderPage(pageNumber);
        }
    }, [pageNumber, scale, numPages, isOpen]);

    const loadDocument = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            setNumPages(pdf.numPages);
            if (pageNumber > pdf.numPages) setPageNumber(1);
        } catch (err) {
            console.error("Error loading PDF:", err);
            setError("Failed to load PDF.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderPage = async (num: number) => {
        if (!canvasRef.current) return;

        try {
            // Cancel previous render if any
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }

            const loadingTask = pdfjsLib.getDocument(url);
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(num);

            const viewport = page.getViewport({ scale });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            const renderTask = page.render(renderContext as any);
            renderTaskRef.current = renderTask;
            await renderTask.promise;
        } catch (err: any) {
            if (err?.name !== 'RenderingCancelledException') {
                console.error("Error rendering page:", err);
            }
        }
    };

    const changePage = (offset: number) => {
        const newPage = Math.min(Math.max(1, pageNumber + offset), numPages);
        setPageNumber(newPage);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-white/5">
                <h3 className="text-white/90 font-medium tracking-wide truncate max-w-md">{title}</h3>
                <div className="flex items-center gap-2">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                        <X weight="duotone" className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-8 custom-scrollbar relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50">
                        Loading...
                    </div>
                )}
                {error && (
                    <div className="text-red-400">{error}</div>
                )}
                <canvas
                    ref={canvasRef}
                    className="shadow-2xl rounded-lg bg-white transition-transform duration-200"
                />
            </div>

            {/* Toolbar */}
            <div className="h-20 flex items-center justify-center">
                <div className="flex items-center gap-6 px-6 py-3 rounded-full bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => changePage(-1)}
                            disabled={pageNumber <= 1}
                            className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronLeft weight="duotone" className="w-5 h-5" />
                        </button>
                        <span className="text-white/80 text-sm font-medium w-24 text-center">
                            {pageNumber} / {numPages || '-'}
                        </span>
                        <button
                            onClick={() => changePage(1)}
                            disabled={pageNumber >= numPages}
                            className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronRight weight="duotone" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-white/10" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setScale(s => Math.max(0.5, s - 0.2))}
                            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                        >
                            <ZoomOut weight="duotone" className="w-5 h-5" />
                        </button>
                        <span className="text-white/50 text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
                        <button
                            onClick={() => setScale(s => Math.min(3.0, s + 0.2))}
                            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                        >
                            <ZoomIn weight="duotone" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
