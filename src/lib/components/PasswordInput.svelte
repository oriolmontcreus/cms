<script lang="ts">
    import { Input } from "$lib/components/ui/input";
    import { usePasswordStrength } from "$lib/hooks/usePasswordStrength.svelte";
    import { cn } from "$lib/utils";

    import Check from "@lucide/svelte/icons/check";
    import Eye from "@lucide/svelte/icons/eye";
    import EyeOff from "@lucide/svelte/icons/eye-off";
    import X from "@lucide/svelte/icons/x";

    let {
        id = undefined,
        value = $bindable(""),
        placeholder = "Enter your password",
        required = false,
        className = "",
    }: {
        id?: string | undefined;
        value?: string;
        placeholder?: string;
        required?: boolean;
        className?: string;
    } = $props();

    const passwordStrength = usePasswordStrength({
        id: id || crypto.randomUUID(),
    });

    // Track if user has started typing to avoid showing errors on first render
    let hasStartedTyping = $state(false);

    $effect(() => {
        if (value !== undefined) {
            passwordStrength.password = value;
            if (value.length > 0) {
                hasStartedTyping = true;
            }
        }
    });

    $effect(() => {
        if (passwordStrength.password !== undefined) {
            value = passwordStrength.password;
        }
    });
</script>

<div>
    <div class="space-y-2">
        <div class="relative">
            <Input
                id={passwordStrength.id}
                class={cn("pe-9", className)}
                name="password"
                {required}
                {placeholder}
                type={passwordStrength.isVisible ? "text" : "password"}
                bind:value={passwordStrength.password}
                aria-invalid={hasStartedTyping &&
                    passwordStrength.strengthScore < 4}
                aria-describedby={passwordStrength.id}
            />
            <button
                class="absolute inset-y-px end-px flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 transition-shadow hover:text-foreground focus-visible:border focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                type="button"
                onclick={passwordStrength.toggleVisibility}
                aria-label={passwordStrength.isVisible
                    ? "Hide password"
                    : "Show password"}
                aria-pressed={passwordStrength.isVisible}
                aria-controls={passwordStrength.id}
            >
                {#if passwordStrength.isVisible}
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

    <!-- Password strength indicator -->
    <div
        class="mb-4 mt-3 h-1 w-full overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={passwordStrength.strengthScore}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label="Password strength"
    >
        <div
            class={cn(
                `h-full transition-all duration-500 ease-out`,
                passwordStrength.strengthColor,
            )}
            style:width="{(passwordStrength.strengthScore / 4) * 100}%"
        ></div>
    </div>

    <!-- Password strength description -->
    <p id="password-strength" class="mb-2 text-sm font-medium text-foreground">
        {passwordStrength.strengthText}. Password must contain:
    </p>

    <!-- Password requirements list -->
    <ul class="space-y-1.5" aria-label="Password requirements">
        {#each passwordStrength.strength as req (req.text)}
            <li class="flex items-center space-x-2">
                {#if hasStartedTyping && req.met}
                    <Check
                        size={16}
                        class="text-emerald-500"
                        aria-hidden="true"
                    />
                {:else}
                    <X
                        size={16}
                        class="text-muted-foreground/80"
                        aria-hidden="true"
                    />
                {/if}
                <span
                    class={`text-xs ${hasStartedTyping && req.met ? "text-emerald-600" : hasStartedTyping && !req.met ? "text-muted-foreground" : "text-muted-foreground/70"}`}
                >
                    {req.text}
                    <span class="sr-only">
                        {hasStartedTyping
                            ? req.met
                                ? " - Requirement met"
                                : " - Requirement not met"
                            : " - Not yet checked"}
                    </span>
                </span>
            </li>
        {/each}
    </ul>
</div>
