// File upload types
export interface UploadedFile {
    id: string;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
    path?: string; // For backward compatibility 
    uploadedAt?: Date | string; // For display purposes
}

export interface UploadedFileWithDeletionFlag extends UploadedFile {
    _markedForDeletion?: boolean;
}