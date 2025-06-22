<script lang="ts">
    import type { FormField } from '../types';
    import CalendarIcon from "@lucide/svelte/icons/calendar";
    import {
        DateFormatter,
        type DateValue,
        getLocalTimeZone,
        parseDate
    } from "@internationalized/date";
    import { cn } from "$lib/utils.js";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import { Calendar } from "$lib/components/ui/calendar/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { CMS_LOCALE } from "@shared/env";

    interface Props {
        field: FormField;
        fieldId: string;
        value: string;
    }

    let { field, fieldId, value = $bindable() }: Props = $props();

    const df = new DateFormatter(field.locale || CMS_LOCALE, {
        dateStyle: field.dateStyle || "long"
    });

    let contentRef = $state<HTMLElement | null>(null);

    // Derive dateValue from the string value without causing loops
    let dateValue = $derived.by(() => {
        if (value && typeof value === 'string') {
            try {
                return parseDate(value);
            } catch {
                return undefined;
            }
        }
        return undefined;
    });

    // Convert min/max date strings to DateValue objects
    let minDateValue = $derived.by(() => {
        if (field.minDate) {
            try {
                return parseDate(field.minDate);
            } catch {
                return undefined;
            }
        }
        return undefined;
    });

    let maxDateValue = $derived.by(() => {
        if (field.maxDate) {
            try {
                return parseDate(field.maxDate);
            } catch {
                return undefined;
            }
        }
        return undefined;
    });

    // Function to determine if a date should be unavailable
    const isDateUnavailable = (date: DateValue) => {
        if (minDateValue && date.compare(minDateValue) < 0) return true;
        if (maxDateValue && date.compare(maxDateValue) > 0) return true;
        return false;
    };

    function handleDateChange(newDate: DateValue | undefined) {
        value = newDate ? newDate.toString() : '';
    }
</script>

<div class="w-full">
    <Popover.Root>
        <Popover.Trigger
            class={cn(
                buttonVariants({
                    variant: "outline",
                    class: "w-full justify-start text-left font-normal"
                }),
                !dateValue && "text-muted-foreground",
                field.disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={field.disabled || field.readonly}
            id={fieldId}
            name={fieldId}
        >
            <CalendarIcon class="mr-2 h-4 w-4" />
            {dateValue ? df.format(dateValue.toDate(getLocalTimeZone())) : (field.placeholder || "Pick a date")}
        </Popover.Trigger>
        <Popover.Content bind:ref={contentRef} class="w-auto p-0">
            <Calendar 
                type="single" 
                value={dateValue}
                onValueChange={handleDateChange}
                disabled={field.disabled || field.readonly}
                locale={field.locale || "en-US"}
                weekdayFormat={field.weekdayFormat || "short"}
                yearFormat={field.yearFormat || "numeric"}
                monthFormat={field.monthFormat || "long"}
                minValue={minDateValue}
                maxValue={maxDateValue}
                isDateUnavailable={isDateUnavailable}
                fixedWeeks={true}
            />
        </Popover.Content>
    </Popover.Root>
</div> 