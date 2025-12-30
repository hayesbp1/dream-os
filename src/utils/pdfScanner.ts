import * as pdfjsLib from 'pdfjs-dist';

// Configure worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export interface PDFMetadata {
    numPages: number;
    title?: string;
    author?: string;
}

export async function getPDFMetadata(url: string): Promise<PDFMetadata> {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const doc = await loadingTask.promise;
        const metadata = await doc.getMetadata().catch(() => ({ info: {} }));
        const info = metadata.info as any; // Cast to any to access standard fields easily

        return {
            numPages: doc.numPages,
            title: info?.Title || undefined,
            author: info?.Author || undefined,
        };
    } catch (error) {
        console.error(`Error scanning PDF at ${url}:`, error);
        return { numPages: 0 };
    }
}

export async function getPDFCover(url: string, scale: number = 0.5): Promise<string | null> {
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        const doc = await loadingTask.promise;
        const page = await doc.getPage(1);

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            return null;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        } as any;

        await page.render(renderContext).promise;
        return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
        console.error(`Error generating cover for ${url}:`, error);
        return null;
    }
}
