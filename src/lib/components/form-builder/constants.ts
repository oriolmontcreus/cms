export const SCHEMA_TYPES = {
    GRID: 'grid',
    TABS: 'tabs',
    TABS_CONTAINER: 'tabs-container',
    TABS_SELECTOR: 'tabs-selector'
} as const;

export const FIELD_TYPES = {
    NUMBER: 'number',
    SELECT: 'select',
    TOGGLE: 'toggle',
    DATE_RANGE: 'dateRange',
    COLOR: 'color',
    RICHTEXT: 'richtext'
} as const;

export const DEFAULT_VALUES = {
    COLOR: '#000000',
    DATE_RANGE: { start: '', end: '' },
    EMPTY_STRING: '',
    NULL: null,
    FALSE: false,
    EMPTY_ARRAY: [] as any[]
} as const;

export const CSS_CLASSES = {
    FORM_CONTAINER: 'space-y-8',
    COMPONENT_CONTAINER: 'space-y-6 p-2 sm:p-6 sm:border rounded-lg bg-card/50 dark:bg-card/20',
    COMPONENT_TITLE: 'text-lg font-light text-muted-foreground',
    FIELD_CONTAINER: 'space-y-6',
    FIELD_CONTAINER_WITH_MARGIN: 'space-y-6 mb-6',
    FLEX_COLUMN_GAP: 'flex flex-col gap-4',
    GRID_CONTAINER: 'grid gap-4',
    TABS_CONTAINER: 'w-full',
    TABS_LIST: 'flex flex-wrap gap-2',
    TABS_CONTENT: 'mt-6',
    LABEL: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    HELPER_TEXT: 'text-sm text-muted-foreground mt-1'
} as const; 