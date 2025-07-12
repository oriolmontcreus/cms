<script lang="ts">
    import type { FormField } from '../../types';
    import { Button } from '@components/ui/button';
    import ConfirmPopover from '@components/ConfirmPopover.svelte';
    import { cn } from '$lib/utils';
    import XIcon from '@lucide/svelte/icons/x';
    import TrashIcon from '@lucide/svelte/icons/trash';
    import UploadIcon from '@lucide/svelte/icons/upload';
    import type { UploadedFile } from '@shared/types/file.type';
    import { getContext, onMount } from 'svelte';
    import FileIcon from '../FileIcon.svelte';
    import VideoPreview from './VideoPreview.svelte';
    import type { Writable } from 'svelte/store';
    import {
        Tooltip,
        TooltipContent,
        TooltipProvider,
        TooltipTrigger
    } from '@components/ui/tooltip';
    import { getFileUrl } from '@/services/file.service';
    import { errorToast } from '@/services/toast.service';
    export let field: FormField;
    export let fieldId: string;
    export let value: UploadedFile[] | UploadedFile | null = null;

    let fileInput: HTMLInputElement;
    let isDragOver = false;
    
    let existingFiles: UploadedFile[] = [];
    let newFiles: File[] = [];
    let filesToDelete: string[] = [];

    const isImage = (mimeType: string) => mimeType.startsWith('image/');
    const isVideo = (mimeType: string) => mimeType.startsWith('video/');

    const getPreviewUrl = (file: File) => URL.createObjectURL(file);
    let previewUrls: Record<string, string> = {};

    onMount(() => {
        return () => {
            // Cleanup object URLs on component destroy
            Object.values(previewUrls).forEach(URL.revokeObjectURL);
        };
    });

    // Create preview URLs for new files
    $: {
        newFiles.forEach(file => {
            if ((isImage(file.type) || isVideo(file.type)) && !previewUrls[file.name]) {
                previewUrls[file.name] = getPreviewUrl(file);
            }
        });
    }

    const fileUploadState = getContext<Writable<Record<string, { pendingFiles: File[]; filesToDelete: string[] }>>>('fileUploadState');
    
    $: fileUploadState?.update(state => ({
        ...state,
        [fieldId]: { pendingFiles: newFiles, filesToDelete }
    }));
    
    // Initialize existing files from prop value
    $: if (value && existingFiles.length === 0) {
        existingFiles = Array.isArray(value) ? value.filter(file => file.id && !filesToDelete.includes(file.id)) : value?.id && !filesToDelete.includes(value.id) ? [value] : [];
    }

    // Update value based on current files and excluding deleted files
    $: updateValue(existingFiles.filter(file => !filesToDelete.includes(file.id)), newFiles);

    const updateValue = (existing: UploadedFile[], newFilesList: File[]) => {
        const allFiles = [
            ...existing,
            ...newFilesList.map(file => ({
                id: '',
                originalName: file.name,
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                path: '',
                uploadedAt: new Date(),
                _pendingFile: file
            } as UploadedFile & { _pendingFile: File }))
        ];

        value = field.multiple 
            ? (allFiles.length > 0 ? allFiles : null)
            : (allFiles.length > 0 ? allFiles[0] : null);
    };

    const validateFile = (file: File): string | null => {
        if (field.allowedMimeTypes?.length && !field.allowedMimeTypes.includes(file.type)) {
            errorToast(`File type "${file.type}" is not allowed`);
            return `File type "${file.type}" is not allowed. Allowed types: ${field.allowedMimeTypes.join(', ')}`;
        }

        if (field.maxFileSize && file.size > field.maxFileSize) {
            const maxSizeMB = (field.maxFileSize / (1024 * 1024)).toFixed(1);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            errorToast(`File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`);
            return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`;
        }

        return null;
    };

    const processFiles = (files: File[]) => {
        const validFiles = files.filter(file => {
            const error = validateFile(file);
            if (error) console.error(error);
            return !error;
        });

        if (validFiles.length === 0) return;

        if (field.multiple) {
            newFiles = [...newFiles, ...validFiles];
        } else {
            newFiles = [validFiles[0]];
            filesToDelete = [...filesToDelete, ...existingFiles.map(f => f.id).filter(Boolean)];
            existingFiles = [];
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

    const removeExistingFile = (fileId: string) => {
        filesToDelete = [...filesToDelete, fileId];
        existingFiles = existingFiles.filter(f => f.id !== fileId);
        // Force update the value to reflect deletion
        updateValue(existingFiles.filter(file => !filesToDelete.includes(file.id)), newFiles);
    };

    const removeNewFile = (index: number) => {
        newFiles = newFiles.filter((_, i) => i !== index);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileExtension = (filename: string) => {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop()?.toUpperCase() : 'UNKNOWN';
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
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
            disabled={field.disabled}
            required={field.required}
        />

        <div
            class={cn(
                "border-2 border-dashed bg-background dark:bg-input/30 rounded-lg p-6 text-center transition-colors",
                isDragOver ? "border-primary bg-primary/10 dark:bg-primary/20" : "border-muted-foreground/25",
                field.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
            )}
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            on:dragleave={() => isDragOver = false}
            on:click={() => fileInput?.click()}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && fileInput?.click()}
        >
            <UploadIcon class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div class="space-y-2">
                <p class="text-sm font-medium">
                    {field.multiple ? 'Drop files here or click to browse' : 'Drop a file here or click to browse'}
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

        {#if existingFiles.length > 0 || newFiles.length > 0}
            <div class="space-y-2">
                <h4 class="text-sm font-medium">
                    {field.multiple ? 'Files' : 'File'}
                </h4>
                <div class="space-y-2">
                    {#each existingFiles as fileData}
                        <div class="flex flex-col gap-3 p-4 bg-muted rounded-lg sm:flex-row sm:items-center sm:p-3">
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
                                        thumbnailClass="w-full h-48 object-cover rounded-lg select-none sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
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
                                <Tooltip>
                                    <TooltipTrigger class="block w-full text-left">
                                        <p class="text-sm font-medium truncate cursor-help">
                                            {fileData.originalName}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent class="space-y-2 w-[280px] shadow-md dark:shadow-none p-3 bg-background border border-border rounded-md">
                                        <div class="text-[13px] font-medium break-all">
                                            {fileData.originalName}
                                        </div>
                                        <div class="space-y-1 text-xs text-muted-foreground">
                                            <div class="flex justify-between">
                                                <span>Type</span>
                                                <span>{getFileExtension(fileData.originalName)}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span>Size</span>
                                                <span>{formatFileSize(fileData.size)}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span>Uploaded</span>
                                                <span>{formatDate(new Date(fileData.uploadedAt))}</span>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                                <p class="text-xs text-muted-foreground">
                                    {formatFileSize(fileData.size)}
                                </p>
                            </div>
                            <div class="flex-shrink-0 flex justify-end sm:justify-center">
                                <ConfirmPopover
                                    title="Confirm file deletion"
                                    description="Are you sure you want to delete this file? This action cannot be undone."
                                    confirmText="Delete"
                                    cancelText="Cancel"
                                    variant="destructive"
                                    onConfirm={() => removeExistingFile(fileData.id)}
                                    disabled={field.disabled}
                                >
                                    <Button
                                        variant="ghostDestructive"
                                        size="sm"
                                        disabled={field.disabled}
                                        title="Delete file"
                                    >
                                        <TrashIcon class="h-4 w-4" />
                                    </Button>
                                </ConfirmPopover>
                            </div>
                        </div>
                    {/each}

                    {#each newFiles as file, index}
                        <div class="flex flex-col gap-3 p-4 bg-muted rounded-lg sm:flex-row sm:items-center sm:p-3">
                            <div class="flex-shrink-0 w-full sm:w-auto">
                                {#if isImage(file.type)}
                                    <img 
                                        src={previewUrls[file.name]} 
                                        alt={file.name}
                                        class="w-full h-48 object-cover rounded-lg select-none sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
                                    />
                                {:else if isVideo(file.type)}
                                    <VideoPreview 
                                        src={previewUrls[file.name]}
                                        title={file.name}
                                        thumbnailClass="w-full h-48 object-cover rounded-lg select-none sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
                                    />
                                {:else}
                                    <div class="flex justify-center sm:justify-start">
                                        <FileIcon 
                                            mimeType={file.type} 
                                            fileName={file.name} 
                                            size={32} 
                                            class="text-muted-foreground" 
                                        />
                                    </div>
                                {/if}
                            </div>
                            <div class="min-w-0 flex-1 space-y-1">
                                <Tooltip>
                                    <TooltipTrigger class="block w-full text-left">
                                        <p class="text-sm font-medium truncate">
                                            {file.name}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent class="space-y-2 w-[280px] p-3">
                                        <div class="text-[13px] font-medium break-all">
                                            {file.name}
                                        </div>
                                        <div class="space-y-1 text-xs text-muted-foreground">
                                            <div class="flex justify-between">
                                                <span>Type</span>
                                                <span>{getFileExtension(file.name)}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span>Size</span>
                                                <span>{formatFileSize(file.size)}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span>Status</span>
                                                <span>Pending Upload</span>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                                <p class="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>
                            <div class="flex-shrink-0 flex justify-end sm:justify-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => removeNewFile(index)}
                                    disabled={field.disabled}
                                    title="Remove file"
                                >
                                    <XIcon class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</TooltipProvider> 