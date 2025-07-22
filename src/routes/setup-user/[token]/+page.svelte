<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { fade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { Button } from "$lib/components/ui/button";
    import { Card, CardContent } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import PasswordInput from "$lib/components/PasswordInput.svelte";
    import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
    import { handleSetupUserAccount } from "@/services/user.service";
    import { usePasswordStrength } from "$lib/hooks/usePasswordStrength.svelte";

    let step = $state(0);
    let name = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let isLoading = $state(false);
    let passwordError = $state("");
    let setupError = $state("");
    let token = $state("");

    // Create password strength instance for validation
    const passwordStrength = usePasswordStrength({ id: "setup-password" });

    // Sync password state with strength validator
    $effect(() => {
        passwordStrength.password = password;
    });

    const steps = [
        {
            title: "Complete Your Account Setup",
            description: "Welcome! Let's finish setting up your account.",
        },
        {
            title: "Setup Complete!",
            description: "Your account is ready to use",
        },
    ];

    onMount(async () => {
        const params = $page.params;
        token = params.token || "";

        if (!token) {
            setupError = "Invalid setup link";
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

    async function handleSubmit() {
        if (!validatePasswords()) return;

        isLoading = true;
        setupError = "";

        try {
            const user = await handleSetupUserAccount(token, {
                password,
                name: name.trim() || undefined,
            });

            if (user) {
                step = 1;
                // Redirect to login after showing success
                setTimeout(() => {
                    goto("/login");
                }, 3000);
            }
        } catch (error: any) {
            if (error.message?.includes("Invalid or expired")) {
                setupError =
                    "This setup link has expired or is invalid. Please contact your administrator for a new setup link.";
            } else {
                setupError =
                    error.message ||
                    "Failed to setup account. Please try again.";
            }
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="min-h-screen w-full relative bg-black dark">
    <div
        class="absolute inset-0 z-0"
        style="background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34, 197, 94, 0.25), transparent 90%), #000000;"
    ></div>

    <div
        class="relative z-10 flex items-center justify-center p-4 min-h-screen"
    >
        <div class="w-full max-w-md mx-auto relative z-10">
            {#if setupError}
                <div in:fade={{ duration: 400 }} class="text-center space-y-8">
                    <div class="space-y-6">
                        <h1
                            class="text-4xl font-light text-white tracking-tight"
                        >
                            Setup Error
                        </h1>
                        <p class="text-lg text-red-400 font-light">
                            {setupError}
                        </p>
                        <Button
                            onclick={() => goto("/login")}
                            variant="ghost"
                            class="text-gray-300 hover:text-white"
                        >
                            Go to Login
                        </Button>
                    </div>
                </div>
            {:else if step === 0}
                <div in:fade={{ duration: 600 }} class="text-center space-y-8">
                    <!-- Welcome message -->
                    <div class="space-y-6">
                        <h1
                            class="text-4xl font-light text-white tracking-tight"
                        >
                            Complete Your Account Setup
                        </h1>
                        <p class="text-lg text-gray-300 font-light">
                            Welcome! Let's finish setting up your account.
                        </p>
                    </div>

                    <!-- Input section -->
                    <div class="max-w-sm mx-auto space-y-6">
                        <Input
                            id="name"
                            type="text"
                            placeholder="Your name (optional)"
                            bind:value={name}
                            class="text-center"
                        />

                        <PasswordInput
                            id="password"
                            placeholder="Create a secure password"
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

                        <div class="flex justify-center">
                            <Button
                                onclick={handleSubmit}
                                disabled={isLoading ||
                                    !password ||
                                    !confirmPassword ||
                                    passwordStrength.strengthScore < 4 ||
                                    password !== confirmPassword}
                                class="px-8"
                            >
                                {#if isLoading}
                                    <div
                                        class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                                    ></div>
                                    Setting up account...
                                {:else}
                                    Complete Setup
                                {/if}
                            </Button>
                        </div>
                    </div>
                </div>
            {:else if step === 1}
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
                                    {steps[1].title}
                                </h2>
                                <p class="text-gray-600 dark:text-gray-300">
                                    {steps[1].description}
                                </p>
                            </div>
                            <div
                                class="space-y-2 text-sm text-gray-500 dark:text-gray-400"
                            >
                                <div class="flex items-center justify-center">
                                    <p>Redirecting to login...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            {/if}
        </div>
    </div>
</div>
