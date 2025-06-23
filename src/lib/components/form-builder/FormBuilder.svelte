<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { handleUpdateComponents } from '@/services/page.service';
    import type { Component } from '@shared/types/pages.type';
    import FormField from './FormField.svelte';

    export let config: PageConfig;
    export let slug: string;
    export let components: Component[] = [];

    let formData: FormData = {};
    
    // Initialize form data
    config.components.forEach(componentInstance => {
        formData[componentInstance.id] = {};
        const existingComponent = components.find(c => c.instanceId === componentInstance.id);
        
        componentInstance.component.fields.forEach(field => {
            const existingValue = existingComponent?.formData[field.name];
            if (existingValue !== undefined) {
                formData[componentInstance.id][field.name] = existingValue;
            } else {
                formData[componentInstance.id][field.name] = field.type === 'number' ? null :
                    field.type === 'select' && field.multiple ? [] :
                    field.type === 'toggle' ? false :
                    field.type === 'dateRange' ? { start: '', end: '' } :
                    field.type === 'color' ? '#000000' :
                    field.type === 'richtext' ? '' : '';
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
</script>

<form class="space-y-8" on:submit|preventDefault={handleSubmit}>
    {#each config.components as componentInstance (componentInstance.id)}
        <div class="space-y-6 p-6 border rounded-lg">
            <h3 class="text-lg font-semibold">
                {componentInstance.displayName || componentInstance.component.name}
            </h3>
            
            <div class="space-y-4">
                {#each componentInstance.component.fields as field (field.name)}
                    <FormField 
                        {field}
                        fieldId="{componentInstance.id}-{field.name}"
                        bind:value={formData[componentInstance.id][field.name]}
                    />
                {/each}
            </div>
        </div>
    {/each}

    <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
    </Button>
</form> 