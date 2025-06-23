<script lang="ts">
    import type { FormField } from '../types';
    import { Input } from '@components/ui/input';

    export let field: FormField;
    export let fieldId: string;
    export let value: number | null;
    export let decimalSeparator: ',' | '.' = '.';
    
    const allowDecimals = field.allowDecimals ?? true;
    const minValue = field.min;
    const maxValue = field.max;
    const showMaxHint = maxValue !== undefined;

    const CONTROL_KEYS = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
    ];
    
    const CTRL_KEYS = ['a', 'c', 'v', 'x', 'z'];
    const NUMBER_REGEX = /^[0-9]$/;
    const VALID_CHARS_REGEX = /[^0-9\-.,]/g;

    let inputElement: HTMLInputElement | null = null;
    let displayValue = value?.toString().replace('.', decimalSeparator) || '';

    $: if (value !== null && value !== undefined) {
        displayValue = value.toString().replace('.', decimalSeparator);
    }

    function isValueInRange(numericValue: number): boolean {
        if (minValue !== undefined && numericValue < minValue) return false;
        if (maxValue !== undefined && numericValue > maxValue) return false;
        return true;
    }

    function handleKeydown(event: KeyboardEvent) {
        const { key, ctrlKey, target } = event;
        const currentValue = (target as HTMLInputElement).value;
        const selectionStart = (target as HTMLInputElement).selectionStart || 0;
        const selectionEnd = (target as HTMLInputElement).selectionEnd || 0;
        
        if (CONTROL_KEYS.includes(key)) return;
        if (ctrlKey && CTRL_KEYS.includes(key.toLowerCase())) return;
        
        // For number keys, check if adding this digit would exceed max value
        if (NUMBER_REGEX.test(key)) {
            const beforeSelection = currentValue.substring(0, selectionStart);
            const afterSelection = currentValue.substring(selectionEnd);
            const newValue = beforeSelection + key + afterSelection;
            
            if (newValue !== '' && newValue !== '-') {
                const normalizedValue = newValue.replace(decimalSeparator, '.');
                const numericValue = parseFloat(normalizedValue);
                
                if (!isNaN(numericValue) && !isValueInRange(numericValue)) {
                    event.preventDefault();
                    return;
                }
            }
            return;
        }
        
        if (key === decimalSeparator && allowDecimals) {
            if (currentValue.includes(decimalSeparator)) {
                event.preventDefault();
                return;
            }
            return;
        }
        
        if (key === '-' && selectionStart === 0 && !currentValue.includes('-')) {
            // Check if negative values are allowed based on min value
            if (minValue !== undefined && minValue >= 0) {
                event.preventDefault();
                return;
            }
            return;
        }
        
        event.preventDefault();
    }

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        const inputValue = target.value;
        
        if (inputValue === '' || inputValue === '-') {
            displayValue = inputValue;
            value = null;
            return;
        }

        const normalizedValue = inputValue.replace(decimalSeparator, '.');
        const numericValue = parseFloat(normalizedValue);
        
        if (!isNaN(numericValue)) {
            if (isValueInRange(numericValue)) {
                displayValue = inputValue;
                value = numericValue;
            } else {
                // Revert to previous valid value
                target.value = displayValue;
            }
        } else {
            displayValue = inputValue;
            value = null;
        }
    }

    function buildValidValue(newValue: string): string {
        let validValue = '';
        let hasDecimalSeparator = false;
        let hasMinus = false;
        
        for (let i = 0; i < newValue.length; i++) {
            const char = newValue[i];
            
            if (char === '-' && i === 0 && !hasMinus) {
                // Only allow minus if min value allows negative numbers
                if (minValue === undefined || minValue < 0) {
                    validValue += char;
                    hasMinus = true;
                }
            } else if (NUMBER_REGEX.test(char)) {
                validValue += char;
            } else if (char === decimalSeparator && !hasDecimalSeparator && allowDecimals) {
                validValue += char;
                hasDecimalSeparator = true;
            }
        }
        
        return validValue;
    }

    function updateValueFromString(validValue: string) {
        if (validValue === '' || validValue === '-') {
            value = null;
        } else {
            const normalizedValue = validValue.replace(decimalSeparator, '.');
            const numericValue = parseFloat(normalizedValue);
            if (!isNaN(numericValue) && isValueInRange(numericValue)) {
                value = numericValue;
            } else {
                value = null;
            }
        }
    }

    function handlePaste(event: ClipboardEvent) {
        event.preventDefault();
        
        const pastedText = event.clipboardData?.getData('text') || '';
        const target = event.target as HTMLInputElement;
        const currentValue = target.value;
        const selectionStart = target.selectionStart ?? 0;
        const selectionEnd = target.selectionEnd ?? 0;
        
        let cleanedText = pastedText.replace(VALID_CHARS_REGEX, '');
        
        if (allowDecimals) {
            cleanedText = decimalSeparator === ',' 
                ? cleanedText.replace(/\./g, ',')
                : cleanedText.replace(/,/g, '.');
        } else {
            cleanedText = cleanedText.replace(/[.,]/g, '');
        }
        
        const beforeSelection = currentValue.substring(0, selectionStart);
        const afterSelection = currentValue.substring(selectionEnd);
        const newValue = beforeSelection + cleanedText + afterSelection;
        
        const validValue = buildValidValue(newValue);
        
        // Check if the pasted value is within range
        if (validValue !== '' && validValue !== '-') {
            const normalizedValue = validValue.replace(decimalSeparator, '.');
            const numericValue = parseFloat(normalizedValue);
            
            if (!isNaN(numericValue) && !isValueInRange(numericValue)) {
                // Don't paste if it would exceed the range
                return;
            }
        }
        
        target.value = validValue;
        displayValue = validValue;
        updateValueFromString(validValue);
    }
</script>

{#if showMaxHint}
    <div class="relative">
        <Input
            bind:ref={inputElement}
            type="text"
            id={fieldId}
            name={fieldId}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled}
            readonly={field.readonly}
            value={displayValue}
            class="peer pe-16"
            onkeydown={handleKeydown}
            oninput={handleInput}
            onpaste={handlePaste}
        />
        <span
            class="text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-sm peer-disabled:opacity-50"
        >
            /{maxValue}
        </span>
    </div>
{:else}
    <Input
        bind:ref={inputElement}
        type="text"
        id={fieldId}
        name={fieldId}
        placeholder={field.placeholder}
        required={field.required}
        disabled={field.disabled}
        readonly={field.readonly}
        value={displayValue}
        onkeydown={handleKeydown}
        oninput={handleInput}
        onpaste={handlePaste}
    />
{/if} 