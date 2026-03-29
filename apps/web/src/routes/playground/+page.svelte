<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Activity, BadgeCheck, Bell, House, Search, Settings } from '@pxicons/lucide-svelte';
	import type { Component } from 'svelte';
	import {
		buildPlaygroundSnippet,
		type PlaygroundRenderMode,
		type PlaygroundShape
	} from '$lib/playground-snippet';

	type IconComponent = Component<any>;

	interface IconOption {
		name: string;
		component: IconComponent;
	}

	const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
	const iconOptions: readonly IconOption[] = [
		{ name: 'Activity', component: Activity },
		{ name: 'BadgeCheck', component: BadgeCheck },
		{ name: 'Bell', component: Bell },
		{ name: 'House', component: House },
		{ name: 'Search', component: Search },
		{ name: 'Settings', component: Settings }
	];
	const shapeOptions: readonly PlaygroundShape[] = ['square', 'circle', 'rounded'];
	const renderModeOptions: readonly PlaygroundRenderMode[] = ['auto', 'raw', 'optimized'];

	let selectedIconName = $state('Settings');
	let size = $state(24);
	let strokeWidth = $state(2);
	let absoluteStrokeWidth = $state(false);
	let shape = $state<PlaygroundShape>('square');
	let renderMode = $state<PlaygroundRenderMode>('auto');
	let color = $state('currentColor');
	let colorPickerValue = $state('#f3f5f8');
	let title = $state('');
	let copyStatus = $state('');
	let copyFeedbackTimer: number | null = null;

	const selectedIconOption = $derived.by(
		() => iconOptions.find((icon) => icon.name === selectedIconName) ?? iconOptions[0]
	);

	const resolvedColor = $derived.by(() => {
		const trimmed = color.trim();
		return trimmed.length > 0 ? trimmed : 'currentColor';
	});

	const resolvedTitle = $derived.by(() => {
		const trimmed = title.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	});

	const codeSnippet = $derived.by(() =>
			buildPlaygroundSnippet(selectedIconOption.name, {
				size,
				color: resolvedColor,
				strokeWidth,
				absoluteStrokeWidth,
				shape,
				renderMode,
				title: resolvedTitle ?? ''
			})
		);
	const SelectedIcon = $derived.by(() => selectedIconOption.component);
	const previewGridStyle = $derived.by(
		() => `--preview-size:${size}px;--preview-cell:${(size / 24).toFixed(4)}px;`
	);

	function normalizeHexColor(value: string): string {
		if (value.length === 4) {
			const r = value[1];
			const g = value[2];
			const b = value[3];
			return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
		}

		return value.toLowerCase();
	}

	function clearCopyStatusTimer(): void {
		if (copyFeedbackTimer === null) {
			return;
		}

		window.clearTimeout(copyFeedbackTimer);
		copyFeedbackTimer = null;
	}

	async function copySnippet(): Promise<void> {
		try {
			await navigator.clipboard.writeText(codeSnippet);
			copyStatus = 'Copied Svelte snippet.';
		} catch {
			copyStatus = 'Copy failed. Clipboard permission may be blocked.';
		}

		clearCopyStatusTimer();
		copyFeedbackTimer = window.setTimeout(() => {
			copyStatus = '';
			copyFeedbackTimer = null;
		}, 1800);
	}

	function handleColorPickerInput(event: Event): void {
		const value = (event.currentTarget as HTMLInputElement).value;
		colorPickerValue = value;
		color = value;
	}

	$effect(() => {
		const normalized = color.trim();

		if (!HEX_COLOR_PATTERN.test(normalized)) {
			return;
		}

		colorPickerValue = normalizeHexColor(normalized);
	});

	onDestroy(() => {
		clearCopyStatusTimer();
	});
</script>

