<script lang="ts">
    import type { FormField } from '../types';
    import { Input } from '@components/ui/input';

    export let field: FormField;
    export let fieldId: string;
    export let value: number | null;
    export let decimalSeparator: ',' | '.' = '.'; // Custom prop for decimal separator

    let inputElement: HTMLInputElement | null = null;
    let displayValue = value?.toString().replace('.', decimalSeparator) || '';

    // Update display value when value prop changes
    $: if (value !== null && value !== undefined) {
        displayValue = value.toString().replace('.', decimalSeparator);
    }

    function handleKeydown(event: KeyboardEvent) {
        const key = event.key;
        const currentValue = (event.target as HTMLInputElement).value;
        
        // Allow control keys
        if ([
            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Home', 'End'
        ].includes(key)) {
            return;
        }

        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        if (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) {
            return;
        }

        // Allow numbers 0-9
        if (/^[0-9]$/.test(key)) {
            return;
        }

        // Allow decimal separator (comma or dot based on prop)
        if (key === decimalSeparator) {
            // Only allow one decimal separator
            if (currentValue.includes(decimalSeparator)) {
                event.preventDefault();
                return;
            }
            return;
        }

        // Allow minus sign only at the beginning
        if (key === '-') {
            const selectionStart = (event.target as HTMLInputElement).selectionStart || 0;
            if (selectionStart === 0 && !currentValue.includes('-')) {
                return;
            }
        }

        // Block all other keys
        event.preventDefault();
    }

    function handleInput(event: Event) {
        const target = event.target as HTMLInputElement;
        let inputValue = target.value;
        
        // Update display value
        displayValue = inputValue;
        
        // Convert to number for the bound value
        if (inputValue === '' || inputValue === '-') {
            value = null;
            return;
        }

        // Replace decimal separator with dot for parsing
        const normalizedValue = inputValue.replace(decimalSeparator, '.');
        const numericValue = parseFloat(normalizedValue);
        
        if (!isNaN(numericValue)) {
            value = numericValue;
        } else {
            value = null;
        }
    }

    function handlePaste(event: ClipboardEvent) {
        event.preventDefault();
        
        const pastedText = event.clipboardData?.getData('text') || '';
        const currentValue = (event.target as HTMLInputElement).value;
        const selectionStart = (event.target as HTMLInputElement).selectionStart || 0;
        const selectionEnd = (event.target as HTMLInputElement).selectionEnd || 0;
        
        // Clean the pasted text to only include valid characters
        let cleanedText = pastedText.replace(/[^0-9\-.,]/g, '');
        
        // Replace comma with the preferred decimal separator
        if (decimalSeparator === ',') {
            cleanedText = cleanedText.replace(/\./g, ',');
        } else {
            cleanedText = cleanedText.replace(/,/g, '.');
        }
        
        // Build the new value
        const beforeSelection = currentValue.substring(0, selectionStart);
        const afterSelection = currentValue.substring(selectionEnd);
        const newValue = beforeSelection + cleanedText + afterSelection;
        
        // Validate the new value
        let validValue = '';
        let hasDecimalSeparator = false;
        let hasMinus = false;
        
        for (let i = 0; i < newValue.length; i++) {
            const char = newValue[i];
            
            if (char === '-' && i === 0 && !hasMinus) {
                validValue += char;
                hasMinus = true;
            } else if (/^[0-9]$/.test(char)) {
                validValue += char;
            } else if (char === decimalSeparator && !hasDecimalSeparator) {
                validValue += char;
                hasDecimalSeparator = true;
            }
        }
        
        // Update the input value
        (event.target as HTMLInputElement).value = validValue;
        displayValue = validValue;
        
        // Convert to number
        if (validValue === '' || validValue === '-') {
            value = null;
        } else {
            const normalizedValue = validValue.replace(decimalSeparator, '.');
            const numericValue = parseFloat(normalizedValue);
            value = !isNaN(numericValue) ? numericValue : null;
        }
    }
</script>

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