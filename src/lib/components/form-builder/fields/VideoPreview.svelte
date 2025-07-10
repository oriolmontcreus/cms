<script lang="ts">
    import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger, DialogClose } from '$lib/components/ui/dialog';
    import { buttonVariants } from '$lib/components/ui/button';
    import IconEye from '@tabler/icons-svelte/icons/eye';

    export let src: string;
    export let title: string = '';
    export let thumbnailClass: string = '';

    let videoElement: HTMLVideoElement;
    let thumbnailUrl: string = '';
    let isVideoLoaded = false;

    // Generate thumbnail when video loads
    const generateThumbnail = () => {
        if (!videoElement || !isVideoLoaded) return;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            canvas.getContext('2d')?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            thumbnailUrl = canvas.toDataURL();
        } catch (error) {
            console.warn('Could not generate thumbnail:', error);
            // If we can't generate thumbnail, we'll show the video element instead
            thumbnailUrl = '';
        }
    };

    const handleVideoLoad = () => {
        isVideoLoaded = true;
        generateThumbnail();
    };
</script>

<Dialog>
    <DialogTrigger>
        <button type="button" class="group relative block w-full">
            {#if thumbnailUrl}
                <img 
                    src={thumbnailUrl} 
                    alt={title} 
                    loading="lazy"
                    draggable={false}
                    class={`${thumbnailClass} select-none`}
                />
            {:else}
                <video 
                    bind:this={videoElement}
                    src={src}
                    class={`${thumbnailClass} select-none`}
                    preload="metadata"
                    draggable={false}
                    crossorigin="anonymous"
                    on:loadeddata={handleVideoLoad}
                >
                    <track kind="captions">
                </video>
            {/if}
            
            <!-- Hover overlay with eye icon -->
            <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                <IconEye class="h-8 w-8 text-white" />
            </div>
        </button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-3xl p-6">
        <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div class="relative aspect-video w-full">
            <video 
                src={src}
                class="h-full w-full"
                controls
                autoplay
                crossorigin="anonymous"
            >
                <track kind="captions">
            </video>
        </div>
    </DialogContent>
</Dialog> 