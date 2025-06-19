<!-- FormBuilder.svelte -->
<script lang="ts">
    import type { PageConfig, FormData } from './types';
    import { Button } from '@components/ui/button';
    import { Input } from '@components/ui/input';
    import { Label } from '@components/ui/label';
    import { Textarea } from '@components/ui/textarea';

    export let config: PageConfig;
    export let onSubmit: (data: FormData) => void;

    let formData: FormData = {};

    function handleSubmit() {
        onSubmit(formData);
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

                {/if}
            </div>
        {/each}
    </div>

    <Button type="submit">Save Changes</Button>
</form> 