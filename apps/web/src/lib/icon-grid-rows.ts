export interface IconRowBounds {
	startIndex: number;
	endIndex: number;
}

function clampTotalItems(totalItems: number): number {
	if (!Number.isFinite(totalItems)) {
		return 0;
	}

	return Math.max(0, Math.floor(totalItems));
}

function clampColumns(columns: number): number {
	if (!Number.isFinite(columns)) {
		return 1;
	}

	return Math.max(1, Math.floor(columns));
}

export function getIconRowCount(totalItems: number, columns: number): number {
	const safeTotalItems = clampTotalItems(totalItems);
	const safeColumns = clampColumns(columns);

	if (safeTotalItems === 0) {
		return 0;
	}

	return Math.ceil(safeTotalItems / safeColumns);
}

export function getIconRowBounds(
	totalItems: number,
	columns: number,
	rowIndex: number
): IconRowBounds {
	const safeTotalItems = clampTotalItems(totalItems);
	const safeColumns = clampColumns(columns);
	const safeRowIndex = Number.isFinite(rowIndex) ? Math.floor(rowIndex) : -1;

	if (safeTotalItems === 0 || safeRowIndex < 0) {
		return { startIndex: 0, endIndex: 0 };
	}

	const startIndex = safeRowIndex * safeColumns;

	if (startIndex >= safeTotalItems) {
		return { startIndex: 0, endIndex: 0 };
	}

	return {
		startIndex,
		endIndex: Math.min(safeTotalItems, startIndex + safeColumns)
	};
}

export function getIconsForRow<T>(
	icons: readonly T[],
	columns: number,
	rowIndex: number
): readonly T[] {
	const bounds = getIconRowBounds(icons.length, columns, rowIndex);

	if (bounds.startIndex === bounds.endIndex) {
		return [];
	}

	return icons.slice(bounds.startIndex, bounds.endIndex);
}
