
import { useState, useEffect } from 'react';
import { Books as LibraryIcon, FileText, BookOpen, PencilSimple as Edit3, ArrowsClockwise as RefreshCw, Spinner as Loader2 } from '@phosphor-icons/react';
import { getPDFMetadata, getPDFCover } from '../../utils/pdfScanner';
import { PDFReader } from '../ui/PDFReader';

interface Book {
    id: number;
    title: string;
    author: string;
    currentPage: number;
    totalPages: number;
    filePath: string;
    cover?: string;
}

const INITIAL_BOOKS: Book[] = [
    {
        id: 1,
        title: 'Linear Algebra Done Right',
        author: 'Axler',
        currentPage: 0,
        totalPages: 350,
        filePath: `/books/linear-algebra.pdf`
    },
];

export function Library() {
    // Initialize from localStorage if available, else default
    const [books, setBooks] = useState<Book[]>(() => {
        const saved = localStorage.getItem('dreamOS_library_books');
        return saved ? JSON.parse(saved) : INITIAL_BOOKS;
    });

    const [isScanning, setIsScanning] = useState(false);
    const [readingBook, setReadingBook] = useState<Book | null>(null);

    // Persist to localStorage whenever books change
    useEffect(() => {
        localStorage.setItem('dreamOS_library_books', JSON.stringify(books));
    }, [books]);

    const updateProgress = (id: number) => {
        const book = books.find(b => b.id === id);
        if (!book) return;

        const input = window.prompt(`Update page number for "${book.title}"(Current: ${book.currentPage} / ${book.totalPages}): `, book.currentPage.toString());
        if (input === null) return;

        const newPage = parseInt(input);
        if (isNaN(newPage) || newPage < 0) {
            alert('Please enter a valid page number.');
            return;
        }

        const finalPage = Math.min(newPage, book.totalPages); // Cap at total pages
        setBooks(books.map(b => b.id === id ? { ...b, currentPage: finalPage } : b));
    };

    const openPdf = (book: Book) => {
        setReadingBook(book);
    };

    const scanBooks = async () => {
        setIsScanning(true);

        try {
            // Process all books in parallel
            const updatedBooks = await Promise.all(books.map(async (book) => {
                const [metadata, cover] = await Promise.all([
                    getPDFMetadata(book.filePath),
                    getPDFCover(book.filePath)
                ]);

                // Only update if we successfully got page count
                if (metadata.numPages > 0) {
                    return {
                        ...book,
                        totalPages: metadata.numPages,
                        // Update title/author if found, otherwise keep existing
                        title: metadata.title || book.title,
                        author: metadata.author || book.author,
                        cover: cover || book.cover
                    };
                }
                return book;
            }));

            setBooks(updatedBooks);
        } catch (error) {
            console.error("Failed to scan books:", error);
            alert("An error occurred while scanning books.");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <>
            <div className="glass-panel p-6 rounded-3xl h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-20 glossy-overlay opacity-40 pointer-events-none" />

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                            <LibraryIcon weight="duotone" className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-white font-semibold text-lg tracking-wide">Library</h3>
                    </div>

                    <button
                        onClick={scanBooks}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-xs text-white/70 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isScanning ? <Loader2 weight="duotone" className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw weight="duotone" className="w-3.5 h-3.5" />}
                        {isScanning ? 'Scanning...' : 'Scan Books'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 relative z-10 pr-2 custom-scrollbar">
                    {books.map((book) => {
                        const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;

                        return (
                            <div key={book.id} className="group p-4 rounded-2xl bg-black/20 hover:bg-black/30 border border-white/10 hover:border-white/20 transition-all relative overflow-hidden">
                                {/* Scanning Overlay */}
                                {isScanning && (
                                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 weight="duotone" className="w-6 h-6 text-emerald-400 animate-spin" />
                                            <span className="text-emerald-400 text-xs font-medium tracking-wide">Processing...</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    {/* Top Row: Icon + Title + Metadata */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Cover or Icon */}
                                            <div className="relative shrink-0">
                                                {book.cover ? (
                                                    <div className="w-12 h-16 rounded-md overflow-hidden bg-white/5 border border-white/10 shadow-lg group-hover:shadow-emerald-500/20 transition-all">
                                                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                                                        <FileText weight="duotone" className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="text-white text-base font-medium tracking-wide group-hover:text-emerald-300 transition-colors line-clamp-1">
                                                    {book.title}
                                                </h4>
                                                <div className="text-white/50 text-xs font-medium mt-0.5">
                                                    {book.author}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <div className="text-white/70 text-sm font-medium">
                                                Page {book.currentPage} of {book.totalPages}
                                            </div>
                                            <div className="text-emerald-400/80 text-xs font-semibold mt-0.5">
                                                {Math.round(progress)}% Complete
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden relative">
                                        <div
                                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500 ease-out"
                                            style={{ width: `${progress}% ` }}
                                        />
                                        {/* Gloss effect on bar */}
                                        <div className="absolute top-0 left-0 h-[50%] w-full bg-white/20" />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <button
                                            onClick={() => openPdf(book)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-xs text-white/80 hover:text-white font-medium transition-all"
                                        >
                                            <BookOpen weight="duotone" className="w-3.5 h-3.5" />
                                            Read
                                        </button>
                                        <button
                                            onClick={() => updateProgress(book.id)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-xs text-white/80 hover:text-white font-medium transition-all"
                                        >
                                            <Edit3 weight="duotone" className="w-3.5 h-3.5" />
                                            Log Progress
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {books.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-white/30">
                            <BookOpen weight="duotone" className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-sm">No books in library</span>
                        </div>
                    )}
                </div>
            </div>

            {readingBook && (
                <PDFReader
                    url={readingBook.filePath}
                    isOpen={!!readingBook}
                    onClose={() => setReadingBook(null)}
                    title={readingBook.title}
                    initialPage={readingBook.currentPage > 0 ? readingBook.currentPage : 1}
                />
            )}
        </>
    );
}

