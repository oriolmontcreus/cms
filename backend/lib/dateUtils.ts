export function formatTimestamp(date: Date): string {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

export function getStartOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}

export function getDateRange(days: number): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = getStartOfDay(new Date());
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate };
}

export function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function* dateIterator(startDate: Date, endDate: Date): Generator<Date> {
    for (const d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        yield new Date(d);
    }
}
