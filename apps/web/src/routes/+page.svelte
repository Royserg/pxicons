<script lang="ts">
	import { onMount } from 'svelte';
	import { lucideIcons, type PixelIcon, type PixelShape } from '@pxicons/lucide';
	import { filterPixelIcons } from '$lib/icon-search';
	import { buildCustomizedSvg } from '$lib/icon-svg';
	import { computeVirtualGridWindow } from '$lib/icon-grid-window';
	import * as Drawer from '$lib/components/ui/drawer';

	const icons = lucideIcons;
	const shapeOptions: PixelShape[] = ['square', 'circle', 'rounded'];
	const packageFilters = [{ id: 'lucide', label: 'Lucide', count: icons.length }];
	const GRID_OVERSCAN_ROWS = 4;

	let query = $state('');
	let selectedId = $state('');
	let drawerOpen = $state(false);
	let color = $state('#f3f5f8');
	let size = $state(192);
	let shape = $state<PixelShape>('square');
	let metaballEnabled = $state(false);
	let metaballStrength = $state(45);
	let withBackground = $state(false);
	let backgroundColor = $state('#0f0f10');
	let copyStatus = $state('');
	let windowScrollY = $state(0);
	let viewportHeight = $state(0);
	let gridWidth = $state(0);
	let gridGap = $state(8);
	let tileMinWidth = $state(96);
	let tileRowHeight = $state(96);
	let gridOffsetTop = $state(0);

	let gridElement: HTMLElement | null = null;

	const filteredIcons = $derived(filterPixelIcons(icons, query));
	const gridColumns = $derived.by(() => {
		const safeTileWidth = Math.max(1, tileMinWidth);
		const safeGap = Math.max(0, gridGap);
		const width = Math.max(gridWidth, safeTileWidth);

		return Math.max(1, Math.floor((width + safeGap) / (safeTileWidth + safeGap)));
	});
	const relativeScrollTop = $derived(Math.max(0, windowScrollY - gridOffsetTop));
	const virtualWindow = $derived(
		computeVirtualGridWindow({
			totalItems: filteredIcons.length,
			columns: gridColumns,
			rowHeight: tileRowHeight,
			viewportHeight: viewportHeight || 720,
			scrollTop: relativeScrollTop,
			overscanRows: GRID_OVERSCAN_ROWS
		})
	);
	const visibleIcons = $derived(filteredIcons.slice(virtualWindow.startIndex, virtualWindow.endIndex));

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
		if (selectedId && !filteredIcons.some((icon) => icon.id === selectedId)) {
			clearSelection();
		}
	});

	$effect(() => {
		void filteredIcons.length;
		syncGridMetrics();
	});

	$effect(() => {
		if (!drawerOpen && selectedId) {
			selectedId = '';
			copyStatus = '';
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
		if (!gridElement || typeof window === 'undefined') {
			return;
		}

		gridWidth = gridElement.clientWidth;
		gridOffsetTop = gridElement.getBoundingClientRect().top + window.scrollY;

		const styles = getComputedStyle(gridElement);
		const nextGap = Number.parseFloat(styles.rowGap || styles.gap || '8');
		const nextTileWidth = Number.parseFloat(styles.getPropertyValue('--tile-min-width'));
		const nextRowHeight = Number.parseFloat(styles.getPropertyValue('--tile-row-height'));

		if (Number.isFinite(nextGap)) {
			gridGap = nextGap;
		}

		if (Number.isFinite(nextTileWidth) && nextTileWidth > 0) {
			tileMinWidth = nextTileWidth;
		}

		if (Number.isFinite(nextRowHeight) && nextRowHeight > 0) {
			tileRowHeight = nextRowHeight;
		}
	}

	function handleViewportChange(): void {
		if (typeof window === 'undefined') {
			return;
		}

		windowScrollY = window.scrollY;
		viewportHeight = window.innerHeight;
		syncGridMetrics();
	}

	function getGridIconSvg(icon: PixelIcon): string {
		const isSelected = selectedId === icon.id;

		return buildCustomizedSvg(icon, {
			color: isSelected ? '#fafafa' : '#d6d6d9',
			size: 24,
			padding: 0,
			backgroundColor: '',
			shape,
			scope: 'grid'
		});
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
		handleViewportChange();

		const resizeObserver =
			typeof ResizeObserver === 'undefined' || !gridElement
				? null
				: new ResizeObserver(() => {
						syncGridMetrics();
					});

		if (resizeObserver && gridElement) {
			resizeObserver.observe(gridElement);
		}

		window.addEventListener('scroll', handleViewportChange, { passive: true });
		window.addEventListener('resize', handleViewportChange);

		return () => {
			resizeObserver?.disconnect();
			window.removeEventListener('scroll', handleViewportChange);
			window.removeEventListener('resize', handleViewportChange);
		};
	});
</script>

<div class="catalog-shell">
	<!-- <div class="filter-row" aria-label="Icon package filters"> -->
	<!-- 	{#each packageFilters as filter (filter.id)} -->
	<!-- 		<button class="filter-pill active" type="button"> -->
	<!-- 			<span>{filter.label}</span> -->
	<!-- 			<small>{filter.count}</small> -->
	<!-- 		</button> -->
	<!-- 	{/each} -->
	<!-- </div> -->

	<div class="flex flex-col">
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

	<section class="icon-grid" aria-label="Available pixel icons" bind:this={gridElement}>
		{#if filteredIcons.length === 0}
			<p class="empty-state">No icon matches this query.</p>
		{:else}
			{#if virtualWindow.topSpacerHeight > 0}
				<div
					class="grid-spacer"
					style={`height:${virtualWindow.topSpacerHeight}px`}
					aria-hidden="true"
				></div>
			{/if}

			{#each visibleIcons as icon (icon.id)}
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

			{#if virtualWindow.bottomSpacerHeight > 0}
				<div
					class="grid-spacer"
					style={`height:${virtualWindow.bottomSpacerHeight}px`}
					aria-hidden="true"
				></div>
			{/if}
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
