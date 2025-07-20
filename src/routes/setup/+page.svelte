<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { fade, fly, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Stepper,
        StepperIndicator,
        StepperItem,
        StepperTitle,
        StepperTrigger,
    } from "$lib/components/ui/stepper";
    import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
    import SparklesIcon from "@lucide/svelte/icons/sparkles";
    import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
    import {
        handleSetupSuperAdmin,
        checkSetupStatus,
    } from "@/services/auth.service";

    let step = $state(0);
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let name = $state("");
    let isLoading = $state(false);
    let passwordError = $state("");

    const steps = [
        {
            title: "Welcome to Froggy CMS",
            description: "Let's get your content management system set up",
        },
        {
            title: "Create Your Admin Account",
            description: "Set up the first administrator account",
        },
        { title: "All Set!", description: "Your CMS is ready to use" },
    ];

    onMount(async () => {
        // Check if setup is actually needed
        const status = await checkSetupStatus();
        if (!status.needsSetup) {
            goto("/login");
            return;
        }

        // Start the welcome animation
        setTimeout(() => (step = 1), 2000);
    });

    function validatePasswords() {
        if (password !== confirmPassword) {
            passwordError = "Passwords do not match";
            return false;
        }
        if (password.length < 8) {
            passwordError = "Password must be at least 8 characters long";
            return false;
        }
        passwordError = "";
        return true;
    }

    async function handleSubmit() {
        if (!validatePasswords()) return;

        isLoading = true;
        await handleSetupSuperAdmin(email, password, name);
        step = 2;
        isLoading = false;

        // Redirect to home after showing success
        setTimeout(() => {
            goto("/");
        }, 3000);
    }

    function nextStep() {
        if (step < steps.length - 1) {
            step++;
        }
    }
</script>

<div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4"
>
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
            class="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl"
        ></div>
        <div
            class="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 blur-3xl"
        ></div>
    </div>

    <div class="w-full max-w-md mx-auto relative z-10">
        <!-- Logo and brand -->
        <div class="text-center mb-8" in:fade={{ duration: 800, delay: 200 }}>
            <div
                class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white mb-4 shadow-lg"
            >
                <GalleryVerticalEndIcon class="w-8 h-8" />
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Froggy CMS
            </h1>
            <p class="text-gray-600 dark:text-gray-300 text-sm">
                Content Management Made Simple
            </p>
        </div>

        <!-- Step indicator -->
        <div
            class="mx-auto max-w-xl space-y-8 mb-8"
            in:fade={{ duration: 600, delay: 400 }}
        >
            <Stepper value={step + 1} class="items-start gap-4">
                {#each steps as { title }, i}
                    <StepperItem step={i + 1} class="flex-1">
                        <StepperTrigger
                            class="w-full flex-col items-start gap-2 rounded"
                        >
                            <StepperIndicator class="bg-border h-1 w-full">
                                <span class="sr-only">{i + 1}</span>
                            </StepperIndicator>
                            <div class="space-y-0.5">
                                <StepperTitle>{title}</StepperTitle>
                            </div>
                        </StepperTrigger>
                    </StepperItem>
                {/each}
            </Stepper>
        </div>

        <!-- Step content -->
        {#if step === 0}
            <div in:scale={{ duration: 600, delay: 600, easing: quintOut }}>
                <Card class="text-center">
                    <CardContent class="p-8">
                        <div class="mb-6">
                            <SparklesIcon
                                class="w-16 h-16 mx-auto text-blue-600 mb-4"
                            />
                            <h2
                                class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
                            >
                                {steps[0].title}
                            </h2>
                            <p class="text-gray-600 dark:text-gray-300">
                                {steps[0].description}
                            </p>
                        </div>
                        <div
                            class="space-y-2 text-sm text-gray-500 dark:text-gray-400"
                        >
                            <div class="flex items-center justify-center">
                                <div
                                    class="animate-pulse w-2 h-2 bg-blue-600 rounded-full mr-2"
                                ></div>
                                Initializing your CMS...
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        {/if}

        {#if step === 1}
            <div in:fly={{ y: 20, duration: 400 }}>
                <Card>
                    <CardHeader class="text-center">
                        <CardTitle
                            class="text-xl text-gray-900 dark:text-white"
                        >
                            {steps[1].title}
                        </CardTitle>
                        <CardDescription>
                            {steps[1].description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <div class="space-y-2">
                            <Label for="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                bind:value={name}
                                required
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                bind:value={email}
                                required
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter a secure password"
                                bind:value={password}
                                required
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="confirmPassword">Confirm Password</Label
                            >
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                bind:value={confirmPassword}
                                required
                            />
                            {#if passwordError}
                                <p class="text-red-500 text-sm">
                                    {passwordError}
                                </p>
                            {/if}
                        </div>

                        <Button
                            onclick={handleSubmit}
                            disabled={isLoading ||
                                !email ||
                                !password ||
                                !confirmPassword ||
                                !name}
                            class="w-full"
                        >
                            {#if isLoading}
                                <div
                                    class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                                ></div>
                                Creating Account...
                            {:else}
                                Create Admin Account
                            {/if}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        {/if}

        {#if step === 2}
            <div in:scale={{ duration: 600, easing: quintOut }}>
                <Card>
                    <CardContent class="p-8">
                        <div class="mb-6">
                            <div
                                class="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4"
                            >
                                <CheckCircleIcon
                                    class="w-8 h-8 text-green-600"
                                />
                            </div>
                            <h2
                                class="text-xl font-semibold text-gray-900 dark:text-white mb-2"
                            >
                                {steps[2].title}
                            </h2>
                            <p class="text-gray-600 dark:text-gray-300">
                                {steps[2].description}
                            </p>
                        </div>
                        <div
                            class="space-y-2 text-sm text-gray-500 dark:text-gray-400"
                        >
                            <div class="flex items-center justify-center">
                                <div
                                    class="animate-pulse w-2 h-2 bg-green-600 rounded-full mr-2"
                                ></div>
                                Redirecting to dashboard...
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        {/if}
    </div>
</div>
