export interface FormField {
    type: 'text' | 'textarea' | 'number' | 'date' | 'select';
    label: string;
    name: string;
    required?: boolean;
    placeholder?: string;
    options?: string[]; // For select fields
    min?: number; // For text/textarea (min length) or number (min value)
    max?: number; // For text/textarea (max length) or number (max value)
    step?: number; // For number fields
    multiple?: boolean; // For select fields
    disabled?: boolean;
    readonly?: boolean;
    pattern?: string; // For text validation
    helperText?: string; // Additional help text
}

export interface PageConfig {
    title: string;
    slug: string;
    fields: FormField[];
}

export interface FormData {
    [key: string]: string | number | Date | null;
} 