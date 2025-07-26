<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Table from "$lib/components/ui/table";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { Badge } from "$lib/components/ui/badge";
    import {
        Tooltip,
        TooltipContent,
        TooltipProvider,
        TooltipTrigger,
    } from "$lib/components/ui/tooltip";
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
    import ReloadIcon from "@tabler/icons-svelte/icons/refresh";
    import Check from "@tabler/icons-svelte/icons/check";
    import Copy from "@tabler/icons-svelte/icons/copy";
    import {
        handleGetAllUsers,
        handleDeleteUser,
        handleRegenerateSetupToken,
    } from "@/services/user.service";
    import type { User } from "@shared/types/user.type";
    import { Roles } from "@shared/constants/role.type";
    import { cn } from "$lib/utils";
    import { successToast } from "@/services/toast.service";

    let users: User[] = [];
    let loading = true;
    let setupResult: { setupUrl: string; setupToken: string } | null = null;
    let createDialogOpen = false;
    let editDialogOpen = false;
    let setupLinkDialogOpen = false;
    let selectedUser: User | null = null;
    let copied = false;

    const roleLabels = new Map([
        [Roles.SUPER_ADMIN, "Super Admin"],
        [Roles.DEVELOPER, "Developer"],
        [Roles.CLIENT, "Client"],
    ]);

    const roleCharacters = new Map([
        [Roles.SUPER_ADMIN, "S"],
        [Roles.DEVELOPER, "D"],
        [Roles.CLIENT, "C"],
    ]);

    const roleStyles = new Map([
        [Roles.SUPER_ADMIN, "bg-purple-400/20 text-purple-500"],
        [Roles.DEVELOPER, "bg-blue-400/20 text-blue-500"],
        [Roles.CLIENT, "bg-green-400/20 text-green-500"],
    ]);

    onMount(loadUsers);

    async function loadUsers() {
        loading = true;
        const result = await handleGetAllUsers();
        if (result) users = result;
        loading = false;
    }

    const openCreateDialog = () => {
        selectedUser = null;
        createDialogOpen = true;
    };

    const openEditDialog = (user: User) => {
        selectedUser = user;
        editDialogOpen = true;
    };

    const deleteUser = async (user: User) => {
        const ok = await handleDeleteUser(user._id, user.name);
        if (ok) await loadUsers();
    };

    const regenerateSetupLink = async (user: User) => {
        const result = await handleRegenerateSetupToken(user._id, user.name);
        if (result) {
            setupResult = result;
            selectedUser = user;
            setupLinkDialogOpen = true;
        }
    };

    const handleUserSaved = (result?: any) => {
        createDialogOpen = false;
        editDialogOpen = false;
        selectedUser = null;

        if (result?.setupUrl) {
            setupResult = result;
            setupLinkDialogOpen = true;
        }

        loadUsers();
    };

    const getRoleLabel = (permissions: number) =>
        roleLabels.get(permissions) ?? "Unknown";
    const getRoleCharacter = (permissions: number) =>
        roleCharacters.get(permissions) ?? "?";
    const getRoleStyle = (permissions: number) =>
        roleStyles.get(permissions) ??
        "bg-gray-500 text-white border border-gray-400";

    const formatDate = (dateString: string | Date) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    };

    async function handleCopy() {
        if (setupResult?.setupUrl) {
            await navigator.clipboard.writeText(setupResult.setupUrl);
            copied = true;
            successToast("Setup link copied to clipboard");
            setTimeout(() => {
                copied = false;
            }, 1500);
        }
    }
</script>

