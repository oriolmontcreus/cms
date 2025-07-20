<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { Button } from "$lib/components/ui/button";
    import { Card, CardContent } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import PasswordInput from "$lib/components/PasswordInput.svelte";
    import {
        Stepper,
        StepperIndicator,
        StepperItem,
        StepperTitle,
        StepperTrigger,
    } from "$lib/components/ui/stepper";
    import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
    import {
        handleSetupSuperAdmin,
        checkSetupStatus,
    } from "@/services/auth.service";
    import { usePasswordStrength } from "$lib/hooks/usePasswordStrength.svelte";

    let step = $state(0);
    let welcomeName = $state("");
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let isLoading = $state(false);
    let passwordError = $state("");

    // Create password strength instance for validation
    const passwordStrength = usePasswordStrength({ id: "setup-password" });

    // Sync password state with strength validator
    $effect(() => {
        passwordStrength.password = password;
    });

    const steps = [
        {
            title: "Welcome to Froggy CMS",
            description: "Let's get your content management system set up",
        },
        {
            title: "Create your admin account",
            description: "Set up the first administrator account",
        },
        { title: "All set!", description: "Your CMS is ready to use" },
    ];

    onMount(async () => {
        // Check if setup is actually needed
        const status = await checkSetupStatus();
        if (!status.needsSetup) {
            goto("/login");
            return;
        }
    });

    function validatePasswords() {
        if (password !== confirmPassword) {
            passwordError = "Passwords do not match";
            return false;
        }

        // Sync password with strength validator
        passwordStrength.password = password;

        if (passwordStrength.strengthScore < 4) {
            passwordError =
                "Please ensure your password meets all requirements";
            return false;
        }

        passwordError = "";
        return true;
    }

    function handleWelcomeNext() {
        if (welcomeName.trim() && email.trim()) {
            step = 1;
        }
    }

    function handleBack() {
        if (step > 0) {
            step--;
        }
    }

    async function handleSubmit() {
        if (!validatePasswords()) return;

        isLoading = true;
        // Use welcomeName as the name for the admin account
        await handleSetupSuperAdmin(email, password, welcomeName);
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

<div class="min-h-screen w-full relative bg-black">
    <div
        class="absolute inset-0 z-0"
        style="background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34, 197, 94, 0.25), transparent 90%), #000000;"
    ></div>

    <div
        class="relative z-10 flex items-center justify-center p-4 min-h-screen"
    >
        <div class="w-full max-w-md mx-auto relative z-10">
            <!-- Step indicator -->
            {#if step > 0}
                <div
                    class="mx-auto max-w-xl space-y-8 mb-8"
                    in:fade={{ duration: 400 }}
                >
                    <Stepper value={step + 1} class="items-start gap-4">
                        {#each steps as { title }, i}
                            <StepperItem step={i + 1} class="flex-1">
                                <StepperTrigger
                                    class="w-full flex-col items-start gap-2 rounded"
                                >
                                    <StepperIndicator
                                        class="bg-border h-1 w-full"
                                    >
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
            {/if}

            <!-- Step content -->
            {#if step === 0}
                <div in:fade={{ duration: 600 }} class="text-center space-y-8">
                    <!-- Welcome message -->
                    <div class="space-y-6">
                        <h1
                            class="text-4xl font-light text-white tracking-tight"
                        >
                            Welcome to Froggy CMS
                        </h1>
                        <p class="text-lg text-gray-300 font-light">
                            How should we address you?
                        </p>
                    </div>

                    <!-- Input section -->
                    <div class="max-w-sm mx-auto space-y-6">
                        <Input
                            id="welcomeName"
                            type="text"
                            placeholder="Mr./Ms./Dr. [Your name]"
                            bind:value={welcomeName}
                            class="text-center"
                        />

                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@example.com"
                            bind:value={email}
                            class="text-center"
                        />

                        <div class="flex justify-end">
                            <Button
                                onclick={handleWelcomeNext}
                                variant="ghost"
                                class="text-gray-300 hover:text-white hover:bg-gray-700/50 px-6 transition-opacity duration-300"
                                style="opacity: {welcomeName.trim() &&
                                email.trim()
                                    ? '1'
                                    : '0'}"
                                disabled={!welcomeName.trim() || !email.trim()}
                            >
                                Continue →
                            </Button>
                        </div>
                    </div>
                </div>
            {/if}

            {#if step === 1}
                <div in:fade={{ duration: 400 }} class="text-center space-y-8">
                    <div class="space-y-6">
                        <h1
                            class="text-4xl font-light text-white tracking-tight"
                        >
                            Create your password
                        </h1>
                        <p class="text-lg text-gray-300 font-light">
                            Secure your admin account
                        </p>
                    </div>

                    <div class="max-w-sm mx-auto space-y-6">
                        <PasswordInput
                            id="password"
                            placeholder="Enter a secure password"
                            bind:value={password}
                            className="text-center"
                            required
                        />

                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm your password"
                            bind:value={confirmPassword}
                            class="text-center"
                            required
                        />

                        {#if passwordError}
                            <p class="text-red-500 text-sm text-center">
                                {passwordError}
                            </p>
                        {/if}

                        <div class="flex gap-3">
                            <Button
                                onclick={handleBack}
                                variant="ghost"
                                class="flex-1 text-gray-300 hover:text-white hover:bg-gray-700/50"
                            >
                                ← Back
                            </Button>
                            <Button
                                onclick={handleSubmit}
                                disabled={isLoading ||
                                    !password ||
                                    !confirmPassword ||
                                    passwordStrength.strengthScore < 4 ||
                                    password !== confirmPassword}
                                class="flex-1"
                            >
                                {#if isLoading}
                                    <div
                                        class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                                    ></div>
                                    Creating account...
                                {:else}
                                    Complete Setup
                                {/if}
                            </Button>
                        </div>
                    </div>
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
</div>
