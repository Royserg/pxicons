<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';

	let drawerOpen = $state(false);
</script>

<section class="test-shell">
	<button type="button" class="test-open-button" onclick={() => (drawerOpen = true)}>
		Open Drawer
	</button>
</section>

<Drawer.Root bind:open={drawerOpen} shouldScaleBackground={false}>
	<Drawer.Content class="selected-drawer">
		<section class="test-drawer-panel">
			<h2>Drawer Performance Test</h2>
			<p>This route renders only a trigger and drawer content for isolated profiling.</p>

			<div class="test-actions">
				<button type="button" class="test-close-button" onclick={() => (drawerOpen = false)}>
					Close
				</button>
			</div>
		</section>
	</Drawer.Content>
</Drawer.Root>

<style>
	.test-shell {
		flex: 1 1 auto;
		min-height: 0;
		display: grid;
		place-items: center;
	}

	.test-open-button {
		padding: 0.6rem 0.95rem;
		border: 1px solid #2d2d31;
		border-radius: 10px;
		background: #111114;
		color: #f6f6f8;
		cursor: pointer;
	}

	.test-open-button:hover {
		border-color: #47474d;
	}

	.test-drawer-panel {
		width: min(820px, calc(100vw - 1rem));
		margin: 0 auto;
		padding: 1rem;
		display: grid;
		gap: 0.7rem;
	}

	.test-drawer-panel h2,
	.test-drawer-panel p {
		margin: 0;
	}

	.test-actions {
		display: flex;
		justify-content: flex-end;
	}

	.test-close-button {
		padding: 0.5rem 0.8rem;
		border: 1px solid #2d2d31;
		border-radius: 8px;
		background: #121215;
		color: #f6f6f8;
		cursor: pointer;
	}

	.test-close-button:hover {
		border-color: #47474d;
	}
</style>
