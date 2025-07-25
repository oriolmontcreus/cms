<script lang="ts">
    import type { FormField } from '../types';
    import CalendarIcon from "@lucide/svelte/icons/calendar";
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import {
        DateFormatter,
        type DateValue,
        getLocalTimeZone,
        parseDate,
        today
    } from "@internationalized/date";
    import { cn } from "$lib/utils.js";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import { type DateRange, DateRangePicker } from 'bits-ui';
    import { CMS_LOCALE } from "@/lib/shared/env";

    interface Props {
        field: FormField;
        fieldId: string;
        value: { start: string; end: string };
    }

    let { field, fieldId, value = $bindable() }: Props = $props();

    const df = new DateFormatter(field.locale || CMS_LOCALE, {
        dateStyle: field.dateStyle || "long"
    });

    let now = today(getLocalTimeZone());

    // Convert the string values to DateRange format
    let dateRange = $derived.by(() => {
        const range: DateRange = { start: undefined, end: undefined };
        
        if (value?.start) {
            try {
                range.start = parseDate(value.start);
            } catch {
                // Invalid date format
            }
        }
        
        if (value?.end) {
            try {
                range.end = parseDate(value.end);
            } catch {
                // Invalid date format
            }
        }
        
        return range;
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

    function handleDateRangeChange(newRange: DateRange) {
        value = {
            start: newRange.start ? newRange.start.toString() : '',
            end: newRange.end ? newRange.end.toString() : ''
        };
    }
</script>

<div class="w-full">
    <DateRangePicker.Root
        locale={field.locale || CMS_LOCALE}
        value={dateRange}
        onValueChange={handleDateRangeChange}
        weekdayFormat={field.weekdayFormat || "short"}
        fixedWeeks={true}
        disabled={field.disabled || field.readonly}
        minValue={minDateValue}
        maxValue={maxDateValue}
        isDateUnavailable={isDateUnavailable}
        class="*:not-first:mt-2"
    >
        <DateRangePicker.Trigger
            class={cn(
                buttonVariants({
                    variant: "outline",
                    class: "w-full justify-start text-left font-normal"
                }),
                !dateRange.start && !dateRange.end && "text-muted-foreground",
                field.disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={field.disabled || field.readonly}
            id={fieldId}
            name={fieldId}
        >
            <CalendarIcon class="mr-2 h-4 w-4" />
            {#if dateRange.start && dateRange.end}
                {df.format(dateRange.start.toDate(getLocalTimeZone()))} - {df.format(dateRange.end.toDate(getLocalTimeZone()))}
            {:else if dateRange.start}
                {df.format(dateRange.start.toDate(getLocalTimeZone()))} - ...
            {:else}
                {field.placeholder || "Pick a date range"}
            {/if}
        </DateRangePicker.Trigger>

        <DateRangePicker.Content
            class="border-input bg-background text-foreground z-50 rounded-lg border shadow-lg shadow-black/[.04] outline-hidden"
        >
            <DateRangePicker.Calendar class="w-fit p-2">
                {#snippet children({ months, weekdays })}
                    <header class="flex w-full items-center gap-1 pb-1">
                        <DateRangePicker.PrevButton
                            class="text-muted-foreground/80 ring-offset-background hover:bg-accent hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-shadow"
                        >
                            <ChevronLeft size={16} />
                        </DateRangePicker.PrevButton>
                        <DateRangePicker.Heading class="grow text-center text-sm font-medium" />
                        <DateRangePicker.NextButton
                            class="text-muted-foreground/80 ring-offset-background hover:bg-accent hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-shadow"
                        >
                            <ChevronRight size={16} />
                        </DateRangePicker.NextButton>
                    </header>

                    <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                        {#each months as month (month.value)}
                            <DateRangePicker.Grid class="w-fit border-collapse space-y-1 select-none">
                                <DateRangePicker.GridHead>
                                    <DateRangePicker.GridRow class="flex w-full justify-between">
                                        {#each weekdays as day (day)}
                                            <DateRangePicker.HeadCell
                                                class="text-muted-foreground/80 size-9 rounded-lg p-0 text-xs font-medium"
                                            >
                                                {day.slice(0, 2)}
                                            </DateRangePicker.HeadCell>
                                        {/each}
                                    </DateRangePicker.GridRow>
                                </DateRangePicker.GridHead>

                                <DateRangePicker.GridBody class="[&_td]:px-0">
                                    {#each month.weeks as weekDates (weekDates.join('-'))}
                                        <DateRangePicker.GridRow class="flex w-full">
                                            {#each weekDates as date (date.day)}
                                                <DateRangePicker.Cell
                                                    {date}
                                                    month={month.value}
                                                    class={cn(
                                                        "text-foreground ring-offset-background data-focus-visible:border-ring hover:bg-accent data-selected:bg-accent hover:text-foreground data-selected:text-foreground data-focus-visible:ring-ring/30 data-invalid:data-selection-end:[&:not([data-hover])]:bg-destructive data-invalid:data-selection-start:[&:not([data-hover])]:bg-destructive data-selection-end:[&:not([data-hover])]:bg-primary data-selection-start:[&:not([data-hover])]:bg-primary data-invalid:data-selection-end:[&:not([data-hover])]:text-destructive-foreground data-invalid:data-selection-start:[&:not([data-hover])]:text-destructive-foreground data-selection-end:[&:not([data-hover])]:text-primary-foreground data-selection-start:[&:not([data-hover])]:text-primary-foreground relative flex size-9 items-center justify-center rounded-lg border border-transparent p-0 text-sm font-normal whitespace-nowrap [transition-property:border-radius,box-shadow] duration-150 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-30 data-focus-visible:z-10 data-focus-visible:ring-2 data-focus-visible:ring-offset-2 data-focus-visible:outline-hidden data-invalid:bg-red-100 data-selected:rounded-none data-selection-end:rounded-e-lg data-selection-start:rounded-s-lg data-unavailable:pointer-events-none data-unavailable:line-through data-unavailable:opacity-30",
                                                        date.compare(now) === 0 &&
                                                            "after:bg-primary data-selection-end:[&:not([data-hover])]:after:bg-background data-selection-start:[&:not([data-hover])]:after:bg-background after:pointer-events-none after:absolute after:start-1/2 after:bottom-1 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full"
                                                    )}
                                                >
                                                    <DateRangePicker.Day
                                                        class={cn(
                                                            "text-foreground ring-offset-background relative flex size-9 items-center justify-center rounded-lg border border-transparent p-0 text-sm font-normal whitespace-nowrap [transition-property:border-radius,box-shadow] duration-150",
                                                            "disabled:pointer-events-none data-outside-month:pointer-events-none",
                                                            "data-highlighted:bg-accent data-selected:bg-accent",
                                                            "data-selection-end:bg-primary data-selection-start:bg-primary",
                                                            "data-selection-end:text-primary-foreground data-selection-start:text-primary-foreground",
                                                            "data-highlighted:rounded-none data-selection-end:rounded-e-lg data-selection-start:rounded-s-lg",
                                                            "focus-visible:ring-ring/30 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                                        )}
                                                    >
                                                        <div
                                                            class="bg-primary data-selected:bg-background absolute start-1/2 bottom-1 hidden size-[3px] -translate-x-1/2 rounded-full transition-all group-data-today:block"
                                                        ></div>
                                                        {date.day}
                                                    </DateRangePicker.Day>
                                                </DateRangePicker.Cell>
                                            {/each}
                                        </DateRangePicker.GridRow>
                                    {/each}
                                </DateRangePicker.GridBody>
                            </DateRangePicker.Grid>
                        {/each}
                    </div>
                {/snippet}
            </DateRangePicker.Calendar>
        </DateRangePicker.Content>
    </DateRangePicker.Root>
</div> 