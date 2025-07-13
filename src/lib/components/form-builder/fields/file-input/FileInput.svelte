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
    import { getFileUrl, handleDeleteFiles } from '@/services/file.service';
    import { errorToast } from '@/services/toast.service';

    export let field: FormField;
    export let fieldId: string;
    export let value: any = null;

    let fileInput: HTMLInputElement;
    let isDragOver = false;
    let isProcessing = false;

    const isImage = (mimeType: string) => mimeType.startsWith('image/');
    const isVideo = (mimeType: string) => mimeType.startsWith('video/');
    const isFile = (item: any): item is File => item instanceof File;
    const isUploadedFile = (item: any): item is UploadedFile => item && typeof item === 'object' && 'id' in item;

    // Get current files as array for display
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

    const processFiles = (files: File[]) => {
        if (isProcessing) return;

        const validFiles = files.filter(file => {
            const error = validateFile(file);
            if (error) {
                errorToast(error);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        isProcessing = true;
        
        try {
            if (field.multiple) {
                value = [...currentFiles, ...validFiles];
            } else {
                value = validFiles[0];
            }
        } finally {
            isProcessing = false;
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

    const removeFile = async (fileToRemove: any) => {
        if (isProcessing) return;

        isProcessing = true;
        
        try {
            if (isFile(fileToRemove)) {
                // Remove from pending files
                if (field.multiple) {
                    const updatedFiles = currentFiles.filter(f => f !== fileToRemove);
                    value = updatedFiles.length > 0 ? updatedFiles : null;
                } else {
                    value = null;
                }
            } else if (isUploadedFile(fileToRemove)) {
                // Remove from uploaded files and delete from server
                if (fileToRemove.id) {
                    await handleDeleteFiles([fileToRemove.id]);
                }
                
                if (field.multiple) {
                    const updatedFiles = currentFiles.filter(f => f !== fileToRemove);
                    value = updatedFiles.length > 0 ? updatedFiles : null;
                } else {
                    value = null;
                }
            }
        } finally {
            isProcessing = false;
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getDisplayFileUrl = (file: any): string => {
        if (isFile(file)) {
            return URL.createObjectURL(file);
        }
        return getFileUrl(file);
    };

    const getFileName = (file: any): string => {
        if (isFile(file)) {
            return file.name;
        }
        return file.originalName || file.fileName;
    };

    const getFileSize = (file: any): number => {
        return file.size;
    };

    const getMimeType = (file: any): string => {
        if (isFile(file)) {
            return file.type;
        }
        return file.mimeType;
    };

    // Clean up object URLs on destroy
    onMount(() => {
        return () => {
            if (Array.isArray(value)) {
                value.forEach(file => {
                    if (isFile(file)) {
                        URL.revokeObjectURL(getDisplayFileUrl(file));
                    }
                });
            } else if (value && isFile(value)) {
                URL.revokeObjectURL(getDisplayFileUrl(value));
            }
        };
    });
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
            disabled={field.disabled || isProcessing}
            required={field.required}
        />

        <div
            class={cn(
                "border-2 border-dashed bg-background dark:bg-input/30 rounded-lg p-6 text-center transition-colors",
                isDragOver ? "border-primary bg-primary/10 dark:bg-primary/20" : "border-muted-foreground/25",
                field.disabled || isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
            )}
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={() => isDragOver = false}
            on:click={() => !isProcessing && fileInput?.click()}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && !isProcessing && fileInput?.click()}
        >
            <UploadIcon class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div class="space-y-2">
                <p class="text-sm font-medium">
                    {isProcessing ? 'Processing...' : field.multiple ? 'Drop files here or click to browse' : 'Drop a file here or click to browse'}
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
                    <div class="flex flex-col gap-3 p-4 bg-background dark:bg-input/30 rounded-lg lg:p-6 {isFile(fileData) ? 'border border-dashed border-yellow-500' : ''}">
                        {#if isFile(fileData)}
                            <div class="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                                <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                Pending upload
                            </div>
                        {/if}
                        <div class="flex-shrink-0 w-full sm:w-auto">
                            {#if isImage(getMimeType(fileData))}
                                <img 
                                    src={getDisplayFileUrl(fileData)}
                                    loading="lazy"
                                    draggable={false}
                                    alt={getFileName(fileData)}
                                    class="w-full h-48 object-cover rounded-lg select-none sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
                                />
                            {:else if isVideo(getMimeType(fileData))}
                                <VideoPreview 
                                    src={getDisplayFileUrl(fileData)}
                                    title={getFileName(fileData)}
                                    thumbnailClass="w-full object-cover rounded-lg select-none"
                                />
                            {:else}
                                <div class="flex justify-center sm:justify-start">
                                    <FileIcon 
                                        mimeType={getMimeType(fileData)} 
                                        fileName={getFileName(fileData)} 
                                        size={32} 
                                        class="text-muted-foreground" 
                                    />
                                </div>
                            {/if}
                        </div>
                        <div class="min-w-0 flex-1 space-y-1">
                            <p class="text-sm font-medium truncate">
                                {getFileName(fileData)}
                            </p>
                            <p class="text-xs text-muted-foreground">
                                {formatFileSize(getFileSize(fileData))}
                            </p>
                        </div>
                        <FileActionBar
                            fileData={isFile(fileData) ? { ...fileData, originalName: fileData.name, fileName: fileData.name, mimeType: fileData.type, path: getDisplayFileUrl(fileData), uploadedAt: new Date() } : fileData}
                            disabled={field.disabled || isProcessing}
                            onDelete={() => removeFile(fileData)}
                        />
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</TooltipProvider> 