<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import type { PixelIcon } from '@pxicons/lucide';
	import * as Drawer from '$lib/components/ui/drawer';
	import { resolveGridIconsSnapshot } from '$lib/icon-grid-pause';
	import { buildGridSvgOptions } from '$lib/icon-grid-render';
	import { getIconRowCount, getIconsForRow } from '$lib/icon-grid-rows';
	import {
		buildPixelIconSearchIndex,
		filterIndexedPixelIcons,
		type PixelIconSearchIndexEntry
	} from '$lib/icon-search';
	import { buildOptimizedSvg } from '$lib/icon-svg';
	import {
		buildReactSnippet,
		buildSvelteSnippet,
		buildVanillaSnippet,
		toComponentName
	} from '$lib/usage-snippets';

	const GRID_OVERSCAN_ROWS = 2;
	const SEARCH_DEBOUNCE_MS = 120;
	const SEARCH_LOADING_DELAY_MS = 90;
	const DETAIL_PREVIEW_COLOR = '#f3f5f8';
	const GRID_ICON_OPTIONS = buildGridSvgOptions();
	const detailPreviewOptions = {
		color: DETAIL_PREVIEW_COLOR,
		size: 24,
		padding: 0,
		backgroundColor: '',
		shape: 'square' as const,
		scope: 'detail' as const
	};

	const usageTabs = [
		{
			id: 'vanilla',
			label: 'Vanilla',
			language: 'html',
			packageName: '@pxicons/lucide',
			buildSnippet: buildVanillaSnippet
		},
		{
			id: 'svelte',
			label: 'Svelte',
			language: 'svelte',
			packageName: '@pxicons/lucide-svelte',
			buildSnippet: buildSvelteSnippet
		},
		{
			id: 'react',
			label: 'React',
			language: 'tsx',
			packageName: '@pxicons/lucide-react',
			buildSnippet: buildReactSnippet
		}
	] as const;

	const packageManagers = [
		{ id: 'npm', label: 'npm', prefix: 'npm install' },
		{ id: 'pnpm', label: 'pnpm', prefix: 'pnpm add' },
		{ id: 'yarn', label: 'yarn', prefix: 'yarn add' },
		{ id: 'bun', label: 'bun', prefix: 'bun add' }
	] as const;

	type UsageTabId = (typeof usageTabs)[number]['id'];
	type PackageManagerId = (typeof packageManagers)[number]['id'];
	type CopyFeedbackTarget = 'source' | 'usage';

	let icons = $state<readonly PixelIcon[]>([]);
	let searchIndex = $state<readonly PixelIconSearchIndexEntry[]>([]);
	let iconsById = $state<ReadonlyMap<string, PixelIcon>>(new Map());
	let queryInput = $state('');
	let debouncedQuery = $state('');
	let filteredIcons = $state<readonly PixelIcon[]>([]);
	let gridIconsSnapshot = $state<readonly PixelIcon[]>([]);
	let isCatalogLoading = $state(true);
	let catalogLoadError = $state('');
	let isSearchLoading = $state(false);
	let selectedId = $state('');
	let drawerOpen = $state(false);
	let activeUsageTab = $state<UsageTabId>('vanilla');
	let activePackageManager = $state<PackageManagerId>('npm');
	let copyFeedback = $state<{
		target: CopyFeedbackTarget;
		message: string;
		nonce: number;
	} | null>(null);
	let pendingClearSelection = $state(false);
	let gridWidth = $state(0);
	let gridGap = $state(8);
	let tileMinWidth = $state(136);
	let tileRowHeight = $state(135);
	let searchRequestId = 0;
	let activeLoadingTimer: number | null = null;
	let activeFilterTimer: number | null = null;
	let activeCopyFeedbackTimer: number | null = null;

	let gridViewportElement = $state<HTMLElement | null>(null);

	const gridColumns = $derived.by(() => {
		const safeTileWidth = Math.max(1, tileMinWidth);
		const safeGap = Math.max(0, gridGap);
		const width = Math.max(gridWidth, safeTileWidth);

		return Math.max(1, Math.floor((width + safeGap) / (safeTileWidth + safeGap)));
	});
	const virtualRowCount = $derived(getIconRowCount(gridIconsSnapshot.length, gridColumns));

	const rowVirtualizer = createVirtualizer<HTMLElement, HTMLElement>({
		count: 0,
		getScrollElement: () => gridViewportElement,
		estimateSize: () => tileRowHeight + gridGap,
		overscan: GRID_OVERSCAN_ROWS
	});

	const virtualRows = $derived($rowVirtualizer.getVirtualItems());
	const virtualTotalHeight = $derived($rowVirtualizer.getTotalSize());
	const selectedIcon = $derived.by(() => iconsById.get(selectedId) ?? null);
	const isGridLoading = $derived(isCatalogLoading || isSearchLoading);
	const activeUsageTabConfig = $derived.by(
		() => usageTabs.find((tab) => tab.id === activeUsageTab) ?? usageTabs[0]
	);
	const usageSnippet = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		const componentName = toComponentName(selectedIcon.id);

		if (activeUsageTabConfig.id === 'vanilla') {
			return activeUsageTabConfig.buildSnippet(selectedIcon.id);
		}

		return activeUsageTabConfig.buildSnippet(componentName);
	});
	const installCommand = $derived.by(() => {
		const pm =
			packageManagers.find((entry) => entry.id === activePackageManager) ?? packageManagers[0];
		return `${pm.prefix} ${activeUsageTabConfig.packageName}`;
	});
	const previewSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		return buildOptimizedSvg(selectedIcon, detailPreviewOptions);
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
		if (searchIndex.length === 0) {
			return;
		}

		queueFilterRun(searchIndex, debouncedQuery);
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
		gridIconsSnapshot = resolveGridIconsSnapshot(drawerOpen, filteredIcons, gridIconsSnapshot);
	});

	$effect(() => {
		if (selectedId && !filteredIcons.some((icon) => icon.id === selectedId)) {
			clearSelectionImmediately();
		}
	});

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

	function queueFilterRun(
		nextSearchIndex: readonly PixelIconSearchIndexEntry[],
		nextQuery: string,
		forceIndicator = false
	): void {
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
			const nextFilteredIcons = filterIndexedPixelIcons(nextSearchIndex, nextQuery);

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
		return buildOptimizedSvg(icon, GRID_ICON_OPTIONS);
	}

	function selectIcon(icon: PixelIcon): void {
		pendingClearSelection = false;
		selectedId = icon.id;
		drawerOpen = true;
		copyFeedback = null;
	}

	function requestCloseDrawer(): void {
		if (!selectedId) {
			return;
		}

		pendingClearSelection = true;
		drawerOpen = false;
		copyFeedback = null;
	}

	function clearSelectionImmediately(): void {
		pendingClearSelection = false;
		selectedId = '';
		drawerOpen = false;
		copyFeedback = null;
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

	function clearCopyFeedbackTimer(): void {
		if (activeCopyFeedbackTimer !== null) {
			window.clearTimeout(activeCopyFeedbackTimer);
			activeCopyFeedbackTimer = null;
		}
	}

	function showCopyFeedback(target: CopyFeedbackTarget, message: string): void {
		clearCopyFeedbackTimer();
		copyFeedback = {
			target,
			message,
			nonce: (copyFeedback?.nonce ?? 0) + 1
		};
		activeCopyFeedbackTimer = window.setTimeout(() => {
			copyFeedback = null;
			activeCopyFeedbackTimer = null;
		}, 1400);
	}

	async function copyText(target: CopyFeedbackTarget, value: string, label: string): Promise<void> {
		if (!value) {
			return;
		}

		try {
			await navigator.clipboard.writeText(value);
			showCopyFeedback(target, 'Copied');
		} catch {
			showCopyFeedback(target, 'Copy failed');
		}
	}

	async function loadCatalog(): Promise<void> {
		isCatalogLoading = true;
		catalogLoadError = '';

		try {
			const { lucideIcons } = await import('@pxicons/lucide');
			icons = lucideIcons;
			searchIndex = buildPixelIconSearchIndex(lucideIcons);
			iconsById = new Map(lucideIcons.map((icon) => [icon.id, icon]));
			filteredIcons = lucideIcons;
			gridIconsSnapshot = lucideIcons;
			queueFilterRun(searchIndex, queryInput, true);
		} catch {
			catalogLoadError = 'The icon catalog failed to load.';
			icons = [];
			searchIndex = [];
			iconsById = new Map();
			filteredIcons = [];
			gridIconsSnapshot = [];
		} finally {
			isCatalogLoading = false;
		}
	}

	onMount(() => {
		void loadCatalog();
		window.addEventListener('resize', syncGridMetrics);

		const handleSearchShortcut = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
				event.preventDefault();
				document.getElementById('icon-search')?.focus();
			}
		};
		window.addEventListener('keydown', handleSearchShortcut);

		return () => {
			clearPendingSearchTimers();
			clearCopyFeedbackTimer();
			window.removeEventListener('resize', syncGridMetrics);
			window.removeEventListener('keydown', handleSearchShortcut);
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
			{#if catalogLoadError}
				Catalog unavailable
			{:else if isGridLoading}
				Loading icons...
			{:else}
				{gridIconsSnapshot.length} results
			{/if}
		</p>
		<label class="search-field" for="icon-search">
			<input
				id="icon-search"
				type="search"
				placeholder="Search pixel icons..."
				disabled={Boolean(catalogLoadError)}
				bind:value={queryInput}
			/>
			<kbd>⌘K</kbd>
		</label>
	</div>

	<section class="icon-grid-section" aria-label="Available pixel icons">
		{#if catalogLoadError}
			<p class="empty-state">{catalogLoadError}</p>
		{:else if isGridLoading}
			<div class="loading-state" role="status" aria-live="polite">
				<span class="loading-swatch" aria-hidden="true"></span>
				<span>Loading icons...</span>
			</div>
		{:else if gridIconsSnapshot.length === 0}
			<p class="empty-state">No icon matches this query.</p>
		{:else}
			<div class="icon-grid-viewport" class:paused={drawerOpen} bind:this={gridViewportElement}>
				<div class="icon-grid-canvas" style={`height:${Math.max(1, virtualTotalHeight)}px`}>
					{#each virtualRows as virtualRow (virtualRow.key)}
						<div
							class="icon-grid-row-wrapper"
							style={`transform:translateY(${virtualRow.start}px);height:${virtualRow.size}px`}
						>
							<div class="icon-grid-row" style={`--grid-columns:${gridColumns}`}>
								{#each getIconsForRow(gridIconsSnapshot, gridColumns, virtualRow.index) as icon (icon.id)}
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
				<section class="selected-panel" aria-live="polite">
					<div class="drawer-top-row">
						<h2 class="drawer-icon-name">{selectedIcon.name}</h2>

						<button
							type="button"
							class="close-button drawer-close-button"
							onclick={requestCloseDrawer}
							aria-label="Close"
						>
							×
						</button>
					</div>

					<div class="selected-preview">
						<div class="preview-canvas" style="--pixel-scale: 12;">
							{@html previewSvg}
						</div>
					</div>

					<div class="selected-content">
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

							<div class="install-section">
								<div class="install-pm-tabs" role="tablist" aria-label="Package manager">
									{#each packageManagers as pm (pm.id)}
										<button
											type="button"
											role="tab"
											class:active={activePackageManager === pm.id}
											aria-selected={activePackageManager === pm.id}
											onclick={() => {
												activePackageManager = pm.id;
											}}
										>
											{pm.label}
										</button>
									{/each}
								</div>
								<button
									type="button"
									class="install-command"
									onclick={() => {
										void navigator.clipboard.writeText(installCommand);
									}}
									title="Click to copy"
								>
									<code>{installCommand}</code>
								</button>
							</div>

							<div class="usage-code-wrap" data-vaul-no-drag>
								<div
									id={`usage-panel-${activeUsageTabConfig.id}`}
									role="tabpanel"
									class="usage-panel"
									aria-labelledby={`usage-tab-${activeUsageTabConfig.id}`}
								>
									<pre class="usage-code" data-vaul-no-drag><code>{usageSnippet}</code></pre>
								</div>
								<span class="usage-lang">{activeUsageTabConfig.language}</span>
							</div>
						</div>

						<div class="action-row">
							<button
								type="button"
								onclick={() => copyText('source', selectedIcon.svg, 'Source SVG')}
							>
								Copy source SVG
								{#if copyFeedback?.target === 'source'}
									{#key copyFeedback.nonce}
										<span class="copy-tooltip">{copyFeedback.message}</span>
									{/key}
								{/if}
							</button>
							<button
								type="button"
								onclick={() =>
									copyText('usage', usageSnippet, `${activeUsageTabConfig.label} usage`)}
							>
								Copy {activeUsageTabConfig.label} usage
								{#if copyFeedback?.target === 'usage'}
									{#key copyFeedback.nonce}
										<span class="copy-tooltip">{copyFeedback.message}</span>
									{/key}
								{/if}
							</button>
						</div>
					</div>
				</section>
			</Drawer.Content>
		{/if}
	</Drawer.Root>
</div>
