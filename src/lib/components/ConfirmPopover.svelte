<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';

	export let title: string = 'Are you sure?';
	export let description: string = 'This action cannot be undone.';
	export let confirmText: string = 'Confirm';
	export let cancelText: string = 'Cancel';
	export let variant: 'default' | 'destructive' = 'destructive';
	export let onConfirm: () => void;
	export let onCancel: (() => void) | undefined = undefined;
	export let disabled: boolean = false;

	let open = false;

	function handleConfirm() {
		onConfirm();
		open = false;
	}

	function handleCancel() {
		onCancel?.();
		open = false;
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		<slot />
	</PopoverTrigger>
	<PopoverContent class="w-80">
		<div class="space-y-4">
			<div class="space-y-2">
				<h4 class="font-medium leading-none text-black dark:text-white">{title}</h4>
				<p class="text-sm text-muted-foreground">{description}</p>
			</div>
			<div class="flex justify-end space-x-2">
				<Button
					variant="outline"
					size="sm"
					onclick={handleCancel}
					{disabled}
				>
					{cancelText}
				</Button>
				<Button
					{variant}
					size="sm"
					onclick={handleConfirm}
					{disabled}
				>
					{confirmText}
				</Button>
			</div>
		</div>
	</PopoverContent>
</Popover> 