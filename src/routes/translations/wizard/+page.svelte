<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import SiteHeader from "$lib/components/site-header.svelte";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import {
        IconArrowLeft,
        IconArrowRight,
        IconCheck,
        IconLanguage,
        IconFilePlus,
        IconEdit,
        IconPlayerSkipForward
    } from "@tabler/icons-svelte";
    import { SITE_LOCALES, CMS_LOCALE } from "@shared/env";
    import { getPages } from "@/services/page.service";
    import { getGlobalVariables } from "@/services/globalVariables.service";
    import { safeFetch } from "@/lib/utils/safeFetch";
    import type { Page } from "@/lib/shared/types/pages.type";
    import Spinner from "$lib/components/Spinner.svelte";
    import { toast } from "svelte-sonner";

    // Wizard steps
    const WizardStep = {
        SELECT_MODE: "select-mode",
        SELECT_LANGUAGE: "select-language",
        SELECT_CONTENT: "select-content",
        TRANSLATE: "translate",
        COMPLETE: "complete",
    } as const;

    type WizardStepType = (typeof WizardStep)[keyof typeof WizardStep];

    let currentStep: WizardStepType = WizardStep.SELECT_MODE;
    let selectedMode: "fill-missing" | "review-existing" | null = null;
    let selectedLocale: string | null = null;
    let selectedPages: string[] = [];
    let includeGlobalVariables = false;
    let loading = true;
    let saving = false;

    let pages: Page[] = [];
    let globalVariables: any = null;
    let translatableItems: any[] = [];
    let currentItemIndex = 0;
    let translations: Record<string, any> = {};

    // Available languages (excluding default)
    $: availableLocales = SITE_LOCALES.filter(
        (locale) => locale.code !== CMS_LOCALE,
    );

    onMount(async () => {
        // Check URL params for pre-selection
        const urlParams = new URLSearchParams(page.url.search);
        const localeParam = urlParams.get("locale");
        const modeParam = urlParams.get("mode");

        if (
            localeParam &&
            availableLocales.find((l) => l.code === localeParam)
        ) {
            selectedLocale = localeParam;
            currentStep = WizardStep.SELECT_CONTENT;
        }

        if (modeParam === "review") {
            selectedMode = "review-existing";
        }

        await loadData();
    });

    async function loadData() {
        loading = true;
        try {
            const [pagesResult, globalVarsResult] = await Promise.all([
                safeFetch(getPages()),
                safeFetch(getGlobalVariables()),
            ]);

            if (pagesResult[0]) pages = pagesResult[0];
            if (globalVarsResult[0]) globalVariables = globalVarsResult[0];
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("Failed to load content data");
        } finally {
            loading = false;
        }
    }

    function nextStep() {
        switch (currentStep) {
            case WizardStep.SELECT_MODE:
                currentStep = WizardStep.SELECT_LANGUAGE;
                break;
            case WizardStep.SELECT_LANGUAGE:
                currentStep = WizardStep.SELECT_CONTENT;
                break;
            case WizardStep.SELECT_CONTENT:
                prepareTranslationItems();
                currentStep = WizardStep.TRANSLATE;
                break;
            case WizardStep.TRANSLATE:
                currentStep = WizardStep.COMPLETE;
                break;
        }
    }

    function previousStep() {
        switch (currentStep) {
            case WizardStep.SELECT_LANGUAGE:
                currentStep = WizardStep.SELECT_MODE;
                break;
            case WizardStep.SELECT_CONTENT:
                currentStep = WizardStep.SELECT_LANGUAGE;
                break;
            case WizardStep.TRANSLATE:
                currentStep = WizardStep.SELECT_CONTENT;
                break;
            case WizardStep.COMPLETE:
                currentStep = WizardStep.TRANSLATE;
                break;
        }
    }

    function prepareTranslationItems() {
        translatableItems = [];

        // Add selected pages
        selectedPages.forEach((pageId) => {
            const selectedPage = pages.find((p) => p._id === pageId);
            if (selectedPage && selectedPage.components) {
                selectedPage.components.forEach((component) => {
                    if (component.formData) {
                        // Find translatable fields (simplified - in real implementation, check component schema)
                        Object.keys(component.formData).forEach((fieldName) => {
                            if (fieldName !== "translations") {
                                const currentValue =
                                    component.formData[fieldName];
                                const existingTranslation =
                                    component.formData.translations?.[
                                        selectedLocale!
                                    ]?.[fieldName];

                                // Include if missing translation or reviewing existing
                                if (
                                    selectedMode === "fill-missing" &&
                                    !existingTranslation
                                ) {
                                    translatableItems.push({
                                        type: "page",
                                        pageTitle:
                                            selectedPage.config?.title ||
                                            selectedPage.slug,
                                        componentName: component.componentName,
                                        fieldName,
                                        originalValue: currentValue,
                                        currentTranslation: "",
                                        componentId: component.instanceId,
                                        pageId: selectedPage._id,
                                    });
                                } else if (
                                    selectedMode === "review-existing" &&
                                    existingTranslation
                                ) {
                                    translatableItems.push({
                                        type: "page",
                                        pageTitle:
                                            selectedPage.config?.title ||
                                            selectedPage.slug,
                                        componentName: component.componentName,
                                        fieldName,
                                        originalValue: currentValue,
                                        currentTranslation: existingTranslation,
                                        componentId: component.instanceId,
                                        pageId: selectedPage._id,
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });

        // Add global variables if selected
        if (
            includeGlobalVariables &&
            globalVariables &&
            globalVariables.formData
        ) {
            Object.keys(globalVariables.formData).forEach((fieldName) => {
                if (fieldName !== "translations") {
                    const currentValue = globalVariables.formData[fieldName];
                    const existingTranslation =
                        globalVariables.formData.translations?.[
                            selectedLocale!
                        ]?.[fieldName];

                    if (
                        selectedMode === "fill-missing" &&
                        !existingTranslation
                    ) {
                        translatableItems.push({
                            type: "global",
                            fieldName,
                            originalValue: currentValue,
                            currentTranslation: "",
                            componentId: "global-variables",
                        });
                    } else if (
                        selectedMode === "review-existing" &&
                        existingTranslation
                    ) {
                        translatableItems.push({
                            type: "global",
                            fieldName,
                            originalValue: currentValue,
                            currentTranslation: existingTranslation,
                            componentId: "global-variables",
                        });
                    }
                }
            });
        }

        currentItemIndex = 0;
    }

    function saveCurrentTranslation() {
        const currentItem = translatableItems[currentItemIndex];
        if (
            currentItem &&
            translations[`${currentItem.componentId}-${currentItem.fieldName}`]
        ) {
            currentItem.currentTranslation =
                translations[
                    `${currentItem.componentId}-${currentItem.fieldName}`
                ];
        }
    }

    function nextItem() {
        saveCurrentTranslation();
        if (currentItemIndex < translatableItems.length - 1) {
            currentItemIndex++;
        } else {
            nextStep();
        }
    }

    function previousItem() {
        saveCurrentTranslation();
        if (currentItemIndex > 0) {
            currentItemIndex--;
        }
    }

    function skipItem() {
        if (currentItemIndex < translatableItems.length - 1) {
            currentItemIndex++;
        } else {
            nextStep();
        }
    }

    async function saveAllTranslations() {
        saving = true;
        try {
            // Save current item first
            saveCurrentTranslation();

            // Group translations by page/component
            const updates: Record<string, any> = {};

            translatableItems.forEach((item) => {
            const pageUpdates: Record<string, any> = {};
            let globalVariablesUpdate: any = null;
            
            translatableItems.forEach(item => {
                if (item.currentTranslation) {
                    const key =
                        item.type === "global"
                            ? "global-variables"
                            : item.pageId;
                    if (!updates[key]) {
                        updates[key] = {};
                    }
                    if (!updates[key][item.componentId]) {
                        updates[key][item.componentId] = {};
                    }
                    if (!updates[key][item.componentId][selectedLocale!]) {
                        updates[key][item.componentId][selectedLocale!] = {};
                    }
                    updates[key][item.componentId][selectedLocale!][
                        item.fieldName
                    ] = item.currentTranslation;
                    if (item.type === 'global') {
                        // Handle global variables
                        if (!globalVariablesUpdate) {
                            globalVariablesUpdate = {
                                translations: {}
                            };
                        }
                        if (!globalVariablesUpdate.translations[selectedLocale!]) {
                            globalVariablesUpdate.translations[selectedLocale!] = {};
                        }
                        globalVariablesUpdate.translations[selectedLocale!][item.fieldName] = item.currentTranslation;
                    } else {
                        // Handle page components
                        const pageId = item.pageId;
                        if (!pageUpdates[pageId]) {
                            pageUpdates[pageId] = {};
                        }
                        if (!pageUpdates[pageId][item.componentId]) {
                            pageUpdates[pageId][item.componentId] = {
                                translations: {}
                            };
                        }
                        if (!pageUpdates[pageId][item.componentId].translations[selectedLocale!]) {
                            pageUpdates[pageId][item.componentId].translations[selectedLocale!] = {};
                        }
                        pageUpdates[pageId][item.componentId].translations[selectedLocale!][item.fieldName] = item.currentTranslation;
                    }
                }
            });

            // Here you would make API calls to save the translations
            // For now, we'll just simulate the save
            await new Promise((resolve) => setTimeout(resolve, 1000));

            toast.success("Translations saved successfully!");
            // Save global variables if needed
            if (globalVariablesUpdate && globalVariables) {
                const { updateGlobalVariables } = await import("@/services/globalVariables.service");
                
                // Merge with existing data
                const updatedData = {
                    ...globalVariables.formData,
                    translations: {
                        ...globalVariables.formData.translations,
                        ...globalVariablesUpdate.translations
                    }
                };
                
                await updateGlobalVariables(updatedData);
            }

            // Save page updates
            for (const [pageId, componentUpdates] of Object.entries(pageUpdates)) {
                const page = pages.find(p => p._id === pageId);
                if (page) {
                    const { handleUpdateComponents } = await import("@/services/page.service");
                    
                    // Update the components with new translations
                    const updatedComponents = page.components.map(component => {
                        const update = componentUpdates[component.instanceId];
                        if (update) {
                            return {
                                ...component,
                                formData: {
                                    ...component.formData,
                                    translations: {
                                        ...component.formData.translations,
                                        ...update.translations
                                    }
                                }
                            };
                        }
                        return component;
                    });
                    
                    await handleUpdateComponents(page.slug, updatedComponents);
                }
            }
            
            toast.success('Translations saved successfully!');
            currentStep = WizardStep.COMPLETE;
        } catch (error) {
            console.error("Failed to save translations:", error);
            toast.error("Failed to save translations");
        } finally {
            saving = false;
        }
    }

    $: currentItem = translatableItems[currentItemIndex];
    $: canProceed = {
        [WizardStep.SELECT_MODE]: selectedMode !== null,
        [WizardStep.SELECT_LANGUAGE]: selectedLocale !== null,
        [WizardStep.SELECT_CONTENT]:
            selectedPages.length > 0 || includeGlobalVariables,
        [WizardStep.TRANSLATE]: true,
        [WizardStep.COMPLETE]: true,
    };
</script>

<SiteHeader title="Translation Wizard">
    <div class="flex items-center gap-2">
        <Button variant="outline" onclick={() => goto("/translations")}>
            <IconArrowLeft class="h-4 w-4 mr-2" />
            Back to Dashboard
        </Button>
    </div>
</SiteHeader>

<div class="flex flex-1 flex-col overflow-hidden">
    <ScrollArea
        class="@container/main flex flex-1 flex-col gap-2 max-h-[calc(100dvh-80px)]"
    >
        <div class="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
            <div class="px-4 lg:px-6">
                {#if loading}
                    <div class="flex items-center justify-center min-h-[400px]">
                        <Spinner />
                    </div>
                {:else}
                    <div class="max-w-4xl mx-auto space-y-6">
                        <!-- Progress Steps -->
                        <div
                            class="flex items-center justify-center space-x-4 mb-8"
                        >
                            {#each [{ step: WizardStep.SELECT_MODE, label: "Mode", icon: IconFilePlus }, { step: WizardStep.SELECT_LANGUAGE, label: "Language", icon: IconLanguage }, { step: WizardStep.SELECT_CONTENT, label: "Content", icon: IconEdit }, { step: WizardStep.TRANSLATE, label: "Translate", icon: IconEdit }, { step: WizardStep.COMPLETE, label: "Complete", icon: IconCheck }] as stepInfo, index}
                        <div class="flex items-center justify-center space-x-2 md:space-x-4 mb-8 overflow-x-auto pb-2">
                            {#each [
                                { step: WizardStep.SELECT_MODE, label: "Mode", icon: IconFilePlus },
                                { step: WizardStep.SELECT_LANGUAGE, label: "Language", icon: IconLanguage },
                                { step: WizardStep.SELECT_CONTENT, label: "Content", icon: IconEdit },
                                { step: WizardStep.TRANSLATE, label: "Translate", icon: IconEdit },
                                { step: WizardStep.COMPLETE, label: "Complete", icon: IconCheck }
                            ] as stepInfo, index}
                                <div class="flex items-center">
                                    <div
                                        class={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                            currentStep === stepInfo.step
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : Object.values(
                                                        WizardStep,
                                                    ).indexOf(currentStep) >
                                                    Object.values(
                                                        WizardStep,
                                                    ).indexOf(stepInfo.step)
                                                  ? "bg-green-500 border-green-500 text-white"
                                                  : "bg-background border-muted-foreground text-muted-foreground"
                                        }`}
                                    >
                                        <stepInfo.icon class="h-4 w-4" />
                                    <div class={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 ${
                                        currentStep === stepInfo.step ? 'bg-primary border-primary text-primary-foreground' :
                                        Object.values(WizardStep).indexOf(currentStep) > Object.values(WizardStep).indexOf(stepInfo.step) ? 'bg-green-500 border-green-500 text-white' :
                                        'bg-background border-muted-foreground text-muted-foreground'
                                    }`}>
                                        <stepInfo.icon class="h-3 w-3 md:h-4 md:w-4" />
                                    </div>
                                    <span class="ml-2 text-sm font-medium"
                                        >{stepInfo.label}</span
                                    >
                                    <span class="ml-1 md:ml-2 text-xs md:text-sm font-medium hidden sm:inline">{stepInfo.label}</span>
                                    {#if index < 4}
                                        <div
                                            class={`w-12 h-0.5 mx-4 ${
                                                Object.values(
                                                    WizardStep,
                                                ).indexOf(currentStep) > index
                                                    ? "bg-green-500"
                                                    : "bg-muted"
                                            }`}
                                        ></div>
                                        <div class={`w-8 md:w-12 h-0.5 mx-1 md:mx-4 ${
                                            Object.values(WizardStep).indexOf(currentStep) > index ? 'bg-green-500' : 'bg-muted'
                                        }`}></div>
                                    {/if}
                                </div>
                            {/each}
                        </div>

                        <!-- Step Content -->
                        {#if currentStep === WizardStep.SELECT_MODE}
                            <Card>
                                <CardHeader>
                                    <CardTitle
                                        >What would you like to do?</CardTitle
                                    >
                                    <CardDescription
                                        >Choose how you want to manage your
                                        translations</CardDescription
                                    >
                                </CardHeader>
                                <CardContent class="grid gap-4 grid-cols-1 md:grid-cols-2">
                                    <button
                                        class={`p-6 rounded-lg border-2 text-left transition-colors ${
                                            selectedMode === "fill-missing"
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-muted-foreground"
                                        }`}
                                        onclick={() =>
                                            (selectedMode = "fill-missing")}
                                    >
                                        <IconFilePlus
                                            class="h-8 w-8 mb-3 text-primary"
                                        />
                                        <h3 class="font-semibold mb-2">
                                            Fill Missing Translations
                                        </h3>
                                        <p
                                            class="text-sm text-muted-foreground"
                                        >
                                            Complete empty translation fields
                                            with new content
                                        </p>
                                    </button>

                                    <button
                                        class={`p-6 rounded-lg border-2 text-left transition-colors ${
                                            selectedMode === "review-existing"
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-muted-foreground"
                                        }`}
                                        onclick={() =>
                                            (selectedMode = "review-existing")}
                                    >
                                        <IconEdit
                                            class="h-8 w-8 mb-3 text-primary"
                                        />
                                        <h3 class="font-semibold mb-2">
                                            Review & Update Existing
                                        </h3>
                                        <p
                                            class="text-sm text-muted-foreground"
                                        >
                                            Modify and improve existing
                                            translations
                                        </p>
                                    </button>
                                </CardContent>
                            </Card>
                        {/if}

                        {#if currentStep === WizardStep.SELECT_LANGUAGE}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Select Language</CardTitle>
                                    <CardDescription
                                        >Which language would you like to work
                                        on?</CardDescription
                                    >
                                </CardHeader>
                                <CardContent class="grid gap-3 grid-cols-1 md:grid-cols-2">
                                    {#each availableLocales as locale}
                                        <button
                                            class={`p-4 rounded-lg border-2 text-left transition-colors ${
                                                selectedLocale === locale.code
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border hover:border-muted-foreground"
                                            }`}
                                            onclick={() =>
                                                (selectedLocale = locale.code)}
                                        >
                                            <div
                                                class="flex items-center justify-between"
                                            >
                                                <h3 class="font-medium">
                                                    {locale.name}
                                                </h3>
                                                <Badge variant="outline"
                                                    >{locale.code}</Badge
                                                >
                                            </div>
                                        </button>
                                    {/each}
                                </CardContent>
                            </Card>
                        {/if}

                        {#if currentStep === WizardStep.SELECT_CONTENT}
                            <div class="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle
                                            >Select Content to Translate</CardTitle
                                        >
                                        <CardDescription
                                            >Choose which pages and content to
                                            include</CardDescription
                                        >
                                    </CardHeader>
                                    <CardContent class="space-y-4">
                                        <!-- Global Variables Option -->
                                        <div
                                            class="flex items-center space-x-2"
                                        >
                                            <input
                                                type="checkbox"
                                                id="global-vars"
                                                bind:checked={
                                                    includeGlobalVariables
                                                }
                                                class="rounded border-gray-300"
                                            />
                                            <Label
                                                for="global-vars"
                                                class="font-medium"
                                                >Global Variables</Label
                                            >
                                        </div>

                                        <Separator />

                                        <!-- Pages Selection -->
                                        <div class="space-y-3">
                                            <h3 class="font-medium">Pages</h3>
                                            <div class="grid gap-2">
                                                {#each pages as page}
                                                    <div
                                                        class="flex items-center space-x-2"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            id="page-{page._id}"
                                                            bind:group={
                                                                selectedPages
                                                            }
                                                            value={page._id}
                                                            class="rounded border-gray-300"
                                                        />
                                                        <Label
                                                            for="page-{page._id}"
                                                        >
                                                            {page.config
                                                                ?.title ||
                                                                page.slug}
                                                        </Label>
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        {/if}

                        {#if currentStep === WizardStep.TRANSLATE && translatableItems.length > 0}
                            <div class="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <div
                                            class="flex items-center justify-between"
                                        >
                                            <div>
                                                <CardTitle>
                                                    {#if currentItem.type === "page"}
                                                        {currentItem.pageTitle} -
                                                        {currentItem.componentName}
                                                    {:else}
                                                        Global Variables
                                                    {/if}
                                                </CardTitle>
                                                <CardDescription>
                                                    Field: {currentItem.fieldName}
                                                    ({currentItemIndex + 1} of {translatableItems.length})
                                                </CardDescription>
                                            </div>
                                            <Badge>{selectedLocale}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent class="space-y-4">
                                        <div class="space-y-2">
                                            <Label
                                                >Original ({CMS_LOCALE}):</Label
                                            >
                                            <div
                                                class="p-3 bg-muted rounded-md"
                                            >
                                                {currentItem.originalValue ||
                                                    "No content"}
                                            </div>
                                        </div>

                                        <div class="space-y-2">
                                            <Label for="translation"
                                                >Translation ({selectedLocale}):</Label
                                            >
                                            {#if typeof currentItem.originalValue === "string" && currentItem.originalValue.length > 100}
                                                <Textarea
                                                    id="translation"
                                                    bind:value={
                                                        translations[
                                                            `${currentItem.componentId}-${currentItem.fieldName}`
                                                        ]
                                                    }
                                                    placeholder="Enter translation..."
                                                    rows={4}
                                                />
                                            {:else}
                                                <Input
                                                    id="translation"
                                                    bind:value={
                                                        translations[
                                                            `${currentItem.componentId}-${currentItem.fieldName}`
                                                        ]
                                                    }
                                                    placeholder="Enter translation..."
                                                />
                                            {/if}
                                            {#if currentItem.currentTranslation && !translations[`${currentItem.componentId}-${currentItem.fieldName}`]}
                                                {(translations[
                                                    `${currentItem.componentId}-${currentItem.fieldName}`
                                                ] =
                                                    currentItem.currentTranslation)}
                                            {/if}
                                        </div>
                                    </CardContent>
                                </Card>

                                <!-- Navigation -->
                                <div class="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <Button 
                                        variant="outline" 
                                        onclick={previousItem}
                                        disabled={currentItemIndex === 0}
                                    >
                                        <IconArrowLeft class="h-4 w-4 mr-2" />
                                        Previous
                                    </Button>

                                    <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                        <Button variant="ghost" onclick={skipItem}>
                                            <IconPlayerSkipForward class="h-4 w-4 mr-2" />
                                            Skip
                                        </Button>

                                        {#if currentItemIndex < translatableItems.length - 1}
                                            <Button onclick={nextItem}>
                                                Next
                                                <IconArrowRight
                                                    class="h-4 w-4 ml-2"
                                                />
                                            </Button>
                                        {:else}
                                            <Button
                                                onclick={saveAllTranslations}
                                                disabled={saving}
                                            >
                                                {#if saving}
                                                    <Spinner />
                                                {/if}
                                                Finish & Save
                                            </Button>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/if}

                        {#if currentStep === WizardStep.TRANSLATE && translatableItems.length === 0}
                            <Card>
                                <CardContent class="text-center py-8">
                                    <IconCheck
                                        class="h-12 w-12 mx-auto mb-4 text-green-500"
                                    />
                                    <h3 class="text-xl font-semibold mb-2">
                                        No items to translate
                                    </h3>
                                    <p class="text-muted-foreground mb-4">
                                        {#if selectedMode === "fill-missing"}
                                            All selected content already has
                                            translations for {selectedLocale}.
                                        {:else}
                                            No existing translations found for
                                            the selected content.
                                        {/if}
                                    </p>
                                    <Button
                                        onclick={() => goto("/translations")}
                                    >
                                        Return to Dashboard
                                    </Button>
                                </CardContent>
                            </Card>
                        {/if}

                        {#if currentStep === WizardStep.COMPLETE}
                            <Card>
                                <CardContent class="text-center py-8">
                                    <IconCheck
                                        class="h-16 w-16 mx-auto mb-4 text-green-500"
                                    />
                                    <h3 class="text-2xl font-semibold mb-2">
                                        Translation Complete!
                                    </h3>
                                    <p class="text-muted-foreground mb-6">
                                        All translations have been saved
                                        successfully.
                                    </p>
                                    <div class="flex gap-3 justify-center">
                                        <Button
                                            onclick={() =>
                                                goto("/translations")}
                                        >
                                            Back to Dashboard
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onclick={() =>
                                                (currentStep =
                                                    WizardStep.SELECT_MODE)}
                                        >
                                            Start Another
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        {/if}

                        <!-- Navigation Buttons -->
                        {#if currentStep !== WizardStep.COMPLETE && currentStep !== WizardStep.TRANSLATE}
                            <div class="flex items-center justify-between">
                                <Button
                                    variant="outline"
                            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <Button 
                                    variant="outline" 
                                    onclick={previousStep}
                                    disabled={currentStep ===
                                        WizardStep.SELECT_MODE}
                                >
                                    <IconArrowLeft class="h-4 w-4 mr-2" />
                                    Previous
                                </Button>

                                <Button
                                    onclick={nextStep}
                                    disabled={!canProceed[currentStep]}
                                >
                                    Next
                                    <IconArrowRight class="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </ScrollArea>
</div>
