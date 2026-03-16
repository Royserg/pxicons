<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { lucideIcons, type PixelIcon, type PixelShape } from '@pxicons/lucide';
	import { buildGridSvgOptions } from '$lib/icon-grid-render';
	import { filterPixelIcons } from '$lib/icon-search';
	import { buildCustomizedSvg } from '$lib/icon-svg';
	import { getIconRowCount, getIconsForRow } from '$lib/icon-grid-rows';
	import * as Drawer from '$lib/components/ui/drawer';

	const icons = lucideIcons;
	const shapeOptions: PixelShape[] = ['square', 'circle', 'rounded'];
	const GRID_OVERSCAN_ROWS = 6;

	let query = $state('');
	let selectedId = $state('');
	let drawerOpen = $state(false);
	let color = $state('#f3f5f8');
	let size = $state(192);
	let shape = $state<PixelShape>('square');
	let pixelGap = $state(0);
	let metaballEnabled = $state(false);
	let metaballStrength = $state(45);
	let withBackground = $state(false);
	let backgroundColor = $state('#0f0f10');
	let copyStatus = $state('');
	let gridWidth = $state(0);
	let gridGap = $state(8);
	let tileMinWidth = $state(96);
	let tileRowHeight = $state(95);

	let gridViewportElement = $state<HTMLElement | null>(null);

	const filteredIcons = $derived(filterPixelIcons(icons, query));
	const gridColumns = $derived.by(() => {
		const safeTileWidth = Math.max(1, tileMinWidth);
		const safeGap = Math.max(0, gridGap);
		const width = Math.max(gridWidth, safeTileWidth);

		return Math.max(1, Math.floor((width + safeGap) / (safeTileWidth + safeGap)));
	});
	const virtualRowCount = $derived(getIconRowCount(filteredIcons.length, gridColumns));

	const rowVirtualizer = createVirtualizer<HTMLElement, HTMLElement>({
		count: 0,
		getScrollElement: () => gridViewportElement,
		estimateSize: () => tileRowHeight + gridGap,
		overscan: GRID_OVERSCAN_ROWS
	});

	const virtualRows = $derived($rowVirtualizer.getVirtualItems());
	const virtualTotalHeight = $derived($rowVirtualizer.getTotalSize());

	const selectedIcon = $derived.by(() => {
		if (!selectedId) {
			return null;
		}

		return filteredIcons.find((icon) => icon.id === selectedId) ?? null;
	});

	const customizedSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		return buildCustomizedSvg(selectedIcon, {
			color,
			size,
			padding: 0,
			pixelGap,
			backgroundColor: withBackground ? backgroundColor : '',
			shape,
			scope: 'detail'
		});
	});

	const previewSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		return buildCustomizedSvg(selectedIcon, {
			color,
			size: 24,
			padding: 0,
			pixelGap,
			backgroundColor: withBackground ? backgroundColor : '',
			shape,
			scope: 'detail',
			metaball: {
				enabled: metaballEnabled,
				strength: metaballStrength
			}
		});
	});

	$effect(() => {
		get(rowVirtualizer).setOptions({
			count: virtualRowCount,
			getScrollElement: () => gridViewportElement,
			estimateSize: () => tileRowHeight + gridGap,
			overscan: GRID_OVERSCAN_ROWS
		});
	});

	$effect(() => {
		if (selectedId && !filteredIcons.some((icon) => icon.id === selectedId)) {
			clearSelection();
		}
	});

	function selectIcon(icon: PixelIcon): void {
		selectedId = icon.id;
		drawerOpen = true;
		copyStatus = '';
	}

	function clearSelection(): void {
		selectedId = '';
		drawerOpen = false;
		copyStatus = '';
	}

	function syncGridMetrics(): void {
		if (!gridViewportElement) {
			return;
		}

		gridWidth = gridViewportElement.clientWidth;

		const styles = getComputedStyle(gridViewportElement);
		const nextGap = Number.parseFloat(styles.getPropertyValue('--grid-gap'));
		const nextTileWidth = Number.parseFloat(styles.getPropertyValue('--tile-min-width'));
		const nextRowHeight = Number.parseFloat(styles.getPropertyValue('--tile-row-height'));

		if (Number.isFinite(nextGap) && nextGap >= 0) {
			gridGap = nextGap;
		}

		if (Number.isFinite(nextTileWidth) && nextTileWidth > 0) {
			tileMinWidth = nextTileWidth;
		}

		if (Number.isFinite(nextRowHeight) && nextRowHeight > 0) {
			tileRowHeight = nextRowHeight;
		}
	}

	function getGridIconSvg(icon: PixelIcon): string {
		return buildCustomizedSvg(icon, buildGridSvgOptions(selectedId === icon.id));
	}

	async function copyText(value: string, label: string): Promise<void> {
		if (!value) {
			return;
		}

		try {
			await navigator.clipboard.writeText(value);
			copyStatus = `${label} copied to clipboard.`;
		} catch {
			copyStatus = `${label} copy failed. Clipboard permission may be blocked.`;
		}
	}

	onMount(() => {
		syncGridMetrics();

		const resizeObserver =
			typeof ResizeObserver === 'undefined' || !gridViewportElement
				? null
				: new ResizeObserver(() => {
						syncGridMetrics();
				  });

		if (resizeObserver && gridViewportElement) {
			resizeObserver.observe(gridViewportElement);
		}

		window.addEventListener('resize', syncGridMetrics);

		return () => {
			resizeObserver?.disconnect();
			window.removeEventListener('resize', syncGridMetrics);
		};
	});
