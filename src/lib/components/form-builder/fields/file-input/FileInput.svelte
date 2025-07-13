<script lang="ts">
    import type { FormField } from '../../types';
    import { cn } from '$lib/utils';
    import UploadIcon from '@tabler/icons-svelte/icons/upload';
    import type { UploadedFileWithDeletionFlag } from '@shared/types/file.type';
    import { onMount } from 'svelte';
    import FileIcon from '../FileIcon.svelte';
    import VideoPreview from './VideoPreview.svelte';
    import FileActionBar from './FileActionBar.svelte';
    import { TooltipProvider } from '@components/ui/tooltip';
    import { getFileUrl } from '@/services/file.service';
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
            value = field.multiple ? [...currentFiles, ...validFiles] : validFiles[0];
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

    const removeFile = (fileToRemove: File | UploadedFileWithDeletionFlag) => {
        if (isProcessing) return;

        isProcessing = true;
        
        try {
            if (isFile(fileToRemove)) {
                value = field.multiple 
                    ? currentFiles.filter(f => f !== fileToRemove) || null
                    : null;
            } else {
                const isMarkedForDeletion = fileToRemove._markedForDeletion;
                
                if (field.multiple) {
                    const updatedFiles = currentFiles.map(f => 
                        f === fileToRemove 
                            ? isMarkedForDeletion 
                                ? { ...f, _markedForDeletion: undefined }
                                : { ...f, _markedForDeletion: true }
                            : f
                    );
                    value = updatedFiles;
                } else {
                    value = isMarkedForDeletion
                        ? (({ _markedForDeletion, ...rest }) => rest)(fileToRemove)
                        : { ...fileToRemove, _markedForDeletion: true };
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

    const getFileData = (file: File | UploadedFileWithDeletionFlag) => ({
        url: isFile(file) ? URL.createObjectURL(file) : getFileUrl(file),
        name: isFile(file) ? file.name : file.originalName || file.fileName,
        size: file.size,
        mimeType: isFile(file) ? file.type : file.mimeType
    });

    onMount(() => {
        return () => {
            currentFiles.forEach(file => {
                if (isFile(file)) {
                    URL.revokeObjectURL(getFileData(file).url);
                }
            });
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
            on:dragover={(e) => { e.preventDefault(); isDragOver = true; }}
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
                    {@const { url, name, size, mimeType } = getFileData(fileData)}
                    {@const isPending = isFile(fileData)}
                    {@const isMarkedForDeletion = !isPending && fileData._markedForDeletion}
                    
                    <div class="flex flex-col gap-3 p-4 bg-background dark:bg-input/30 rounded-lg lg:p-6 {isPending ? 'border border-dashed border-yellow-500' : isMarkedForDeletion ? 'border border-dashed border-red-500' : ''}">
                        {#if isPending}
                            <div class="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                                <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                Pending upload
                            </div>
                        {:else if isMarkedForDeletion}
                            <div class="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                                <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                                Marked for deletion
                            </div>
                        {/if}
                        
                        <div class="flex-shrink-0 w-full sm:w-auto">
                            {#if isImage(mimeType)}
                                <img 
                                    src={url}
                                    loading="lazy"
                                    draggable={false}
                                    alt={name}
                                    class="w-full h-48 object-cover rounded-lg select-none sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
                                />
                            {:else if isVideo(mimeType)}
                                <VideoPreview 
                                    src={url}
                                    title={name}
                                    thumbnailClass="w-full object-cover rounded-lg select-none"
                                />
                            {:else}
                                <div class="flex justify-center sm:justify-start">
                                    <FileIcon 
                                        mimeType={mimeType} 
                                        fileName={name} 
                                        size={32} 
                                        class="text-muted-foreground" 
                                    />
                                </div>
                            {/if}
                        </div>
                        
                        <div class="min-w-0 flex-1 space-y-1">
                            <p class="text-sm font-medium truncate">{name}</p>
                            <p class="text-xs text-muted-foreground">{formatFileSize(size)}</p>
                        </div>
                        
                        <FileActionBar
                            fileData={isPending ? { 
                                id: '', 
                                originalName: name, 
                                fileName: name, 
                                mimeType, 
                                size,
                                path: url, 
                                uploadedAt: new Date() 
                            } : fileData}
                            disabled={field.disabled || isProcessing}
                            onDelete={() => removeFile(fileData)}
                        />
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</TooltipProvider> 