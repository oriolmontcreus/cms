<script lang="ts">
    import LoginForm from "@/lib/components/LoginForm.svelte";
    import { CMS_NAME } from "@shared/env";
    import CmsLogo from "@/lib/components/CmsLogo.svelte";
    import FlickeringGrid from "@/lib/components/FlickeringGrid.svelte";
</script>

<div class="grid min-h-svh lg:grid-cols-2 dark:bg-background">
    <div class="flex flex-col gap-4 p-6 md:p-10">
        <div class="flex justify-center gap-1 md:justify-start">
            <CmsLogo textSize="text-sm" />
            {CMS_NAME}
        </div>
        <div class="flex flex-1 items-center justify-center">
            <div class="w-full max-w-xs">
                <LoginForm />
            </div>
        </div>
    </div>
    <div
        class="relative hidden lg:flex items-center justify-center overflow-hidden bg-background border-l"
    >
        <FlickeringGrid
            squareSize={12}
            gridGap={8}
            flickerChance={0.05}
            color="oklch(0.7611 0.1735 156.3879)"
            maxOpacity={0.3}
            className="absolute inset-0"
        />
    </div>
</div>
