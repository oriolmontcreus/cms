<script lang="ts">
    import SetupForm from "@/lib/components/SetupForm.svelte";
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { checkSetupStatus } from '@/services/auth.service';

    let loading = $state(true);

    onMount(async () => {
        try {
            const status = await checkSetupStatus();
            if (!status.needsSetup) {
                // Setup already completed, redirect to login
                goto('/login');
                return;
            }
            loading = false;
        } catch (error) {
            console.error('Error checking setup status:', error);
            goto('/login');
        }
    });
</script>

<svelte:head>
    <title>Welcome to Froggy CMS - First Time Setup</title>
</svelte:head>

{#if loading}
    <div class="flex items-center justify-center min-h-screen">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
{:else}
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <div class="w-full max-w-2xl">
            <SetupForm />
        </div>
    </div>
{/if}