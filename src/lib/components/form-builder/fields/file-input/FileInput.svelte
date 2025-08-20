<script lang="ts">
    import type { FormField } from "../../types";
    import { cn } from "$lib/utils";
    import UploadIcon from "@tabler/icons-svelte/icons/upload";
    import type { UploadedFileWithDeletionFlag } from "@/lib/shared/types/file.type";
    import { onMount } from "svelte";
    import { flip } from "svelte/animate";
    import { cubicOut } from "svelte/easing";
    import FileIcon from "../FileIcon.svelte";
    import VideoPreview from "./VideoPreview.svelte";
    import { getFileUrl } from "@/services/file.service";
    import { errorToast } from "@/services/toast.service";
    import Button from "$lib/components/ui/button/button.svelte";

    export let field: FormField;
    export let value: any = null; // single File / UploadedFile or array

    let fileInput: HTMLInputElement;
    let isDragOver = false;
    let isProcessing = false;
    // Track files (only local new Files) being removed to animate out before actual deletion
    let removingLocalFiles = new Set<File>();
    let dragIndex: number | null = null;
    let overIndex: number | null = null;

    function handleDragStart(event: DragEvent, index: number) {
        if (!field.allowReorder || !field.multiple) return;
        dragIndex = index;
        overIndex = index;

        // Create a custom drag image that's transparent
        const dragImage = new Image();
        dragImage.src =
            "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
        event.dataTransfer?.setDragImage(dragImage, 0, 0);
        event.dataTransfer?.setData("text/plain", String(index));
    }

    function handleDragEnter(event: DragEvent, index: number) {
        if (dragIndex === null || !field.allowReorder) return;
        event.preventDefault();
        overIndex = index;
    }

    function handleDragOver(event: DragEvent) {
        if (dragIndex === null || !field.allowReorder) return;
        event.preventDefault();
    }

    function handleDropReorder(event: DragEvent, index: number) {
        if (dragIndex === null || overIndex === null || !field.allowReorder)
            return;
        event.preventDefault();

        if (dragIndex !== overIndex) {
            const newOrder = [...currentFiles];
            const [moved] = newOrder.splice(dragIndex, 1);
            newOrder.splice(overIndex, 0, moved);
            value = newOrder;
        }

        dragIndex = null;
        overIndex = null;
    }

    function handleDragEnd() {
        dragIndex = null;
        overIndex = null;
    }

    const isImage = (mimeType: string) => mimeType?.startsWith("image/");
    const isVideo = (mimeType: string) => mimeType?.startsWith("video/");
    const isFile = (item: any): item is File => item instanceof File;

    $: currentFiles = Array.isArray(value) ? value : value ? [value] : [];

    const validateFile = (file: File): string | null => {
        if (
            field.allowedMimeTypes?.length &&
            !field.allowedMimeTypes.includes(file.type)
        ) {
            return `File type "${file.type}" is not allowed. Allowed: ${field.allowedMimeTypes.join(", ")}`;
        }
        if (field.maxFileSize && file.size > field.maxFileSize) {
            const maxSizeMB = (field.maxFileSize / (1024 * 1024)).toFixed(1);
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return `File size ${fileSizeMB}MB exceeds ${maxSizeMB}MB`;
        }
        return null;
    };

    const processFiles = (files: File[]) => {
        if (isProcessing) return;
        const valid = files.filter((f) => {
            const error = validateFile(f);
            if (error) errorToast(error);
            return !error;
        });
        if (!valid.length) return;
        isProcessing = true;
        // operations are sync, so we can safely reset after
        value = field.multiple ? [...currentFiles, ...valid] : valid[0];
        isProcessing = false;
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

    const toggleRemove = (target: File | UploadedFileWithDeletionFlag) => {
        if (isProcessing) return;
        if (isFile(target)) {
            // Newly added local file: animate removal before actually deleting
            removingLocalFiles.add(target);
            removingLocalFiles = removingLocalFiles; // trigger reactivity
            const ANIMATION_MS = 300;
            setTimeout(() => {
                value = field.multiple
                    ? currentFiles.filter((f) => f !== target)
                    : null;
                removingLocalFiles.delete(target);
                removingLocalFiles = removingLocalFiles;
            }, ANIMATION_MS);
        } else {
            // Existing uploaded file: toggle _markedForDeletion
            if (field.multiple) {
                value = currentFiles.map((f) =>
                    f === target
                        ? {
                              ...f,
                              _markedForDeletion: f._markedForDeletion
                                  ? undefined
                                  : true,
                          }
                        : f,
                );
            } else {
                value = target._markedForDeletion
                    ? (({ _markedForDeletion, ...rest }) => rest)(target)
                    : { ...target, _markedForDeletion: true };
            }
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (!bytes) return "0B";
        const k = 1024;
        const units = ["B", "KB", "MB", "GB"]; // enough
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
    };

    const getFileData = (file: File | UploadedFileWithDeletionFlag) => ({
        url: isFile(file) ? URL.createObjectURL(file) : getFileUrl(file),
        name: isFile(file) ? file.name : file.originalName || file.fileName,
        size: file.size,
        mimeType: isFile(file) ? file.type : file.mimeType,
    });

    onMount(() => {
        return () => {
            currentFiles.forEach((f) => {
                if (isFile(f)) URL.revokeObjectURL(getFileData(f).url);
            });
        };
    });
</script>

<div class="flex flex-col gap-2">
    <!-- Drop Area -->
    <div
        class={cn(
            "border-input bg-background dark:bg-input/30 data-[dragging=true]:bg-accent has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-48 flex-col overflow-hidden rounded-md border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]",
            currentFiles.length === 0
                ? "items-center justify-center text-center"
                : "gap-3",
            field.disabled || isProcessing
                ? "opacity-60 pointer-events-none"
                : "",
        )}
        data-dragging={isDragOver || undefined}
        data-files={currentFiles.length > 0 || undefined}
        on:dragenter={(e) => {
            e.preventDefault();
            isDragOver = true;
        }}
        on:dragover={(e) => {
            e.preventDefault();
            isDragOver = true;
        }}
        on:dragleave={() => (isDragOver = false)}
        on:drop={handleDrop}
        role="group"
    >
        <input
            bind:this={fileInput}
            type="file"
            class="sr-only"
            multiple={field.multiple}
            accept={field.allowedMimeTypes?.join(",")}
            on:change={handleFileSelect}
            disabled={field.disabled || isProcessing}
            required={field.required}
            aria-label="Upload files"
        />

        {#if currentFiles.length > 0}
            <!-- Header + Add more -->
            <div class="flex items-center justify-between gap-2">
                <!-- Accessibility region -->
                <p
                    aria-live="polite"
                    role="status"
                    class="text-muted-foreground text-center text-xs mt-1"
                >
                    {currentFiles.length === 0
                        ? "No files selected"
                        : `${currentFiles.length} file${currentFiles.length === 1 ? "" : "s"} selected`}
                </p>
                {#if field.multiple}
                    <Button
                        variant="outline"
                        size="sm"
                        class="inline-flex items-center gap-1"
                        disabled={field.disabled || isProcessing}
                        onclick={() => fileInput?.click()}
                    >
                        <UploadIcon class="-ms-0.5 h-3.5 w-3.5 opacity-60" />
                        Add more
                    </Button>
                {/if}
            </div>
            <!-- Grid -->
            <div
                class={cn(
                    field.multiple
                        ? field.preview &&
                          (field.preview.width || field.preview.height)
                            ? // When explicit sizing is provided, flex-wrap avoids grid min-content issues causing overlap
                              "flex flex-wrap gap-3 mt-2"
                            : "grid gap-3 mt-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                        : "grid gap-3 mt-2 grid-cols-1",
                )}
            >
                {#each currentFiles as f, i (f.id || f.name || f.fileName)}
                    {@const data = getFileData(f)}
                    {@const pending = isFile(f)}
                    {@const marked = !pending && f._markedForDeletion}
                    <div
                        class={cn(
                            // Base styles
                            "relative rounded-md group bg-accent/40 border border-transparent flex items-center justify-center overflow-visible transition-all duration-150 ease-out",
                            (field.preview?.aspect === "video" &&
                                "aspect-video") ||
                                (field.preview?.aspect === "wide" &&
                                    "aspect-[16/9]") ||
                                (field.preview?.aspect === "portrait" &&
                                    "aspect-[3/4]") ||
                                (field.preview?.aspect === "square" &&
                                    "aspect-square") ||
                                (!field.preview?.aspect && "aspect-square") ||
                                field.preview?.aspect,
                            !field.multiple &&
                                currentFiles.length === 1 &&
                                !field.preview?.width &&
                                !field.preview?.height
                                ? "max-w-60 mx-auto"
                                : "",
                            removingLocalFiles.has(f)
                                ? "scale-95 opacity-0"
                                : "",
                            dragIndex === i
                                ? "scale-105 shadow-2xl z-20 opacity-90 rotate-1"
                                : "",
                            overIndex === i &&
                                dragIndex !== null &&
                                dragIndex !== i
                                ? "ring-2 ring-primary/50 scale-95"
                                : "",
                            field.allowReorder && field.multiple
                                ? "cursor-grab active:cursor-grabbing hover:shadow-md"
                                : "",
                            field.preview?.class,
                        )}
                        style={field.preview &&
                        (field.preview.width || field.preview.height)
                            ? `${field.preview.width ? `width:${field.preview.width}px;flex:0 0 ${field.preview.width}px;` : ""}${field.preview.height ? `height:${field.preview.height}px;` : ""}`
                            : undefined}
                        draggable={(field.allowReorder && field.multiple) ||
                            undefined}
                        on:dragstart={(e) => handleDragStart(e, i)}
                        on:dragenter={(e) => handleDragEnter(e, i)}
                        on:dragover={handleDragOver}
                        on:drop={(e) => handleDropReorder(e, i)}
                        on:dragend={handleDragEnd}
                        role={field.allowReorder && field.multiple
                            ? "listitem"
                            : undefined}
                        aria-grabbed={(field.allowReorder &&
                            field.multiple &&
                            dragIndex === i) ||
                            undefined}
                        animate:flip={{ duration: 150, easing: cubicOut }}
                    >
                        {#if isImage(data.mimeType)}
                            <img
                                src={data.url}
                                alt={data.name}
                                class="size-full object-cover select-none pointer-events-none"
                                loading="lazy"
                                draggable={false}
                            />
                        {:else if isVideo(data.mimeType)}
                            <VideoPreview
                                src={data.url}
                                title={data.name}
                                thumbnailClass="size-full object-cover"
                            />
                        {:else}
                            <div
                                class="flex flex-col items-center justify-center size-full gap-2 text-xs text-muted-foreground"
                            >
                                <FileIcon
                                    mimeType={data.mimeType}
                                    fileName={data.name}
                                    size={36}
                                />
                                <span class="px-1 truncate max-w-[90%]"
                                    >{data.name}</span
                                >
                            </div>
                        {/if}

                        <!-- Overlay states -->
                        {#if pending}
                            <div class="absolute inset-0 flex items-start p-1">
                                <span
                                    class="text-[10px] font-medium text-yellow-950 dark:text-yellow-100 bg-yellow-400/80 px-1 rounded"
                                    >Pending</span
                                >
                            </div>
                        {:else if marked}
                            <div class="absolute inset-0 flex items-start p-1">
                                <span
                                    class="text-[10px] font-medium text-red-50 bg-red-600/80 px-1 rounded"
                                    >Marked</span
                                >
                            </div>
                        {/if}

                        <!-- Remove / Toggle button -->
                        <button
                            type="button"
                            class="absolute -top-2 -right-2 size-6 cursor-pointer rounded-full border-2 border-background bg-destructive shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center text-[10px] font-semibold hover:scale-105 transition text-white z-10"
                            on:click|stopPropagation={() => toggleRemove(f)}
                            aria-label={pending
                                ? "Remove file"
                                : marked
                                  ? "Undo deletion"
                                  : "Mark for deletion"}
                        >
                            {#if pending}
                                ✕
                            {:else if marked}
                                ↺
                            {:else}
                                ✕
                            {/if}
                        </button>

                        <!-- Meta footer -->
                        <div
                            class="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/60 to-black/0 text-[10px] text-white px-1.5 py-1 flex items-center justify-between gap-1 pointer-events-none"
                        >
                            <span class="truncate" title={data.name}
                                >{data.name}</span
                            >
                            <span>{formatFileSize(data.size)}</span>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <div
                class="flex flex-col items-center justify-center px-4 py-3 text-center select-none"
            >
                <div
                    class="mb-2 flex h-11 w-11 items-center justify-center rounded-full border bg-background dark:bg-input/30"
                    aria-hidden="true"
                >
                    <UploadIcon class="h-4 w-4 opacity-60" />
                </div>
                <p class="mb-1.5 text-sm font-medium">
                    {field.multiple
                        ? "Drop your files here"
                        : "Drop your file here"}
                </p>
                <p class="text-muted-foreground text-xs">
                    {#if field.allowedMimeTypes?.length}
                        {field.allowedMimeTypes.join(", ")}
                    {/if}
                    {#if field.maxFileSize}
                        {#if field.allowedMimeTypes?.length}&nbsp;•&nbsp;{/if}
                        Max {formatFileSize(field.maxFileSize)}
                    {/if}
                </p>
                <Button
                    type="button"
                    variant="outline"
                    class="mt-4 inline-flex items-center gap-2"
                    disabled={field.disabled || isProcessing}
                    onclick={() => fileInput?.click()}
                >
                    <UploadIcon class="-ms-1 h-4 w-4 opacity-60" />
                    Select {field.multiple ? "files" : "file"}
                </Button>
            </div>
        {/if}
    </div>
</div>
