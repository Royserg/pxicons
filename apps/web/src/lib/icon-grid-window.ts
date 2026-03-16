export interface VirtualGridWindowOptions {
	totalItems: number;
	columns: number;
	rowHeight: number;
	viewportHeight: number;
	scrollTop: number;
	overscanRows?: number;
}

export interface VirtualGridWindowResult {
	startIndex: number;
	endIndex: number;
	topSpacerHeight: number;
	bottomSpacerHeight: number;
	totalRows: number;
}

export function computeVirtualGridWindow(
	options: VirtualGridWindowOptions
): VirtualGridWindowResult {
	const totalItems = Math.max(0, Math.floor(options.totalItems));
	const columns = Math.max(1, Math.floor(options.columns));
	const rowHeight = Math.max(1, options.rowHeight);
	const viewportHeight = Math.max(rowHeight, options.viewportHeight);
	const scrollTop = Math.max(0, options.scrollTop);
	const overscanRows = Math.max(0, Math.floor(options.overscanRows ?? 4));

	if (totalItems === 0) {
		return {
			startIndex: 0,
			endIndex: 0,
			topSpacerHeight: 0,
			bottomSpacerHeight: 0,
			totalRows: 0
		};
	}

	const totalRows = Math.ceil(totalItems / columns);
	const lastRowIndex = Math.max(0, totalRows - 1);
	const firstVisibleRow = Math.min(lastRowIndex, Math.floor(scrollTop / rowHeight));
	const visibleRows = Math.ceil(viewportHeight / rowHeight);
	const startRow = Math.max(0, firstVisibleRow - overscanRows);
	const endRow = Math.min(totalRows, firstVisibleRow + visibleRows + overscanRows);

	const startIndex = startRow * columns;
	const endIndex = Math.min(totalItems, endRow * columns);

	return {
		startIndex,
		endIndex,
		topSpacerHeight: startRow * rowHeight,
		bottomSpacerHeight: Math.max(0, (totalRows - endRow) * rowHeight),
		totalRows
	};
}
