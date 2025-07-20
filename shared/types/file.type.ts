// File upload types
export interface UploadedFile {
    id: string;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
}

export interface UploadedFileWithDeletionFlag extends UploadedFile {
    _markedForDeletion?: boolean;
}