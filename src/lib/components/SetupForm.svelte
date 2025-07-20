<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import CheckCircle2 from "@lucide/svelte/icons/check-circle-2";
    import User from "@lucide/svelte/icons/user";
    import Mail from "@lucide/svelte/icons/mail";
    import Lock from "@lucide/svelte/icons/lock";
    import Sparkles from "@lucide/svelte/icons/sparkles";
    import { handleSetupSuperAdmin } from "@/services/auth.service";
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    let currentStep = $state(1);
    let isSubmitting = $state(false);
    let isComplete = $state(false);
    
    // Form fields
    let name = $state("");
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");

    // Validation
    let nameError = $state("");
    let emailError = $state("");
    let passwordError = $state("");
    let confirmPasswordError = $state("");

    function validateStep1(): boolean {
        nameError = "";
        emailError = "";
        
        if (!name.trim()) {
            nameError = "Name is required";
            return false;
        }
        
        if (!email.trim()) {
            emailError = "Email is required";
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailError = "Please enter a valid email address";
            return false;
        }
        
        return true;
    }

    function validateStep2(): boolean {
        passwordError = "";
        confirmPasswordError = "";
        
        if (!password) {
            passwordError = "Password is required";
            return false;
        }
        
        if (password.length < 8) {
            passwordError = "Password must be at least 8 characters long";
            return false;
        }
        
        if (password !== confirmPassword) {
            confirmPasswordError = "Passwords do not match";
            return false;
        }
        
        return true;
    }

    function nextStep() {
        if (currentStep === 1 && validateStep1()) {
            currentStep = 2;
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep = 1;
        }
    }

    async function completeSetup() {
        if (!validateStep2()) return;
        
        isSubmitting = true;
        try {
            await handleSetupSuperAdmin(email, password, name, false);
            isComplete = true;
            
            // Auto-redirect after success
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } catch (error) {
            console.error('Setup failed:', error);
        } finally {
            isSubmitting = false;
        }
    }
</script>

{#if isComplete}
    <div 
        class="text-center py-12"
        in:fly={{ y: 20, duration: 800, easing: quintOut }}
    >
        <div class="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 class="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Froggy CMS!</h1>
        <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Your account has been created successfully. You'll be redirected to the login page shortly.
        </p>
        <div class="animate-pulse">
            <div class="h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto w-48"></div>
        </div>
    </div>
{:else}
    <div in:fade={{ duration: 600 }}>
        <!-- Welcome Header -->
        <div class="text-center mb-8" in:fly={{ y: -20, duration: 800, easing: quintOut }}>
            <div class="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Sparkles class="w-10 h-10 text-white" />
            </div>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome to Froggy CMS
            </h1>
            <p class="text-xl text-gray-600 dark:text-gray-300">
                Let's set up your first administrator account
            </p>
        </div>

        <!-- Progress Indicator -->
        <div class="flex justify-center mb-8" in:fly={{ y: 20, duration: 800, delay: 200, easing: quintOut }}>
            <div class="flex items-center space-x-4">
                <div class="flex items-center">
                    <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        currentStep >= 1 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                        {currentStep > 1 ? '✓' : '1'}
                    </div>
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Basic Info</span>
                </div>
                <div class={`w-12 h-0.5 transition-all duration-300 ${
                    currentStep > 1 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}></div>
                <div class="flex items-center">
                    <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                        currentStep >= 2 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                        2
                    </div>
                    <span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Security</span>
                </div>
            </div>
        </div>

        <!-- Setup Form -->
        <Card class="mx-auto max-w-md shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader class="text-center">
                <CardTitle class="text-2xl">
                    {currentStep === 1 ? 'Tell us about yourself' : 'Create your password'}
                </CardTitle>
                <CardDescription>
                    {currentStep === 1 
                        ? 'We need some basic information to create your account' 
                        : 'Choose a strong password to secure your account'}
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
                {#if currentStep === 1}
                    <div class="space-y-4" in:fly={{ x: -20, duration: 500, easing: quintOut }}>
                        <div class="space-y-2">
                            <Label for="name" class="flex items-center gap-2">
                                <User class="w-4 h-4" />
                                Full Name
                            </Label>
                            <Input 
                                id="name" 
                                type="text" 
                                placeholder="Enter your full name"
                                bind:value={name}
                                class={nameError ? "border-red-500 focus:border-red-500" : ""}
                            />
                            {#if nameError}
                                <p class="text-sm text-red-600 dark:text-red-400">{nameError}</p>
                            {/if}
                        </div>
                        
                        <div class="space-y-2">
                            <Label for="email" class="flex items-center gap-2">
                                <Mail class="w-4 h-4" />
                                Email Address
                            </Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="Enter your email address"
                                bind:value={email}
                                class={emailError ? "border-red-500 focus:border-red-500" : ""}
                            />
                            {#if emailError}
                                <p class="text-sm text-red-600 dark:text-red-400">{emailError}</p>
                            {/if}
                        </div>

                        <div class="pt-4">
                            <Button 
                                onclick={nextStep}
                                class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                                size="lg"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                {:else}
                    <div class="space-y-4" in:fly={{ x: 20, duration: 500, easing: quintOut }}>
                        <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div class="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" class="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100">
                                    Super Administrator
                                </Badge>
                            </div>
                            <p class="text-sm text-blue-800 dark:text-blue-200">
                                You'll have full access to all CMS features and settings.
                            </p>
                        </div>

                        <div class="space-y-2">
                            <Label for="password" class="flex items-center gap-2">
                                <Lock class="w-4 h-4" />
                                Password
                            </Label>
                            <Input 
                                id="password" 
                                type="password" 
                                placeholder="Create a strong password"
                                bind:value={password}
                                class={passwordError ? "border-red-500 focus:border-red-500" : ""}
                            />
                            {#if passwordError}
                                <p class="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                            {/if}
                        </div>
                        
                        <div class="space-y-2">
                            <Label for="confirmPassword" class="flex items-center gap-2">
                                <Lock class="w-4 h-4" />
                                Confirm Password
                            </Label>
                            <Input 
                                id="confirmPassword" 
                                type="password" 
                                placeholder="Confirm your password"
                                bind:value={confirmPassword}
                                class={confirmPasswordError ? "border-red-500 focus:border-red-500" : ""}
                            />
                            {#if confirmPasswordError}
                                <p class="text-sm text-red-600 dark:text-red-400">{confirmPasswordError}</p>
                            {/if}
                        </div>

                        <div class="flex gap-3 pt-4">
                            <Button 
                                onclick={prevStep}
                                variant="outline"
                                class="flex-1"
                                size="lg"
                            >
                                Back
                            </Button>
                            <Button 
                                onclick={completeSetup}
                                disabled={isSubmitting}
                                class="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                                size="lg"
                            >
                                {#if isSubmitting}
                                    <div class="flex items-center gap-2">
                                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Setting up...
                                    </div>
                                {:else}
                                    Complete Setup
                                {/if}
                            </Button>
                        </div>
                    </div>
                {/if}
            </CardContent>
        </Card>
    </div>
{/if}