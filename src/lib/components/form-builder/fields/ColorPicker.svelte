<script lang="ts">
    import type { FormField } from '../types';
    import { Input } from '@components/ui/input';
    import { Button } from '@components/ui/button';
    import * as Popover from '@components/ui/popover';
    import { cn } from '$lib/utils';
    import Palette from '@lucide/svelte/icons/palette';

    interface Props {
        field: FormField;
        fieldId: string;
        value: string;
    }

    let { field, fieldId, value = $bindable() }: Props = $props();

    const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const COLOR_PALETTE = [
        '#000000', '#FFFFFF', '#F3F4F6', '#6B7280', '#374151',
        '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
        '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
        '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF'
    ];

    const isValidColor = $derived(value && typeof value === 'string' && HEX_REGEX.test(value));
    const isDisabled = $derived(field.disabled || field.readonly);
    const displayValue = $derived(typeof value === 'string' ? value : '');
    const shouldShowValidation = $derived(value && typeof value === 'string' && !isValidColor);

    $effect(() => {
        // Reset non-string values to prevent CSS errors
        if (value && typeof value !== 'string') {
            console.warn('ColorPicker received non-string value:', value, 'Resetting to empty string');
            value = '';
            return;
        }
        
        if (value && typeof value === 'string' && !value.startsWith('#')) value = '#' + value;
    });

    function normalizeHexValue(inputValue: string): string {
        return inputValue && !inputValue.startsWith('#') ? '#' + inputValue : inputValue;
    }

    function handleColorSelect(color: string) {
        if (!isDisabled) value = color;
    }

    function handleInputChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (!target) return;
        
        const normalizedValue = normalizeHexValue(target.value);
        if (!normalizedValue || HEX_REGEX.test(normalizedValue)) {
            value = normalizedValue;
        }
    }

    // Safe color value for CSS - only use if it's a valid color string
    const safeColorValue = $derived(isValidColor && typeof value === 'string' ? value : null);
</script>

<div class="space-y-2">
    <div class="flex gap-2">
        <div class="relative flex-1">
            <Input
                type="text"
                id={fieldId}
                name={fieldId}
                placeholder={field.placeholder || '#000000'}
                required={field.required}
                disabled={field.disabled}
                readonly={field.readonly}
                value={displayValue}
                oninput={handleInputChange}
                class={cn("pr-12", shouldShowValidation && "border-destructive focus-visible:ring-destructive")}
            />
            
            <!-- Color preview -->
            <div 
                class={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-6 rounded border border-border",
                    !isValidColor && "bg-muted"
                )}
                style={safeColorValue ? `background-color: ${safeColorValue}` : ''}
            >
                {#if !isValidColor}
                    <div class="w-full h-full flex items-center justify-center">
                        <Palette class="w-3 h-3 text-muted-foreground" />
                    </div>
                {/if}
            </div>
        </div>
        
        <!-- Color picker popover -->
        <Popover.Root>
            <Popover.Trigger>
                <Button 
                    variant="outline" 
                    size="icon"
                    disabled={isDisabled}
                    type="button"
                    aria-label="Open color picker"
                >
                    <Palette class="w-4 h-4" />
                </Button>
            </Popover.Trigger>
            <Popover.Content class="w-64 p-4">
                <div class="space-y-3">
                    <h4 class="text-sm font-medium select-none">Choose a color</h4>
                    <div class="grid grid-cols-5 gap-2">
                        {#each COLOR_PALETTE as color}
                            <button
                                type="button"
                                class={cn(
                                    "w-8 h-8 rounded border-2 transition-all cursor-pointer",
                                    isDisabled ? "opacity-50 cursor-not-allowed" : "hover:scale-110",
                                    safeColorValue === color ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                                )}
                                style="background-color: {color}"
                                onclick={() => handleColorSelect(color)}
                                title={color}
                                aria-label="Select color {color}"
                                disabled={isDisabled}
                            >
                            </button>
                        {/each}
                    </div>
                    
                    <!-- Native color input for advanced color picking -->
                    <div class="pt-2 border-t">
                        <label for="{fieldId}-advanced" class="text-xs text-muted-foreground mb-1 block select-none">
                            More options:
                        </label>
                        <input
                            id="{fieldId}-advanced"
                            type="color"
                            value={safeColorValue || '#000000'}
                            onchange={(e) => {
                                const colorInput = e.target as HTMLInputElement;
                                if (colorInput) handleColorSelect(colorInput.value);
                            }}
                            class={cn(
                                "w-full h-8 rounded border border-border",
                                isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                            )}
                            disabled={isDisabled}
                        />
                    </div>
                </div>
            </Popover.Content>
        </Popover.Root>
    </div>
    
    {#if shouldShowValidation}
        <p class="text-sm text-destructive">Please enter a valid hex color (e.g., #FF0000 or #F00)</p>
    {/if}
</div> 