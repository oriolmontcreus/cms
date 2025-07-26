<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import * as Checkbox from "$lib/components/ui/checkbox";
    import {
        RadioGroup,
        RadioGroupItem,
    } from "$lib/components/ui/radio-group/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import RoleSelector from "$lib/components/ui/role-selector.svelte";
    import PasswordInput from "$lib/components/PasswordInput.svelte";
    import {
        handleCreateUser,
        handleUpdateUser,
        handleCreateUserWithoutPassword,
    } from "@/services/user.service";
    import type {
        User,
        UserRegisterPayload,
        UserUpdatePayload,
        UserCreatePayload,
    } from "@shared/types/user.type";
    import { Roles } from "@shared/constants/role.type";
    import { onMount } from "svelte";
    import Lock from "@tabler/icons-svelte/icons/lock";
    import Link from "@tabler/icons-svelte/icons/link";
    import Dice from "@tabler/icons-svelte/icons/dice";

    // Props
    export let user: User | null = null; // If provided, we're editing
    export let onSuccess: (result?: any) => void;
    export let onCancel: () => void;

    // Form state
    let name = "";
    let email = "";
    let password = "";
    let permissions = Roles.CLIENT;
    let loading = false;
    let setupMethod = "immediate"; // "immediate" or "link"

    // Validation state
    let errors: Record<string, string> = {};

    const isEditing = !!user;

    onMount(() => {
        if (user) {
            name = user.name;
            email = user.email;
            permissions = user.permissions;
        }
    });

    function validateForm(): boolean {
        errors = {};

        if (!name.trim()) {
            errors.name = "Name is required";
        }

        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!isEditing && setupMethod === "immediate") {
            if (!password) {
                errors.password = "Password is required";
            } else if (password.length < 8) {
                errors.password = "Password must be at least 8 characters long";
            }
        } else if (password && password.length < 8) {
            errors.password = "Password must be at least 8 characters long";
        }

        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        loading = true;

        let success = false;
        let result: any = null;

        if (isEditing && user) {
            const updateData: UserUpdatePayload = {
                name: name.trim(),
                email: email.trim(),
                permissions,
            };

            // Only include password if it's provided
            if (password) {
                (updateData as any).password = password;
            }

            result = await handleUpdateUser(user._id, updateData);
            success = !!result;
        } else if (setupMethod === "link") {
            const createData: UserCreatePayload = {
                name: name.trim(),
                email: email.trim(),
                permissions,
            };

            result = await handleCreateUserWithoutPassword(createData);
            success = !!result;
        } else {
            const createData: UserRegisterPayload = {
                name: name.trim(),
                email: email.trim(),
                password,
                permissions,
            };

            result = await handleCreateUser(createData);
            success = !!result;
        }

        loading = false;

        if (success) {
            onSuccess(result);
        }
    }

    $: passwordRequired = !isEditing && setupMethod === "immediate";

    function generateRandomPassword(): string {
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        let password = "";
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];

        const allChars = lowercase + uppercase + numbers + symbols;
        const passwordLength = 12;

        for (let i = password.length; i < passwordLength; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        return password
            .split("")
            .sort(() => Math.random() - 0.5)
            .join("");
    }

    function handleGeneratePassword() {
        password = generateRandomPassword();
        if (errors.password) {
            errors = { ...errors };
            delete errors.password;
        }
    }
</script>

