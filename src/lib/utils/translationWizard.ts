import type { Page } from "@/lib/shared/types/pages.type";

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

                if (selectedMode === "fill-missing" && !existingTranslation) {
                    items.push({
                        type: "page",
                        pageTitle: selectedPage.config?.title || selectedPage.slug,
                        componentName: component.componentName,
                        fieldName,
                        originalValue: currentValue,
                        currentTranslation: "",
                        componentId: component.instanceId,
                        pageId: selectedPage._id
                    });
                } else if (selectedMode === "review-existing" && existingTranslation) {
                    items.push({
                        type: "page",
                        pageTitle: selectedPage.config?.title || selectedPage.slug,
                        componentName: component.componentName,
                        fieldName,
                        originalValue: currentValue,
                        currentTranslation: existingTranslation,
                        componentId: component.instanceId,
                        pageId: selectedPage._id
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

            if (selectedMode === "fill-missing" && !existingTranslation) {
                items.push({
                    type: "global",
                    fieldName,
                    originalValue: currentValue,
                    currentTranslation: "",
                    componentId: "global-variables"
                });
            } else if (selectedMode === "review-existing" && existingTranslation) {
                items.push({
                    type: "global",
                    fieldName,
                    originalValue: currentValue,
                    currentTranslation: existingTranslation,
                    componentId: "global-variables"
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

    console.log('🔧 Persisting translations:', {
        itemCount: translatableItems.length,
        selectedLocale,
        items: translatableItems.map(item => ({
            type: item.type,
            fieldName: item.fieldName,
            currentTranslation: item.currentTranslation,
            hasTranslation: !!item.currentTranslation
        }))
    });

    const pageUpdates: Record<string, any> = {};
    let globalVariablesUpdate: any = null;

    translatableItems.forEach(item => {
        console.log(`Processing item: ${item.fieldName}, translation: "${item.currentTranslation}"`);

        // Check for both empty string and undefined/null
        if (!item.currentTranslation || item.currentTranslation.trim() === '') {
            console.log(`Skipping item ${item.fieldName} - no translation provided`);
            return;
        }

        if (item.type === "global") {
            console.log(`Saving global variable translation: ${item.fieldName} = "${item.currentTranslation}"`);
            if (!globalVariablesUpdate) globalVariablesUpdate = { translations: {} };
            if (!globalVariablesUpdate.translations[selectedLocale]) {
                globalVariablesUpdate.translations[selectedLocale] = {};
            }
            globalVariablesUpdate.translations[selectedLocale][item.fieldName] = item.currentTranslation;
        } else {
            console.log(`Saving page translation: ${item.fieldName} = "${item.currentTranslation}" for component ${item.componentId}`);
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

    console.log('📊 Final updates to save:', {
        pageUpdates: Object.keys(pageUpdates).length > 0 ? pageUpdates : 'No page updates',
        globalVariablesUpdate: globalVariablesUpdate || 'No global variable updates'
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

    // Save pages sequentially (could be parallel if API supports)
    for (const [pageId, componentUpdates] of Object.entries(pageUpdates)) {
        const page = pages.find(p => p._id === pageId);
        if (!page) {
            console.error(`❌ Page not found: ${pageId}`);
            continue;
        }

        console.log(`🔄 Processing page: ${page.slug} (${pageId})`);
        console.log(`📝 Component updates for page:`, componentUpdates);

        const { handleUpdateComponents } = await import("@/services/page.service");

        const updatedComponents = page.components.map(component => {
            const update = componentUpdates[component.instanceId];
            if (!update) {
                console.log(`⏭️ No updates for component: ${component.instanceId}`);
                return component;
            }

            console.log(`🔧 Updating component ${component.instanceId}:`, {
                currentTranslations: component.formData?.translations,
                newTranslations: update.translations,
                mergedTranslations: {
                    ...component.formData?.translations,
                    ...update.translations
                }
            });

            const updatedComponent = {
                ...component,
                formData: {
                    ...component.formData,
                    translations: {
                        ...component.formData?.translations,
                        ...update.translations
                    }
                }
            };

            console.log(`✅ Updated component data:`, updatedComponent);
            return updatedComponent;
        });

        console.log(`🚀 Calling handleUpdateComponents with:`, {
            slug: page.slug,
            componentsCount: updatedComponents.length,
            updatedComponents
        });

        try {
            const result = await handleUpdateComponents(page.slug, updatedComponents);
            console.log(`✅ API call successful for page ${page.slug}:`, result);
        } catch (error) {
            console.error(`❌ API call failed for page ${page.slug}:`, error);
            throw error;
        }
    }
}
