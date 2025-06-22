<script lang="ts">
    import type { FormField } from '../types';
    import { Input } from '@components/ui/input';

    export let field: FormField;
    export let fieldId: string;
    export let value: string;
</script>

<Input
    type="date"
    id={fieldId}
    name={fieldId}
    required={field.required}
    disabled={field.disabled}
    readonly={field.readonly}
    bind:value
/> 