</script>

<div class="catalog-shell">
	<div class="catalog-toolbar">
		<p class="pl-1 text-sm text-muted-foreground">{filteredIcons.length} results</p>
		<label class="search-field" for="icon-search">
			<input
				id="icon-search"
				type="search"
				placeholder="Search pixel icons..."
				bind:value={query}
			/>
			<kbd>⌘K</kbd>
		</label>
	</div>

	<section class="icon-grid-section" aria-label="Available pixel icons">
		{#if filteredIcons.length === 0}
			<p class="empty-state">No icon matches this query.</p>
		{:else}
			<div class="icon-grid-viewport" bind:this={gridViewportElement}>
				<div class="icon-grid-canvas" style={`height:${Math.max(1, virtualTotalHeight)}px`}>
					{#each virtualRows as virtualRow (virtualRow.key)}
						<div
							class="icon-grid-row-wrapper"
							style={`transform:translateY(${virtualRow.start}px);height:${virtualRow.size}px`}
						>
							<div
								class="icon-grid-row"
								style={`--grid-columns:${gridColumns}`}
							>
								{#each getIconsForRow(filteredIcons, gridColumns, virtualRow.index) as icon (icon.id)}
									<button
										type="button"
										class="icon-tile"
										class:active={selectedId === icon.id}
										onclick={() => selectIcon(icon)}
									>
										<span class="tile-canvas">{@html getGridIconSvg(icon)}</span>
										<span class="tile-label">{icon.id}</span>
									</button>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</section>

	<Drawer.Root bind:open={drawerOpen} shouldScaleBackground={false}>
		{#if selectedIcon}
			<Drawer.Content class="selected-drawer">
				<section class="selected-panel" aria-live="polite">
					<div class="selected-preview">
						<div class="preview-canvas" style="--pixel-scale: 12;">
							{@html previewSvg}
						</div>
					</div>

					<div class="selected-content">
						<div class="selected-heading">
							<h2>{selectedIcon.name}</h2>
							<div class="selected-heading-actions">
								<span>24x24 canvas</span>
								<button
									type="button"
									class="close-button"
									onclick={clearSelection}
									aria-label="Close"
								>
									×
								</button>
							</div>
						</div>
						<p class="selected-tags">{selectedIcon.tags.join(' · ')}</p>

						<div class="control-grid">
							<label>
								Color
								<input type="color" bind:value={color} />
							</label>

							<label>
								Export size <span>{size}px</span>
								<input type="range" min="64" max="384" step="8" bind:value={size} />
							</label>

							<label>
								Pixel gap <span>{pixelGap.toFixed(2)}</span>
								<input type="range" min="0" max="0.95" step="0.01" bind:value={pixelGap} />
							</label>

							<div class="shape-control">
								<span>Pixel shape</span>
								<div class="shape-options">
									{#each shapeOptions as candidate (candidate)}
										<button
											type="button"
											class:active={shape === candidate}
											onclick={() => {
												shape = candidate;
											}}
										>
											{candidate}
										</button>
									{/each}
								</div>
							</div>

							<label class="toggle-row">
								<input type="checkbox" bind:checked={metaballEnabled} />
								Liquid merge
							</label>

							<label class:disabled={!metaballEnabled}>
								Strength <span>{metaballStrength}</span>
								<input
									type="range"
									min="0"
									max="100"
									step="1"
									bind:value={metaballStrength}
									disabled={!metaballEnabled}
								/>
							</label>

							<label class="toggle-row">
								<input type="checkbox" bind:checked={withBackground} />
								Use background
							</label>

							<label class:disabled={!withBackground}>
								Background
								<input type="color" bind:value={backgroundColor} disabled={!withBackground} />
							</label>
						</div>

						<div class="action-row">
							<button type="button" onclick={() => copyText(selectedIcon.svg, 'Raw SVG')}>
								Copy raw SVG
							</button>
							<button type="button" onclick={() => copyText(customizedSvg, 'Customized SVG')}>
								Copy customized SVG
							</button>
						</div>

						{#if copyStatus}
							<p class="copy-status">{copyStatus}</p>
						{/if}
					</div>
				</section>
			</Drawer.Content>
		{/if}
	</Drawer.Root>
</div>
