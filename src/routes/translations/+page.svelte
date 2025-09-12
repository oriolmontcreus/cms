<script lang="ts">
    import { onMount } from "svelte";
    import SiteHeader from "$lib/components/site-header.svelte";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
    import { Button } from "$lib/components/ui/button";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Progress } from "$lib/components/ui/progress";
    import { Separator } from "$lib/components/ui/separator";
    import { 
        IconLanguage, 
        IconCheckbox, 
        IconClock, 
        IconFilePlus,
        IconSettings,
        IconArrowRight
    } from "@tabler/icons-svelte";
    import { SITE_LOCALES, CMS_LOCALE } from "@shared/env";
    import { getPages } from "@/services/page.service";
    import { getGlobalVariables } from "@/services/globalVariables.service";
    import { safeFetch } from "@/lib/utils/safeFetch";
    import type { Page } from "@/lib/shared/types/pages.type";
    import Spinner from "$lib/components/Spinner.svelte";
    import { goto } from "$app/navigation";

    let loading = true;
    let pages: Page[] = [];
    let globalVariables: any = null;
    let translationStats = {
        totalTranslatableFields: 0,
        translatedFields: 0,
        missingTranslations: 0,
        completionPercentage: 0,
        byLocale: {} as Record<string, { translated: number; total: number; percentage: number }>
    };

    // Available languages (excluding default)
    $: availableLocales = SITE_LOCALES.filter(locale => locale.code !== CMS_LOCALE);

    onMount(async () => {
        await loadTranslationData();
    });

    async function loadTranslationData() {
        loading = true;
        try {
            // Load pages and global variables
            const [pagesResult, globalVarsResult] = await Promise.all([
                safeFetch(getPages()),
                safeFetch(getGlobalVariables())
            ]);

            if (pagesResult[0]) pages = pagesResult[0];
            if (globalVarsResult[0]) globalVariables = globalVarsResult[0];

            // Calculate translation statistics
            calculateTranslationStats();
        } catch (error) {
            console.error('Failed to load translation data:', error);
        } finally {
            loading = false;
        }
    }

    function calculateTranslationStats() {
        let totalFields = 0;
        let translatedFields = 0;
        
        // Initialize per-locale stats
        const byLocale: Record<string, { translated: number; total: number; percentage: number }> = {};
        availableLocales.forEach(locale => {
            byLocale[locale.code] = { translated: 0, total: 0, percentage: 0 };
        });

        // Count translatable fields in pages
        pages.forEach(page => {
            if (page.components) {
                page.components.forEach(component => {
                    // Count translatable fields in the component
                    const { translatableFieldsCount, translatedCount } = countTranslatableFields(component);
                    totalFields += translatableFieldsCount * availableLocales.length;
                    translatedFields += translatedCount;

                    // Update per-locale stats
                    availableLocales.forEach(locale => {
                        byLocale[locale.code].total += translatableFieldsCount;
                        const localeTranslated = countTranslatedForLocale(component, locale.code);
                        byLocale[locale.code].translated += localeTranslated;
                    });
                });
            }
        });

        // Count global variables
        if (globalVariables && globalVariables.formData) {
            const { translatableFieldsCount, translatedCount } = countTranslatableFields({
                formData: globalVariables.formData
            });
            totalFields += translatableFieldsCount * availableLocales.length;
            translatedFields += translatedCount;

            availableLocales.forEach(locale => {
                byLocale[locale.code].total += translatableFieldsCount;
                const localeTranslated = countTranslatedForLocale({
                    formData: globalVariables.formData
                }, locale.code);
                byLocale[locale.code].translated += localeTranslated;
            });
        }

        // Calculate percentages
        Object.keys(byLocale).forEach(localeCode => {
            const stats = byLocale[localeCode];
            stats.percentage = stats.total > 0 ? Math.round((stats.translated / stats.total) * 100) : 0;
        });

        translationStats = {
            totalTranslatableFields: Math.floor(totalFields / availableLocales.length),
            translatedFields,
            missingTranslations: totalFields - translatedFields,
            completionPercentage: totalFields > 0 ? Math.round((translatedFields / totalFields) * 100) : 0,
            byLocale
        };
    }

    function countTranslatableFields(component: any): { translatableFieldsCount: number; translatedCount: number } {
        // This is a simplified count - in real implementation, you'd analyze the component schema
        // to find fields marked with translatable()
        let translatableFieldsCount = 0;
        let translatedCount = 0;

        if (component.formData) {
            // Count fields that might be translatable (simplified approach)
            Object.keys(component.formData).forEach(fieldName => {
                // In real implementation, check component schema for translatable() modifier
                translatableFieldsCount += 1;
                
                // Check if translations exist
                if (component.formData.translations) {
                    availableLocales.forEach(locale => {
                        if (component.formData.translations[locale.code] && 
                            component.formData.translations[locale.code][fieldName]) {
                            translatedCount += 1;
                        }
                    });
                }
            });
        }

        return { translatableFieldsCount, translatedCount };
    }

    function countTranslatedForLocale(component: any, localeCode: string): number {
        let translated = 0;
        if (component.formData && component.formData.translations && 
            component.formData.translations[localeCode]) {
            translated = Object.keys(component.formData.translations[localeCode]).filter(
                key => component.formData.translations[localeCode][key]
            ).length;
        }
        return translated;
    }

    function startTranslationWizard() {
        goto('/translations/wizard');
    }

    function manageLocaleTranslations(localeCode: string) {
        goto(`/translations/wizard?locale=${localeCode}`);
    }
