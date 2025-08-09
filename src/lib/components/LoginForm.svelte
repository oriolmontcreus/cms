<script lang="ts">
    import { Label } from "$lib/components/ui/label/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import Eye from "@lucide/svelte/icons/eye";
    import EyeOff from "@lucide/svelte/icons/eye-off";
    import { cn, type WithElementRef } from "$lib/utils.js";
    import type { HTMLFormAttributes } from "svelte/elements";
    import { handleLogin } from "@/services/auth.service";
    let {
        ref = $bindable(null),
        class: className,
        ...restProps
    }: WithElementRef<HTMLFormAttributes> = $props();
    const id = $props.id();

    let email = $state("");
    let password = $state("");
    let showPassword = $state(false);

    async function onSubmit(e: SubmitEvent) {
        e.preventDefault();
        await handleLogin(email, password, true);
    }
</script>

<form
    class={cn("flex flex-col gap-6", className)}
    bind:this={ref}
    {...restProps}
    onsubmit={onSubmit}
>
    <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-2xl font-bold">Login to your account</h1>
        <p class="text-muted-foreground text-balance text-sm">
            Enter your email below to login to your account
        </p>
    </div>
    <div class="grid gap-6">
        <div class="grid gap-3">
            <Label for="email-{id}">Email</Label>
            <Input
                id="email-{id}"
                type="email"
                placeholder="m@example.com"
                required
                bind:value={email}
            />
        </div>
        <div class="grid gap-3">
            <Label for="password-{id}">Password</Label>
            <div class="relative">
                <Input
                    id="password-{id}"
                    type={showPassword ? "text" : "password"}
                    required
                    bind:value={password}
                    class="pr-10"
                />
                <button
                    type="button"
                    class="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground"
                    onclick={() => (showPassword = !showPassword)}
                >
                    {#if showPassword}
                        <EyeOff class="h-4 w-4" />
                    {:else}
                        <Eye class="h-4 w-4" />
                    {/if}
                </button>
            </div>
        </div>
        <Button type="submit" class="w-full">Login</Button>
    </div>
</form>
