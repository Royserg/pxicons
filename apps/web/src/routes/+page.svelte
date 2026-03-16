<script lang="ts">
	import { lucideIcons, type PixelIcon, type PixelShape } from '@pxicons/lucide';
	import { filterPixelIcons } from '$lib/icon-search';
	import { buildCustomizedSvg } from '$lib/icon-svg';
	import * as Drawer from '$lib/components/ui/drawer';

	const icons = lucideIcons;
	const shapeOptions: PixelShape[] = ['square', 'circle', 'rounded'];
	const packageFilters = [{ id: 'lucide', label: 'Lucide', count: icons.length }];

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

	const filteredIcons = $derived(filterPixelIcons(icons, query));

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
</script>

<section class="lucide-page">
	<header class="top-nav">
		<div class="brand">
			<strong>PXIcons</strong>
			<small>Pixel Icon Platform</small>
		</div>
	</header>

	<div class="catalog-shell">
		<div class="filter-row" aria-label="Icon package filters">
			{#each packageFilters as filter (filter.id)}
				<button class="filter-pill active" type="button">
					<span>{filter.label}</span>
					<small>{filter.count}</small>
				</button>
			{/each}
		</div>

		<div class="search-wrap">
			<label class="search-field" for="icon-search">
				<input
					id="icon-search"
					type="search"
					placeholder="Search pixel icons..."
					bind:value={query}
				/>
				<kbd>⌘K</kbd>
			</label>
			<p class="results-note">{filteredIcons.length} results</p>
		</div>

		<section class="icon-grid" aria-label="Available pixel icons">
			{#if filteredIcons.length === 0}
				<p class="empty-state">No icon matches this query.</p>
			{/if}

			{#each filteredIcons as icon (icon.id)}
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
</section>
