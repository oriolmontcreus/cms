<script lang="ts">
    import type { FormField } from '../types';
    import { Input } from '@components/ui/input';
    import { Button } from '@components/ui/button';
    import { cn } from '$lib/utils';
    import XIcon from '@lucide/svelte/icons/x';
    import TrashIcon from '@lucide/svelte/icons/trash';
    import UploadIcon from '@lucide/svelte/icons/upload';
    import FileIcon from '@lucide/svelte/icons/file';
    import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
    import type { UploadedFile } from '@shared/types/file.type';
    import { getContext, onMount } from 'svelte';
    import type { Writable } from 'svelte/store';
    import { checkFilesExist } from '@/services/file.service';

    export let field: FormField;
    export let fieldId: string;
    export let value: UploadedFile[] | UploadedFile | null = null;

    let fileInput: HTMLInputElement;
    let isDragOver = false;
    
    // Separate arrays for existing uploaded files and new files to be uploaded
    let existingFiles: UploadedFile[] = [];
    let newFiles: File[] = [];
    let filesToDelete: string[] = []; // IDs of existing files to delete
    let fileExistenceMap: Record<string, boolean> = {}; // Track which files exist
    let isCheckingFiles = false;

    // Initialize from existing value on mount
    let initialValue = value;
    
    // Get the file upload state from context
    const fileUploadState = getContext<Writable<Record<string, { pendingFiles: File[]; filesToDelete: string[] }>>>('fileUploadState');
    
    // Update the context whenever our state changes
    $: if (fileUploadState) {
        fileUploadState.update(state => ({
            ...state,
            [fieldId]: {
                pendingFiles: newFiles,
                filesToDelete: filesToDelete
            }
        }));
    }
    
    // Initialize existing files from the initial value
    $: if (initialValue && existingFiles.length === 0 && newFiles.length === 0) {
        if (Array.isArray(initialValue)) {
            existingFiles = initialValue.filter(file => file.id);
        } else if (initialValue && initialValue.id) {
            existingFiles = [initialValue];
        }
    }

    // Check file existence when existing files change
    $: if (existingFiles.length > 0) {
        checkFileExistence();
    }

    async function checkFileExistence() {
        if (isCheckingFiles || existingFiles.length === 0) return;
        
        isCheckingFiles = true;
        try {
            const fileNames = existingFiles.map(file => file.fileName);
            const results = await checkFilesExist(fileNames);
            
            fileExistenceMap = results.reduce((acc, result) => {
                acc[result.fileName] = result.exists;
                return acc;
            }, {} as Record<string, boolean>);
        } catch (error) {
            console.error('Error checking file existence:', error);
            // If check fails, assume files don't exist to prevent errors
            fileExistenceMap = existingFiles.reduce((acc, file) => {
                acc[file.fileName] = false;
                return acc;
            }, {} as Record<string, boolean>);
        } finally {
            isCheckingFiles = false;
        }
    }

    // Update the value based on current state
    $: {
        const allFiles = [...existingFiles, ...newFiles.map(file => ({
            id: '', // Will be set after upload
            originalName: file.name,
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            path: '',
            uploadedAt: new Date(),
            _pendingFile: file // Store the actual file for upload
        } as UploadedFile & { _pendingFile: File }))];

        if (field.multiple) {
            value = allFiles.length > 0 ? allFiles : null;
        } else {
            value = allFiles.length > 0 ? allFiles[0] : null;
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

    function processFiles(files: File[]) {
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

        // Add files to local state instead of uploading immediately
        if (field.multiple) {
            newFiles = [...newFiles, ...validFiles];
        } else {
            // For single file, replace existing
            newFiles = [validFiles[0]];
            existingFiles = [];
            filesToDelete = existingFiles.map(f => f.id).filter(id => id);
        }
    }

    function removeExistingFile(fileId: string) {
        console.log('removeExistingFile', fileId);
        filesToDelete = [...filesToDelete, fileId];
        existingFiles = existingFiles.filter(f => f.id !== fileId);
    }

    function removeNewFile(index: number) {
        // Remove new file from local state
        newFiles = newFiles.filter((_, i) => i !== index);
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

    function getFileStatus(file: UploadedFile): 'exists' | 'missing' | 'checking' {
        if (isCheckingFiles) return 'checking';
        if (file.fileName in fileExistenceMap) {
            return fileExistenceMap[file.fileName] ? 'exists' : 'missing';
        }
        return 'checking';
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

    <!-- Files list -->
    {#if existingFiles.length > 0 || newFiles.length > 0}
        <div class="space-y-2">
            <h4 class="text-sm font-medium">
                {field.multiple ? 'Files' : 'File'}
            </h4>
            <div class="space-y-2">
                <!-- Existing files -->
                {#each existingFiles as fileData}
                    {@const status = getFileStatus(fileData)}
                    <div class={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        status === 'missing' ? "bg-red-50 border border-red-200" : "bg-muted"
                    )}>
                        <div class="flex items-center space-x-3">
                            {#if status === 'missing'}
                                <AlertTriangleIcon class="h-4 w-4 text-red-500" />
                            {:else}
                                <FileIcon class="h-4 w-4 text-muted-foreground" />
                            {/if}
                            <div>
                                <p class="text-sm font-medium">{fileData.originalName}</p>
                                <p class="text-xs text-muted-foreground">
                                    {formatFileSize(fileData.size)}
                                    {#if fileData.id}
                                        • ID: {fileData.id.substring(0, 8)}...
                                    {/if}
                                    {#if status === 'missing'}
                                        • <span class="text-red-600">File not found</span>
                                    {:else if status === 'checking'}
                                        • <span class="text-blue-600">Checking...</span>
                                    {/if}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => removeExistingFile(fileData.id)}
                            disabled={field.disabled}
                            title={status === 'missing' ? 'Remove missing file' : 'Delete file'}
                        >
                            <TrashIcon class="h-4 w-4" />
                        </Button>
                    </div>
                {/each}

                <!-- New files (not yet uploaded) -->
                {#each newFiles as file, index}
                    <div class="flex items-center justify-between p-3 bg-muted rounded-lg border-l-4 border-l-blue-500">
                        <div class="flex items-center space-x-3">
                            <FileIcon class="h-4 w-4 text-blue-600" />
                            <div>
                                <p class="text-sm font-medium">{file.name}</p>
                                <p class="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)} • <span class="text-blue-600">New file</span>
                                </p>
                            </div>
                        </div>
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
                {/each}
            </div>
        </div>
    {/if}
</div> 