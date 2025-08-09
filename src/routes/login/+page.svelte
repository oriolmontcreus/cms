<script lang="ts">
    import LoginForm from "@/lib/components/LoginForm.svelte";
    import { CMS_NAME } from "@shared/env";
    import CmsLogo from "@/lib/components/CmsLogo.svelte";
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
    <div class="bg-muted relative hidden lg:block">
        <img
            src="/placeholder.svg"
            alt="placeholder"
            class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
    </div>
</div>
