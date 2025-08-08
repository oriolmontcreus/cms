<script lang="ts">
	import DashboardIcon from "@tabler/icons-svelte/icons/dashboard";
	import FolderIcon from "@tabler/icons-svelte/icons/folder";
	import InnerShadowTopIcon from "@tabler/icons-svelte/icons/inner-shadow-top";
	import UsersIcon from "@tabler/icons-svelte/icons/users";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import SettingsIcon from "@tabler/icons-svelte/icons/settings";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
	import { loggedUser } from "@/stores/loggedUser";
	import { CMS_NAME } from "@shared/env";

	const data = {
		navMain: [
			{
				title: "Dashboard",
				url: "/",
				icon: DashboardIcon,
			},
			{
				title: "Pages",
				url: "/pages",
				icon: FolderIcon,
			},
			{
				title: "Users",
				url: "/users",
				icon: UsersIcon,
			},
			{
				title: "Settings",
				url: "#",
				icon: SettingsIcon,
			},
		],
	};

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton
					class="data-[slot=sidebar-menu-button]:!p-1.5"
				>
					{#snippet child({ props })}
						<a href="##" {...props}>
							<InnerShadowTopIcon class="!size-5" />
							<span class="text-base font-semibold"
								>{CMS_NAME}</span
							>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		{#if $loggedUser}
			<NavUser user={$loggedUser} />
		{/if}
	</Sidebar.Footer>
</Sidebar.Root>
