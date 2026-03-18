<script lang="ts">
	import { onMount } from 'svelte';
	import { EditorState, StateEffect, StateField } from '@codemirror/state';
	import { Decoration, type DecorationSet, EditorView, drawSelection } from '@codemirror/view';
	import { xml } from '@codemirror/lang-xml';

	export interface SvgEditorRange {
		from: number;
		to: number;
	}

	const setActiveRangeEffect = StateEffect.define<SvgEditorRange | null>();
	const activeRangeDecoration = Decoration.mark({ class: 'cm-svg-active-range' });

	const activeRangeField = StateField.define<DecorationSet>({
		create() {
			return Decoration.none;
		},
		update(decorations, transaction) {
			let nextDecorations = decorations.map(transaction.changes);

			for (const effect of transaction.effects) {
				if (!effect.is(setActiveRangeEffect)) {
					continue;
				}

				const range = effect.value;

				if (!range || range.to <= range.from) {
					nextDecorations = Decoration.none;
					continue;
				}

				nextDecorations = Decoration.set([activeRangeDecoration.range(range.from, range.to)]);
			}

			return nextDecorations;
		},
		provide: (field) => EditorView.decorations.from(field)
	});

	let {
		value = $bindable(''),
		activeRange = null,
		class: className = '',
		onHoverOffset = () => {},
		onCursorOffset = () => {}
	}: {
		value?: string;
		activeRange?: SvgEditorRange | null;
		class?: string;
		onHoverOffset?: (offset: number | null) => void;
		onCursorOffset?: (offset: number | null) => void;
	} = $props();

	let hostElement = $state<HTMLDivElement | null>(null);
	let editorView = $state<EditorView | null>(null);

	export function scrollToRange(range: SvgEditorRange | null): void {
		if (!editorView || !range) {
			return;
		}

		const from = Math.max(0, Math.min(editorView.state.doc.length, range.from));
		editorView.dispatch({
			effects: EditorView.scrollIntoView(from, { y: 'center' })
		});
	}

	onMount(() => {
		if (!hostElement) {
			return;
		}

		editorView = new EditorView({
			parent: hostElement,
			state: EditorState.create({
				doc: value,
				extensions: [
					xml(),
					drawSelection(),
					activeRangeField,
					EditorView.updateListener.of((update) => {
						if (update.docChanged) {
							const nextValue = update.state.doc.toString();

							if (nextValue !== value) {
								value = nextValue;
							}
						}

						if (update.selectionSet) {
							onCursorOffset(update.state.selection.main.head);
						}
					}),
					EditorView.domEventHandlers({
						mousemove(event, view) {
							const position = view.posAtCoords({
								x: event.clientX,
								y: event.clientY
							});
							onHoverOffset(position ?? null);
							return false;
						},
						mouseleave() {
							onHoverOffset(null);
							return false;
						}
					})
				]
			})
		});

		return () => {
			editorView?.destroy();
			editorView = null;
		};
	});

	$effect(() => {
		if (!editorView) {
			return;
		}

		const current = editorView.state.doc.toString();

		if (value === current) {
			return;
		}

		editorView.dispatch({
			changes: {
				from: 0,
				to: current.length,
				insert: value
			}
		});
	});

	$effect(() => {
		if (!editorView) {
			return;
		}

		editorView.dispatch({
			effects: setActiveRangeEffect.of(activeRange)
		});
	});
</script>

<div class={`svg-code-editor ${className}`.trim()} bind:this={hostElement}></div>

<style>
	:global(.svg-code-editor) {
		height: 100%;
		min-height: 0;
	}

	:global(.svg-code-editor .cm-editor) {
		height: 100%;
		background: transparent;
		color: inherit;
	}

	:global(.svg-code-editor .cm-scroller) {
		overflow: auto;
		font-family: var(--font-geist-mono), monospace;
	}

	:global(.svg-code-editor .cm-content) {
		padding: 0.7rem;
		min-height: 100%;
		font-size: 0.74rem;
		line-height: 1.45;
		caret-color: #9fd2ff !important;
	}

	:global(.svg-code-editor .cm-focused) {
		outline: none;
	}

	:global(.svg-code-editor .cm-cursor) {
		border-left: 2px solid #9fd2ff;
		margin-left: -1px;
		box-shadow: 0 0 0 1px rgba(159, 210, 255, 0.35);
	}

	:global(.svg-code-editor .cm-selectionBackground) {
		background: rgba(120, 136, 173, 0.28);
	}

	:global(.svg-code-editor .cm-svg-active-range) {
		background: rgba(129, 163, 255, 0.2);
		outline: 1px solid rgba(129, 163, 255, 0.5);
		outline-offset: -1px;
	}
</style>
