import type { Page } from "@/lib/shared/types/pages.type";
import type { FormField, SchemaItem, FieldType } from "@/lib/components/form-builder/types";
import { getPageConfig } from "@/lib/page-registry";
import { convertToFormField } from "@/lib/components/form-builder/utils/formHelpers";

// Utility function to find field config in a schema recursively
function findFieldInSchema(schema: SchemaItem[], fieldName: string): FormField | null {
    for (const item of schema) {
        // Check if this item is the field we're looking for
        const field = convertToFormField(item);
        if (field && field.name === fieldName) {
            return field;
        }

        // Recursively search in nested structures
        if (item && typeof item === 'object') {
            // Check tabs container
            if ('tabs' in item && Array.isArray(item.tabs)) {
                for (const tab of item.tabs) {
                    if (tab.schema) {
                        const found = findFieldInSchema(tab.schema, fieldName);
                        if (found) return found;
                    }
                }
            }

            // Check grid layouts
            if ('schema' in item && Array.isArray(item.schema)) {
                const found = findFieldInSchema(item.schema, fieldName);
                if (found) return found;
            }
        }
    }
    return null;
}

export const WizardStep = {
    SELECT_MODE: "select-mode",
    SELECT_LANGUAGE: "select-language",
    SELECT_CONTENT: "select-content",
    TRANSLATE: "translate",
    COMPLETE: "complete"
} as const;

export type WizardStepType = (typeof WizardStep)[keyof typeof WizardStep];

export type SelectedMode = "fill-missing" | "review-existing" | null;

export interface TranslatableItemBase {
    type: "page" | "global";
    fieldName: string;
    originalValue: any;
    currentTranslation: string;
    componentId: string; // page component instanceId or 'global-variables'
    fieldType?: FieldType; // The field type (input, textarea, richEditor, tagsInput, etc.)
    fieldConfig?: Partial<FormField>; // Field configuration for rendering
}

export interface PageTranslatableItem extends TranslatableItemBase {
    type: "page";
    pageId: string;
    pageTitle: string;
    componentName: string;
}

export interface GlobalTranslatableItem extends TranslatableItemBase {
    type: "global";
}

export type TranslatableItem = PageTranslatableItem | GlobalTranslatableItem;

interface GlobalVariablesLike {
    formData?: Record<string, any> & { translations?: Record<string, any> };
}

export function buildTranslatableItems(params: {
    selectedPages: string[];
    pages: Page[];
    selectedMode: SelectedMode;
    selectedLocale: string | null;
    includeGlobalVariables: boolean;
    globalVariables: GlobalVariablesLike | null;
}): TranslatableItem[] {
    const {
        selectedPages,
        pages,
        selectedMode,
        selectedLocale,
        includeGlobalVariables,
        globalVariables
    } = params;

    if (!selectedLocale || !selectedMode) return [];

    const items: TranslatableItem[] = [];

    selectedPages.forEach(pageId => {
        const selectedPage = pages.find(p => p._id === pageId);
        if (!selectedPage?.components) return;

        selectedPage.components.forEach(component => {
            if (!component.formData) return;

            // Get the page config to access component schema
            const pageConfig = getPageConfig(selectedPage.slug);
            const componentConfig = pageConfig?.components.find(c => c.id === component.instanceId);

            // Simple approach: check what fields actually have translation data
            // If a field has any translations, it's translatable
            const allLocales = component.formData.translations ? Object.keys(component.formData.translations) : [];
            const translatableFieldNames = new Set<string>();

            // Find fields that have translations in any locale
            allLocales.forEach(locale => {
                const localeTranslations = component.formData.translations?.[locale];
                if (localeTranslations) {
                    Object.keys(localeTranslations).forEach(fieldName => {
                        translatableFieldNames.add(fieldName);
                    });
                }
            });

            // If no existing translations, treat all non-translation fields as potentially translatable
            // (this handles the first-time translation case)
            if (translatableFieldNames.size === 0) {
                Object.keys(component.formData).forEach(fieldName => {
                    if (fieldName !== "translations") {
                        translatableFieldNames.add(fieldName);
                    }
                });
            }

            translatableFieldNames.forEach(fieldName => {
                if (fieldName === "translations") return;
                if (!component.formData[fieldName]) return; // Skip empty fields

                const currentValue = component.formData[fieldName];
                const existingTranslation = component.formData.translations?.[selectedLocale]?.[fieldName];

                // Find field configuration from schema
                let fieldConfig: FormField | null = null;
                if (componentConfig?.component?.schema) {
                    fieldConfig = findFieldInSchema(componentConfig.component.schema, fieldName);
                }

                const baseItem = {
                    type: "page" as const,
                    pageTitle: selectedPage.config?.title || selectedPage.slug,
                    componentName: component.componentName,
                    fieldName,
                    originalValue: currentValue,
                    componentId: component.instanceId,
                    pageId: selectedPage._id,
                    fieldType: (fieldConfig?.type || "text") as FieldType,
                    fieldConfig: fieldConfig ? {
                        type: fieldConfig.type,
                        label: fieldConfig.label,
                        placeholder: fieldConfig.placeholder,
                        required: fieldConfig.required,
                        min: fieldConfig.min,
                        max: fieldConfig.max,
                        options: fieldConfig.options,
                        schema: fieldConfig.schema
                    } : undefined
                };

                if (selectedMode === "fill-missing" && !existingTranslation) {
                    items.push({
                        ...baseItem,
                        currentTranslation: ""
                    });
                } else if (selectedMode === "review-existing" && existingTranslation) {
                    items.push({
                        ...baseItem,
                        currentTranslation: existingTranslation
                    });
                }
            });
        });
    });

    if (includeGlobalVariables && globalVariables?.formData) {
        Object.keys(globalVariables.formData).forEach(fieldName => {
            if (fieldName === "translations") return;
            const currentValue = globalVariables.formData![fieldName];
            const existingTranslation = globalVariables.formData!.translations?.[selectedLocale]?.[fieldName];

            // For global variables, we'll default to text type since we don't have schema access
            const baseItem = {
                type: "global" as const,
                fieldName,
                originalValue: currentValue,
                componentId: "global-variables",
                fieldType: "text" as FieldType, // Default to text for global variables
                fieldConfig: {
                    type: "text" as FieldType,
                    label: fieldName,
                    placeholder: `Enter ${fieldName}...`
                }
            };

            if (selectedMode === "fill-missing" && !existingTranslation) {
                items.push({
                    ...baseItem,
                    currentTranslation: ""
                });
            } else if (selectedMode === "review-existing" && existingTranslation) {
                items.push({
                    ...baseItem,
                    currentTranslation: existingTranslation
                });
            }
        });
    }

    return items;
}

