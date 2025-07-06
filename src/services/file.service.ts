import { api } from "@/lib/utils/api";
import { safeFetch } from "@/lib/utils/safeFetch";
import { errorToast } from "./toast.service";
import type { UploadedFile } from "@shared/types/file.type";

const root = "/files";

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

export async function handleUploadFiles(files: File[]): Promise<UploadedFile[] | null> {
    const [uploadedFiles, err] = await safeFetch(uploadFiles(files));
    if (!uploadedFiles) {
        errorToast('Failed to upload files');
        return null;
    }
    return uploadedFiles;
}

export async function handleUploadSingleFile(file: File): Promise<UploadedFile | null> {
    const [uploadedFiles, err] = await safeFetch(uploadFiles([file]));
    if (!uploadedFiles) {
        errorToast('Failed to upload file');
        return null;
    }
    return uploadedFiles[0];
}
