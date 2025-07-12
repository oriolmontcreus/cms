<script lang="ts">
    import type { UploadedFile } from '@shared/types/file.type';
    import { Button } from '@components/ui/button';
    import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
    import ConfirmPopover from '@components/ConfirmPopover.svelte';
    import TrashIcon from '@tabler/icons-svelte/icons/trash';
    import InfoCircleIcon from '@tabler/icons-svelte/icons/info-circle';
    import ExternalLinkIcon from '@tabler/icons-svelte/icons/external-link';
    import { getFileUrl } from '@/services/file.service';

    export let fileData: UploadedFile;
    export let disabled = false;
    export let onDelete: () => void;

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

<div class="inline-flex -space-x-px rounded-lg rtl:space-x-reverse w-fit">
    <Popover>
        <PopoverTrigger>
            <Button
                class="rounded-none shadow-none first:rounded-s-md focus-visible:z-10 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/20"
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
        class="rounded-none shadow-none focus-visible:z-10 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/20"
        variant="outline"
        size="icon"
        {disabled}
        title="Open file"
        aria-label="Open file"
        onclick={() => window.open(getFileUrl(fileData), '_blank')}
    >
        <ExternalLinkIcon size={16} aria-hidden="true" />
    </Button>
    
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
            class="rounded-none shadow-none last:rounded-e-md focus-visible:z-10 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/20"
            variant="outline"
            size="icon"
            {disabled}
            title="Delete file"
            aria-label="Delete file"
        >
            <TrashIcon size={16} aria-hidden="true" />
        </Button>
    </ConfirmPopover>
</div> 