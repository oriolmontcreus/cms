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

export async function deleteFiles(fileIds: string[]): Promise<boolean> {
    const response = await api.delete<{ success: boolean; message: string }>(
        `${root}/delete`,
        { data: { fileIds } }
    );

    return response.data.success;
}

export async function checkFilesExist(fileNames: string[]): Promise<{ fileName: string; exists: boolean }[]> {
    const response = await api.post<{ success: boolean; data: { fileName: string; exists: boolean }[] }>(
        `${root}/check-exists`,
        { fileNames }
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

export async function handleDeleteFiles(fileIds: string[]): Promise<boolean> {
    if (fileIds.length === 0) return true;
    
    const [success, err] = await safeFetch(deleteFiles(fileIds));
    if (!success) {
        errorToast('Failed to delete files');
        return false;
    }
    return true;
}

// Helper function to process file uploads for form submission
export async function processFileUploads(formData: Record<string, any>, fileFieldComponents: Array<{ component: any; fieldName: string }>): Promise<Record<string, any>> {
    const processedFormData = { ...formData };
    
    for (const { component, fieldName } of fileFieldComponents) {
        const fieldValue = processedFormData[fieldName];
        
        if (!fieldValue) continue;
        
        // Get pending files and files to delete from the component
        const pendingFiles = component.getPendingFiles ? component.getPendingFiles() : [];
        const filesToDelete = component.getFilesToDelete ? component.getFilesToDelete() : [];
        
        // Delete files marked for deletion
        if (filesToDelete.length > 0) {
            await handleDeleteFiles(filesToDelete);
        }
        
        // Upload new files
        if (pendingFiles.length > 0) {
            const uploadedFiles = await handleUploadFiles(pendingFiles);
            if (uploadedFiles) {
                // Get existing files (not marked for deletion)
                const existingFiles = Array.isArray(fieldValue) 
                    ? fieldValue.filter((file: UploadedFile) => file.id && !filesToDelete.includes(file.id))
                    : (fieldValue && fieldValue.id && !filesToDelete.includes(fieldValue.id) ? [fieldValue] : []);
                
                // Combine existing and newly uploaded files
                const allFiles = [...existingFiles, ...uploadedFiles];
                
                // Update the field value
                if (component.field?.multiple) {
                    processedFormData[fieldName] = allFiles.length > 0 ? allFiles : null;
                } else {
                    processedFormData[fieldName] = allFiles.length > 0 ? allFiles[0] : null;
                }
            }
        } else {
            // No new files, just filter out deleted files
            const existingFiles = Array.isArray(fieldValue) 
                ? fieldValue.filter((file: UploadedFile) => file.id && !filesToDelete.includes(file.id))
                : (fieldValue && fieldValue.id && !filesToDelete.includes(fieldValue.id) ? [fieldValue] : []);
            
            if (component.field?.multiple) {
                processedFormData[fieldName] = existingFiles.length > 0 ? existingFiles : null;
            } else {
                processedFormData[fieldName] = existingFiles.length > 0 ? existingFiles[0] : null;
            }
        }
    }
    
    return processedFormData;
}
