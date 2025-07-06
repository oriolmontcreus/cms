<script lang="ts">
    import type { FormField } from '../types';
    import { Input } from '@components/ui/input';
    import { Button } from '@components/ui/button';
    import { cn } from '$lib/utils';
    import { handleUploadFiles, handleUploadSingleFile } from '@/services/file.service';
    import XIcon from '@lucide/svelte/icons/x';
    import UploadIcon from '@lucide/svelte/icons/upload';
    import FileIcon from '@lucide/svelte/icons/file';
    import type { UploadedFile } from '@shared/types/file.type';

    export let field: FormField;
    export let fieldId: string;
    export let value: UploadedFile[] | UploadedFile | null = null;

    let fileInput: HTMLInputElement;
    let isDragOver = false;
    let uploadedFiles: File[] = [];
    let uploadedFileData: UploadedFile[] = [];
    let isUploading = false;

    // Initialize uploaded files from value
    $: if (value) {
        if (Array.isArray(value)) {
            uploadedFileData = value;
        } else if (value) {
            uploadedFileData = [value];
        }
    }

    // File validation
    function validateFile(file: File): string | null {
        // Check MIME type
        if (field.allowedMimeTypes && field.allowedMimeTypes.length > 0) {
            if (!field.allowedMimeTypes.includes(file.type)) {
                return `File type "${file.type}" is not allowed. Allowed types: ${field.allowedMimeTypes.join(', ')}`;
            }
        }

        // Check file size
        if (field.maxFileSize && file.size > field.maxFileSize) {
            const maxSizeMB = (field.maxFileSize / (1024 * 1024)).toFixed(1);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`;
        }

        return null;
    }

    function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        
        if (files && files.length > 0) {
            processFiles(Array.from(files));
        }
    }

    function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragOver = false;
        
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            processFiles(Array.from(files));
        }
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        isDragOver = true;
    }

    function handleDragLeave() {
        isDragOver = false;
    }

    async function processFiles(files: File[]) {
        const validFiles: File[] = [];
        
        for (const file of files) {
            const error = validateFile(file);
            if (error) {
                // You might want to show toast notifications here
                console.error(error);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        // Upload files
        isUploading = true;
        let uploadResult;
        
        if (field.multiple) {
            uploadResult = await handleUploadFiles(validFiles);
        } else {
            uploadResult = await handleUploadSingleFile(validFiles[0]);
        }
        
        isUploading = false;

        if (uploadResult) {
            // Handle single vs multiple files
            if (!field.multiple) {
                uploadedFiles = [validFiles[0]];
                uploadedFileData = [uploadResult as UploadedFile];
                value = uploadResult as UploadedFile;
            } else {
                uploadedFiles = [...uploadedFiles, ...validFiles];
                const newFileData = Array.isArray(uploadResult) ? uploadResult : [uploadResult];
                uploadedFileData = [...uploadedFileData, ...newFileData];
                value = uploadedFileData;
            }
        }
    }

    function removeFile(index: number) {
        uploadedFiles = uploadedFiles.filter((_, i) => i !== index);
        uploadedFileData = uploadedFileData.filter((_, i) => i !== index);
        
        if (uploadedFileData.length === 0) {
            value = null;
        } else if (!field.multiple) {
            value = uploadedFileData[0];
        } else {
            value = uploadedFileData;
        }
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function openFileDialog() {
        fileInput?.click();
    }
</script>

<div class="space-y-4">
    <!-- Hidden file input -->
    <input
        bind:this={fileInput}
        type="file"
        class="hidden"
        multiple={field.multiple}
        accept={field.allowedMimeTypes?.join(',')}
        on:change={handleFileSelect}
        disabled={field.disabled}
        required={field.required}
    />

    <!-- Drop zone -->
    <div
        class={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            field.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
        )}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        on:click={openFileDialog}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === 'Enter' && openFileDialog()}
    >
        <UploadIcon class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <div class="space-y-2">
            <p class="text-sm font-medium">
                {field.multiple ? 'Drop files here or click to browse' : 'Drop a file here or click to browse'}
            </p>
            {#if field.allowedMimeTypes && field.allowedMimeTypes.length > 0}
                <p class="text-xs text-muted-foreground">
                    Allowed types: {field.allowedMimeTypes.join(', ')}
                </p>
            {/if}
            {#if field.maxFileSize}
                <p class="text-xs text-muted-foreground">
                    Maximum file size: {formatFileSize(field.maxFileSize)}
                </p>
            {/if}
        </div>
    </div>

    <!-- Uploaded files list -->
    {#if uploadedFileData.length > 0}
        <div class="space-y-2">
            <h4 class="text-sm font-medium">
                {field.multiple ? 'Uploaded Files' : 'Uploaded File'}
            </h4>
            <div class="space-y-2">
                {#each uploadedFileData as fileData, index}
                    {@const file = uploadedFiles[index]}
                    <div class="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div class="flex items-center space-x-3">
                            <FileIcon class="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p class="text-sm font-medium">{fileData.originalName}</p>
                                <p class="text-xs text-muted-foreground">
                                    {formatFileSize(fileData.size)}
                                    {#if fileData.id}
                                        • ID: {fileData.id.substring(0, 8)}...
                                    {/if}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => removeFile(index)}
                            disabled={field.disabled || isUploading}
                        >
                            <XIcon class="h-4 w-4" />
                        </Button>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Upload status -->
    {#if isUploading}
        <div class="flex items-center space-x-2 text-sm text-muted-foreground">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span>Uploading...</span>
        </div>
    {/if}
</div> 