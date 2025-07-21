<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Table from "$lib/components/ui/table";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
    import SiteHeader from "$lib/components/site-header.svelte";
    import UserForm from "./UserForm.svelte";
    import PlusIcon from "@tabler/icons-svelte/icons/plus";
    import DotsVerticalIcon from "@tabler/icons-svelte/icons/dots-vertical";
    import EditIcon from "@tabler/icons-svelte/icons/edit";
    import TrashIcon from "@tabler/icons-svelte/icons/trash";
    import {
        handleGetAllUsers,
        handleDeleteUser,
    } from "@/services/user.service";
    import type { User } from "@shared/types/user.type";
    import { Roles } from "@shared/constants/role.type";

    let users: User[] = [];
    let loading = true;
    let error: string | null = null;

    // Dialog states
    let createDialogOpen = false;
    let editDialogOpen = false;
    let selectedUser: User | null = null;

    // Load users on mount
    onMount(async () => {
        await loadUsers();
    });

    async function loadUsers() {
        loading = true;
        error = null;

        const result = await handleGetAllUsers();
        if (result) {
            users = result;
        } else {
            error = "Failed to load users";
        }

        loading = false;
    }

    function handleCreateUser() {
        selectedUser = null;
        createDialogOpen = true;
    }

    function handleEditUser(user: User) {
        selectedUser = user;
        editDialogOpen = true;
    }

    async function deleteUserConfirm(user: User) {
        const success = await handleDeleteUser(user._id, user.name);
        if (success) {
            await loadUsers(); // Refresh the list
        }
    }

    function handleUserSaved() {
        createDialogOpen = false;
        editDialogOpen = false;
        selectedUser = null;
        loadUsers(); // Refresh the list
    }

    function getRoleLabel(permissions: number): string {
        switch (permissions) {
            case Roles.SUPER_ADMIN:
                return "Super Admin";
            case Roles.DEVELOPER:
                return "Developer";
            case Roles.CLIENT:
                return "Client";
            default:
                return "Unknown";
        }
    }

    function getRoleVariant(
        permissions: number,
    ): "default" | "secondary" | "destructive" {
        switch (permissions) {
            case Roles.SUPER_ADMIN:
                return "destructive";
            case Roles.DEVELOPER:
                return "default";
            case Roles.CLIENT:
                return "secondary";
            default:
                return "secondary";
        }
    }

    function formatDate(dateString: string | Date): string {
        const date = new Date(dateString);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    }
</script>

<SiteHeader title="Users" />
<div class="flex flex-1 flex-col">
    <ScrollArea
        class="@container/main flex flex-col gap-2 max-h-[calc(100dvh-80px)]"
    >
        <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div class="px-4 lg:px-6">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h1 class="text-2xl font-bold">User Management</h1>
                        <p class="text-muted-foreground">
                            Manage system users and their permissions
                        </p>
                    </div>
                    <Button onclick={handleCreateUser}>
                        <PlusIcon class="h-4 w-4 mr-2" />
                        Add User
                    </Button>
                </div>

                {#if loading}
                    <div class="text-center py-8">
                        <div class="text-gray-500">Loading users...</div>
                    </div>
                {:else if error}
                    <Card>
                        <CardContent class="py-8">
                            <div class="text-center text-red-500">{error}</div>
                            <div class="text-center mt-4">
                                <Button onclick={loadUsers} variant="outline">
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                {:else if users.length === 0}
                    <Card>
                        <CardContent class="py-8">
                            <div class="text-center text-gray-500">
                                No users found. Create your first user to get
                                started.
                            </div>
                        </CardContent>
                    </Card>
                {:else}
                    <Card>
                        <CardHeader>
                            <CardTitle>Users ({users.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table.Root>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.Head>Name</Table.Head>
                                        <Table.Head>Email</Table.Head>
                                        <Table.Head>Role</Table.Head>
                                        <Table.Head>Created</Table.Head>
                                        <Table.Head>Updated</Table.Head>
                                        <Table.Head class="w-[100px]"
                                            >Actions</Table.Head
                                        >
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {#each users as user (user._id)}
                                        <Table.Row>
                                            <Table.Cell class="font-medium"
                                                >{user.name}</Table.Cell
                                            >
                                            <Table.Cell>{user.email}</Table.Cell
                                            >
                                            <Table.Cell>
                                                <Badge
                                                    variant={getRoleVariant(
                                                        user.permissions,
                                                    )}
                                                >
                                                    {getRoleLabel(
                                                        user.permissions,
                                                    )}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell
                                                >{formatDate(
                                                    user.createdAt,
                                                )}</Table.Cell
                                            >
                                            <Table.Cell
                                                >{formatDate(
                                                    user.updatedAt,
                                                )}</Table.Cell
                                            >
                                            <Table.Cell>
                                                <DropdownMenu.Root>
                                                    <DropdownMenu.Trigger>
                                                        {#snippet child({
                                                            props,
                                                        })}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                {...props}
                                                            >
                                                                <DotsVerticalIcon
                                                                    class="h-4 w-4"
                                                                />
                                                                <span
                                                                    class="sr-only"
                                                                    >Open menu</span
                                                                >
                                                            </Button>
                                                        {/snippet}
                                                    </DropdownMenu.Trigger>
                                                    <DropdownMenu.Content
                                                        align="end"
                                                    >
                                                        <DropdownMenu.Item
                                                            onclick={() =>
                                                                handleEditUser(
                                                                    user,
                                                                )}
                                                        >
                                                            <EditIcon
                                                                class="h-4 w-4 mr-2"
                                                            />
                                                            Edit
                                                        </DropdownMenu.Item>
                                                        <DropdownMenu.Separator
                                                        />
                                                        <DropdownMenu.Item
                                                            variant="destructive"
                                                            onclick={() => {
                                                                if (
                                                                    confirm(
                                                                        "Are you sure you want to delete this user? This action cannot be undone.",
                                                                    )
                                                                ) {
                                                                    deleteUserConfirm(
                                                                        user,
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            <TrashIcon
                                                                class="h-4 w-4 mr-2"
                                                            />
                                                            Delete
                                                        </DropdownMenu.Item>
                                                    </DropdownMenu.Content>
                                                </DropdownMenu.Root>
                                            </Table.Cell>
                                        </Table.Row>
                                    {/each}
                                </Table.Body>
                            </Table.Root>
                        </CardContent>
                    </Card>
                {/if}
            </div>
        </div>
    </ScrollArea>
</div>

<!-- Create User Dialog -->
<Dialog.Root bind:open={createDialogOpen}>
    <Dialog.Content class="sm:max-w-[600px]">
        <Dialog.Header>
            <Dialog.Title>Create New User</Dialog.Title>
            <Dialog.Description>
                Add a new user to the system. Fill in the required information
                below.
            </Dialog.Description>
        </Dialog.Header>
        <UserForm
            onSuccess={handleUserSaved}
            onCancel={() => (createDialogOpen = false)}
        />
    </Dialog.Content>
</Dialog.Root>

<!-- Edit User Dialog -->
<Dialog.Root bind:open={editDialogOpen}>
    <Dialog.Content class="sm:max-w-[600px]">
        <Dialog.Header>
            <Dialog.Title>Edit User</Dialog.Title>
            <Dialog.Description>
                Update user information and permissions.
            </Dialog.Description>
        </Dialog.Header>
        <UserForm
            user={selectedUser}
            onSuccess={handleUserSaved}
            onCancel={() => (editDialogOpen = false)}
        />
    </Dialog.Content>
</Dialog.Root>
