<script lang="ts">
    import type { UploadedFileWithDeletionFlag } from '@/lib/shared/types/file.type';
    import { Button } from '@components/ui/button';
    import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
    import ConfirmPopover from '@components/ConfirmPopover.svelte';
    import TrashIcon from '@tabler/icons-svelte/icons/trash';
    import XIcon from '@tabler/icons-svelte/icons/x';
    import UndoIcon from '@tabler/icons-svelte/icons/arrow-back-up';
    import InfoCircleIcon from '@tabler/icons-svelte/icons/info-circle';
    import ExternalLinkIcon from '@tabler/icons-svelte/icons/external-link';
    import { getFileUrl } from '@/services/file.service';

    export let fileData: UploadedFileWithDeletionFlag;
    export let disabled = false;
    export let onDelete: () => void;

    $: isPendingFile = !fileData.id;
    $: isMarkedForDeletion = fileData._markedForDeletion;

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

    const buttonClasses = {
        info: "text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20",
        open: "text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/20",
        cancel: "text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/20",
        undo: "text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20",
        delete: "text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
    };
</script>

<div class="inline-flex -space-x-px rounded-lg rtl:space-x-reverse w-fit">
    {#if !isPendingFile && !isMarkedForDeletion}
        <Popover>
            <PopoverTrigger>
                <Button
                    class="rounded-none shadow-none first:rounded-s-md focus-visible:z-10 {buttonClasses.info}"
                    variant="outline"
                    size="icon"
                    {disabled}
                    title="File information"
                    aria-label="File information"
                >
                    <InfoCircleIcon size={16} aria-hidden="true" />
                </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[280px] p-3">
                <div class="space-y-2">
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
                </div>
            </PopoverContent>
        </Popover>
        
        <Button
            class="rounded-none shadow-none focus-visible:z-10 {buttonClasses.open}"
            variant="outline"
            size="icon"
            {disabled}
            title="Open file"
            aria-label="Open file"
            onclick={() => window.open(getFileUrl(fileData), '_blank')}
        >
            <ExternalLinkIcon size={16} aria-hidden="true" />
        </Button>
    {/if}
    
    {#if isPendingFile}
        <Button
            class="shadow-none rounded-md focus-visible:z-10 {buttonClasses.cancel}"
            variant="outline"
            size="icon"
            {disabled}
            title="Cancel upload"
            aria-label="Cancel upload"
            onclick={onDelete}
        >
            <XIcon size={16} aria-hidden="true" />
        </Button>
    {:else if isMarkedForDeletion}
        <Button
            class="shadow-none rounded-md focus-visible:z-10 {buttonClasses.undo}"
            variant="outline"
            size="icon"
            {disabled}
            title="Undo delete"
            aria-label="Undo delete"
            onclick={onDelete}
        >
            <UndoIcon size={16} aria-hidden="true" />
        </Button>
    {:else}
        <ConfirmPopover
            title="Confirm file deletion"
            description="Are you sure you want to delete this file? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            variant="destructive"
            onConfirm={onDelete}
            {disabled}
        >
            <Button
                class="rounded-none shadow-none last:rounded-e-md focus-visible:z-10 {buttonClasses.delete}"
                variant="outline"
                size="icon"
                {disabled}
                title="Delete file"
                aria-label="Delete file"
            >
                <TrashIcon size={16} aria-hidden="true" />
            </Button>
        </ConfirmPopover>
    {/if}
</div> 