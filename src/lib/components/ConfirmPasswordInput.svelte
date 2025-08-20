<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { cn } from "$lib/utils";

    import Eye from "@tabler/icons-svelte/icons/eye";
    import EyeOff from "@tabler/icons-svelte/icons/eye-off";

    let {
        id = undefined,
        value = $bindable(""),
        placeholder = "Confirm your password",
        required = false,
        className = "",
    }: {
        id?: string | undefined;
        value?: string;
        placeholder?: string;
        required?: boolean;
        className?: string;
    } = $props();

    let isVisible = $state(false);

    function toggleVisibility() {
        isVisible = !isVisible;
    }
</script>

<div>
    <div class="space-y-2">
        <div class="relative">
            <Input
                {id}
                class={cn("pe-9", className)}
                name="confirmPassword"
                {required}
                {placeholder}
                type={isVisible ? "text" : "password"}
                bind:value
                autocomplete="off"
            />
            <button
                class="absolute inset-y-px end-px flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                type="button"
                onclick={toggleVisibility}
                aria-label={isVisible
                    ? "Hide password"
                    : "Show password"}
                aria-pressed={isVisible}
                aria-controls={id}
            >
                {#if isVisible}
                    <EyeOff
                        class="size-5 text-muted-foreground flex-shrink-0"
                        aria-hidden="true"
                    />
                {:else}
                    <Eye
                        class="size-5 text-muted-foreground flex-shrink-0"
                        aria-hidden="true"
                    />
                {/if}
            </button>
        </div>
    </div>
</div>
