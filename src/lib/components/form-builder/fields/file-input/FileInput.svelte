<script lang="ts">
    import type { FormField } from '../../types';
    import { Button } from '@components/ui/button';
    import { cn } from '$lib/utils';
    import XIcon from '@tabler/icons-svelte/icons/x';
    import UploadIcon from '@tabler/icons-svelte/icons/upload';
    import type { UploadedFile } from '@shared/types/file.type';
    import { onMount } from 'svelte';
    import FileIcon from '../FileIcon.svelte';
    import VideoPreview from './VideoPreview.svelte';
    import FileActionBar from './FileActionBar.svelte';
    import { TooltipProvider } from '@components/ui/tooltip';
    import { getFileUrl, handleUploadFiles, handleDeleteFiles } from '@/services/file.service';
    import { errorToast } from '@/services/toast.service';

    export let field: FormField;
    export let fieldId: string;
    export let value: UploadedFile[] | UploadedFile | null = null;

    let fileInput: HTMLInputElement;
    let isDragOver = false;
    let isUploading = false;

    const isImage = (mimeType: string) => mimeType.startsWith('image/');
    const isVideo = (mimeType: string) => mimeType.startsWith('video/');

    // Get current files as array
    $: currentFiles = Array.isArray(value) ? value : (value ? [value] : []);

    const validateFile = (file: File): string | null => {
        if (field.allowedMimeTypes?.length && !field.allowedMimeTypes.includes(file.type)) {
            return `File type "${file.type}" is not allowed. Allowed types: ${field.allowedMimeTypes.join(', ')}`;
        }

        if (field.maxFileSize && file.size > field.maxFileSize) {
            const maxSizeMB = (field.maxFileSize / (1024 * 1024)).toFixed(1);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`;
        }

        return null;
    };

    const processFiles = async (files: File[]) => {
        if (isUploading) return;

        const validFiles = files.filter(file => {
            const error = validateFile(file);
            if (error) {
                errorToast(error);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        isUploading = true;
        
        try {
            const uploadedFiles = await handleUploadFiles(validFiles);
            if (uploadedFiles) {
                if (field.multiple) {
                    value = [...currentFiles, ...uploadedFiles];
                } else {
                    // For single file, delete old file first
                    if (currentFiles.length > 0) {
                        await handleDeleteFiles(currentFiles.map(f => f.id).filter(Boolean));
                    }
                    value = uploadedFiles[0];
                }
            }
        } finally {
            isUploading = false;
        }
    };

    const handleFileSelect = (event: Event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files?.length) processFiles(Array.from(files));
    };

    const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        isDragOver = false;
        
        const files = event.dataTransfer?.files;
        if (files?.length) processFiles(Array.from(files));
    };

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
        isDragOver = true;
    };

    const removeFile = async (fileToRemove: UploadedFile) => {
        if (isUploading) return;

        isUploading = true;
        
        try {
            if (fileToRemove.id) {
                await handleDeleteFiles([fileToRemove.id]);
            }
            
            if (field.multiple) {
                const updatedFiles = currentFiles.filter(f => f.id !== fileToRemove.id);
                value = updatedFiles.length > 0 ? updatedFiles : null;
            } else {
                value = null;
            }
        } finally {
            isUploading = false;
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
</script>

<TooltipProvider>
    <div class="space-y-4">
        <input
            bind:this={fileInput}
            type="file"
            class="hidden"
            multiple={field.multiple}
            accept={field.allowedMimeTypes?.join(',')}
            on:change={handleFileSelect}
            disabled={field.disabled || isUploading}
            required={field.required}
        />

        <div
            class={cn(
                "border-2 border-dashed bg-background dark:bg-input/30 rounded-lg p-6 text-center transition-colors",
                isDragOver ? "border-primary bg-primary/10 dark:bg-primary/20" : "border-muted-foreground/25",
                field.disabled || isUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
            )}
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={() => isDragOver = false}
            on:click={() => !isUploading && fileInput?.click()}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && !isUploading && fileInput?.click()}
        >
            <UploadIcon class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div class="space-y-2">
                <p class="text-sm font-medium">
                    {isUploading ? 'Uploading...' : field.multiple ? 'Drop files here or click to browse' : 'Drop a file here or click to browse'}
                </p>
                {#if field.allowedMimeTypes?.length}
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

        {#if currentFiles.length > 0}
            <div class="space-y-2">
                {#each currentFiles as fileData}
                    <div class="flex flex-col gap-3 p-4 bg-background dark:bg-input/30 rounded-lg lg:p-6">
                        <div class="flex-shrink-0 w-full sm:w-auto">
                            {#if isImage(fileData.mimeType)}
                                <img 
                                    src={getFileUrl(fileData)}
                                    loading="lazy"
                                    draggable={false}
                                    alt={fileData.originalName}
                                    class="w-full h-48 object-cover rounded-lg select-none sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
                                />
                            {:else if isVideo(fileData.mimeType)}
                                <VideoPreview 
                                    src={getFileUrl(fileData)}
                                    title={fileData.originalName}
                                    thumbnailClass="w-full object-cover rounded-lg select-none"
                                />
                            {:else}
                                <div class="flex justify-center sm:justify-start">
                                    <FileIcon 
                                        mimeType={fileData.mimeType} 
                                        fileName={fileData.originalName} 
                                        size={32} 
                                        class="text-muted-foreground" 
                                    />
                                </div>
                            {/if}
                        </div>
                        <div class="min-w-0 flex-1 space-y-1">
                            <p class="text-sm font-medium truncate">
                                {fileData.originalName}
                            </p>
                            <p class="text-xs text-muted-foreground">
                                {formatFileSize(fileData.size)}
                            </p>
                        </div>
                        <FileActionBar
                            {fileData}
                            disabled={field.disabled || isUploading}
                            onDelete={() => removeFile(fileData)}
                        />
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</TooltipProvider> 