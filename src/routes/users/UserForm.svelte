<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import * as Checkbox from "$lib/components/ui/checkbox";
    import RoleSelector from "$lib/components/ui/role-selector.svelte";
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
    import InfoCircle from "@tabler/icons-svelte/icons/info-circle";

    // Props
    export let user: User | null = null; // If provided, we're editing
    export let onSuccess: (result?: any) => void;
    export let onCancel: () => void;

    // Form state
    let name = "";
    let email = "";
    let password = "";
    let confirmPassword = "";
    let permissions = Roles.CLIENT;
    let loading = false;
    let createWithoutPassword = false;

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

        if (!isEditing && !createWithoutPassword) {
            if (!password) {
                errors.password = "Password is required";
            } else if (password.length < 8) {
                errors.password = "Password must be at least 8 characters long";
            }

            if (!confirmPassword) {
                errors.confirmPassword = "Please confirm your password";
            } else if (password !== confirmPassword) {
                errors.confirmPassword = "Passwords do not match";
            }
        } else if (password && password.length < 8) {
            errors.password = "Password must be at least 8 characters long";
        } else if (password && password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
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
        } else if (createWithoutPassword) {
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

    $: passwordRequired = !isEditing && !createWithoutPassword;
</script>

<form onsubmit={handleSubmit} class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Name Field -->
        <div class="space-y-2">
            <Label for="name">Name *</Label>
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
            <Label for="email">Email *</Label>
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
        label="Role *"
        id="role"
    />

    {#if !isEditing}
        <!-- Create without password option -->
        <div class="flex items-center space-x-2">
            <Checkbox.Root
                id="createWithoutPassword"
                bind:checked={createWithoutPassword}
                disabled={loading}
            />
            <Label
                for="createWithoutPassword"
                class="text-sm font-normal cursor-pointer"
            >
                Generate setup link instead of setting password now
            </Label>
        </div>
        {#if createWithoutPassword}
            <div class="border-border rounded-lg border px-4 py-3">
                <p class="text-sm">
                    <InfoCircle
                        class="-mt-0.5 inline-flex text-blue-500"
                        size={16}
                        aria-hidden="true"
                    />
                    A secure setup link will be generated that you can copy and send
                    to the user. The user will use this link to create their own
                    password. The link expires in 48 hours for security.
                </p>
            </div>
        {/if}
    {/if}

    <!-- Password Fields -->
    {#if !createWithoutPassword}
        <div class="space-y-4">
            <div class="space-y-2">
                <Label for="password">
                    {isEditing
                        ? "New Password (leave empty to keep current)"
                        : "Password *"}
                </Label>
                <Input
                    id="password"
                    type="password"
                    bind:value={password}
                    placeholder={isEditing
                        ? "Enter new password (optional)"
                        : "Enter password"}
                    required={passwordRequired}
                    class={errors.password ? "border-destructive" : ""}
                    disabled={loading}
                />
                {#if errors.password}
                    <p class="text-sm text-destructive">{errors.password}</p>
                {/if}
                {#if !isEditing}
                    <p class="text-sm text-muted-foreground">
                        Password must be at least 8 characters long
                    </p>
                {/if}
            </div>

            <div class="space-y-2">
                <Label for="confirmPassword">
                    {isEditing ? "Confirm New Password" : "Confirm Password *"}
                </Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    bind:value={confirmPassword}
                    placeholder={isEditing
                        ? "Confirm new password"
                        : "Confirm password"}
                    required={passwordRequired || !!password}
                    class={errors.confirmPassword ? "border-destructive" : ""}
                    disabled={loading}
                />
                {#if errors.confirmPassword}
                    <p class="text-sm text-destructive">
                        {errors.confirmPassword}
                    </p>
                {/if}
            </div>
        </div>
    {/if}

    <!-- Role Description -->
    <div class="bg-muted/50 p-4 rounded-lg space-y-2">
        <h4 class="text-sm font-medium">Role Permissions:</h4>
        <div class="text-sm text-muted-foreground space-y-1">
            {#if permissions === Roles.CLIENT}
                <p>
                    <strong>Client:</strong> Basic access to view content and limited
                    functionality.
                </p>
            {:else if permissions === Roles.DEVELOPER}
                <p>
                    <strong>Developer:</strong> Access to content management, page
                    creation, and development tools.
                </p>
            {:else if permissions === Roles.SUPER_ADMIN}
                <p>
                    <strong>Super Admin:</strong> Full system access including user
                    management and system settings.
                </p>
            {/if}
        </div>
    </div>

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
