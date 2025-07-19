<script>
    import '../../app.css';
    import { ModeWatcher } from "mode-watcher";
    
    let { children } = $props();
</script>

<svelte:head>
    <title>Translation Test</title>
</svelte:head>

<main>
    {@render children()}
</main>

<ModeWatcher defaultMode="dark" />