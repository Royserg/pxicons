<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { lucideIcons, type PixelIcon } from '@pxicons/lucide';
	import { buildGridSvgOptions } from '$lib/icon-grid-render';
	import { filterPixelIcons } from '$lib/icon-search';
	import { buildCustomizedSvg, buildExportSvg } from '$lib/icon-svg';
	import { getIconRowCount, getIconsForRow } from '$lib/icon-grid-rows';
	import * as Drawer from '$lib/components/ui/drawer';

	const icons = lucideIcons;
	const GRID_OVERSCAN_ROWS = 3;
	const SEARCH_DEBOUNCE_MS = 180;
	const SEARCH_LOADING_DELAY_MS = 120;
	const DETAIL_PREVIEW_COLOR = '#f3f5f8';
	const CUSTOMIZE_EXPORT_COLOR = 'currentColor';
	const CUSTOMIZE_PREVIEW_SIZE = 192;
	const drawerTabs = [
		{ id: 'usage', label: 'Usage' },
		{ id: 'customize', label: 'Customize' }
	] as const;

	const usageTabs = [
		{
			id: 'svelte',
			label: 'Svelte',
			language: 'svelte',
			packageName: '@pxicons/lucide-svelte',
			snippet: (componentName: string): string => `<script>
  import { ${componentName} } from '@pxicons/lucide-svelte';
<\/script>

<${componentName} />`
		}
	] as const;

	type DrawerTabId = (typeof drawerTabs)[number]['id'];
	type UsageTabId = (typeof usageTabs)[number]['id'];

	let queryInput = $state('');
	let debouncedQuery = $state('');
	let filteredIcons = $state<readonly PixelIcon[]>([]);
	let isSearchLoading = $state(true);
	let selectedId = $state('');
	let drawerOpen = $state(false);
	let activeDrawerTab = $state<DrawerTabId>('usage');
	let activeUsageTab = $state<UsageTabId>(usageTabs[0].id);
	let customizeSvgCode = $state('');
	let customizeSvgSourceIconId = $state('');
	let copyStatus = $state('');
	let pendingClearSelection = $state(false);
	let gridWidth = $state(0);
	let gridGap = $state(8);
	let tileMinWidth = $state(136);
	let tileRowHeight = $state(135);
	let gridIconsSnapshot = $state<readonly PixelIcon[]>(icons);
	let searchRequestId = 0;
	let activeLoadingTimer: number | null = null;
	let activeFilterTimer: number | null = null;

	let gridViewportElement = $state<HTMLElement | null>(null);

	const renderedGridIcons = $derived(drawerOpen ? gridIconsSnapshot : filteredIcons);
	const gridColumns = $derived.by(() => {
		const safeTileWidth = Math.max(1, tileMinWidth);
		const safeGap = Math.max(0, gridGap);
		const width = Math.max(gridWidth, safeTileWidth);

		return Math.max(1, Math.floor((width + safeGap) / (safeTileWidth + safeGap)));
	});
	const virtualRowCount = $derived(getIconRowCount(renderedGridIcons.length, gridColumns));

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

	const selectedIconComponentName = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		return selectedIcon.id
			.split('-')
			.filter(Boolean)
			.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
			.join('');
	});

	const activeUsageTabConfig = $derived.by(
		() => usageTabs.find((tab) => tab.id === activeUsageTab) ?? usageTabs[0]
	);

	const usageSnippet = $derived.by(() => {
		if (!selectedIconComponentName) {
			return '';
		}

		return activeUsageTabConfig.snippet(selectedIconComponentName);
	});

	const generatedRawCustomizeSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		return buildExportSvg(
			selectedIcon,
			{
				color: CUSTOMIZE_EXPORT_COLOR,
				size: CUSTOMIZE_PREVIEW_SIZE,
				padding: 0,
				pixelGap: 0,
				backgroundColor: '',
				shape: 'square',
				scope: 'detail'
			},
			'raw'
		);
	});

	const customizeSvgError = $derived.by(() => {
		const markup = customizeSvgCode.trim();

		if (!markup) {
			return 'SVG markup is empty.';
		}

		if (typeof DOMParser === 'undefined') {
			return '';
		}

		const parsedDocument = new DOMParser().parseFromString(markup, 'image/svg+xml');
		const parserErrorNode = parsedDocument.querySelector('parsererror');

		if (parserErrorNode) {
			return 'SVG markup is invalid.';
		}

		return parsedDocument.documentElement.nodeName.toLowerCase() === 'svg'
			? ''
			: 'Root element must be <svg>.';
	});

	const customizeRenderedSvg = $derived.by(() => {
		if (customizeSvgError) {
			return generatedRawCustomizeSvg;
		}

		return customizeSvgCode.trim() || generatedRawCustomizeSvg;
	});

	const previewSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		return buildCustomizedSvg(selectedIcon, {
			color: DETAIL_PREVIEW_COLOR,
			size: 24,
			padding: 0,
			pixelGap: 0,
			backgroundColor: '',
			shape: 'square',
			scope: 'detail'
		});
	});

	$effect(() => {
		const value = queryInput;
		const debounceTimer = window.setTimeout(() => {
			debouncedQuery = value;
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			window.clearTimeout(debounceTimer);
		};
	});

	$effect(() => {
		queueFilterRun(debouncedQuery);
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
		// Keep grid data "live" only when the drawer is closed; freeze while open.
		if (!drawerOpen) {
			gridIconsSnapshot = filteredIcons;
		}
	});

	$effect(() => {
		if (selectedId && !filteredIcons.some((icon) => icon.id === selectedId)) {
			clearSelectionImmediately();
		}
	});

	$effect(() => {
		if (!selectedIcon) {
			customizeSvgCode = '';
			customizeSvgSourceIconId = '';
			return;
		}

		if (customizeSvgSourceIconId !== selectedIcon.id) {
			customizeSvgCode = generatedRawCustomizeSvg;
			customizeSvgSourceIconId = selectedIcon.id;
		}
	});

	function selectIcon(icon: PixelIcon): void {
		pendingClearSelection = false;
		selectedId = icon.id;
		drawerOpen = true;
		activeDrawerTab = 'usage';
		copyStatus = '';
	}

	function requestCloseDrawer(): void {
		if (!selectedId) {
			return;
		}

		pendingClearSelection = true;
		drawerOpen = false;
		copyStatus = '';
	}

	function clearSelectionImmediately(): void {
		pendingClearSelection = false;
		selectedId = '';
		drawerOpen = false;
		activeDrawerTab = 'usage';
		copyStatus = '';
	}

	function handleDrawerOpenChange(open: boolean): void {
		drawerOpen = open;

		if (open) {
			pendingClearSelection = false;
			return;
		}

		if (selectedId) {
			pendingClearSelection = true;
		}
	}

	function handleDrawerAnimationEnd(open: boolean): void {
		if (open || !pendingClearSelection || drawerOpen) {
			return;
		}

		selectedId = '';
		pendingClearSelection = false;
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
		return buildCustomizedSvg(icon, buildGridSvgOptions());
	}

	function clearPendingSearchTimers(): void {
		if (activeLoadingTimer !== null) {
			window.clearTimeout(activeLoadingTimer);
			activeLoadingTimer = null;
		}

		if (activeFilterTimer !== null) {
			window.clearTimeout(activeFilterTimer);
			activeFilterTimer = null;
		}
	}

	function queueFilterRun(nextQuery: string, forceIndicator = false): void {
		searchRequestId += 1;
		const requestId = searchRequestId;

		clearPendingSearchTimers();

		if (forceIndicator) {
			isSearchLoading = true;
		} else {
			activeLoadingTimer = window.setTimeout(() => {
				if (searchRequestId === requestId) {
					isSearchLoading = true;
				}
			}, SEARCH_LOADING_DELAY_MS);
		}

		activeFilterTimer = window.setTimeout(() => {
			const nextFilteredIcons = filterPixelIcons(icons, nextQuery);

			if (searchRequestId !== requestId) {
				return;
			}

			if (activeLoadingTimer !== null) {
				window.clearTimeout(activeLoadingTimer);
				activeLoadingTimer = null;
			}

			filteredIcons = nextFilteredIcons;

			window.requestAnimationFrame(() => {
				if (searchRequestId === requestId) {
					isSearchLoading = false;
				}
			});
		}, 0);
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
		queueFilterRun(queryInput, true);
		window.addEventListener('resize', syncGridMetrics);

		return () => {
			clearPendingSearchTimers();
			window.removeEventListener('resize', syncGridMetrics);
		};
	});

	$effect(() => {
		if (!gridViewportElement) {
			return;
		}

		syncGridMetrics();
	});

	$effect(() => {
		if (typeof ResizeObserver === 'undefined' || !gridViewportElement) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			syncGridMetrics();
		});

		resizeObserver.observe(gridViewportElement);

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div class="catalog-shell">
	<div class="catalog-toolbar">
		<p class="pl-1 text-sm text-muted-foreground">
			{isSearchLoading ? 'Loading icons...' : `${renderedGridIcons.length} results`}
		</p>
		<label class="search-field" for="icon-search">
			<input
				id="icon-search"
				type="search"
				placeholder="Search pixel icons..."
				bind:value={queryInput}
			/>
			<kbd>⌘K</kbd>
		</label>
	</div>

	<section class="icon-grid-section" aria-label="Available pixel icons">
		{#if isSearchLoading}
			<div class="loading-state" role="status" aria-live="polite">
				<span class="loading-swatch" aria-hidden="true"></span>
				<span>Loading icons...</span>
			</div>
		{:else if renderedGridIcons.length === 0}
			<p class="empty-state">No icon matches this query.</p>
		{:else}
			<div class="icon-grid-viewport" class:paused={drawerOpen} bind:this={gridViewportElement}>
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
								{#each getIconsForRow(renderedGridIcons, gridColumns, virtualRow.index) as icon (icon.id)}
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

	<Drawer.Root
		open={drawerOpen}
		handleOnly
		disablePreventScroll={false}
		repositionInputs={false}
		shouldScaleBackground={false}
		onOpenChange={handleDrawerOpenChange}
		onAnimationEnd={handleDrawerAnimationEnd}
		>
			{#if selectedIcon}
				<Drawer.Content class="selected-drawer">
					<section class="selected-panel" class:customize-active={activeDrawerTab === 'customize'} aria-live="polite">
						<div class="drawer-top-row">
							<div class="drawer-tabs" role="tablist" aria-label="Icon detail sections">
								{#each drawerTabs as tab (tab.id)}
									<button
										type="button"
										id={`drawer-tab-${tab.id}`}
										role="tab"
										class:active={activeDrawerTab === tab.id}
										aria-selected={activeDrawerTab === tab.id}
										aria-controls={`drawer-panel-${tab.id}`}
										onclick={() => {
											activeDrawerTab = tab.id;
										}}
									>
										{tab.label}
									</button>
								{/each}
							</div>

							<h2 class="drawer-icon-name">{selectedIcon.name}</h2>

							<button type="button" class="close-button drawer-close-button" onclick={requestCloseDrawer} aria-label="Close">
								×
							</button>
						</div>

						{#if activeDrawerTab === 'usage'}
							<div class="selected-preview">
								<div class="preview-canvas" style="--pixel-scale: 12;">
									{@html previewSvg}
								</div>
							</div>

							<div
								id="drawer-panel-usage"
								role="tabpanel"
								aria-labelledby="drawer-tab-usage"
								class="selected-content"
							>
								<p class="selected-tags">{selectedIcon.tags.join(' · ')}</p>

								<div class="usage-card">
									<div class="usage-tabs" role="tablist" aria-label="Package examples">
										{#each usageTabs as tab (tab.id)}
											<button
												type="button"
												id={`usage-tab-${tab.id}`}
												role="tab"
												class:active={activeUsageTab === tab.id}
												aria-selected={activeUsageTab === tab.id}
												aria-controls={`usage-panel-${tab.id}`}
												onclick={() => {
													activeUsageTab = tab.id;
												}}
											>
												{tab.label}
											</button>
										{/each}
									</div>

									<p class="usage-package">{activeUsageTabConfig.packageName}</p>

									<div class="usage-code-wrap">
										<div
											id={`usage-panel-${activeUsageTabConfig.id}`}
											role="tabpanel"
											class="usage-panel"
											aria-labelledby={`usage-tab-${activeUsageTabConfig.id}`}
										>
											<pre class="usage-code"><code>{usageSnippet}</code></pre>
										</div>
										<span class="usage-lang">{activeUsageTabConfig.language}</span>
									</div>
								</div>

								<div class="action-row">
									<button type="button" onclick={() => copyText(selectedIcon.svg, 'Source SVG')}>
										Copy source SVG
									</button>
									<button type="button" onclick={() => copyText(usageSnippet, `${activeUsageTabConfig.label} usage`)}>
										Copy {activeUsageTabConfig.label} usage
									</button>
								</div>

								{#if copyStatus}
									<p class="copy-status">{copyStatus}</p>
								{/if}
							</div>
						{:else}
							<div
								id="drawer-panel-customize"
								role="tabpanel"
								aria-labelledby="drawer-tab-customize"
								class="customize-editor-pane"
							>
								<textarea
									class="customize-editor"
									bind:value={customizeSvgCode}
									spellcheck="false"
									autocapitalize="off"
									autocomplete="off"
									wrap="off"
								></textarea>
							</div>

							<section class="customize-output-pane">
								<div class="customize-output">
									<div class="customize-output-canvas">
										{@html customizeRenderedSvg}
									</div>
								</div>
								{#if customizeSvgError}
									<p class="customize-error">{customizeSvgError}</p>
								{/if}
							</section>
						{/if}
					</section>
				</Drawer.Content>
			{/if}
	</Drawer.Root>
</div>
