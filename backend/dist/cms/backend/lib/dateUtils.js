export function formatTimestamp(date) {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}
export function getStartOfDay(date) {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
}
export function getDateRange(days) {
    const endDate = new Date();
    const startDate = getStartOfDay(new Date());
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate };
}
export function formatDateKey(date) {
    return date.toISOString().split('T')[0];
}
export function* dateIterator(startDate, endDate) {
    for (const d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        yield new Date(d);
    }
}
