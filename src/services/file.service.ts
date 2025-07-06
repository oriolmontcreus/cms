import { api } from "@/lib/utils/api";
import { safeFetch } from "@/lib/utils/safeFetch";
import { errorToast } from "./toast.service";

const root = "/files";

export async function uploadFiles(files: File[]): Promise<void> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
    });

    await api.post<void>(
        `${root}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
}

export async function handleUploadFiles(files: File[]): Promise<void> {
    const [ok, err] = await safeFetch(uploadFiles(files));
    if (!ok) errorToast('Failed to upload files');

}

export async function handleUploadSingleFile(file: File): Promise<void> {
    const [ok, err] = await safeFetch(uploadFiles([file]));
    if (!ok) errorToast('Failed to upload file');
}
