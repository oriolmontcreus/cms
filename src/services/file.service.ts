import { api } from "@/lib/utils/api";
import { safeFetch } from "@/lib/utils/safeFetch";
import { errorToast } from "./toast.service";
import type { UploadedFile } from "@/lib/shared/types/file.type";
import { BACKEND_URL } from "@/lib/shared/env";

const root = "/files";

//region Routes
export function getFileUrl(file: UploadedFile): string {
    if (file.path.startsWith('http://') || file.path.startsWith('https://')) {
        return file.path;
    }
    const filename = file.path.split('/').pop() || file.fileName;
    return `${BACKEND_URL}/${filename}`;
}

export async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
    });

    const response = await api.post<{ success: boolean; data: UploadedFile[]; message: string }>(
        `${root}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data.data;
}

export async function deleteFiles(fileIds: string[]): Promise<boolean> {
    const response = await api.delete<{ success: boolean; message: string }>(
        `${root}/delete`,
        { data: { fileIds } }
    );

    return response.data.success;
}
//endregion


//region Handlers
export async function handleUploadFiles(files: File[]): Promise<UploadedFile[] | null> {
    const [uploadedFiles, err] = await safeFetch(uploadFiles(files));
    if (!uploadedFiles) {
        errorToast('Failed to upload files');
        return null;
    }
    return uploadedFiles;
}

export async function handleDeleteFiles(fileIds: string[]): Promise<boolean> {
    if (fileIds.length === 0) return true;
    
    const [success, err] = await safeFetch(deleteFiles(fileIds));
    if (!success) {
        errorToast('Failed to delete files');
        return false;
    }
    return true;
}


//endregion
