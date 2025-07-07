<script lang="ts">
    // Document icons
    import FileTextIcon from "@tabler/icons-svelte/icons/file-text";
    import FilePdfIcon from "@tabler/icons-svelte/icons/file-type-pdf";
    import FileWordIcon from "@tabler/icons-svelte/icons/file-word";
    import FileExcelIcon from "@tabler/icons-svelte/icons/file-spreadsheet";
    import FilePowerpointIcon from "@tabler/icons-svelte/icons/presentation";
    
    // Image icons
    import PhotoIcon from "@tabler/icons-svelte/icons/photo";
    import FileImageIcon from "@tabler/icons-svelte/icons/file-type-jpg";
    import FilePngIcon from "@tabler/icons-svelte/icons/file-type-png";
    import FileSvgIcon from "@tabler/icons-svelte/icons/file-type-svg";
    
    // Video icons
    import VideoIcon from "@tabler/icons-svelte/icons/video";
    
    // Audio icons
    import MusicIcon from "@tabler/icons-svelte/icons/music";
    
    // Archive icons
    import FileZipIcon from "@tabler/icons-svelte/icons/file-zip";
    
    // Code icons
    import CodeIcon from "@tabler/icons-svelte/icons/code";
    import FileJsIcon from "@tabler/icons-svelte/icons/brand-javascript";
    import FileHtmlIcon from "@tabler/icons-svelte/icons/file-type-html";
    import FileCssIcon from "@tabler/icons-svelte/icons/file-type-css";
    import FileJsonIcon from "@tabler/icons-svelte/icons/file-code";
    import FileXmlIcon from "@tabler/icons-svelte/icons/file-code";
    
    // Generic file icon
    import FileIcon from "@tabler/icons-svelte/icons/file";
    
    export let mimeType: string = '';
    export let fileName: string = '';
    export let size: number = 20;
    let className: string = '';
    export { className as class };
    
    // MIME type patterns to icon mappings
    const mimeTypePatterns = new Map([
        ['pdf', FilePdfIcon],
        ['msword', FileWordIcon],
        ['wordprocessingml', FileWordIcon],
        ['excel', FileExcelIcon],
        ['spreadsheetml', FileExcelIcon],
        ['powerpoint', FilePowerpointIcon],
        ['presentationml', FilePowerpointIcon],
        ['zip', FileZipIcon],
        ['compressed', FileZipIcon],
        ['json', FileJsonIcon],
        ['xml', FileXmlIcon],
        ['javascript', FileJsIcon],
        ['html', FileHtmlIcon],
        ['css', FileCssIcon]
    ]);
    
    // File extension to icon mappings
    const extensionMap = new Map([
        // Documents
        ['.pdf', FilePdfIcon],
        ['.doc', FileWordIcon],
        ['.docx', FileWordIcon],
        ['.xls', FileExcelIcon],
        ['.xlsx', FileExcelIcon],
        ['.ppt', FilePowerpointIcon],
        ['.pptx', FilePowerpointIcon],
        ['.txt', FileTextIcon],
        ['.md', FileTextIcon],
        
        // Images
        ['.jpg', FileImageIcon],
        ['.jpeg', FileImageIcon],
        ['.png', FilePngIcon],
        ['.svg', FileSvgIcon],
        
        // Videos
        ['.mp4', VideoIcon],
        ['.mov', VideoIcon],
        ['.avi', VideoIcon],
        
        // Audio
        ['.mp3', MusicIcon],
        ['.wav', MusicIcon],
        ['.flac', MusicIcon],
        
        // Archives
        ['.zip', FileZipIcon],
        ['.rar', FileZipIcon],
        ['.7z', FileZipIcon],
        
        // Code
        ['.js', FileJsIcon],
        ['.ts', FileJsIcon],
        ['.html', FileHtmlIcon],
        ['.htm', FileHtmlIcon],
        ['.css', FileCssIcon],
        ['.scss', FileCssIcon],
        ['.sass', FileCssIcon],
        ['.json', FileJsonIcon],
        ['.xml', FileXmlIcon]
    ]);
    
    // MIME type category to icon mappings
    const mimeTypeCategoryMap = new Map([
        ['image/', PhotoIcon],
        ['video/', VideoIcon],
        ['audio/', MusicIcon],
        ['text/', CodeIcon]
    ]);
    
    function getFileIcon(mimeType: string, fileName: string) {
        const lowerFileName = fileName.toLowerCase();
        const lowerMimeType = mimeType.toLowerCase();
        
        // Check MIME type patterns first
        for (const [pattern, icon] of mimeTypePatterns) {
            if (lowerMimeType.includes(pattern)) return icon;
        }
        
        // Check file extension
        for (const [extension, icon] of extensionMap) {
            if (lowerFileName.endsWith(extension)) return icon;
        }
        
        // Check MIME type categories
        for (const [category, icon] of mimeTypeCategoryMap) {
            if (lowerMimeType.startsWith(category)) return icon;
        }
        
        // Special case for code-related content
        if (lowerMimeType.includes('code')) return CodeIcon;
        
        // Default fallback
        return FileIcon;
    }
    
    $: IconComponent = getFileIcon(mimeType, fileName);
</script>

<svelte:component this={IconComponent} {size} class={className} /> 