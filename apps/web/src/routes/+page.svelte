<script lang="ts">
	import { lucideIcons, type PixelIcon, type PixelShape } from '@pxicons/lucide';
	import { filterPixelIcons } from '$lib/icon-search';
	import { buildCustomizedSvg } from '$lib/icon-svg';

	const icons = lucideIcons;
	const shapeOptions: PixelShape[] = ['square', 'circle', 'rounded'];

	let query = $state('');
	let selectedId = $state(icons[0]?.id ?? '');
	let color = $state('#f3f5f8');
	let size = $state(192);
	let padding = $state(2);
	let shape = $state<PixelShape>('square');
	let withBackground = $state(false);
	let backgroundColor = $state('#111827');
	let copyStatus = $state('');

	const filteredIcons = $derived(filterPixelIcons(icons, query));

	const selectedIcon = $derived.by(() => {
		return filteredIcons.find((icon) => icon.id === selectedId) ?? filteredIcons[0] ?? null;
	});

	const customizedSvg = $derived.by(() => {
		if (!selectedIcon) {
			return '';
		}

		return buildCustomizedSvg(selectedIcon, {
			color,
			size,
			padding,
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
			padding,
			backgroundColor: withBackground ? backgroundColor : '',
			shape,
			scope: 'detail'
		});
	});

	$effect(() => {
		if (!filteredIcons.length) {
			selectedId = '';
			return;
		}

		if (!filteredIcons.some((icon) => icon.id === selectedId)) {
			selectedId = filteredIcons[0].id;
		}
	});

	function selectIcon(icon: PixelIcon): void {
		selectedId = icon.id;
		copyStatus = '';
	}

	function getGridIconSvg(icon: PixelIcon): string {
		const isSelected = selectedIcon?.id === icon.id;

		return buildCustomizedSvg(icon, {
			color: isSelected ? '#f8fafc' : '#c3c9d6',
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
			<span class="brand-dot"></span>
			<strong>PXIcons</strong>
			<small>Lucide Pixel</small>
		</div>
		<nav>
			<a href="/">Icons</a>
			<a href="/">Guide</a>
			<a href="/">Packages</a>
		</nav>
	</header>

	<div class="catalog-shell">
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
			<p class="results-note">{filteredIcons.length} icons</p>
		</div>

		<section class="icon-grid" aria-label="Available pixel icons">
			{#if filteredIcons.length === 0}
				<p class="empty-state">No icon matches this query.</p>
			{/if}

			{#each filteredIcons as icon (icon.id)}
				<button
					type="button"
					class="icon-tile"
					class:active={selectedIcon?.id === icon.id}
					onclick={() => selectIcon(icon)}
				>
					<span class="tile-canvas">{@html getGridIconSvg(icon)}</span>
					<span class="tile-label">{icon.id}</span>
				</button>
			{/each}
		</section>

		{#if selectedIcon}
			<section class="selected-panel" aria-live="polite">
				<div class="selected-preview">
					<div class="preview-canvas" style="--pixel-scale: 12;">
						{@html previewSvg}
					</div>
				</div>

				<div class="selected-content">
					<div class="selected-heading">
						<h2>{selectedIcon.name}</h2>
						<span>24x24 canvas</span>
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
							Padding <span>{padding}px</span>
							<input type="range" min="0" max="11" step="1" bind:value={padding} />
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
		{/if}
	</div>
</section>
