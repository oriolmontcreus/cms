<script lang="ts">
    import Spinner from "$lib/components/Spinner.svelte";
</script>

<div class="flex h-screen items-center justify-center">
    <div class="text-center flex flex-col items-center gap-2">
        <Spinner />
        <p class="text-muted-foreground">Loading</p>
    </div>
</div>
