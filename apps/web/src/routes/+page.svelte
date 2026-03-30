<script lang="ts">
	import { dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { lucideIcons, type PixelIcon } from '@pxicons/lucide';
	import { buildGridSvgOptions } from '$lib/icon-grid-render';
	import { filterPixelIcons } from '$lib/icon-search';
	import { buildCustomizedSvg } from '$lib/icon-svg';
	import { getIconRowCount, getIconsForRow } from '$lib/icon-grid-rows';
	import SvgCodeEditor, { type SvgEditorRange } from '$lib/components/svg-code-editor.svelte';
	import {
		buildSvgInspectionModel,
		findSvgMapEntryByOffset,
		normalizeSvgMarkup,
		type SvgInspectionModel
	} from '$lib/svg-inspector';
	import { prepareSvgOverlayMarkup } from '$lib/svg-overlay';
	import { buildSvgVisualDiff, type SvgVisualDiffResult } from '$lib/svg-visual-diff';
	import * as Drawer from '$lib/components/ui/drawer';

	const icons = lucideIcons;
	const GRID_OVERSCAN_ROWS = 3;
	const SEARCH_DEBOUNCE_MS = 180;
	const SEARCH_LOADING_DELAY_MS = 120;
	const DETAIL_PREVIEW_COLOR = '#f3f5f8';
	const EDIT_OVERLAY_OPACITY_MIN = 0;
	const EDIT_OVERLAY_OPACITY_MAX = 90;
	const DEFAULT_EDIT_OVERLAY_OPACITY = 35;
	const GRID_ICON_OPTIONS = buildGridSvgOptions();
	const SVG_OPEN_TAG_PATTERN = /<svg\b[^>]*>/i;
	const SVG_FILL_ATTR_PATTERN = /\sfill=(['"]).*?\1/i;
	const drawerTabs = [
		{ id: 'usage', label: 'Usage' },
		{ id: 'customize', label: 'Customize' },
		...(dev ? ([{ id: 'edit', label: 'Edit' }] as const) : [])
	] as const;

	interface UsageSnippetContext {
		componentName: string;
		iconId: string;
	}

	const usageTabs = [
		{
			id: 'svelte',
			label: 'Svelte',
			language: 'svelte',
			packageName: '@pxicons/lucide-svelte',
			snippet: ({ componentName }: UsageSnippetContext): string => `<script>
  import { ${componentName} } from '@pxicons/lucide-svelte';
<\/script>

<${componentName} />`
		},
		{
			id: 'vanilla',
			label: 'Vanilla',
			language: 'html',
			packageName: '@pxicons/lucide',
			snippet: ({ iconId }: UsageSnippetContext): string => `<script type="module">
  import { createIcons } from '@pxicons/lucide';

  createIcons();
<\/script>

<i data-px="lucide:${iconId}"></i>`
		},
		{
			id: 'react',
			label: 'React',
			language: 'tsx',
			packageName: '@pxicons/lucide-react',
			snippet: ({
				componentName
			}: UsageSnippetContext): string => `import { ${componentName} } from '@pxicons/lucide-react';

export function App() {
  return <${componentName} size={24} color="currentColor" />;
}`
		}
	] as const;

	const packageManagers = [
		{ id: 'npm', label: 'npm', prefix: 'npm install' },
		{ id: 'pnpm', label: 'pnpm', prefix: 'pnpm add' },
		{ id: 'yarn', label: 'yarn', prefix: 'yarn add' },
		{ id: 'bun', label: 'bun', prefix: 'bun add' }
	] as const;

	type PackageManagerId = (typeof packageManagers)[number]['id'];

	type DrawerTabId = 'usage' | 'customize' | 'edit';
	type UsageTabId = (typeof usageTabs)[number]['id'];
	type EditOutputTabId = 'preview' | 'diff';
	type SvgCodeEditorHandle = {
		scrollToRange: (range: SvgEditorRange | null) => void;
	};

	const EMPTY_INSPECTION_MODEL: SvgInspectionModel = {
		normalizedSvg: '',
		instrumentedSvg: '',
		entries: [],
		errors: [],
		status: 'invalid'
	};
	const EMPTY_VISUAL_DIFF: SvgVisualDiffResult = {
		status: 'invalid',
		svg: '',
		message: 'No SVG selected.'
	};

	let queryInput = $state('');
	let debouncedQuery = $state('');
	let filteredIcons = $state<readonly PixelIcon[]>([]);
	let isSearchLoading = $state(true);
	let selectedId = $state('');
	let drawerOpen = $state(false);
	let activeDrawerTab = $state<DrawerTabId>('usage');
	let activeUsageTab = $state<UsageTabId>(usageTabs[0].id);
	let activePackageManager = $state<PackageManagerId>('npm');
	let activeEditOutputTab = $state<EditOutputTabId>('preview');
	let customizeSvgCode = $state('');
	let customizeSvgSourceIconId = $state('');
	let inspectMode = $state(false);
	let activeMapId = $state<string | null>(null);
	let lastEditorCursorOffset = $state<number | null>(null);
	let autoNormalizedInInspectSession = $state(false);
	let lastScrolledMapId = $state<string | null>(null);
	let pendingScrollToActiveMap = $state(false);
	let editSvgCode = $state('');
	let editBaselineSvg = $state('');
	let editSvgSourceIconId = $state('');
	let editInspectMode = $state(false);
	let editActiveMapId = $state<string | null>(null);
	let editLastEditorCursorOffset = $state<number | null>(null);
	let editAutoNormalizedInInspectSession = $state(false);
	let editLastScrolledMapId = $state<string | null>(null);
	let editPendingScrollToActiveMap = $state(false);
	let isSavingEditSvg = $state(false);
	let editSaveStatus = $state('');
	let editOverlaySvg = $state('');
	let editOverlayError = $state('');
	let editOverlayPasteValue = $state('');
	let editOverlayPopoverOpen = $state(false);
	let editOverlayOpacityPercent = $state(DEFAULT_EDIT_OVERLAY_OPACITY);
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
	let customizePreviewElement = $state<HTMLDivElement | null>(null);
	let editPreviewElement = $state<HTMLDivElement | null>(null);
	let editOverlayFileInput = $state<HTMLInputElement | null>(null);
	let editOverlayMenuElement = $state<HTMLDivElement | null>(null);
	let customizeCodeEditor = $state<SvgCodeEditorHandle | null>(null);
	let editCodeEditor = $state<SvgCodeEditorHandle | null>(null);
	let runtimeSvgOverrides = $state<Record<string, string>>({});

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

	const selectedIconSourceSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		return runtimeSvgOverrides[selectedIcon.id] ?? selectedIcon.svg;
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
		if (!selectedIcon || !selectedIconComponentName) {
			return '';
		}

		return activeUsageTabConfig.snippet({
			componentName: selectedIconComponentName,
			iconId: selectedIcon.id
		});
	});

	const installCommand = $derived.by(() => {
		const pm = packageManagers.find((p) => p.id === activePackageManager) ?? packageManagers[0];
		return `${pm.prefix} ${activeUsageTabConfig.packageName}`;
	});

	const customizeSourceSvg = $derived.by(() => {
		if (customizeSvgCode.length > 0) {
			return customizeSvgCode;
		}

		return selectedIconSourceSvg;
	});

	const customizeInspectionModel = $derived.by(() => {
		if (!selectedIcon || !customizeSourceSvg) {
			return EMPTY_INSPECTION_MODEL;
		}

		return buildSvgInspectionModel(customizeSourceSvg);
	});

	const mappingStatus = $derived.by(() => customizeInspectionModel.status);

	const customizeSvgError = $derived.by(() => {
		if (mappingStatus !== 'invalid') {
			return '';
		}

		return customizeInspectionModel.errors[0] ?? 'SVG markup is invalid.';
	});

	const customizeUnmappedStatus = $derived.by(() => {
		if (mappingStatus !== 'partial') {
			return '';
		}

		return customizeInspectionModel.errors[0] ?? 'Some SVG segments are currently unmapped.';
	});

	const customizeRenderedSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		if (mappingStatus === 'invalid') {
			return customizeSourceSvg;
		}

		return customizeInspectionModel.instrumentedSvg || customizeSourceSvg;
	});

	const activeMapEntry = $derived.by(() => {
		if (!activeMapId) {
			return null;
		}

		return customizeInspectionModel.entries.find((entry) => entry.id === activeMapId) ?? null;
	});

	const activeEditorRange = $derived.by((): SvgEditorRange | null => {
		if (!activeMapEntry) {
			return null;
		}

		return {
			from: activeMapEntry.sourceStart,
			to: activeMapEntry.sourceEnd
		};
	});

	const previewSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		const runtimeOverride = runtimeSvgOverrides[selectedIcon.id];

		if (runtimeOverride) {
			return withSvgRootFill(runtimeOverride, DETAIL_PREVIEW_COLOR);
		}

		return buildCustomizedSvg(selectedIcon, {
			color: DETAIL_PREVIEW_COLOR,
			size: 24,
			padding: 0,
			backgroundColor: '',
			shape: 'square',
			scope: 'detail'
		});
	});

	const editSourceSvg = $derived.by(() => {
		if (editSvgCode.length > 0) {
			return editSvgCode;
		}

		return selectedIconSourceSvg;
	});

	const editInspectionModel = $derived.by(() => {
		if (!selectedIcon || !editSourceSvg) {
			return EMPTY_INSPECTION_MODEL;
		}

		return buildSvgInspectionModel(editSourceSvg);
	});

	const editMappingStatus = $derived.by(() => editInspectionModel.status);

	const editSvgError = $derived.by(() => {
		if (editMappingStatus !== 'invalid') {
			return '';
		}

		return editInspectionModel.errors[0] ?? 'SVG markup is invalid.';
	});

	const editUnmappedStatus = $derived.by(() => {
		if (editMappingStatus !== 'partial') {
			return '';
		}

		return editInspectionModel.errors[0] ?? 'Some SVG segments are currently unmapped.';
	});

	const editRenderedSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		if (editMappingStatus === 'invalid') {
			return editSourceSvg;
		}

		return editInspectionModel.instrumentedSvg || editSourceSvg;
	});

	const editActiveMapEntry = $derived.by(() => {
		if (!editActiveMapId) {
			return null;
		}

		return editInspectionModel.entries.find((entry) => entry.id === editActiveMapId) ?? null;
	});

	const editActiveEditorRange = $derived.by((): SvgEditorRange | null => {
		if (!editActiveMapEntry) {
			return null;
		}

		return {
			from: editActiveMapEntry.sourceStart,
			to: editActiveMapEntry.sourceEnd
		};
	});

	const editVisualDiff = $derived.by(() => {
		if (!selectedIcon || !editBaselineSvg || !editSourceSvg) {
			return EMPTY_VISUAL_DIFF;
		}

		return buildSvgVisualDiff(editBaselineSvg, editSourceSvg);
	});

	const editHasPendingChanges = $derived.by(() => {
		if (!selectedIcon) {
			return false;
		}

		return editSourceSvg !== editBaselineSvg;
	});

	const editOverlayOpacity = $derived.by(() => {
		const bounded = Math.max(
			EDIT_OVERLAY_OPACITY_MIN,
			Math.min(EDIT_OVERLAY_OPACITY_MAX, editOverlayOpacityPercent)
		);
		return bounded / 100;
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
			inspectMode = false;
			activeMapId = null;
			lastEditorCursorOffset = null;
			autoNormalizedInInspectSession = false;
			lastScrolledMapId = null;
			pendingScrollToActiveMap = false;
			editSvgCode = '';
			editBaselineSvg = '';
			editSvgSourceIconId = '';
			editInspectMode = false;
			editActiveMapId = null;
			editLastEditorCursorOffset = null;
			editAutoNormalizedInInspectSession = false;
			editLastScrolledMapId = null;
			editPendingScrollToActiveMap = false;
			isSavingEditSvg = false;
			editSaveStatus = '';
			editOverlaySvg = '';
			editOverlayError = '';
			editOverlayPasteValue = '';
			editOverlayPopoverOpen = false;
			editOverlayOpacityPercent = DEFAULT_EDIT_OVERLAY_OPACITY;
			activeEditOutputTab = 'preview';
			return;
		}

		if (customizeSvgSourceIconId !== selectedIcon.id) {
			customizeSvgCode = selectedIconSourceSvg;
			customizeSvgSourceIconId = selectedIcon.id;
			inspectMode = false;
			activeMapId = null;
			lastEditorCursorOffset = null;
			autoNormalizedInInspectSession = false;
			lastScrolledMapId = null;
			pendingScrollToActiveMap = false;
		}

		if (editSvgSourceIconId !== selectedIcon.id) {
			const initialSource = selectedIconSourceSvg;
			editSvgCode = initialSource;
			editBaselineSvg = initialSource;
			editSvgSourceIconId = selectedIcon.id;
			editInspectMode = false;
			editActiveMapId = null;
			editLastEditorCursorOffset = null;
			editAutoNormalizedInInspectSession = false;
			editLastScrolledMapId = null;
			editPendingScrollToActiveMap = false;
			isSavingEditSvg = false;
			editSaveStatus = '';
			editOverlaySvg = '';
			editOverlayError = '';
			editOverlayPasteValue = '';
			editOverlayPopoverOpen = false;
			editOverlayOpacityPercent = DEFAULT_EDIT_OVERLAY_OPACITY;
			activeEditOutputTab = 'preview';
		}
	});

	$effect(() => {
		if (activeDrawerTab === 'customize') {
			return;
		}

		inspectMode = false;
		activeMapId = null;
		lastScrolledMapId = null;
		pendingScrollToActiveMap = false;
	});

	$effect(() => {
		if (activeDrawerTab === 'edit') {
			return;
		}

		editInspectMode = false;
		editActiveMapId = null;
		editLastScrolledMapId = null;
		editPendingScrollToActiveMap = false;
		editOverlayPopoverOpen = false;
	});

	$effect(() => {
		if (activeEditOutputTab === 'preview') {
			return;
		}

		editInspectMode = false;
		editActiveMapId = null;
		editPendingScrollToActiveMap = false;
		editLastScrolledMapId = null;
	});

	$effect(() => {
		if (!editOverlayPopoverOpen || !editOverlayMenuElement) {
			return;
		}

		const menuElement = editOverlayMenuElement;
		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target;

			if (target instanceof Node && menuElement.contains(target)) {
				return;
			}

			editOverlayPopoverOpen = false;
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				editOverlayPopoverOpen = false;
			}
		};

		document.addEventListener('pointerdown', handlePointerDown);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	$effect(() => {
		if (!inspectMode) {
			autoNormalizedInInspectSession = false;
			return;
		}

		if (autoNormalizedInInspectSession) {
			return;
		}

		autoNormalizedInInspectSession = true;
		normalizeCustomizeSvg();
	});

	$effect(() => {
		if (!editInspectMode) {
			editAutoNormalizedInInspectSession = false;
			return;
		}

		if (editAutoNormalizedInInspectSession) {
			return;
		}

		editAutoNormalizedInInspectSession = true;
		normalizeEditSvg();
	});

	$effect(() => {
		const previewElement = customizePreviewElement;
		const activeId = activeMapId;
		const rendered = customizeRenderedSvg;

		if (!previewElement || !rendered) {
			return;
		}

		const mappedNodes = previewElement.querySelectorAll<SVGElement>('[data-px-node-id]');

		if (!mappedNodes.length) {
			return;
		}

		mappedNodes.forEach((node) => {
			node.classList.remove('px-inspect-active', 'px-inspect-dim');

			if (!activeId) {
				return;
			}

			if (node.getAttribute('data-px-node-id') === activeId) {
				node.classList.add('px-inspect-active');
			} else {
				node.classList.add('px-inspect-dim');
			}
		});
	});

	$effect(() => {
		const previewElement = editPreviewElement;
		const activeId = editActiveMapId;
		const rendered = editRenderedSvg;

		if (!previewElement || !rendered) {
			return;
		}

		const mappedNodes = previewElement.querySelectorAll<SVGElement>('[data-px-node-id]');

		if (!mappedNodes.length) {
			return;
		}

		mappedNodes.forEach((node) => {
			node.classList.remove('px-inspect-active', 'px-inspect-dim');

			if (!activeId) {
				return;
			}

			if (node.getAttribute('data-px-node-id') === activeId) {
				node.classList.add('px-inspect-active');
			} else {
				node.classList.add('px-inspect-dim');
			}
		});
	});

	$effect(() => {
		if (!pendingScrollToActiveMap || !customizeCodeEditor || !activeMapEntry) {
			lastScrolledMapId = null;
			return;
		}

		if (lastScrolledMapId === activeMapEntry.id) {
			pendingScrollToActiveMap = false;
			return;
		}

		lastScrolledMapId = activeMapEntry.id;
		customizeCodeEditor.scrollToRange({
			from: activeMapEntry.sourceStart,
			to: activeMapEntry.sourceEnd
		});
		pendingScrollToActiveMap = false;
	});

	$effect(() => {
		if (!editPendingScrollToActiveMap || !editCodeEditor || !editActiveMapEntry) {
			editLastScrolledMapId = null;
			return;
		}

		if (editLastScrolledMapId === editActiveMapEntry.id) {
			editPendingScrollToActiveMap = false;
			return;
		}

		editLastScrolledMapId = editActiveMapEntry.id;
		editCodeEditor.scrollToRange({
			from: editActiveMapEntry.sourceStart,
			to: editActiveMapEntry.sourceEnd
		});
		editPendingScrollToActiveMap = false;
	});

	function normalizeCustomizeSvg(): void {
		const source = customizeSourceSvg;

		if (!source) {
			return;
		}

		const normalized = normalizeSvgMarkup(source);

		if (!normalized) {
			return;
		}

		if (normalized === source && customizeSvgCode.length > 0) {
			return;
		}

		customizeSvgCode = normalized;
	}

	function normalizeEditSvg(): void {
		const source = editSourceSvg;

		if (!source) {
			return;
		}

		const normalized = normalizeSvgMarkup(source);

		if (!normalized) {
			return;
		}

		if (normalized === source && editSvgCode.length > 0) {
			return;
		}

		editSvgCode = normalized;
	}

	function setActiveMapFromOffset(offset: number | null): void {
		if (!selectedIcon || inspectMode || mappingStatus === 'invalid') {
			activeMapId = null;
			return;
		}

		const entry = findSvgMapEntryByOffset(customizeInspectionModel.entries, offset);
		activeMapId = entry?.id ?? null;
	}

	function handleEditorHoverOffset(offset: number | null): void {
		if (inspectMode) {
			return;
		}

		if (offset === null) {
			setActiveMapFromOffset(lastEditorCursorOffset);
			return;
		}

		setActiveMapFromOffset(offset);
	}

	function handleEditorCursorOffset(offset: number | null): void {
		lastEditorCursorOffset = offset;
		setActiveMapFromOffset(offset);
	}

	function setEditActiveMapFromOffset(offset: number | null): void {
		if (!selectedIcon || editInspectMode || editMappingStatus === 'invalid') {
			editActiveMapId = null;
			return;
		}

		const entry = findSvgMapEntryByOffset(editInspectionModel.entries, offset);
		editActiveMapId = entry?.id ?? null;
	}

	function handleEditEditorHoverOffset(offset: number | null): void {
		if (editInspectMode) {
			return;
		}

		if (offset === null) {
			setEditActiveMapFromOffset(editLastEditorCursorOffset);
			return;
		}

		setEditActiveMapFromOffset(offset);
	}

	function handleEditEditorCursorOffset(offset: number | null): void {
		editLastEditorCursorOffset = offset;
		setEditActiveMapFromOffset(offset);
	}

	function resolveMapIdFromPreviewTarget(target: EventTarget | null): string | null {
		if (!(target instanceof Element)) {
			return null;
		}

		const mappedElement = target.closest('[data-px-node-id]');

		if (!(mappedElement instanceof Element)) {
			return null;
		}

		return mappedElement.getAttribute('data-px-node-id');
	}

	function handlePreviewPointerMove(event: PointerEvent): void {
		if (!inspectMode || mappingStatus === 'invalid') {
			return;
		}

		activeMapId = resolveMapIdFromPreviewTarget(event.target);
	}

	function handleEditPreviewPointerMove(event: PointerEvent): void {
		if (!editInspectMode || editMappingStatus === 'invalid' || activeEditOutputTab !== 'preview') {
			return;
		}

		editActiveMapId = resolveMapIdFromPreviewTarget(event.target);
	}

	function handlePreviewPointerLeave(): void {
		if (!inspectMode) {
			return;
		}

		activeMapId = null;
	}

	function handleEditPreviewPointerLeave(): void {
		if (!editInspectMode || activeEditOutputTab !== 'preview') {
			return;
		}

		editActiveMapId = null;
	}

	function toggleInspectMode(): void {
		inspectMode = !inspectMode;
		activeMapId = null;
		pendingScrollToActiveMap = false;
		lastScrolledMapId = null;
	}

	function toggleEditInspectMode(): void {
		editInspectMode = !editInspectMode;
		editActiveMapId = null;
		editPendingScrollToActiveMap = false;
		editLastScrolledMapId = null;
	}

	function handlePreviewPointerDown(event: PointerEvent): void {
		if (!inspectMode || mappingStatus === 'invalid') {
			return;
		}
		event.preventDefault();
		event.stopPropagation();

		const mapId = resolveMapIdFromPreviewTarget(event.target);

		if (!mapId) {
			return;
		}

		activeMapId = mapId;
		inspectMode = false;
		pendingScrollToActiveMap = true;
	}

	function handleEditPreviewPointerDown(event: PointerEvent): void {
		if (!editInspectMode || editMappingStatus === 'invalid' || activeEditOutputTab !== 'preview') {
			return;
		}
		event.preventDefault();
		event.stopPropagation();

		const mapId = resolveMapIdFromPreviewTarget(event.target);

		if (!mapId) {
			return;
		}

		editActiveMapId = mapId;
		editInspectMode = false;
		editPendingScrollToActiveMap = true;
	}

	function applyEditOverlay(source: string): boolean {
		const result = prepareSvgOverlayMarkup(source);

		if (!result.ok) {
			editOverlayError = result.error;
			return false;
		}

		editOverlaySvg = result.markup;
		editOverlayError = '';
		return true;
	}

	function openEditOverlayFilePicker(): void {
		editOverlayFileInput?.click();
	}

	async function handleEditOverlayFileChange(event: Event): Promise<void> {
		const input = event.currentTarget;

		if (!(input instanceof HTMLInputElement)) {
			return;
		}

		const file = input.files?.[0];

		if (!file) {
			return;
		}

		try {
			const svgSource = await file.text();
			applyEditOverlay(svgSource);
		} catch {
			editOverlayError = 'Failed to read overlay SVG file.';
		} finally {
			input.value = '';
		}
	}

	function toggleEditOverlayPopover(): void {
		editOverlayPopoverOpen = !editOverlayPopoverOpen;

		if (editOverlayPopoverOpen) {
			editOverlayError = '';
		}
	}

	function applyEditOverlayPaste(): void {
		const source = editOverlayPasteValue.trim();

		if (!source) {
			editOverlayError = 'Paste SVG markup before applying overlay.';
			return;
		}

		applyEditOverlay(source);
	}

	function clearEditOverlayPaste(): void {
		editOverlayPasteValue = '';
		editOverlayError = '';
	}

	function removeEditOverlay(): void {
		editOverlaySvg = '';
		editOverlayError = '';
	}

	function selectIcon(icon: PixelIcon): void {
		pendingClearSelection = false;
		selectedId = icon.id;
		drawerOpen = true;
		activeDrawerTab = 'usage';
		copyStatus = '';
		editSaveStatus = '';
	}

	function requestCloseDrawer(): void {
		if (!selectedId) {
			return;
		}

		pendingClearSelection = true;
		drawerOpen = false;
		copyStatus = '';
		editSaveStatus = '';
	}

	function clearSelectionImmediately(): void {
		pendingClearSelection = false;
		selectedId = '';
		drawerOpen = false;
		activeDrawerTab = 'usage';
		copyStatus = '';
		editSaveStatus = '';
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

	function withSvgRootFill(svg: string, fill: string): string {
		const svgOpenTag = svg.match(SVG_OPEN_TAG_PATTERN)?.[0];

		if (!svgOpenTag) {
			return svg;
		}

		const nextOpenTag = SVG_FILL_ATTR_PATTERN.test(svgOpenTag)
			? svgOpenTag.replace(SVG_FILL_ATTR_PATTERN, ` fill="${fill}"`)
			: svgOpenTag.replace('<svg', `<svg fill="${fill}"`);

		return svg.replace(svgOpenTag, nextOpenTag);
	}

	function getGridIconSvg(icon: PixelIcon): string {
		const runtimeOverride = runtimeSvgOverrides[icon.id];

		if (runtimeOverride) {
			return withSvgRootFill(runtimeOverride, GRID_ICON_OPTIONS.color);
		}

		return buildCustomizedSvg(icon, GRID_ICON_OPTIONS);
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

	async function saveEditedIcon(): Promise<void> {
		if (!selectedIcon || !dev || isSavingEditSvg) {
			return;
		}

		const svgToSave = editSourceSvg;

		if (!svgToSave || !editHasPendingChanges) {
			return;
		}

		isSavingEditSvg = true;
		editSaveStatus = '';

		try {
			const response = await fetch(`/api/dev/icons/${encodeURIComponent(selectedIcon.id)}/svg`, {
				method: 'PUT',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({ svg: svgToSave })
			});
			const payload = (await response.json().catch(() => null)) as {
				error?: string;
				iconId?: string;
				savedAt?: string;
				frameworkSync?: {
					status?: 'ok' | 'failed';
					command?: string;
					durationMs?: number;
					message?: string;
				};
			} | null;

			if (!response.ok) {
				const message = payload?.error ?? `Save failed with status ${response.status}.`;
				throw new Error(message);
			}

			runtimeSvgOverrides = {
				...runtimeSvgOverrides,
				[selectedIcon.id]: svgToSave
			};
			if (customizeSvgSourceIconId === selectedIcon.id) {
				customizeSvgCode = svgToSave;
			}
			editBaselineSvg = svgToSave;
			const syncStatus = payload?.frameworkSync?.status;
			if (syncStatus === 'ok') {
				const savedPrefix = payload?.savedAt
					? `Saved and framework sources synced at ${new Date(payload.savedAt).toLocaleTimeString()}.`
					: 'Saved and framework sources synced.';
				editSaveStatus = `${savedPrefix} Run \`vp run frameworks:build\` to refresh framework dist (used by package imports/playground).`;
			} else if (syncStatus === 'failed') {
				const syncError = payload?.frameworkSync?.message ?? 'framework generation command failed.';
				editSaveStatus = `Saved SVG, but framework sync failed: ${syncError} Run \`vp run frameworks:generate\` and then \`vp run frameworks:build\`.`;
			} else {
				const savedPrefix = payload?.savedAt
					? `Saved at ${new Date(payload.savedAt).toLocaleTimeString()}.`
					: 'Saved.';
				editSaveStatus = `${savedPrefix} Run \`vp run frameworks:build\` to refresh framework dist (used by package imports/playground).`;
			}
		} catch (error) {
			const fallbackMessage = 'Failed to save icon SVG.';
			editSaveStatus = error instanceof Error && error.message ? error.message : fallbackMessage;
		} finally {
			isSavingEditSvg = false;
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
							<div class="icon-grid-row" style={`--grid-columns:${gridColumns}`}>
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
				<section
					class="selected-panel"
					class:customize-active={activeDrawerTab !== 'usage'}
					aria-live="polite"
				>
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

						<button
							type="button"
							class="close-button drawer-close-button"
							onclick={requestCloseDrawer}
							aria-label="Close"
						>
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
										onclick={() => copyText(installCommand, 'Install command')}
										title="Click to copy"
									>
										<code>{installCommand}</code>
									</button>
								</div>

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
								<button type="button" onclick={() => copyText(selectedIconSourceSvg, 'Source SVG')}>
									Copy source SVG
								</button>
								<button
									type="button"
									onclick={() => copyText(usageSnippet, `${activeUsageTabConfig.label} usage`)}
								>
									Copy {activeUsageTabConfig.label} usage
								</button>
							</div>

							{#if copyStatus}
								<p class="copy-status">{copyStatus}</p>
							{/if}
						</div>
					{:else if activeDrawerTab === 'customize'}
						<div
							id="drawer-panel-customize"
							role="tabpanel"
							aria-labelledby="drawer-tab-customize"
							class="customize-editor-pane"
						>
							<div class="customize-toolbar">
								<div
									class="customize-status"
									class:invalid={mappingStatus === 'invalid'}
									class:partial={mappingStatus === 'partial'}
								>
									{#if mappingStatus === 'ready'}
										Inspect map ready
									{:else if mappingStatus === 'partial'}
										Inspect map partial
									{:else}
										Inspect map invalid
									{/if}
								</div>

								<div class="customize-toolbar-actions">
									<button
										type="button"
										class="customize-tool-button"
										onclick={normalizeCustomizeSvg}
									>
										Normalize
									</button>
									<button
										type="button"
										class="customize-tool-button inspect-toggle"
										class:active={inspectMode}
										onclick={toggleInspectMode}
										aria-pressed={inspectMode}
										title="Toggle inspect mode"
									>
										<span class="inspect-icon" aria-hidden="true">
											<svg viewBox="0 0 16 16" focusable="false">
												<path d="M6 2h4v2h2v4h-2v2H6V8H4V4h2Z" />
												<path d="M2 10h2v2h2v2h4v-2h2v-2h2v4H2Z" />
											</svg>
										</span>
										Inspect
									</button>
								</div>
							</div>
							<SvgCodeEditor
								class="customize-editor"
								bind:value={customizeSvgCode}
								activeRange={activeEditorRange}
								onHoverOffset={handleEditorHoverOffset}
								onCursorOffset={handleEditorCursorOffset}
								bind:this={customizeCodeEditor}
							/>
						</div>

						<section class="customize-output-pane">
							<div class="customize-output">
								<div
									class="customize-output-canvas"
									class:inspect-enabled={inspectMode}
									class:map-active={Boolean(activeMapId)}
									role="img"
									aria-label="Customized icon preview"
									bind:this={customizePreviewElement}
									onpointermove={handlePreviewPointerMove}
									onpointerleave={handlePreviewPointerLeave}
									onpointerdown={handlePreviewPointerDown}
								>
									{@html customizeRenderedSvg}
								</div>
							</div>
							{#if customizeSvgError}
								<p class="customize-error">{customizeSvgError}</p>
							{:else if customizeUnmappedStatus}
								<p class="customize-hint">{customizeUnmappedStatus}</p>
							{/if}
						</section>
					{:else if dev}
						<div
							id="drawer-panel-edit"
							role="tabpanel"
							aria-labelledby="drawer-tab-edit"
							class="customize-editor-pane"
						>
							<div class="customize-toolbar">
								<div class="customize-toolbar-actions">
									<button type="button" class="customize-tool-button" onclick={normalizeEditSvg}>
										Normalize
									</button>
									<button
										type="button"
										class="customize-tool-button save-button"
										onclick={saveEditedIcon}
										disabled={!editHasPendingChanges || isSavingEditSvg}
									>
										{isSavingEditSvg ? 'Saving…' : 'Save'}
									</button>
								</div>
							</div>

							<SvgCodeEditor
								class="customize-editor"
								bind:value={editSvgCode}
								activeRange={editActiveEditorRange}
								onHoverOffset={handleEditEditorHoverOffset}
								onCursorOffset={handleEditEditorCursorOffset}
								bind:this={editCodeEditor}
							/>
						</div>

						<section class="customize-output-pane edit-output-pane">
							<div class="edit-output-head">
								<div
									class="usage-tabs edit-output-tabs"
									role="tablist"
									aria-label="Edit output mode"
								>
									<button
										type="button"
										role="tab"
										class:active={activeEditOutputTab === 'preview'}
										aria-selected={activeEditOutputTab === 'preview'}
										onclick={() => {
											activeEditOutputTab = 'preview';
										}}
									>
										Preview
									</button>
									<button
										type="button"
										role="tab"
										class:active={activeEditOutputTab === 'diff'}
										aria-selected={activeEditOutputTab === 'diff'}
										onclick={() => {
											activeEditOutputTab = 'diff';
										}}
									>
										Diff
									</button>
								</div>
								<div class="edit-output-actions">
									<button
										type="button"
										class="customize-tool-button inspect-toggle"
										class:active={editInspectMode}
										onclick={toggleEditInspectMode}
										aria-pressed={editInspectMode}
										title="Toggle inspect mode"
										disabled={activeEditOutputTab !== 'preview'}
									>
										<span class="inspect-icon" aria-hidden="true">
											<svg viewBox="0 0 16 16" focusable="false">
												<path d="M6 2h4v2h2v4h-2v2H6V8H4V4h2Z" />
												<path d="M2 10h2v2h2v2h4v-2h2v-2h2v4H2Z" />
											</svg>
										</span>
										Inspect
									</button>
									<div class="edit-overlay-menu" bind:this={editOverlayMenuElement}>
										<button
											type="button"
											class="customize-tool-button edit-overlay-trigger"
											class:active={editOverlayPopoverOpen || Boolean(editOverlaySvg)}
											onclick={toggleEditOverlayPopover}
											aria-expanded={editOverlayPopoverOpen}
											aria-controls="edit-overlay-popover"
										>
											Overlay
										</button>
										{#if editOverlayPopoverOpen}
											<div
												id="edit-overlay-popover"
												class="edit-overlay-popover"
												role="dialog"
												aria-label="Overlay options"
											>
												<input
													class="overlay-file-input"
													type="file"
													accept=".svg,image/svg+xml"
													bind:this={editOverlayFileInput}
													onchange={handleEditOverlayFileChange}
												/>
												<div class="edit-overlay-actions">
													<button
														type="button"
														class="customize-tool-button"
														onclick={openEditOverlayFilePicker}
													>
														Upload SVG
													</button>
													<button
														type="button"
														class="customize-tool-button"
														onclick={removeEditOverlay}
														disabled={!editOverlaySvg}
													>
														Delete overlay
													</button>
												</div>
												<label class="edit-overlay-paste-label" for="edit-overlay-paste">
													Paste SVG
												</label>
												<textarea
													id="edit-overlay-paste"
													bind:value={editOverlayPasteValue}
													rows="5"
													placeholder="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 24 24&quot;>…</svg>"
												></textarea>
												<div class="edit-overlay-paste-actions">
													<button
														type="button"
														class="customize-tool-button"
														onclick={applyEditOverlayPaste}
													>
														Apply paste
													</button>
													<button
														type="button"
														class="customize-tool-button"
														onclick={clearEditOverlayPaste}
													>
														Clear
													</button>
												</div>
												{#if editOverlaySvg}
													<label class="edit-overlay-opacity">
														<span>Overlay opacity {editOverlayOpacityPercent}%</span>
														<input
															type="range"
															min={EDIT_OVERLAY_OPACITY_MIN}
															max={EDIT_OVERLAY_OPACITY_MAX}
															step="5"
															bind:value={editOverlayOpacityPercent}
														/>
													</label>
												{/if}
												{#if editOverlayError}
													<p class="customize-error edit-overlay-error">{editOverlayError}</p>
												{/if}
											</div>
										{/if}
									</div>
								</div>
							</div>

							<div class="customize-output">
								{#if activeEditOutputTab === 'preview'}
									<div
										class="customize-output-canvas"
										class:inspect-enabled={editInspectMode}
										class:map-active={Boolean(editActiveMapId)}
										role="img"
										aria-label="Edit icon preview"
										bind:this={editPreviewElement}
										onpointermove={handleEditPreviewPointerMove}
										onpointerleave={handleEditPreviewPointerLeave}
										onpointerdown={handleEditPreviewPointerDown}
									>
										{@html editRenderedSvg}
										{#if editOverlaySvg}
											<div
												class="edit-overlay-layer"
												aria-hidden="true"
												style={`--overlay-opacity:${editOverlayOpacity};`}
											>
												{@html editOverlaySvg}
											</div>
										{/if}
									</div>
								{:else}
									<div
										class="customize-output-canvas diff-canvas"
										role="img"
										aria-label="Icon visual diff"
									>
										{#if editVisualDiff.svg}
											{@html editVisualDiff.svg}
										{:else}
											<p class="diff-placeholder">{editVisualDiff.message}</p>
										{/if}
									</div>
								{/if}
							</div>

							<div class="edit-footer-status">
								{#if editSaveStatus}
									<p class="customize-hint">{editSaveStatus}</p>
								{:else if editSvgError}
									<p class="customize-error">{editSvgError}</p>
								{:else if editUnmappedStatus}
									<p class="customize-hint">{editUnmappedStatus}</p>
								{:else if activeEditOutputTab === 'diff' && editVisualDiff.message}
									<p class="customize-hint">{editVisualDiff.message}</p>
								{/if}
							</div>
						</section>
					{/if}
				</section>
			</Drawer.Content>
		{/if}
	</Drawer.Root>
</div>
