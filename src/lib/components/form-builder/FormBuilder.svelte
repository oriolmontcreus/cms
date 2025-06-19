<!-- FormBuilder.svelte -->
<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { Input } from '@components/ui/input';
    import { Label } from '@components/ui/label';
    import { Textarea } from '@components/ui/textarea';
    import { handleSaveFormData } from '@/services/page.service';
    import { onMount } from 'svelte';

    export let config: PageConfig;
    export let slug: string;
    export let initialData: Record<string, any> | undefined = undefined;

    let formData: FormData = {};
    let isSubmitting = false;

    onMount(() => {
        // Initialize form with existing data if available
        if (initialData) {
            formData = { ...initialData };
        }
    });

    async function handleSubmit() {
        try {
            isSubmitting = true;
            const result = await handleSaveFormData(slug, formData);
            
            if (result) {
                console.log('Form data saved:', result);
            }
        } catch (error) {
            console.error('Error saving form data:', error);
        } finally {
            isSubmitting = false;
        }
    }

    function getSelectValue(value: string | number | Date | null): string {
        if (value === null || value === undefined) return '';
        return String(value);
    }
</script>

<form class="space-y-6" on:submit|preventDefault={handleSubmit}>
    <div class="space-y-4">
        {#each config.fields as field (field.name)}
            <div class="space-y-2">
                <Label for={field.name}>{field.label}</Label>

                {#if field.type === 'text'}
                    <Input
                        type="text"
                        id={field.name}
                        name={field.name}
                        placeholder={field.placeholder}
                        required={field.required}
                        bind:value={formData[field.name]}
                    />
                {:else if field.type === 'textarea'}
                    <Textarea
                        id={field.name}
                        name={field.name}
                        placeholder={field.placeholder}
                        required={field.required}
                        bind:value={formData[field.name] as string}
                    />
                {:else if field.type === 'number'}
                    <Input
                        type="number"
                        id={field.name}
                        name={field.name}
                        placeholder={field.placeholder}
                        required={field.required}
                        bind:value={formData[field.name]}
                    />
                {:else if field.type === 'date'}
                    <Input
                        type="date"
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        bind:value={formData[field.name]}
                    />
                {:else if field.type === 'select' && field.options}
                    <select
                        id={field.name}
                        name={field.name}
                        class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required={field.required}
                        bind:value={formData[field.name]}
                    >
                        <option value="">{field.placeholder || `Select ${field.label}`}</option>
                        {#each field.options as option}
                            <option value={option}>{option}</option>
                        {/each}
                    </select>
                {/if}
            </div>
        {/each}
    </div>

    <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
    </Button>
</form> 