<SiteHeader title="Users" />
<div class="flex flex-1 flex-col">
    <ScrollArea
        class="@container/main flex flex-col gap-2 max-h-[calc(100dvh-80px)]"
    >
        <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div class="px-4 lg:px-6">
                <div class="flex justify-end items-center mb-8">
                    <Button
                        onclick={openCreateDialog}
                        effect="expandIcon"
                        iconPlacement="right"
                        icon={PlusIcon}
                    >
                        Add User
                    </Button>
                </div>

                {#if loading}
                    <div class="text-center py-8">
                        <div class="text-gray-500">Loading users...</div>
                    </div>
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
                                        <Table.Head>Status</Table.Head>
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
                                                <TooltipProvider
                                                    delayDuration={300}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            {#snippet child({
                                                                props,
                                                            })}
                                                                <div
                                                                    class="inline-flex items-center justify-center w-6 h-6 rounded-sm text-xs font-semibold cursor-help transition-colors {getRoleStyle(
                                                                        user.permissions,
                                                                    )}"
                                                                    {...props}
                                                                >
                                                                    {getRoleCharacter(
                                                                        user.permissions,
                                                                    )}
                                                                </div>
                                                            {/snippet}
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            class="px-2 py-1 text-xs"
                                                        >
                                                            {getRoleLabel(
                                                                user.permissions,
                                                            )}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <TooltipProvider
                                                    delayDuration={300}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            {#snippet child({
                                                                props,
                                                            })}
                                                                <div
                                                                    class="inline-flex items-center justify-center w-3 h-3 rounded-full cursor-help transition-colors {user.isInitialized
                                                                        ? 'bg-green-500/60'
                                                                        : 'bg-yellow-500/60'}"
                                                                    {...props}
                                                                ></div>
                                                            {/snippet}
                                                        </TooltipTrigger>
                                                        <TooltipContent
                                                            class="px-2 py-1 text-xs"
                                                        >
                                                            {user.isInitialized
                                                                ? "Active"
                                                                : "Pending setup"}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
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
                                                                openEditDialog(
                                                                    user,
                                                                )}
                                                        >
                                                            <EditIcon
                                                                class="h-4 w-4 mr-2"
                                                            />
                                                            Edit
                                                        </DropdownMenu.Item>
                                                        {#if !user.isInitialized}
                                                            <DropdownMenu.Item
                                                                onclick={() =>
                                                                    regenerateSetupLink(
                                                                        user,
                                                                    )}
                                                            >
                                                                <ReloadIcon
                                                                    class="h-4 w-4 mr-2"
                                                                />
                                                                Regenerate setup
                                                                link
                                                            </DropdownMenu.Item>
                                                        {/if}
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
                                                                    deleteUser(
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
            <Dialog.Title>Create new user</Dialog.Title>
            <Dialog.Description
                >Add a new user to the system. Fill in the required information
                below.</Dialog.Description
            >
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
            <Dialog.Title>Edit user</Dialog.Title>
            <Dialog.Description
                >Update user information and permissions.</Dialog.Description
            >
        </Dialog.Header>
        <UserForm
            user={selectedUser}
            onSuccess={handleUserSaved}
            onCancel={() => (editDialogOpen = false)}
        />
    </Dialog.Content>
</Dialog.Root>

<!-- Setup Link Dialog -->
<Dialog.Root bind:open={setupLinkDialogOpen}>
    <Dialog.Content class="sm:max-w-[500px]">
        <Dialog.Header>
            <Dialog.Title>Generated setup link</Dialog.Title>
            <Dialog.Description
                >Copy this secure link and send it to the user to complete their
                account setup.</Dialog.Description
            >
        </Dialog.Header>
        {#if setupResult}
            <div class="space-y-4">
                <div
                    class="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 rounded-lg"
                >
                    <p class="text-sm text-green-800 dark:text-green-300 mb-3">
                        <strong>Setup link generated successfully!</strong> Copy
                        the link below and send it to the user through your preferred
                        communication method.
                    </p>
                    <div class="space-y-2">
                        <div class="relative">
                            <Input
                                id="setup-url"
                                value={setupResult.setupUrl}
                                readonly
                                class="text-sm font-mono pe-9"
                                onclick={(e) =>
                                    (e.target as HTMLInputElement)?.select()}
                            />
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        {#snippet child({ props })}
                                            <button
                                                {...props}
                                                onclick={handleCopy}
                                                class="text-muted-foreground/80 ring-offset-background hover:text-foreground focus-visible:border-ring focus-visible:text-foreground focus-visible:ring-ring/30 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg border border-transparent transition-shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:cursor-not-allowed"
                                                aria-label={copied
                                                    ? "Copied"
                                                    : "Copy to clipboard"}
                                                disabled={copied}
                                            >
                                                <div
                                                    class={cn(
                                                        "transition-all",
                                                        copied
                                                            ? "scale-100 opacity-100"
                                                            : "scale-0 opacity-0",
                                                    )}
                                                >
                                                    <Check
                                                        class="stroke-emerald-500"
                                                        size={16}
                                                    />
                                                </div>
                                                <div
                                                    class={cn(
                                                        "absolute transition-all",
                                                        copied
                                                            ? "scale-0 opacity-0"
                                                            : "scale-100 opacity-100",
                                                    )}
                                                >
                                                    <Copy size={16} />
                                                </div>
                                            </button>
                                        {/snippet}
                                    </TooltipTrigger>
                                    <TooltipContent
                                        class="border-input bg-popover text-muted-foreground border px-2 py-1 text-xs"
                                    >
                                        Copy to clipboard
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p class="text-xs text-muted-foreground">
                            ⚠️ This link expires in 48 hours for security
                            reasons.
                        </p>
                    </div>
                </div>

                <div class="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onclick={() => {
                            setupLinkDialogOpen = false;
                            setupResult = null;
                            selectedUser = null;
                        }}
                    >
                        Close
                    </Button>
                </div>
            </div>
        {/if}
    </Dialog.Content>
</Dialog.Root>
