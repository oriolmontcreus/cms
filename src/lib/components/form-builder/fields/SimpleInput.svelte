<script lang="ts">
    import { cn } from "$lib/utils";
    import type { FormField } from "../types";

    export let field: FormField;
    export let fieldId: string;
    export let value: string = "";
    export let type: string = "text";
    export let validationError: string | null = null;

    const hasPrefix = field.prefix !== undefined;
    const hasSuffix = field.suffix !== undefined;
    const inputClasses = cn(
        hasPrefix && "ps-9",
        hasSuffix && "pe-9",
        validationError &&
            "border-destructive focus-visible:border-destructive",
    );
    const prefixIsString = typeof field.prefix === "string";
    const suffixIsString = typeof field.suffix === "string";
    const inputType = type === "text" ? "text" : type;

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        value = target.value;
    }
</script>

<div class="relative">
    <div class="relative w-full">
        <input
            id={fieldId}
            type={inputType}
            class={cn(
                "border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-neutral-500 flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-all duration-300 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                inputClasses,
            )}
            placeholder={field.placeholder}
            bind:value
            oninput={handleInput}
            required={field.required}
            disabled={field.disabled}
            readonly={field.readonly}
            minlength={field.min}
            maxlength={field.max}
            pattern={field.pattern}
        />

        {#if hasPrefix}
            <div
                class="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50"
            >
                {#if prefixIsString}
                    <span class="text-sm font-medium">{field.prefix}</span>
                {:else}
                    <svelte:component
                        this={field.prefix}
                        size={16}
                        aria-hidden="true"
                    />
                {/if}
            </div>
        {/if}

        {#if hasSuffix}
            <div
                class="text-muted-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 peer-disabled:opacity-50"
            >
                {#if suffixIsString}
                    <span class="text-sm font-medium">{field.suffix}</span>
                {:else}
                    <svelte:component
                        this={field.suffix}
                        size={16}
                        aria-hidden="true"
                    />
                {/if}
            </div>
        {/if}
    </div>
</div>
