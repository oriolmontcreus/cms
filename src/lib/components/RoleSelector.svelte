<script lang="ts">
    import * as Select from "$lib/components/ui/select";
    import { Label } from "$lib/components/ui/label";
    import { Roles } from "@shared/constants/role.type";

    // Props
    export let value: number = Roles.CLIENT;
    export let onValueChange: (value: number) => void;
    export let disabled: boolean = false;
    export let label: string = "Role";
    export let id: string = "role";

    // Role configuration
    const roleOptions = [
        {
            value: Roles.CLIENT,
            label: "Client",
            description:
                "Basic access to view content and limited functionality",
        },
        {
            value: Roles.DEVELOPER,
            label: "Developer",
            description:
                "Access to content management, page creation, and development tools",
        },
        {
            value: Roles.SUPER_ADMIN,
            label: "Super Admin",
            description:
                "Full system access including user management and system settings",
        },
    ];

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

    function getRoleLabel(roleValue: number): string {
        const role = roleOptions.find((r) => r.value === roleValue);
        return role?.label || "Unknown";
    }

    function getRoleCharacter(roleValue: number): string {
        return roleCharacters.get(roleValue) ?? "?";
    }

    function getRoleStyle(roleValue: number): string {
        return roleStyles.get(roleValue) ?? "bg-gray-500/20 text-gray-500";
    }

    $: selectedRoleValue = value.toString();
</script>

<div class="space-y-2">
    <Label for={id}>{label}</Label>
    <div class="flex items-center gap-2">
        <Select.Root
            type="single"
            value={selectedRoleValue}
            onValueChange={(selectedValue) => {
                if (selectedValue) {
                    onValueChange(parseInt(selectedValue));
                }
            }}
        >
            <Select.Trigger {id} {disabled} class="w-42">
                <div class="flex items-center gap-2">
                    <div
                        class="inline-flex items-center justify-center w-6 h-6 rounded-sm text-xs font-semibold transition-colors {getRoleStyle(
                            value,
                        )}"
                    >
                        {getRoleCharacter(value)}
                    </div>
                    <span>{getRoleLabel(value)}</span>
                </div>
            </Select.Trigger>
            <Select.Content>
                <Select.Group>
                    <Select.Label>User roles</Select.Label>
                    {#each roleOptions as role (role.value)}
                        <Select.Item
                            value={role.value.toString()}
                            label={role.label}
                        >
                            <div class="flex items-start gap-3 py-1">
                                <div
                                    class="inline-flex items-center justify-center w-6 h-6 rounded-sm text-xs font-semibold transition-colors {getRoleStyle(
                                        role.value,
                                    )}"
                                >
                                    {getRoleCharacter(role.value)}
                                </div>
                                <div class="flex flex-col gap-0.5">
                                    <span class="font-medium">{role.label}</span
                                    >
                                    <span class="text-xs text-muted-foreground"
                                        >{role.description}</span
                                    >
                                </div>
                            </div>
                        </Select.Item>
                    {/each}
                </Select.Group>
            </Select.Content>
        </Select.Root>
    </div>
</div>
