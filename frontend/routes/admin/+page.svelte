<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/auth';
    import { authService } from '$lib/services/auth';

    let user = $authStore.user;

    onMount(() => {
        if (!authService.getToken()) {
            goto('/login');
        }
    });

    function handleLogout() {
        authService.logout();
        authStore.logout();
        goto('/login');
    }
</script>

<div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <h1 class="text-xl font-semibold">Admin Dashboard</h1>
                </div>
                <div class="flex items-center">
                    <span class="mr-4">Welcome, {user?.name}</span>
                    <button
                        on:click={handleLogout}
                        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
            <div class="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
                <h2 class="text-2xl font-bold mb-4">Welcome to your Admin Dashboard</h2>
                <p>You are logged in as {user?.email}</p>
            </div>
        </div>
    </main>
</div> 