<section class="playground-shell">
	<header class="playground-header">
		<h1>@pxicons/lucide-svelte Playground</h1>
		<p>Dev-only package test ground using built workspace output.</p>
		<p class="playground-note">
			After editing icons in the main app, run <code>vp run frameworks:build</code> to refresh
			framework dist consumed here.
		</p>
	</header>

	<section class="sample-strip" aria-label="Package sample icons">
		{#each iconOptions as icon (icon.name)}
			{@const SampleIcon = icon.component}
			<article class="sample-card">
				<div class="sample-icon">
					<SampleIcon size={28} color="#f3f5f8" />
				</div>
				<p>{icon.name}</p>
			</article>
		{/each}
	</section>

	<section class="playground-grid">
		<form class="control-panel" onsubmit={(event) => event.preventDefault()}>
			<h2>Controls</h2>

			<label class="control">
				<span>Icon</span>
				<select bind:value={selectedIconName}>
					{#each iconOptions as icon (icon.name)}
						<option value={icon.name}>{icon.name}</option>
					{/each}
				</select>
			</label>

			<label class="control">
				<span>Size <output>{size}</output></span>
				<input type="range" min="12" max="128" step="1" bind:value={size} />
			</label>

			<label class="control">
				<span>Stroke Width <output>{strokeWidth}</output></span>
				<input type="range" min="0.5" max="4" step="0.25" bind:value={strokeWidth} />
			</label>

			<label class="control checkbox">
				<input type="checkbox" bind:checked={absoluteStrokeWidth} />
				<span>absoluteStrokeWidth</span>
			</label>

			<label class="control">
				<span>Shape</span>
				<select bind:value={shape}>
					{#each shapeOptions as option (option)}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</label>

			<label class="control">
				<span>Render Mode</span>
				<select bind:value={renderMode}>
					{#each renderModeOptions as option (option)}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</label>

			<div class="control">
				<span>Color</span>
				<div class="color-row">
					<input type="color" value={colorPickerValue} oninput={handleColorPickerInput} />
					<input
						type="text"
						bind:value={color}
						spellcheck="false"
						placeholder="currentColor or #RRGGBB"
					/>
				</div>
			</div>

			<label class="control">
				<span>Title</span>
				<input type="text" bind:value={title} spellcheck="false" placeholder="Optional title" />
			</label>
		</form>

			<div class="output-panel">
				<section class="preview-card" aria-label="Interactive preview">
					<h2>Interactive Preview</h2>
					<div class="preview-stage">
						<div class="preview-artboard" style={previewGridStyle}>
							<div class="preview-grid" aria-hidden="true"></div>
							<div class="preview-icon">
								<SelectedIcon
									size={size}
									color={resolvedColor}
									strokeWidth={strokeWidth}
									absoluteStrokeWidth={absoluteStrokeWidth}
									shape={shape}
									renderMode={renderMode}
									title={resolvedTitle}
								/>
							</div>
						</div>
					</div>
				</section>

				<section class="snippet-card" aria-label="Generated Svelte code">
					<div class="snippet-header">
						<h2>Generated Code</h2>
						<button type="button" onclick={copySnippet}>Copy code</button>
					</div>
					<pre><code>{codeSnippet}</code></pre>
					{#if copyStatus}
						<p class="copy-status">{copyStatus}</p>
					{/if}
				</section>
			</div>
	</section>
</section>

<style>
	.playground-shell {
		display: grid;
		gap: 1rem;
		flex: 1 1 auto;
		min-height: 0;
		overflow: auto;
		padding-right: 0.15rem;
	}

	.playground-header {
		display: grid;
		gap: 0.3rem;
		padding: 0.75rem 0.8rem;
		border-radius: 12px;
		border: 1px solid #222329;
		background:
			radial-gradient(circle at 85% 20%, rgba(133, 181, 255, 0.16), transparent 55%),
			linear-gradient(180deg, #0d1018, #08090f);
	}

	.playground-header h1,
	.playground-header p {
		margin: 0;
	}

	.playground-header h1 {
		font-size: 1rem;
		letter-spacing: 0.03em;
	}

	.playground-header p {
		font-size: 0.75rem;
		color: #9aa4ba;
	}

	.playground-note code {
		font-family: var(--font-geist-mono), monospace;
		font-size: 0.7rem;
		color: #bed0f1;
	}

	.sample-strip {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
		gap: 0.65rem;
	}

	.sample-card {
		display: grid;
		gap: 0.4rem;
		padding: 0.62rem;
		border-radius: 10px;
		border: 1px solid #242429;
		background: #0a0b10;
	}

	.sample-card p {
		margin: 0;
		font-size: 0.66rem;
		color: #9ca6bb;
	}

	.sample-icon {
		width: 100%;
		aspect-ratio: 1 / 1;
		display: grid;
		place-items: center;
		border-radius: 8px;
		border: 1px solid #202126;
		background:
			linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
			#0a0a0f;
		background-size: 12px 12px;
	}

	.playground-grid {
		display: grid;
		grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
		gap: 0.9rem;
		min-height: 0;
	}

	.control-panel {
		display: grid;
		align-content: start;
		gap: 0.6rem;
		padding: 0.8rem;
		border-radius: 12px;
		border: 1px solid #23242a;
		background: #090a0f;
		min-height: 0;
	}

	.control-panel h2 {
		margin: 0;
		font-size: 0.86rem;
	}

	.control {
		display: grid;
		gap: 0.4rem;
		font-size: 0.7rem;
		color: #c4cada;
	}

	.control span {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.control output {
		font-family: var(--font-geist-mono), monospace;
		color: #9fb2d9;
	}

	.control input[type='range'] {
		width: 100%;
		accent-color: #6f85b3;
	}

	.control input[type='text'],
	.control select {
		width: 100%;
		padding: 0.45rem 0.5rem;
		border-radius: 8px;
		border: 1px solid #2a2d37;
		background: #11131b;
		color: #e4e9f8;
		font-size: 0.7rem;
	}

	.control.checkbox {
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.5rem;
	}

	.control.checkbox span {
		display: block;
	}

	.color-row {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr);
		gap: 0.45rem;
	}

	.color-row input[type='color'] {
		width: 44px;
		height: 32px;
		padding: 0;
		border: 1px solid #2a2d37;
		border-radius: 7px;
		background: #11131b;
	}

	.output-panel {
		display: grid;
		gap: 0.7rem;
		min-height: 0;
		grid-template-rows: auto minmax(0, 1fr);
	}

	.preview-card,
	.snippet-card {
		display: grid;
		gap: 0.6rem;
		padding: 0.75rem;
		border-radius: 12px;
		border: 1px solid #23242a;
		background: #090a0f;
	}

	.preview-card h2,
	.snippet-card h2 {
		margin: 0;
		font-size: 0.82rem;
	}

	.preview-stage {
		width: min(100%, 420px);
		aspect-ratio: 1 / 1;
		display: grid;
		place-items: center;
		overflow: hidden;
		border-radius: 9px;
		border: 1px solid #25262d;
		background: #0b0b11;
	}

	.preview-artboard {
		position: relative;
		width: var(--preview-size);
		height: var(--preview-size);
	}

	.preview-grid,
	.preview-icon {
		position: absolute;
		inset: 0;
	}

	.preview-grid {
		border: 1px solid #2a2e39;
		background:
			linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
			#0b0b11;
		background-size: var(--preview-cell) var(--preview-cell);
	}

	.preview-icon {
		display: grid;
		place-items: center;
	}

	.preview-stage :global(svg),
	.preview-icon :global(svg),
	.sample-icon :global(svg) {
		image-rendering: pixelated;
		image-rendering: crisp-edges;
	}

	.snippet-card {
		min-height: 0;
	}

	.snippet-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.7rem;
	}

	.snippet-header button {
		padding: 0.45rem 0.62rem;
		border-radius: 8px;
		border: 1px solid #394156;
		background: #192233;
		color: #d5e2ff;
		font-size: 0.66rem;
		cursor: pointer;
	}

	.snippet-header button:hover {
		border-color: #4c5e86;
	}

	.snippet-card pre {
		margin: 0;
		padding: 0.75rem;
		border-radius: 9px;
		border: 1px solid #2a2e36;
		background: #0b0d14;
		overflow: auto;
		min-height: 280px;
		font-family: var(--font-geist-mono), monospace;
		font-size: 0.72rem;
		line-height: 1.5;
	}

	.copy-status {
		margin: 0;
		font-size: 0.67rem;
		color: #9ab2de;
	}

	@media (max-width: 980px) {
		.playground-grid {
			grid-template-columns: 1fr;
		}

		.preview-stage {
			margin-inline: auto;
		}
	}
</style>
