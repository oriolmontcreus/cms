export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'dateRange' | 'select' | 'email' | 'password' | 'url' | 'tel' | 'checkbox' | 'radio' | 'toggle' | 'color';

export type PrefixSuffix = string | any; // Can be either a string or an icon component

export interface FormField {
    type: FieldType;
    label: string;
    name: string;
    required?: boolean;
    placeholder?: string;
    options?: string[]; // For select/radio fields
    min?: number; // For text/textarea (min length) or number (min value)
    max?: number; // For text/textarea (max length) or number (max value)
    step?: number; // For number fields
    decimalSeparator?: ',' | '.'; // For number fields - decimal separator preference
    allowDecimals?: boolean; // For number fields - whether decimal values are allowed
    multiple?: boolean; // For select fields
    disabled?: boolean;
    readonly?: boolean;
    pattern?: string; // For text validation
    helperText?: string; // Additional help text
    searchable?: boolean; // For searchable select fields
    prefix?: PrefixSuffix; // Prefix icon or text
    suffix?: PrefixSuffix; // Suffix icon or text
    // Textarea-specific options
    rows?: number; // For textarea fields - number of visible rows
    resizable?: boolean; // For textarea fields - whether it can be resized (default: true)
    // Date-specific formatting options
    locale?: string; // For date fields (e.g., 'en-US', 'es-ES')
    weekdayFormat?: 'short' | 'long' | 'narrow'; // For date fields
    yearFormat?: 'numeric' | '2-digit'; // For date fields
    monthFormat?: 'numeric' | '2-digit' | 'short' | 'long' | 'narrow'; // For date fields
    dateStyle?: 'full' | 'long' | 'medium' | 'short'; // For date fields display style
    // Date range constraints
    minDate?: string; // For date fields - minimum selectable date (ISO string format)
    maxDate?: string; // For date fields - maximum selectable date (ISO string format)
}

export interface Component {
    name: string;
    fields: FormField[];
    validate?: (data: Record<string, any>) => string[];
    transform?: (data: Record<string, any>) => Record<string, any>;
}

export interface ComponentInstance {
    component: Component;
    id: string; // Unique identifier for this instance
    displayName?: string; // Optional custom display name for this instance
}

export interface PageConfig {
    title: string;
    slug: string;
    components: ComponentInstance[];
}

export interface FormData {
    [componentId: string]: {
        [fieldName: string]: any;
    };
} 