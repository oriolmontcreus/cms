<script lang="ts">
	import DashboardIcon from "@tabler/icons-svelte/icons/dashboard";
	import FolderIcon from "@tabler/icons-svelte/icons/folder";
	import UsersIcon from "@tabler/icons-svelte/icons/users";
	import VariableIcon from "@tabler/icons-svelte/icons/variable";
	import LanguageIcon from "@tabler/icons-svelte/icons/language";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
	import { loggedUser } from "@/stores/loggedUser";
	import { CMS_NAME } from "@shared/env";
	import CmsLogo from "./CmsLogo.svelte";
	import { globalValidationState } from "$lib/stores/validationState";
	import { fly } from "svelte/transition";
	import { quintOut } from "svelte/easing";

	type Props = ComponentProps<typeof Sidebar.Root>;
	let { ...restProps }: Props = $props();

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
				title: "Global Variables",
				url: "/global-variables",
				icon: VariableIcon,
			},
			{
				title: "Translations",
				url: "/translations",
				icon: LanguageIcon,
			},
			{
				title: "Users",
				url: "/users",
				icon: UsersIcon,
			},
		],
	};
	const validationState = $derived($globalValidationState);
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

		<!-- Validation Panel (show when there are validation errors) -->
		{#if validationState.isVisible && (validationState.errors.length > 0 || validationState.totalErrors > 0)}
			<div
				transition:fly={{ y: -20, duration: 300, easing: quintOut }}
				class="validation-panel-container"
			>
				{#await import("$lib/components/form-builder/components/ValidationSidebarPanel.svelte") then { default: ValidationSidebarPanel }}
					<ValidationSidebarPanel
						errors={validationState.errors}
						isVisible={validationState.isVisible}
						totalErrors={validationState.totalErrors}
						fixedErrors={validationState.fixedErrors}
						on:navigateToError={(e) =>
							validationState.onNavigateToError?.(e.detail.error)}
						on:nextError={() => validationState.onNextError?.()}
						on:previousError={() =>
							validationState.onPreviousError?.()}
					/>
				{/await}
			</div>
		{/if}
	</Sidebar.Content>
	<Sidebar.Footer>
		{#if $loggedUser}
			<NavUser user={$loggedUser} />
		{/if}
	</Sidebar.Footer>
</Sidebar.Root>

<style>
	.validation-panel-container {
		will-change: transform, opacity;
	}
</style>
