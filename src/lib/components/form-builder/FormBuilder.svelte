<!-- FormBuilder.svelte -->
<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { Input } from '@components/ui/input';
    import { Label } from '@components/ui/label';
    import { Textarea } from '@components/ui/textarea';
    import { handleUpdateComponents } from '@/services/page.service';
    import type { Component } from '@shared/types/pages';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];

    let formData: FormData = {};
    
    config.components.forEach(componentInstance => {
        formData[componentInstance.id] = {};
        const existingComponent = components.find(c => c.instanceId === componentInstance.id);
        
        componentInstance.component.fields.forEach(field => {
            const existingValue = existingComponent?.formData[field.name];
            if (existingValue !== undefined) {
                formData[componentInstance.id][field.name] = existingValue;
            } else {
                formData[componentInstance.id][field.name] = field.type === 'number' ? null :
                    field.type === 'select' && field.multiple ? [] : '';
            }
        });
    });

    let isSubmitting = false;

    async function handleSubmit() {
        try {
            isSubmitting = true;
            
            const updatedComponents: Component[] = config.components.map(componentInstance => ({
                componentName: componentInstance.component.name,
                instanceId: componentInstance.id,
                displayName: componentInstance.displayName || componentInstance.component.name,
                formData: formData[componentInstance.id] || {}
            }));
            
            await handleUpdateComponents(slug, updatedComponents);
        } catch (error) {
            console.error('Error saving components:', error);
        } finally {
            isSubmitting = false;
        }
    }

    function getSelectValue(value: string | number | Date | null): string {
        if (value === null || value === undefined) return '';
        return String(value);
    }
</script>

<form class="space-y-8" on:submit|preventDefault={handleSubmit}>
    {#each config.components as componentInstance (componentInstance.id)}
        <div class="space-y-6 p-6 border rounded-lg">
            <h3 class="text-lg font-semibold">
                {componentInstance.displayName || componentInstance.component.name}
            </h3>
            
            <div class="space-y-4">
                {#each componentInstance.component.fields as field (field.name)}
                    <div class="space-y-2">
                        <Label for="{componentInstance.id}-{field.name}">{field.label}</Label>

                        {#if field.type === 'text'}
                            <Input
                                type="text"
                                id="{componentInstance.id}-{field.name}"
                                name="{componentInstance.id}-{field.name}"
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={field.disabled}
                                readonly={field.readonly}
                                minlength={field.min}
                                maxlength={field.max}
                                pattern={field.pattern}
                                bind:value={formData[componentInstance.id][field.name]}
                            />
                        {:else if field.type === 'textarea'}
                            <Textarea
                                id="{componentInstance.id}-{field.name}"
                                name="{componentInstance.id}-{field.name}"
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={field.disabled}
                                readonly={field.readonly}
                                minlength={field.min}
                                maxlength={field.max}
                                bind:value={formData[componentInstance.id][field.name]}
                            />
                        {:else if field.type === 'number'}
                            <Input
                                type="number"
                                id="{componentInstance.id}-{field.name}"
                                name="{componentInstance.id}-{field.name}"
                                placeholder={field.placeholder}
                                required={field.required}
                                disabled={field.disabled}
                                readonly={field.readonly}
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                bind:value={formData[componentInstance.id][field.name]}
                            />
                        {:else if field.type === 'date'}
                            <Input
                                type="date"
                                id="{componentInstance.id}-{field.name}"
                                name="{componentInstance.id}-{field.name}"
                                required={field.required}
                                disabled={field.disabled}
                                readonly={field.readonly}
                                bind:value={formData[componentInstance.id][field.name]}
                            />
                        {:else if field.type === 'select'}
                            {#if field.multiple}
                                <select
                                    id="{componentInstance.id}-{field.name}"
                                    name="{componentInstance.id}-{field.name}"
                                    class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required={field.required}
                                    disabled={field.disabled}
                                    multiple
                                    bind:value={formData[componentInstance.id][field.name] as unknown as string[]}
                                >
                                    {#each field.options || [] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                            {:else}
                                <select
                                    id="{componentInstance.id}-{field.name}"
                                    name="{componentInstance.id}-{field.name}"
                                    class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required={field.required}
                                    disabled={field.disabled}
                                    bind:value={formData[componentInstance.id][field.name] as string}
                                >
                                    <option value="">{field.placeholder || `Select ${field.label}`}</option>
                                    {#each field.options || [] as option}
                                        <option value={option}>{option}</option>
                                    {/each}
                                </select>
                            {/if}
                        {/if}

                        {#if field.helperText}
                            <p class="text-sm text-muted-foreground">{field.helperText}</p>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/each}

    <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
    </Button>
</form> 