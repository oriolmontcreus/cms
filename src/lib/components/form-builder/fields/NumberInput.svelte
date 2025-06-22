<script lang="ts">
    import type { FormField } from '../types';
    import { Input } from '@components/ui/input';

    export let field: FormField;
    export let fieldId: string;
    export let value: number | null;
</script>

<Input
    type="number"
    id={fieldId}
    name={fieldId}
    placeholder={field.placeholder}
    required={field.required}
    disabled={field.disabled}
    readonly={field.readonly}
    min={field.min}
    max={field.max}
    step={field.step}
    bind:value
/> 