</script>

<SiteHeader title="Translations">
    <div class="flex items-center gap-2">
        <Button onclick={startTranslationWizard}>
            <IconFilePlus class="h-4 w-4 mr-2" />
            Start Translation Wizard
        </Button>
    </div>
</SiteHeader>

<div class="flex flex-1 flex-col overflow-hidden">
    <ScrollArea class="@container/main flex flex-1 flex-col gap-2 max-h-[calc(100dvh-80px)]">
        <div class="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
            <div class="px-4 lg:px-6">
                {#if loading}
                    <div class="flex items-center justify-center min-h-[400px]">
                        <Spinner />
                    </div>
                {:else}
                    <div class="max-w-6xl mx-auto space-y-6">
                        <!-- Overview Cards -->
                        <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle class="text-sm font-medium">Available Languages</CardTitle>
                                    <IconLanguage class="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div class="text-2xl font-bold">{availableLocales.length}</div>
                                    <p class="text-xs text-muted-foreground">
                                        {availableLocales.map(l => l.name).join(', ')}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle class="text-sm font-medium">Translatable Fields</CardTitle>
                                    <IconSettings class="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div class="text-2xl font-bold">{translationStats.totalTranslatableFields}</div>
                                    <p class="text-xs text-muted-foreground">
                                        Fields marked as translatable
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle class="text-sm font-medium">Completed</CardTitle>
                                    <IconCheckbox class="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div class="text-2xl font-bold">{translationStats.translatedFields}</div>
                                    <p class="text-xs text-muted-foreground">
                                        {translationStats.completionPercentage}% complete
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle class="text-sm font-medium">Missing</CardTitle>
                                    <IconClock class="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div class="text-2xl font-bold">{translationStats.missingTranslations}</div>
                                    <p class="text-xs text-muted-foreground">
                                        Translations needed
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <!-- Overall Progress -->
                        <Card>
                            <CardHeader>
                                <CardTitle>Overall Translation Progress</CardTitle>
                                <CardDescription>
                                    Complete progress across all languages and content
                                </CardDescription>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <div class="space-y-2">
                                    <div class="flex justify-between text-sm">
                                        <span>Progress</span>
                                        <span>{translationStats.completionPercentage}%</span>
                                    </div>
                                    <Progress value={translationStats.completionPercentage} class="h-2" />
                                </div>
                                <div class="text-sm text-muted-foreground">
                                    {translationStats.translatedFields} of {translationStats.totalTranslatableFields * availableLocales.length} translations completed
                                </div>
                            </CardContent>
                        </Card>

                        <!-- Per-Language Breakdown -->
                        <Card>
                            <CardHeader>
                                <CardTitle>Progress by Language</CardTitle>
                                <CardDescription>
                                    See how complete each language translation is
                                </CardDescription>
                            </CardHeader>
                            <CardContent class="space-y-6">
                                {#each availableLocales as locale}
                                    {@const stats = translationStats.byLocale[locale.code]}
                                    <div class="space-y-3">
                                        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div class="flex items-center gap-3">
                                                <h3 class="font-medium">{locale.name}</h3>
                                                <Badge variant={stats.percentage === 100 ? "default" : stats.percentage > 50 ? "secondary" : "destructive"}>
                                                    {stats.percentage}%
                                                </Badge>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onclick={() => manageLocaleTranslations(locale.code)}
                                            >
                                                Manage
                                                <IconArrowRight class="ml-1 h-3 w-3" />
                                            </Button>
                                        </div>
                                        
                                        <div class="space-y-2">
                                            <Progress value={stats.percentage} class="h-2" />
                                            <div class="flex justify-between text-sm text-muted-foreground">
                                                <span>{stats.translated} completed</span>
                                                <span>{stats.total - stats.translated} remaining</span>
                                            </div>
                                        </div>
                                    </div>
                                    {#if locale !== availableLocales[availableLocales.length - 1]}
                                        <Separator />
                                    {/if}
                                {/each}
                            </CardContent>
                        </Card>

                        <!-- Quick Actions -->
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                                <CardDescription>
                                    Common translation management tasks
                                </CardDescription>
                            </CardHeader>
                            <CardContent class="grid gap-3 grid-cols-1 md:grid-cols-2">
                                <Button 
                                    variant="outline" 
                                    class="justify-start h-auto p-4"
                                    onclick={startTranslationWizard}
                                >
                                    <div class="text-left">
                                        <div class="font-medium">Fill Missing Translations</div>
                                        <div class="text-sm text-muted-foreground">Complete any empty translation fields</div>
                                    </div>
                                </Button>
                                
                                <Button 
                                    variant="outline" 
                                    class="justify-start h-auto p-4"
                                    onclick={() => goto('/translations/wizard?mode=review')}
                                >
                                    <div class="text-left">
                                        <div class="font-medium">Review & Update</div>
                                        <div class="text-sm text-muted-foreground">Modify existing translations</div>
                                    </div>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                {/if}
            </div>
        </div>
    </ScrollArea>
</div>