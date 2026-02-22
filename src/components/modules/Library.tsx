
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

const pdfFiles = import.meta.glob('../../assets/books/*.pdf', { as: 'url', eager: true });

export function Library() {
    // Initialize from localStorage if available, but allow merging new files later
    const [books, setBooks] = useState<Book[]>(() => {
        const saved = localStorage.getItem('dreamOS_library_books');
        return saved ? JSON.parse(saved) : [];
    });

    const [isScanning, setIsScanning] = useState(false);
    const [readingBook, setReadingBook] = useState<Book | null>(null);

    // Persist to localStorage whenever books change
    useEffect(() => {
        localStorage.setItem('dreamOS_library_books', JSON.stringify(books));
    }, [books]);

    // Initial scan to populate empty library or legacy paths
    useEffect(() => {
        if (books.length === 0) {
            scanBooks();
        }
    }, []);

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
            // Get all available files from assets

            // Map the glob results to a list of potential books
            const fileEntries = Object.entries(pdfFiles).map(([path, url]) => {
                // path is relative like ../../assets/books/filename.pdf
                // Extract filename
                const filename = path.split('/').pop() || 'Unknown Book';
                // Create a readable title from filename (remove extension, replace dashes/underscores)
                const title = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

                return {
                    filePath: url as string,
                    defaultTitle: title,
                    filename: filename
                };
            });

            // Process existing books + new files
            // 1. Identify new files that aren't in the current 'books' state
            // matching by checking if existing books have the same filePath (or roughly same)
            // Note: imported URLs might change with builds, so we should likely rely on filename if possible,
            // but for now, let's use the full relative path key if we could, OR just the resolved URL.
            // A simple way is to check if any existing book has this URL. 
            // Better: Re-build the book list based on files found, preserving progress for matching titles.

            const newBookList: Book[] = [];
            let nextId = Math.max(0, ...books.map(b => b.id)) + 1;

            for (const entry of fileEntries) {
                // Check if we already have this book (by title primarily, as URL might change hash)
                // If title matches, keep the progress.
                // We'll trust the default title derived from filename for initial matching.

                // Note: Metadata title might be different. 
                // Let's use the filename-derived title as a stable key effectively if scanning fresh.

                // Better approach:
                // Scan metadata for the file. 
                // If we find a book in our state with the SAME TITLE, preserve its progress.
                // If not, create new.

                const [metadata, cover] = await Promise.all([
                    getPDFMetadata(entry.filePath),
                    getPDFCover(entry.filePath)
                ]);

                const finalTitle = metadata.title || entry.defaultTitle;
                const finalAuthor = metadata.author || 'Unknown Author';

                // Look for existing book to preserve progress
                // Check by title OR by fuzzy filename match if we had that stored.
                // For simplicity, we match by Title.
                const existingBook = books.find(b => b.title === finalTitle || b.title === entry.defaultTitle);

                if (existingBook) {
                    newBookList.push({
                        ...existingBook,
                        filePath: entry.filePath, // Update URL in case build hash changed
                        totalPages: metadata.numPages > 0 ? metadata.numPages : existingBook.totalPages,
                        cover: cover || existingBook.cover,
                        author: finalAuthor !== 'Unknown Author' ? finalAuthor : existingBook.author
                    });
                } else {
                    newBookList.push({
                        id: nextId++,
                        title: finalTitle,
                        author: finalAuthor,
                        currentPage: 0,
                        totalPages: metadata.numPages,
                        filePath: entry.filePath,
                        cover: cover || undefined
                    });
                }
            }

            setBooks(newBookList);
        } catch (error) {
            console.error("Failed to scan books:", error);
            alert("An error occurred while scanning books.");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <>
            <div className="glass-panel p-6 rounded-3xl h-full flex flex-col relative overflow-hidden bg-black/20 border border-white/10">
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
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-0">
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

                                        <div className="flex justify-between w-full md:w-auto md:block md:text-right shrink-0 items-end">
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

