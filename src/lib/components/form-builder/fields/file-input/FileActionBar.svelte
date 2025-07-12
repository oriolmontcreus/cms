<script lang="ts">
    import type { UploadedFile } from '@shared/types/file.type';
    import { Button } from '@components/ui/button';
    import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
    import ConfirmPopover from '@components/ConfirmPopover.svelte';
    import TrashIcon from '@lucide/svelte/icons/trash';
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

<div class="flex-shrink-0 flex gap-1">
    <Popover>
        <PopoverTrigger>
            <Button
                variant="outline"
                size="sm"
                {disabled}
                title="File information"
            >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                </svg>
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
        variant="outline"
        size="sm"
        {disabled}
        title="Open file"
        onclick={() => window.open(getFileUrl(fileData), '_blank')}
    >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15,3 21,3 21,9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
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
            variant="outline"
            size="sm"
            class="hover:text-destructive hover:dark:bg-destructive/10 hover:bg-destructive/20"
            {disabled}
            title="Delete file"
        >
            <TrashIcon class="h-4 w-4" />
        </Button>
    </ConfirmPopover>
</div> 