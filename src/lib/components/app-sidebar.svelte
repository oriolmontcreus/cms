<script lang="ts">
	import DashboardIcon from "@tabler/icons-svelte/icons/dashboard";
	import FolderIcon from "@tabler/icons-svelte/icons/folder";
	import UsersIcon from "@tabler/icons-svelte/icons/users";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
	import { loggedUser } from "@/stores/loggedUser";
	import { CMS_NAME } from "@shared/env";
	import CmsLogo from "./CmsLogo.svelte";

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
		],
	};

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<div class="flex justify-start gap-1 items-center">
					<CmsLogo textSize="text-sm" />
					<span class="text-base font-extralight">{CMS_NAME}</span>
				</div>
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
