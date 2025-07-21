<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { createUser, updateUser } from "@/services/user.service";
    import type {
        User,
        UserRegisterPayload,
        UserUpdatePayload,
    } from "@shared/types/user.type";
    import { Roles } from "@shared/constants/role.type";
    import { toast } from "svelte-sonner";
    import { onMount } from "svelte";

    // Props
    export let user: User | null = null; // If provided, we're editing
    export let onSuccess: () => void;
    export let onCancel: () => void;

    // Form state
    let name = "";
    let email = "";
    let password = "";
    let confirmPassword = "";
    let permissions = Roles.CLIENT;
    let loading = false;

    // Validation state
    let errors: Record<string, string> = {};

    const isEditing = !!user;

    // Role options
    const roleOptions = [
        { value: Roles.CLIENT, label: "Client" },
        { value: Roles.DEVELOPER, label: "Developer" },
        { value: Roles.SUPER_ADMIN, label: "Super Admin" },
    ];

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

        if (!isEditing) {
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

        try {
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

                await updateUser(user._id, updateData);
                toast.success("User updated successfully");
            } else {
                const createData: UserRegisterPayload = {
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    permissions,
                };

                await createUser(createData);
                toast.success("User created successfully");
            }

            onSuccess();
        } catch (err: any) {
            console.error("Error saving user:", err);
            const errorMessage = err?.message || "Failed to save user";
            toast.error(errorMessage);
        } finally {
            loading = false;
        }
    }

    function getRoleLabel(roleValue: number): string {
        const role = roleOptions.find((r) => r.value === roleValue);
        return role?.label || "Unknown";
    }

    $: selectedRoleValue = permissions.toString();
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
    <div class="space-y-2">
        <Label for="role">Role *</Label>
        <Select.Root
            type="single"
            value={selectedRoleValue}
            onValueChange={(value) => {
                if (value) {
                    permissions = parseInt(value);
                }
            }}
        >
            <Select.Trigger id="role" disabled={loading}>
                {getRoleLabel(permissions)}
            </Select.Trigger>
            <Select.Content>
                <Select.Group>
                    <Select.Label>User Roles</Select.Label>
                    {#each roleOptions as role (role.value)}
                        <Select.Item
                            value={role.value.toString()}
                            label={role.label}
                        >
                            {role.label}
                        </Select.Item>
                    {/each}
                </Select.Group>
            </Select.Content>
        </Select.Root>
    </div>

    <!-- Password Fields -->
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
                required={!isEditing}
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
                required={!isEditing || !!password}
                class={errors.confirmPassword ? "border-destructive" : ""}
                disabled={loading}
            />
            {#if errors.confirmPassword}
                <p class="text-sm text-destructive">{errors.confirmPassword}</p>
            {/if}
        </div>
    </div>

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