<form onsubmit={handleSubmit} class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Name Field -->
        <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input
                id="name"
                type="text"
                bind:value={name}
                placeholder="Enter full name"
                required
                class={errors.name ? "border-destructive" : ""}
                disabled={loading}
            />
            {#if errors.name}
                <p class="text-sm text-destructive">{errors.name}</p>
            {/if}
        </div>

        <!-- Email Field -->
        <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
                id="email"
                type="email"
                bind:value={email}
                placeholder="Enter email address"
                required
                class={errors.email ? "border-destructive" : ""}
                disabled={loading}
            />
            {#if errors.email}
                <p class="text-sm text-destructive">{errors.email}</p>
            {/if}
        </div>
    </div>

    <!-- Role Selection -->
    <RoleSelector
        bind:value={permissions}
        onValueChange={(value) => (permissions = value)}
        disabled={loading}
        label="Role"
        id="role"
        showTooltip={true}
    />

    {#if !isEditing}
        <!-- Setup Method Selection - Two Column Layout -->
        <div class="space-y-2">
            <Label class="text-sm font-medium">Setup Method</Label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Left Column: Radio Buttons -->
                <div class="space-y-1">
                    <RadioGroup bind:value={setupMethod} class="gap-1">
                        <!-- Set Password Now -->
                        <div
                            class="border-input has-data-[state=checked]:border-ring relative flex w-full items-center gap-2 rounded-md border p-2 shadow-sm"
                        >
                            <RadioGroupItem
                                value="immediate"
                                id="setup-immediate"
                                class="order-1 after:absolute after:inset-0"
                                disabled={loading}
                            />
                            <div class="flex grow items-center gap-2">
                                <Lock size="16" class="text-muted-foreground" />
                                <Label
                                    for="setup-immediate"
                                    class="text-sm font-medium cursor-pointer"
                                >
                                    Set password now
                                </Label>
                            </div>
                        </div>

                        <!-- Send Setup Link -->
                        <div
                            class="border-input has-data-[state=checked]:border-ring relative flex w-full items-center gap-2 rounded-md border p-2 shadow-sm"
                        >
                            <RadioGroupItem
                                value="link"
                                id="setup-link"
                                class="order-1 after:absolute after:inset-0"
                                disabled={loading}
                            />
                            <div class="flex grow items-center gap-2">
                                <Link size="16" class="text-muted-foreground" />
                                <Label
                                    for="setup-link"
                                    class="text-sm font-medium cursor-pointer"
                                >
                                    Send setup link
                                </Label>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                <!-- Right Column: Password Input or Notice (Fixed Height) -->
                <div class="min-h-[120px] flex flex-col justify-start">
                    {#if setupMethod === "immediate"}
                        <div
                            class="space-y-2 bg-muted dark:bg-muted/30 border rounded-lg p-8 text-center h-full flex flex-col items-center justify-center"
                        >
                            <Popover.Root>
                                <Popover.Trigger
                                    class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full gap-2"
                                    disabled={loading}
                                >
                                    <Lock size="16" />
                                    Choose password
                                </Popover.Trigger>
                                <Popover.Content class="w-80">
                                    <div class="grid gap-4">
                                        <div class="space-y-2">
                                            <div class="flex gap-2">
                                                <PasswordInput
                                                    id="popover-password"
                                                    bind:value={password}
                                                    placeholder="Enter password"
                                                    required={passwordRequired}
                                                    className={errors.password
                                                        ? "border-destructive"
                                                        : ""}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onclick={handleGeneratePassword}
                                                    disabled={loading}
                                                    class="px-3 h-9 shrink-0"
                                                    title="Generate random password"
                                                >
                                                    <Dice size="16" />
                                                </Button>
                                            </div>
                                            {#if errors.password}
                                                <p
                                                    class="text-sm text-destructive"
                                                >
                                                    {errors.password}
                                                </p>
                                            {/if}
                                        </div>
                                    </div>
                                </Popover.Content>
                            </Popover.Root>
                            {#if errors.password}
                                <p class="text-sm text-destructive">
                                    {errors.password}
                                </p>
                            {/if}
                        </div>
                    {:else}
                        <div
                            class="bg-muted dark:bg-muted/30 border rounded-lg p-4 text-center h-full flex flex-col items-center justify-center"
                        >
                            <Link class="h-6 w-6 text-muted-foreground mb-2" />
                            <p class="text-sm text-muted-foreground">
                                Setup link will be generated
                            </p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {:else}
        <!-- Password Fields for Editing -->
        <div class="space-y-2">
            <Label for="password">New Password (optional)</Label>
            <div class="flex gap-2">
                <PasswordInput
                    id="password"
                    bind:value={password}
                    placeholder="Enter new password"
                    required={passwordRequired}
                    className={errors.password ? "border-destructive" : ""}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onclick={handleGeneratePassword}
                    disabled={loading}
                    class="px-3 h-9 shrink-0"
                    title="Generate random password"
                >
                    <Dice size="16" />
                </Button>
            </div>
            {#if errors.password}
                <p class="text-sm text-destructive">
                    {errors.password}
                </p>
            {/if}
        </div>
    {/if}

    <!-- Form Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t">
        <Button
            type="button"
            variant="outline"
            onclick={onCancel}
            disabled={loading}
        >
            Cancel
        </Button>
        <Button type="submit" disabled={loading}>
            {#if loading}
                <div
                    class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                ></div>
                {isEditing ? "Updating..." : "Creating..."}
            {:else}
                {isEditing ? "Update User" : "Create User"}
            {/if}
        </Button>
    </div>
</form>
