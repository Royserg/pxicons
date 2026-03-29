<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: DrawerPrimitive.HandleProps = $props();
</script>

<DrawerPrimitive.Handle
	bind:ref
	data-slot="drawer-handle"
	class={cn(
		"bg-muted mx-auto mt-3 h-3 w-[132px] shrink-0 rounded-full transition-colors hover:bg-muted/80 cursor-grab active:cursor-grabbing group-data-[vaul-drawer-direction=bottom]/drawer-content:block",
		className
	)}
	{...restProps}
/>