// Persist translations for global variables & pages
export async function persistTranslations(params: {
    translatableItems: TranslatableItem[];
    selectedLocale: string;
    pages: Page[];
    globalVariables: GlobalVariablesLike | null;
}): Promise<void> {
    const { translatableItems, selectedLocale, pages, globalVariables } = params;

    const pageUpdates: Record<string, any> = {};
    let globalVariablesUpdate: any = null;

    translatableItems.forEach(item => {
        // Handle different data types for validation
        const isEmpty = () => {
            if (item.currentTranslation === undefined || item.currentTranslation === null) {
                return true;
            }

            // For strings, check if empty or just whitespace
            if (typeof item.currentTranslation === 'string') {
                return item.currentTranslation.trim() === '';
            }

            // For arrays (like TagsInput), check if empty
            if (Array.isArray(item.currentTranslation)) {
                return (item.currentTranslation as any[]).length === 0;
            }

            // For other types (numbers, booleans, objects), consider them valid if they exist
            return false;
        };

        if (isEmpty()) {
            return;
        }

        if (item.type === "global") {
            if (!globalVariablesUpdate) globalVariablesUpdate = { translations: {} };
            if (!globalVariablesUpdate.translations[selectedLocale]) {
                globalVariablesUpdate.translations[selectedLocale] = {};
            }
            globalVariablesUpdate.translations[selectedLocale][item.fieldName] = item.currentTranslation;
        } else {
            const pageId = item.pageId;
            if (!pageUpdates[pageId]) pageUpdates[pageId] = {};
            if (!pageUpdates[pageId][item.componentId]) {
                pageUpdates[pageId][item.componentId] = { translations: {} };
            }
            if (!pageUpdates[pageId][item.componentId].translations[selectedLocale]) {
                pageUpdates[pageId][item.componentId].translations[selectedLocale] = {};
            }
            pageUpdates[pageId][item.componentId].translations[selectedLocale][item.fieldName] = item.currentTranslation;
        }
    });

    // Save global variables
    if (globalVariablesUpdate && globalVariables) {
        const { updateGlobalVariables } = await import("@/services/globalVariables.service");
        const updatedData = {
            ...globalVariables.formData,
            translations: {
                ...globalVariables.formData?.translations,
                ...globalVariablesUpdate.translations
            }
        };
        await updateGlobalVariables(updatedData);
    }

    // Save pages sequentially
    for (const [pageId, componentUpdates] of Object.entries(pageUpdates)) {
        const page = pages.find(p => p._id === pageId);
        if (!page) {
            console.error(`Page not found: ${pageId}`);
            continue;
        }

        const { handleUpdateComponents } = await import("@/services/page.service");

        const updatedComponents = page.components.map(component => {
            const update = componentUpdates[component.instanceId];
            if (!update) {
                return component;
            }

            return {
                ...component,
                formData: {
                    ...component.formData,
                    translations: {
                        ...component.formData?.translations,
                        ...update.translations
                    }
                }
            };
        });

        try {
            await handleUpdateComponents(page.slug, updatedComponents);
        } catch (error) {
            console.error(`Failed to save translations for page ${page.slug}:`, error);
            throw error;
        }
    }
}
